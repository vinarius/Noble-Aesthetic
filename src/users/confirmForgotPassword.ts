import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { confirmForgotPassword } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';
import { ConfirmForgotPasswordReqBody, validateConfirmForgotPassword } from '../../models/user';

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const {
  webAppClientId = ''
} = process.env;

const confirmForgotPasswordHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  validateEnvVars(['webAppClientId']);

  const userParams: ConfirmForgotPasswordReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [webAppClientId];

  const isValid = validateConfirmForgotPassword(userParams);
  if (!isValid) throw {
    success: false,
    validationErrors: validateConfirmForgotPassword.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    userName,
    proposedPassword,
    confirmationCode
  } = userParams.input;

  if (!validClientIds.includes(appClientId)) {
    throw {
      success: false,
      error: `Appclient ID '${appClientId}' is invalid`,
      statusCode: 401
    };
  }

  await confirmForgotPassword(
    cognitoClient,
    appClientId,
    userName,
    proposedPassword,
    confirmationCode
  );
    
  return {
    success: true
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, confirmForgotPasswordHandler);

  console.log('Response:', response);
  return response;
}
