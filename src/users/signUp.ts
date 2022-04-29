import { CognitoIdentityProviderClient, SignUpCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { signUp } from '../../lib/cognito';
import { throwNotAuthorizedError, throwValidationError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { SignUpUserReqBody, validateSignUpUser } from '../../models/user';

interface SignUpResponse {
  details: SignUpCommandOutput;
}

const {
  webAppClientId = ''
} = process.env;

const logger = LoggerFactory.getLogger();
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const signUpHandler = async (event: APIGatewayProxyEvent): Promise<SignUpResponse> => {
  validateEnvVars(['webAppClientId']);

  const params: SignUpUserReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [webAppClientId];
  const isValid = validateSignUpUser(params);

  logger.debug('params:', params);
  logger.debug('validClientIds:', validClientIds);
  logger.debug('isValid:', isValid);

  if (!isValid) throwValidationError(validateSignUpUser.errors);

  const {
    appClientId,
    username,
    password
  } = params.input;

  if (!validClientIds.includes(appClientId)) throwNotAuthorizedError(`Appclient ID '${appClientId}' is Invalid`);

  // TODO: verify user does not exist, else throw error

  const details: SignUpCommandOutput = await signUp(cognitoClient, appClientId, username, password);

  logger.debug('details:', details);

  return {
    details
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, signUpHandler);

  logger.debug('Response:', response);
  return response;
}
