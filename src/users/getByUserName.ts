import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';
import { DynamoUserItem } from '../../models/user';

interface GetUserByIdResponse extends HandlerResponse {
  user: DynamoUserItem;
}

const {
  usersTableName = ''
} = process.env;

const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);

const getUserByIdHandler = async (event: APIGatewayProxyEvent): Promise<GetUserByIdResponse> => {
  validateEnvVars(['usersTableName']);

  const partitionKey = 'userName';
  const sortKey = 'dataKey';
  const userName = event.pathParameters?.[partitionKey] as string;

  const detailsQuery = await docClient.query({
    TableName: usersTableName,
    KeyConditionExpression: `${partitionKey} = :${partitionKey} and ${sortKey} = :${sortKey}`,
    ExpressionAttributeValues: {
      [`:${partitionKey}`]: userName,
      [`:${sortKey}`]: 'details'
    }
  });

  if (detailsQuery.Count === 0) throw {
    success: false,
    error: `Username '${userName}' not found`,
    statusCode: 404
  };

  const user = detailsQuery.Items?.[0] as DynamoUserItem;

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
