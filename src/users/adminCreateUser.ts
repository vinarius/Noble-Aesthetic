import {
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
  UsernameAttributeType,
  UserType
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { adminDeleteUserByUserName } from '../../lib/cognito';
import { throwResourceExistsError, throwUnknownError, throwValidationError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { DynamoUserItem, validateAdminCreateUser } from '../../models/user';

const {
  usersTableName = '',
  userPoolId = ''
} = process.env;

const logger = LoggerFactory.getLogger();
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const adminCreateUserHandler = async (event: APIGatewayProxyEvent): Promise<DynamoUserItem> => {
  validateEnvVars(['usersTableName', 'userPoolId']);

  const partitionKey = 'username';
  const sortKey = 'dataKey';
  const userParams: DynamoUserItem = JSON.parse(event.body ?? '{}');
  const isValid = validateAdminCreateUser(userParams);

  logger.debug('partitionKey:', partitionKey);
  logger.debug('sortKey:', sortKey);
  logger.debug('userParams:', userParams);
  logger.debug('isValid:', isValid);

  if (!isValid) {
    logger.debug('adminCreateUser input was not valid. Throwing an error.');
    throwValidationError(validateAdminCreateUser.errors);
  }

  const {
    username,
    phoneNumber
  } = userParams as DynamoUserItem;

  const userNameTaken = await docClient.query({
    TableName: usersTableName,
    KeyConditionExpression: `${partitionKey} = :${partitionKey} and ${sortKey} = :${sortKey}`,
    ExpressionAttributeValues: {
      [`:${partitionKey}`]: username,
      [`:${sortKey}`]: 'details'
    }
  });

  if (userNameTaken.Count! > 0) throwResourceExistsError(username);

  const createCognitoUserCommand = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: username,
    DesiredDeliveryMediums: ['EMAIL'],
    UserAttributes: [
      {
        Name: UsernameAttributeType.EMAIL,
        Value: username
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
    Key: {
      Username,
      sortKey: 'details'
    },
    UpdateExpression,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }).catch(async error => {
    await adminDeleteUserByUserName(cognitoClient, userPoolId, Username!);
    throwUnknownError(error);
  });

  return dynamoResponse.Attributes as DynamoUserItem;
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, adminCreateUserHandler);

  logger.debug('Response:', response);
  return response;
}
