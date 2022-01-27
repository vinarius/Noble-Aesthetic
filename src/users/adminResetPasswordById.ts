import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { adminResetUserPassword } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions, validateEnvVars } from '../../lib/utils';
import { HandlerResponse } from '../../models/response';
import { AdminResetUserPasswordReqBody, validateAdminResetPassword } from '../../models/user';

const {
  userPoolId = '',
  usersTableName = ''
} = process.env;

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });
const primaryKey = 'userId';
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);

const adminResetPasswordHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  validateEnvVars(['userPoolId', 'usersTableName']);

  const userParams: AdminResetUserPasswordReqBody = JSON.parse(event.body ?? '{}');

  const isValid = validateAdminResetPassword(userParams);
  if (!isValid) throw {
    success: false,
    validationErrors: validateAdminResetPassword.errors ?? [],
    statusCode: 400
  };

  const { userId } = userParams.input;

  const itemQuery = await docClient.query({
    TableName: usersTableName,
    KeyConditionExpression: `${primaryKey} = :${primaryKey}`,
    ExpressionAttributeValues: {
      [`:${primaryKey}`]: userId
    }
  });

  if (itemQuery.Count === 0) throw {
    success: false,
    error: `User Id '${userId}' not found`,
    statusCode: 404
  };

  await adminResetUserPassword(cognitoClient, userPoolId, userId);

  return {
    success: true
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, adminResetPasswordHandler);

  console.log('Response:', response);
  return response;
}
