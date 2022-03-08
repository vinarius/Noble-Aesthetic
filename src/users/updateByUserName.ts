import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';
import { DynamoUserItem, UpdateUserAddress, UpdateUserItem, validateUpdateUser } from '../../models/user';

interface UpdateUserResponse extends HandlerResponse {
  user?: DynamoUserItem;
}

const {
  usersTableName = ''
} = process.env;

const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);

const updateUserByIdHandler = async (event: APIGatewayProxyEvent): Promise<UpdateUserResponse> => {
  validateEnvVars(['usersTableName']);

  const partitionKey = 'userName';
  const sortKey = 'dataKey';
  const userName = event.pathParameters?.[partitionKey] as string;
  const userParams: UpdateUserItem = JSON.parse(event.body ?? '{}');
  const isValid = validateUpdateUser(userParams);

  if (!isValid) throw {
    success: false,
    validationErrors: validateUpdateUser.errors ?? [],
    statusCode: 400
  };

  const {
    input
  } = userParams;

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
    error: `Username '${userName}' not found`,
    statusCode: 404
  };

  let UpdateExpression = 'SET ';
  const ExpressionAttributeValues: { [key: string]: string|UpdateUserAddress; } = {};
  for (const [key, value] of Object.entries(input)) {
    UpdateExpression += `${key} = :${key}, `;
    ExpressionAttributeValues[`:${key}`] = value;
  }

  UpdateExpression = UpdateExpression.slice(0, -2);

  const dynamoResponse = await docClient.update({
    TableName: usersTableName,
    Key: { 
      userName,
      sortKey: 'details'
    },
    UpdateExpression,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  });

  return {
    success: true,
    user: dynamoResponse.Attributes as DynamoUserItem
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, updateUserByIdHandler);

  console.log('Response:', response);
  return response;
}
