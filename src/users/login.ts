import { AuthenticationResultType, CognitoIdentityProviderClient, InitiateAuthCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { login } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { buildNotAuthorizedError, buildNotFoundError, buildUnknownError, buildValidationError } from '../../models/error';
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

const logger = LoggerFactory.getLogger();
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const loginHandler = async (event: APIGatewayProxyEvent): Promise<LoginResponse> => {
  validateEnvVars(['usersTableName', 'webAppClientId']);

  const partitionKey = 'username';
  const sortKey = 'dataKey';
  const params: LoginReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [webAppClientId];
  const isValid = validateLogin(params);

  logger.debug('partitionKey:', partitionKey);
  logger.debug('sortKey:', sortKey);
  logger.debug('params:', params);
  logger.debug('validClientIds:', validClientIds);
  logger.debug('isValid:', isValid);

  if (!isValid) {
    logger.debug('login input was not valid. Throwing an error.');
    throw buildValidationError(validateLogin.errors);
  }

  const {
    appClientId,
    username,
    password
  } = params.input;

  if (!validClientIds.includes(appClientId)) {
    logger.debug('validClientIds does not include appClientId. Throwing an error.');
    throw buildNotAuthorizedError(`Appclient ID '${appClientId}' is Invalid`);
  }

  const result: InitiateAuthCommandOutput = await login(cognitoClient, appClientId, username, password)
    .catch(err => {
      logger.debug('login operation failed with error:', err);
      throw err.name === 'NotAuthorizedException' ? buildNotAuthorizedError('Invalid username or password') : buildUnknownError(err);
    });

  logger.debug('result:', result);

  const queryOptions: QueryCommandInput = {
    TableName: usersTableName,
    KeyConditionExpression: `${partitionKey} = :${partitionKey} and ${sortKey} = :${sortKey}`,
    ExpressionAttributeValues: {
      [`:${partitionKey}`]: username,
      [`:${sortKey}`]: 'details'
    }
  };
  logger.debug('queryOptions:', queryOptions);

  const itemQuery = await docClient.query(queryOptions)
    .catch(err => {
      logger.debug('docClient query operation failed with error:', err);
      throw buildUnknownError(err);
    });

  logger.debug('itemQuery:', itemQuery);

  if (itemQuery.Count === 0) {
    logger.debug('itemQuery returned 0 items. Throwing an error.');
    throw buildNotFoundError(username);
  }

  const user = itemQuery.Items?.[0] as DynamoUserItem;
  logger.debug('user:', user);

  const { AccessToken, ExpiresIn, IdToken, RefreshToken } = result.AuthenticationResult as AuthenticationResultType;

  return {
    success: true,
    payload: { AccessToken, ExpiresIn, IdToken, RefreshToken },
    user
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, loginHandler);

  logger.debug('Response:', response);
  return response;
}
