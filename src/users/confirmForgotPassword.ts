import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { confirmForgotPassword } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';
import { ConfirmForgotPasswordReqBody, validateConfirmForgotPassword } from '../../models/user';

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const confirmForgotPasswordHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  validateEnvVars([]);

  const userParams: ConfirmForgotPasswordReqBody = JSON.parse(event.body ?? '{}');

  const isValid = validateConfirmForgotPassword(userParams);
  if (!isValid) throw {
    success: false,
    validationErrors: validateConfirmForgotPassword.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    username,
    proposedPassword,
    confirmationCode
  } = userParams.input;

  await confirmForgotPassword(
    cognitoClient,
    appClientId,
    username,
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
