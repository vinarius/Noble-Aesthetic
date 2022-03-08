import { CodeDeliveryDetailsType, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { resendConfirmationCode } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';
import { ResendConfirmationCodeReqBody, validateResendConfirmationCode } from '../../models/user';

interface SignUpResponse extends HandlerResponse {
  details: CodeDeliveryDetailsType;
}

const {
  mobileAppClientId = ''
} = process.env;

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const signUpHandler = async (event: APIGatewayProxyEvent): Promise<SignUpResponse> => {
  validateEnvVars(['mobileAppClientId']);

  const params: ResendConfirmationCodeReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [mobileAppClientId];

  const isValid = validateResendConfirmationCode(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateResendConfirmationCode.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    userName
  } = params.input;

  if (!validClientIds.includes(appClientId)) {
    throw {
      success: false,
      error: `Appclient ID '${appClientId}' is Invalid`,
      statusCode: 401
    };
  }
  
  const { CodeDeliveryDetails } = await resendConfirmationCode(cognitoClient, appClientId, userName);

  return {
    success: true,
    details: CodeDeliveryDetails!
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, signUpHandler);

  console.log('Response:', response);
  return response;
}
