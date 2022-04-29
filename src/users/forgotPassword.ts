import { CodeDeliveryDetailsType, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { forgotPassword } from '../../lib/cognito';
import { throwNotAuthorizedError, throwValidationError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { ForgotPasswordReqBody, validateForgotPassword } from '../../models/user';

interface ForgotPasswordResponse {
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

  if (!isValid) throwValidationError(validateForgotPassword.errors);

  const {
    appClientId,
    username
  } = userParams.input;

  if (!validClientIds.includes(appClientId)) {
    logger.debug('validClientIds does not include appClientId. Throwing an error.');
    throwNotAuthorizedError(`Appclient ID '${appClientId}' is Invalid`);
  }

  const { CodeDeliveryDetails } = await forgotPassword(cognitoClient, appClientId, username);

  return {
    details: CodeDeliveryDetails as CodeDeliveryDetailsType
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, forgotPasswordHandler);

  logger.debug('Response:', response);
  return response;
}
