import { CodeDeliveryDetailsType, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { resendConfirmationCode } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { HandlerResponse } from '../../models/response';
import { ResendConfirmationCodeReqBody, validateResendConfirmationCode } from '../../models/user';

interface SignUpResponse extends HandlerResponse {
  details: CodeDeliveryDetailsType;
}

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const signUpHandler = async (event: APIGatewayProxyEvent): Promise<SignUpResponse> => {
  const params: ResendConfirmationCodeReqBody = JSON.parse(event.body ?? '{}');

  const isValid = validateResendConfirmationCode(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateResendConfirmationCode.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    username
  } = params.input;

  const { CodeDeliveryDetails } = await resendConfirmationCode(cognitoClient, appClientId, username);

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
