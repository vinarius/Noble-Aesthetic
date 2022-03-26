import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { changePassword } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { buildNotAuthorizedError, buildUnknownError, buildValidationError } from '../../models/error';
import { HandlerResponse } from '../../models/response';
import { ChangePasswordReqBody, validateChangePassword } from '../../models/user';

const logger = LoggerFactory.getLogger();
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const changePasswordHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  const userParams: ChangePasswordReqBody = JSON.parse(event.body ?? '{}');
  const isValid = validateChangePassword(userParams);

  logger.debug('userParams:', userParams);
  logger.debug('isValid:', isValid);

  if (!isValid) {
    logger.debug('changePassword input was not valid. Throwing an error.');
    throw buildValidationError(validateChangePassword.errors);
  }

  const {
    accessToken,
    previousPassword,
    proposedPassword
  } = userParams.input;

  const changePasswordResponse = await changePassword(cognitoClient, accessToken, previousPassword, proposedPassword)
    .catch(error => {
      logger.debug('changePassword operation failed with error:', error);
      throw error.name === 'NotAuthorizedException' ? buildNotAuthorizedError(error) : buildUnknownError(error);
    });

  logger.debug('changePasswordResponse:', changePasswordResponse);

  return {
    success: true
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, changePasswordHandler);

  logger.debug('Response:', response);
  return response;
}
