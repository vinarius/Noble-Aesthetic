import { CodeDeliveryDetailsType, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { resendConfirmationCode } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { LoggerFactory } from '../../lib/loggerFactory';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';
import { ResendConfirmationCodeReqBody, validateResendConfirmationCode } from '../../models/user';

interface SignUpResponse extends HandlerResponse {
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

  if (!isValid) {
    logger.debug('resendConfirmationCode input was not valid. Throwing an error.');
    throwValidationError(validateResendConfirmationCode.errors);
  }

  const {
    appClientId,
    username
  } = params.input;

  if (!validClientIds.includes(appClientId)) {
    logger.debug('validClientIds does not include appClientId. Throwing an error.');
    throwNotAuthorizedError(`Appclient ID '${appClientId}' is Invalid`);
  }

  const { CodeDeliveryDetails } = await resendConfirmationCode(cognitoClient, appClientId, username)
    .catch(err => {
      logger.debug('resendConfirmationCode operation failed with error:', err);
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

  const response = await setDefaultProps(event, signUpHandler);

  logger.debug('Response:', response);
  return response;
}
