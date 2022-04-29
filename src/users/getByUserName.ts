import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { throwNotFoundError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { DynamoUserItem } from '../../models/user';

const {
  usersTableName = ''
} = process.env;

const logger = LoggerFactory.getLogger();
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);

const getUserByIdHandler = async (event: APIGatewayProxyEvent): Promise<DynamoUserItem> => {
  validateEnvVars(['usersTableName']);

  const partitionKey = 'username';
  const sortKey = 'dataKey';
  const username = event.pathParameters?.[partitionKey] as string;

  logger.debug('partitionKey:', partitionKey);
  logger.debug('sortKey:', sortKey);
  logger.debug('username:', username);

  const queryOptions: QueryCommandInput = {
    TableName: usersTableName,
    KeyConditionExpression: `${partitionKey} = :${partitionKey} and ${sortKey} = :${sortKey}`,
    ExpressionAttributeValues: {
      [`:${partitionKey}`]: username,
      [`:${sortKey}`]: 'details'
    }
  };
  logger.debug('queryOptions:', queryOptions);

  const detailsQuery = await docClient.query(queryOptions);
  logger.debug('detailsQuery:', detailsQuery);

  if (detailsQuery.Count === 0) throwNotFoundError(`User ${username} not found`);

  return detailsQuery.Items?.[0] as DynamoUserItem;
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, getUserByIdHandler);

  logger.debug('Response:', response);
  return response;
}
