import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { adminResetUserPassword } from '../../lib/cognito';
import { throwNotFoundError, throwValidationError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { AdminResetUserPasswordReqBody, validateAdminResetPassword } from '../../models/user';

const {
  userPoolId = '',
  usersTableName = ''
} = process.env;

const logger = LoggerFactory.getLogger();
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);

const adminResetPasswordHandler = async (event: APIGatewayProxyEvent): Promise<void> => {
  validateEnvVars(['userPoolId', 'usersTableName']);

  const partitionKey = 'username';
  const sortKey = 'dataKey';
  const userParams: AdminResetUserPasswordReqBody = JSON.parse(event.body ?? '{}');
  const isValid = validateAdminResetPassword(userParams);

  logger.debug('partitionKey:', partitionKey);
  logger.debug('sortKey:', sortKey);
  logger.debug('userParams:', userParams);
  logger.debug('isValid:', isValid);

  if (!isValid) throwValidationError(validateAdminResetPassword.errors);

  const { username } = userParams.input;

  const itemQuery = await docClient.query({
    TableName: usersTableName,
    KeyConditionExpression: `${partitionKey} = :${partitionKey} and ${sortKey} = :${sortKey}`,
    ExpressionAttributeValues: {
      [`:${partitionKey}`]: username,
      [`:${sortKey}`]: 'details'
    }
  });

  if (itemQuery.Count === 0) throwNotFoundError(`A user with the username ${username} does not exist.`);

  await adminResetUserPassword(cognitoClient, userPoolId, username);
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, adminResetPasswordHandler);

  logger.debug('Response:', response);
  return response;
}
