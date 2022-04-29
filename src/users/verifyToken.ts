import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CognitoAccessTokenPayload } from 'aws-jwt-verify/dist/cjs/jwt-model';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { DateTime } from 'luxon';
import { throwNotAuthorizedError, throwValidationError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';
import { validateVerifyToken, VerifyTokenReqBody } from '../../models/user';

const {
  userPoolId = ''
} = process.env;

const logger = LoggerFactory.getLogger();

const verifyTokenHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  validateEnvVars(['userPoolId']);

  const params: VerifyTokenReqBody = JSON.parse(event.body ?? '{}');
  const isValid = validateVerifyToken(params);

  logger.debug('params:', params);
  logger.debug('isValid:', isValid);

  if (!isValid) throwValidationError(validateVerifyToken.errors);

  const {
    accessToken,
    appClientId
  } = params.input;

  const verifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId: appClientId,
    tokenUse: 'access'
  });

  logger.debug('verifier:', verifier);

  const verifyResponse = await verifier.verify(accessToken)
    .catch(error => {
      logger.debug('verify error:', error);
      throwNotAuthorizedError('Invalid access token');
    });

  const { exp } = verifyResponse as CognitoAccessTokenPayload;

  logger.debug('exp:', exp);

  const isExpired = DateTime.now() > DateTime.fromSeconds(exp);

  logger.debug('isExpired:', isExpired);

  return {
    success: !isExpired,
    ...isExpired && { error: 'Token has expired. Refresh required.' }
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, verifyTokenHandler);

  logger.debug('Response:', response);
  return response;
}
