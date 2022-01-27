import { CognitoIdentityProviderClient, SignUpCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { signUp } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/utils';
import { HandlerResponse } from '../../models/response';
import { SignUpUserReqBody, validateSignUpUser } from '../../models/user';

interface SignUpResponse extends HandlerResponse {
  details: SignUpCommandOutput;
}

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const signUpHandler = async (event: APIGatewayProxyEvent): Promise<SignUpResponse> => {  
  const params: SignUpUserReqBody = JSON.parse(event.body ?? '{}');

  const isValid = validateSignUpUser(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateSignUpUser.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    username,
    password
  } = params.input;

  const details: SignUpCommandOutput = await signUp(cognitoClient, appClientId, username, password);

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
