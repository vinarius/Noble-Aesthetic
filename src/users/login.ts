import { CognitoIdentityProviderClient, InitiateAuthCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { login } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions, validateEnvVars } from '../../lib/utils';
import { notAuthorizedError } from '../../models/error';
import { HandlerResponse } from '../../models/response';
import { DynamoUserItem, LoginReqBody, validateLogin } from '../../models/user';

interface LoginResponse extends HandlerResponse {
  result: InitiateAuthCommandOutput;
  user: DynamoUserItem;
}

const {
  usersTableName = ''
} = process.env;

const primaryKey = 'email';
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const loginHandler = async (event: APIGatewayProxyEvent): Promise<LoginResponse> => {
  validateEnvVars(['usersTableName']);
  
  const params: LoginReqBody = JSON.parse(event.body ?? '{}');

  const isValid = validateLogin(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateLogin.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    username,
    password
  } = params.input;

  const result: InitiateAuthCommandOutput = await login(cognitoClient, appClientId, username, password).catch(err => {
    throw err.name?.toLowerCase() === 'notauthorizedexception' ? notAuthorizedError : err;
  });

  const itemQuery = await docClient.query({
    TableName: usersTableName,
    IndexName: 'email_index',
    KeyConditionExpression: `${primaryKey} = :${primaryKey}`,
    ExpressionAttributeValues: {
      [`:${primaryKey}`]: username
    }
  });

  if (itemQuery.Count === 0) throw {
    success: false,
    error: `Username '${username}' not found in dynamo database`,
    statusCode: 404
  };

  const user = itemQuery.Items?.[0] as DynamoUserItem;

  return {
    success: true,
    result,
    user
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, loginHandler);

  console.log('Response:', response);
  return response;
}
