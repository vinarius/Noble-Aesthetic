import { CognitoIdentityProviderClient, InitiateAuthCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { refreshUserToken } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { HandlerResponse } from '../../models/response';
import { RefreshTokenReqBody, validateRefreshToken } from '../../models/user';

interface RefreshTokenResponse extends HandlerResponse {
  details: InitiateAuthCommandOutput;
}

const logger = LoggerFactory.getLogger();
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const refreshTokenHandler = async (event: APIGatewayProxyEvent): Promise<RefreshTokenResponse> => {
  const params: RefreshTokenReqBody = JSON.parse(event.body ?? '{}');
  const isValid = validateRefreshToken(params);

  logger.debug('params:', params);
  logger.debug('isValid:', isValid);

  if (!isValid) {
    logger.debug('refreshToken input was not valid. Throwing an error.');
    throwValidationError(validateRefreshToken.errors);
  }

  const {
    refreshToken,
    appClientId
  } = params.input;

  const details = await refreshUserToken(cognitoClient, appClientId, refreshToken)
    .catch(err => {
      logger.debug('refreshUserToken operation failed with error:', err);
      throwUnknownError(err);
    });

  logger.debug('details:', details);

  return {
    success: true,
    details
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, refreshTokenHandler);

  logger.debug('Response:', response);
  return response;
}
