import { CognitoIdentityProviderClient, InitiateAuthCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { refreshUserToken } from '../../lib/cognito';
import { throwValidationError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { RefreshTokenReqBody, validateRefreshToken } from '../../models/user';

interface RefreshTokenResponse {
  details: InitiateAuthCommandOutput;
}

const logger = LoggerFactory.getLogger();
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const refreshTokenHandler = async (event: APIGatewayProxyEvent): Promise<RefreshTokenResponse> => {
  const params: RefreshTokenReqBody = JSON.parse(event.body ?? '{}');
  const isValid = validateRefreshToken(params);

  logger.debug('params:', params);
  logger.debug('isValid:', isValid);

  if (!isValid) throwValidationError(validateRefreshToken.errors);

  const {
    refreshToken,
    appClientId
  } = params.input;

  const details = await refreshUserToken(cognitoClient, appClientId, refreshToken);

  return {
    details
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, refreshTokenHandler);

  logger.debug('Response:', response);
  return response;
}
