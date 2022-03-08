import { CognitoIdentityProviderClient, SignUpCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { signUp } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';
import { SignUpUserReqBody, validateSignUpUser } from '../../models/user';

interface SignUpResponse extends HandlerResponse {
  details: SignUpCommandOutput;
}

const {
  mobileAppClientId = ''
} = process.env;

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const signUpHandler = async (event: APIGatewayProxyEvent): Promise<SignUpResponse> => {  
  validateEnvVars(['mobileAppClientId']);

  const params: SignUpUserReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [mobileAppClientId];

  const isValid = validateSignUpUser(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateSignUpUser.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    userName,
    password
  } = params.input;

  if (!validClientIds.includes(appClientId)) {
    throw {
      success: false,
      error: `Appclient ID '${appClientId}' is Invalid`,
      statusCode: 401
    };
  }
  
  const details: SignUpCommandOutput = await signUp(cognitoClient, appClientId, userName, password);

  return {
    success: true,
    details
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, signUpHandler);

  console.log('Response:', response);
  return response;
}
