import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { scan } from '../../lib/dynamo';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { DynamoUserItem } from '../../models/user';

interface GetUsersResponse {
  users: DynamoUserItem[];
}

const {
  usersTableName = ''
} = process.env;

const logger = LoggerFactory.getLogger();
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getUsersHandler = async (event: APIGatewayProxyEvent): Promise<GetUsersResponse> => {
  validateEnvVars(['usersTableName']);

  return {
    users: await scan(docClient, usersTableName) as DynamoUserItem[] // TODO: fix this
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, getUsersHandler);

  logger.debug('Response:', response);
  return response;
}
