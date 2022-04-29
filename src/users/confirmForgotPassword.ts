import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { confirmForgotPassword } from '../../lib/cognito';
import { throwNotAuthorizedError, throwUnknownError, throwValidationError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { ConfirmForgotPasswordReqBody, validateConfirmForgotPassword } from '../../models/user';

const {
  webAppClientId = ''
} = process.env;

const logger = LoggerFactory.getLogger();
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const confirmForgotPasswordHandler = async (event: APIGatewayProxyEvent): Promise<void> => {
  validateEnvVars(['webAppClientId']);

  const userParams: ConfirmForgotPasswordReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [webAppClientId];
  const isValid = validateConfirmForgotPassword(userParams);

  logger.debug('userParams:', userParams);
  logger.debug('validClientIds:', validClientIds);
  logger.debug('isValid:', isValid);

  if (!isValid) throwValidationError(validateConfirmForgotPassword.errors);

  const {
    appClientId,
    username,
    proposedPassword,
    confirmationCode
  } = userParams.input;

  if (!validClientIds.includes(appClientId)) throwNotAuthorizedError(`Appclient ID '${appClientId}' is invalid`);

  await confirmForgotPassword(
    cognitoClient,
    appClientId,
    username,
    proposedPassword,
    confirmationCode
  ).catch(err => throwUnknownError(err));
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, confirmForgotPasswordHandler);

  logger.debug('Response:', response);
  return response;
}
