import { CognitoIdentityProviderClient, GlobalSignOutCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { logout } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/utils';
import { invalidTokenError } from '../../models/error';
import { HandlerResponse } from '../../models/response';
import { LogoutReqBody, validateLogout } from '../../models/user';

interface LogoutResponse extends HandlerResponse{
  result: GlobalSignOutCommandOutput;
}

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const logoutHandler = async (event: APIGatewayProxyEvent): Promise<LogoutResponse> => {
  const params: LogoutReqBody = JSON.parse(event.body ?? '{}');

  const isValid = validateLogout(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateLogout.errors ?? [],
    statusCode: 400
  };

  const {
    accessToken
  } = params.input;

  const result: GlobalSignOutCommandOutput = await logout(cognitoClient, accessToken).catch(err => {
    throw err.toLowerCase().includes('invalid access token') ? invalidTokenError : err;
  });

  return {
    success: true,
    result
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, logoutHandler);

  console.log('Response:', response);
  return response;
}
