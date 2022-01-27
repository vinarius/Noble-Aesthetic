import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { setDefaultProps } from '../../lib/lambda';
import { HandlerResponse } from '../../models/response';
import { DynamoUserItem } from '../../models/user';
import { retryOptions, validateEnvVars } from '../../lib/utils';

interface GetUserByIdResponse extends HandlerResponse {
  user: DynamoUserItem;
}

const {
  usersTableName = ''
} = process.env;

const primaryKey = 'userId';
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);

const getUserByIdHandler = async (event: APIGatewayProxyEvent): Promise<GetUserByIdResponse> => {
  validateEnvVars(['usersTableName']);

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

  const user = itemQuery.Items?.[0] as DynamoUserItem;

  return {
    success: true,
    user
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, getUserByIdHandler);

  console.log('Response:', response);
  return response;
}
