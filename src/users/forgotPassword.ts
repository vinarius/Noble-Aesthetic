import { CodeDeliveryDetailsType, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { forgotPassword } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
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

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const forgotPasswordHandler = async (event: APIGatewayProxyEvent): Promise<ForgotPasswordResponse> => {
  validateEnvVars(['webAppClientId']);

  const userParams: ForgotPasswordReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [webAppClientId];

  const isValid = validateForgotPassword(userParams);
  if (!isValid) throw {
    success: false,
    validationErrors: validateForgotPassword.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    userName
  } = userParams.input;

  if (!validClientIds.includes(appClientId)) {
    throw {
      success: false,
      error: `Appclient ID '${appClientId}' is Invalid`,
      statusCode: 401
    };
  }

  const { CodeDeliveryDetails } = await forgotPassword(cognitoClient, appClientId, userName);

  return {
    success: true,
    details: CodeDeliveryDetails!
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, forgotPasswordHandler);

  console.log('Response:', response);
  return response;
}
