import { CodeDeliveryDetailsType, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { resendConfirmationCode } from '../../lib/cognito';
import { throwNotAuthorizedError, throwValidationError } from '../../lib/errors';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { ResendConfirmationCodeReqBody, validateResendConfirmationCode } from '../../models/user';

interface SignUpResponse {
  details: CodeDeliveryDetailsType;
}

const {
  webAppClientId = ''
} = process.env;

const logger = LoggerFactory.getLogger();
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const signUpHandler = async (event: APIGatewayProxyEvent): Promise<SignUpResponse> => {
  validateEnvVars(['webAppClientId']);

  const params: ResendConfirmationCodeReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [webAppClientId];
  const isValid = validateResendConfirmationCode(params);

  logger.debug('params:', params);
  logger.debug('validClientIds:', validClientIds);
  logger.debug('isValid:', isValid);

  if (!isValid) throwValidationError(validateResendConfirmationCode.errors);

  const {
    appClientId,
    username
  } = params.input;

  if (!validClientIds.includes(appClientId)) throwNotAuthorizedError(`Appclient ID '${appClientId}' is Invalid`);

  const { CodeDeliveryDetails } = await resendConfirmationCode(cognitoClient, appClientId, username);
  logger.debug('CodeDeliveryDetails:', CodeDeliveryDetails);

  return {
    details: CodeDeliveryDetails as CodeDeliveryDetailsType
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  logger.debug('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, signUpHandler);

  logger.debug('Response:', response);
  return response;
}
