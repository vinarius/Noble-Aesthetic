import { AdminDeleteUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';

const {
  usersTableName = '',
  userPoolId
} = process.env;

const logger = LoggerFactory.getLogger();
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const adminDeleteUserByIdHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  validateEnvVars(['usersTableName', 'userPoolId']);

  const partitionKey = 'username';
  const sortKey = 'dataKey';
  const username = event.pathParameters?.[partitionKey] as string;

  logger.debug('partitionKey:', partitionKey);
  logger.debug('sortKey:', sortKey);
  logger.debug('username:', username);

  const itemQuery = await docClient.query({
    TableName: usersTableName,
    KeyConditionExpression: `${partitionKey} = :${partitionKey} and ${sortKey} = :${sortKey}`,
    ExpressionAttributeValues: {
      [`:${partitionKey}`]: username,
      [`:${sortKey}`]: 'details'
    }
  });

  if (itemQuery.Count === 0) throwNotFoundError(username);

  const originalDynamoItem = await docClient.delete({
    Key: { username },
    TableName: usersTableName,
    ReturnValues: 'ALL_OLD'
  });

  await cognitoClient.send(new AdminDeleteUserCommand({
    UserPoolId: userPoolId,
    Username: username
  })).catch(async error => {
    await docClient.put({
      TableName: usersTableName,
      Item: originalDynamoItem.Attributes
    });

    throwUnknownError(error);
  });

  return {
    success: true
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, adminDeleteUserByIdHandler);

  logger.debug('Response:', response);
  return response;
}
