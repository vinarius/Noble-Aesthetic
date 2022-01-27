import {
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
  UsernameAttributeType,
  UserType
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { ErrorObject } from 'ajv';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { adminDeleteUserById } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions, validateEnvVars } from '../../lib/utils';
import { HandlerResponse } from '../../models/response';
import { DynamoUserItem, validateAdminCreateUser } from '../../models/user';


interface CreateUserResponse extends HandlerResponse{
  user?: DynamoUserItem;
}

const {
  usersTableName = '',
  userPoolId = ''
} = process.env;

const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const adminCreateUserHandler = async (event: APIGatewayProxyEvent): Promise<CreateUserResponse> => {
  validateEnvVars(['usersTableName', 'userPoolId']);

  const userParams: DynamoUserItem = JSON.parse(event.body ?? '{}');

  const isValid = validateAdminCreateUser(userParams);
  if (!isValid) throw {
    success: false,
    validationErrors: validateAdminCreateUser.errors ?? [],
    statusCode: 400
  };

  const {
    email,
    phoneNumber
  } = userParams as DynamoUserItem;

  const existingEmailTaken = await docClient.query({
    TableName: usersTableName,
    IndexName: 'email_index',
    KeyConditionExpression: 'email = :emailVal',
    ExpressionAttributeValues: {
      ':emailVal': email
    }
  });

  if (existingEmailTaken.Count! > 0) {
    const errorObject: ErrorObject = {
      instancePath: '',
      keyword: 'duplicate',
      params: { type: 'string' },
      schemaPath: '',
      message: 'A user already exists with this email'
    };
    throw {
      success: false,
      validationErrors: [errorObject],
      statusCode: 400
    };
  }

  const createCognitoUserCommand = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: email,
    DesiredDeliveryMediums: ['EMAIL'],
    UserAttributes: [
      {
        Name: UsernameAttributeType.EMAIL,
        Value: email
      },
      {
        Name: UsernameAttributeType.PHONE_NUMBER,
        Value: phoneNumber
      }
    ]
  });

  const newCognitoUser = await cognitoClient.send(createCognitoUserCommand);
  const { Username } = newCognitoUser.User as UserType;

  let UpdateExpression = 'SET ';
  const ExpressionAttributeValues: { [key: string]: string; } = {};
  for (const [key, value] of Object.entries(userParams)) {
    UpdateExpression += `${key} = :${key}, `;
    ExpressionAttributeValues[`:${key}`] = value;
  }

  UpdateExpression = UpdateExpression.slice(0, -2);

  const dynamoResponse = await docClient.update({
    TableName: usersTableName,
    Key: { userId: Username },
    UpdateExpression,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }).catch(async error => {
    await adminDeleteUserById(cognitoClient, userPoolId, Username!);
    throw error;
  });

  return {
    success: true,
    user: dynamoResponse.Attributes as DynamoUserItem
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, adminCreateUserHandler);

  console.log('Response:', response);
  return response;
}
