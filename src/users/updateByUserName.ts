import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, QueryCommandInput, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
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

const logger = LoggerFactory.getLogger();
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);

const updateUserByIdHandler = async (event: APIGatewayProxyEvent): Promise<UpdateUserResponse> => {
  validateEnvVars(['usersTableName']);

  const partitionKey = 'username';
  const sortKey = 'dataKey';
  const username = event.pathParameters?.[partitionKey] as string;
  const userParams: UpdateUserItem = JSON.parse(event.body ?? '{}');
  const isValid = validateUpdateUser(userParams);

  logger.debug('partitionKey:', partitionKey);
  logger.debug('sortKey:', sortKey);
  logger.debug('username:', username);
  logger.debug('userParams:', userParams);
  logger.debug('isValid:', isValid);

  if (!isValid) {
    logger.debug('updateUser input was not valid. Throwing an error.');
    throwValidationError(validateUpdateUser.errors);
  }

  const {
    input
  } = userParams;

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
      throwUnknownError(err);
    });

  logger.debug('itemQuery:', itemQuery);

  if (itemQuery.Count === 0) {
    logger.debug('itemQuery returned 0 items. Throwing an error.');
    throwNotFoundError(username);
  }

  let UpdateExpression = 'SET ';
  const ExpressionAttributeValues: { [key: string]: string | UpdateUserAddress; } = {};
  for (const [key, value] of Object.entries(input)) {
    UpdateExpression += `${key} = :${key}, `;
    ExpressionAttributeValues[`:${key}`] = value;
  }

  logger.debug('UpdateExpression before slice:', UpdateExpression);
  UpdateExpression = UpdateExpression.slice(0, -2);
  logger.debug('UpdateExpression after slice:', UpdateExpression);

  const docClientUpdateOptions: UpdateCommandInput = {
    TableName: usersTableName,
    Key: {
      username,
      [sortKey]: 'details'
    },
    UpdateExpression,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };
  logger.debug(docClientUpdateOptions);

  const dynamoResponse = await docClient.update(docClientUpdateOptions)
    .catch(err => {
      logger.debug('docClient update operation failed with error:', err);
      throwUnknownError(err);
    });

  logger.debug('dynamoResponse:', dynamoResponse);

  return {
    success: true,
    user: dynamoResponse.Attributes as DynamoUserItem
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, updateUserByIdHandler);

  logger.debug('Response:', response);
  return response;
}
