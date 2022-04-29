import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, PutCommandInput } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { DateTime } from 'luxon';
import { adminDeleteUserByUserName, confirmSignUp } from '../../lib/cognito';
import { throwNotAuthorizedError, throwUnknownError, throwValidationError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { ConfirmSignUpUserReqBody, DynamoUserItem, validateConfirmSignUpUser } from '../../models/user';

const {
  usersTableName = '',
  userPoolId = '',
  webAppClientId = ''
} = process.env;

export const newUser: DynamoUserItem = {
  username: '',
  dataKey: 'details',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
  country: '',
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

const confirmSignUpHandler = async (event: APIGatewayProxyEvent): Promise<void> => {
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

  if (!isValid) throwValidationError(validateConfirmSignUpUser.errors);

  const {
    appClientId,
    username,
    confirmationCode
  } = params.input;

  if (!validClientIds.includes(appClientId)) throwNotAuthorizedError(`Appclient ID '${appClientId}' is Invalid`);

  const confirmSignUpResponse = await confirmSignUp(cognitoClient, appClientId, username, confirmationCode)
    .catch(err => {
      logger.debug('confirmSignUp operation failed with error:', err);
      err.name === 'CodeMismatchException' ? throwNotAuthorizedError('Code entered is invalid') : throwUnknownError(err);
    });
  logger.debug('confirmSignUpResponse:', confirmSignUpResponse);

  const timestamp = DateTime.now().toUTC().toISO();
  logger.debug('timestamp:', timestamp);

  newUser.username = username;

  const putOptions: PutCommandInput = {
    TableName: usersTableName,
    Item: newUser
  };
  logger.debug('putOptions:', putOptions);

  await docClient.put(putOptions)
    .catch(async (error) => {
      logger.debug('putResponse operation failed with error:', error);
      const adminDeleteUserByUserNameResponse = await adminDeleteUserByUserName(cognitoClient, userPoolId, username);
      logger.debug('adminDeleteUserByUserNameResponse:', adminDeleteUserByUserNameResponse);
      throwUnknownError(error);
    });
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, confirmSignUpHandler);

  logger.debug('Response:', response);
  return response;
}
