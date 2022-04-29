import { CodeDeliveryDetailsType, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { forgotPassword } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';
import { ForgotPasswordReqBody, validateForgotPassword } from '../../models/user';

interface ForgotPasswordResponse extends HandlerResponse {
  details: CodeDeliveryDetailsType
}

const {
  webAppClientId = ''
} = process.env;

const logger = LoggerFactory.getLogger();
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const forgotPasswordHandler = async (event: APIGatewayProxyEvent): Promise<ForgotPasswordResponse> => {
  validateEnvVars(['webAppClientId']);

  const userParams: ForgotPasswordReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [webAppClientId];
  const isValid = validateForgotPassword(userParams);

  logger.debug('userParams:', userParams);
  logger.debug('validClientIds:', validClientIds);
  logger.debug('isValid:', isValid);

  if (!isValid) {
    logger.debug('forgotPassword input was not valid. Throwing an error.');
    throwValidationError(validateForgotPassword.errors);
  }

  const {
    appClientId,
    username
  } = userParams.input;

  if (!validClientIds.includes(appClientId)) {
    logger.debug('validClientIds does not include appClientId. Throwing an error.');
    throwNotAuthorizedError(`Appclient ID '${appClientId}' is Invalid`);
  }

  const { CodeDeliveryDetails } = await forgotPassword(cognitoClient, appClientId, username)
    .catch(err => {
      logger.debug('forgotPassword operation failed with error:', err);
      throwUnknownError(err);
    });
  logger.debug('CodeDeliveryDetails:', CodeDeliveryDetails);

  return {
    success: true,
    details: CodeDeliveryDetails!
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, forgotPasswordHandler);

  logger.debug('Response:', response);
  return response;
}
