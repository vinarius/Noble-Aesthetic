import { AuthenticationResultType, CognitoIdentityProviderClient, InitiateAuthCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { login } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { notAuthorizedError } from '../../models/error';
import { HandlerResponse } from '../../models/response';
import { DynamoUserItem, LoginReqBody, validateLogin } from '../../models/user';

interface LoginResponse extends HandlerResponse {
  payload: {
    AccessToken?: string;
    ExpiresIn?: number;
    IdToken?: string;
    RefreshToken?: string;
  };
  user: DynamoUserItem;
}

const {
  usersTableName = '',
  webAppClientId = ''
} = process.env;

const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const loginHandler = async (event: APIGatewayProxyEvent): Promise<LoginResponse> => {
  validateEnvVars(['usersTableName', 'webAppClientId']);
  
  const partitionKey = 'userName';
  const sortKey = 'dataKey';
  const params: LoginReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [webAppClientId];

  const isValid = validateLogin(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateLogin.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    userName,
    password
  } = params.input;

  if (!validClientIds.includes(appClientId)) {
    throw {
      success: false,
      error: `Appclient ID '${appClientId}' is Invalid`,
      statusCode: 401
    };
  }

  const result: InitiateAuthCommandOutput = await login(cognitoClient, appClientId, userName, password).catch(err => {
    throw err.name?.toLowerCase() === 'notauthorizedexception' ? notAuthorizedError : err;
  });

  const itemQuery = await docClient.query({
    TableName: usersTableName,
    KeyConditionExpression: `${partitionKey} = :${partitionKey} and ${sortKey} = :${sortKey}`,
    ExpressionAttributeValues: {
      [`:${partitionKey}`]: userName,
      [`:${sortKey}`]: 'details'
    }
  });

  if (itemQuery.Count === 0) throw {
    success: false,
    error: `Username '${userName}' not found in dynamo database`,
    statusCode: 404
  };

  const user = itemQuery.Items?.[0] as DynamoUserItem;

  const { AccessToken, ExpiresIn, IdToken, RefreshToken } = result.AuthenticationResult as AuthenticationResultType;

  return {
    success: true,
    payload: { AccessToken, ExpiresIn, IdToken, RefreshToken },
    user
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, loginHandler);

  console.log('Response:', response);
  return response;
}
