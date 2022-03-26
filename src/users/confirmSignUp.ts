import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, PutCommandInput } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { DateTime } from 'luxon';
import { adminDeleteUserByUserName, confirmSignUp } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { buildNotAuthorizedError, buildUnknownError, buildValidationError } from '../../models/error';
import { HandlerResponse } from '../../models/response';
import { ConfirmSignUpUserReqBody, DynamoUserItem, validateConfirmSignUpUser } from '../../models/user';

const {
  usersTableName = '',
  userPoolId = '',
  webAppClientId = ''
} = process.env;

export const newUser: DynamoUserItem = {
  username: '',
  dataKey: 'details',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  },
  birthdate: '',
  firstName: '',
  gender: '',
  lastName: '',
  phoneNumber: ''
};

const logger = LoggerFactory.getLogger();
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const confirmSignUpHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  validateEnvVars([
    'usersTableName',
    'userPoolId',
    'webAppClientId'
  ]);

  const params: ConfirmSignUpUserReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [webAppClientId];
  const isValid = validateConfirmSignUpUser(params);

  logger.debug('params:', params);
  logger.debug('validClientIds:', validClientIds);
  logger.debug('isValid:', isValid);

  if (!isValid) {
    logger.debug('confirmSignUpUser input was not valid. Throwing an error.');
    throw buildValidationError(validateConfirmSignUpUser.errors);
  }

  const {
    appClientId,
    username,
    confirmationCode
  } = params.input;

  if (!validClientIds.includes(appClientId)) {
    logger.debug('validClientIds does not include appClientId. Throwing an error.');
    throw buildNotAuthorizedError(`Appclient ID '${appClientId}' is Invalid`);
  }

  const confirmSignUpResponse = await confirmSignUp(cognitoClient, appClientId, username, confirmationCode)
    .catch(err => {
      logger.debug('confirmSignUp operation failed with error:', err);
      throw err.name === 'CodeMismatchException' ? buildNotAuthorizedError('Code entered is invalid') : buildUnknownError(err);
    });
  logger.debug('confirmSignUpResponse:', confirmSignUpResponse);

  const timestamp = DateTime.now().toUTC().toFormat('MM/dd/yyyy\'T\'HH:mm:ss.SSS\'Z\'');
  logger.debug('timestamp:', timestamp);

  newUser.username = username;

  const putOptions: PutCommandInput = {
    TableName: usersTableName,
    Item: newUser
  };
  logger.debug('putOptions:', putOptions);

  const putResponse = await docClient.put(putOptions)
    .catch(async (error) => {
      logger.debug('putResponse operation failed with error:', error);
      const adminDeleteUserByUserNameResponse = await adminDeleteUserByUserName(cognitoClient, userPoolId, username);
      logger.debug('adminDeleteUserByUserNameResponse:', adminDeleteUserByUserNameResponse);
      throw buildUnknownError(error);
    });

  logger.debug('putResponse:', putResponse);

  return {
    success: true
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, confirmSignUpHandler);

  logger.debug('Response:', response);
  return response;
}
