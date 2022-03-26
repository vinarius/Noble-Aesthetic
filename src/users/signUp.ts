import { CognitoIdentityProviderClient, SignUpCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { signUp } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { buildNotAuthorizedError, buildUnknownError, buildValidationError } from '../../models/error';
import { HandlerResponse } from '../../models/response';
import { SignUpUserReqBody, validateSignUpUser } from '../../models/user';

interface SignUpResponse extends HandlerResponse {
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

  if (!isValid) {
    logger.debug('signUpUser input was not valid. Throwing an error.');
    throw buildValidationError(validateSignUpUser.errors);
  }

  const {
    appClientId,
    username,
    password
  } = params.input;

  if (!validClientIds.includes(appClientId)) {
    logger.debug('validClientIds does not include appClientId. Throwing an error.');
    throw buildNotAuthorizedError(`Appclient ID '${appClientId}' is Invalid`);
  }

  const details: SignUpCommandOutput = await signUp(cognitoClient, appClientId, username, password)
    .catch(err => {
      logger.debug('signUp operation failed with error:', err);
      throw buildUnknownError(err);
    });

  logger.debug('details:', details);

  return {
    success: true,
    details
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, signUpHandler);

  logger.debug('Response:', response);
  return response;
}
