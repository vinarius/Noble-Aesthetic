import { CognitoIdentityProviderClient, GlobalSignOutCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { logout } from '../../lib/cognito';
import { throwNotAuthorizedError, throwUnknownError, throwValidationError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { LogoutReqBody, validateLogout } from '../../models/user';

interface LogoutResponse {
  result: GlobalSignOutCommandOutput;
}

const logger = LoggerFactory.getLogger();
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const logoutHandler = async (event: APIGatewayProxyEvent): Promise<LogoutResponse> => {
  const params: LogoutReqBody = JSON.parse(event.body ?? '{}');
  const isValid = validateLogout(params);

  logger.debug('params:', params);
  logger.debug('isValid:', isValid);

  if (!isValid) throwValidationError(validateLogout.errors);

  const {
    accessToken
  } = params.input;

  const result: GlobalSignOutCommandOutput = await logout(cognitoClient, accessToken)
    .catch(err => {
      logger.debug('logout operation failed with error:', err);
      throw err.toLowerCase().includes('invalid access token') ? throwNotAuthorizedError('Invalid access token.') : throwUnknownError(err);
    });

  return {
    result
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, logoutHandler);

  logger.debug('Response:', response);
  return response;
}
