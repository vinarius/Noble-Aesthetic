import { AdminDeleteUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';

const {
  usersTableName = '',
  userPoolId
} = process.env;

const primaryKey = 'userId';
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const adminDeleteUserByIdHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  validateEnvVars(['usersTableName', 'userPoolId']);

  const userId = event.pathParameters?.[primaryKey] as string;

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

  const originalDynamoItem = await docClient.delete({
    Key: { userId },
    TableName: usersTableName,
    ReturnValues: 'ALL_OLD'
  });

  await cognitoClient.send(new AdminDeleteUserCommand({
    UserPoolId: userPoolId,
    Username: userId
  })).catch(async error => {
    await docClient.put({
      TableName: usersTableName,
      Item: originalDynamoItem.Attributes
    });

    throw {
      success: false,
      error
    };
  });

  return {
    success: true
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, adminDeleteUserByIdHandler);

  console.log('Response:', response);
  return response;
}
