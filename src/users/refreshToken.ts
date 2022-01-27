import { CognitoIdentityProviderClient, InitiateAuthCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { refreshUserToken } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/utils';
import { HandlerResponse } from '../../models/response';
import { RefreshTokenReqBody, validateRefreshToken } from '../../models/user';

interface RefreshTokenResponse extends HandlerResponse {
  details: InitiateAuthCommandOutput;
}

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const refreshTokenHandler = async (event: APIGatewayProxyEvent): Promise<RefreshTokenResponse> => {  
  const params: RefreshTokenReqBody = JSON.parse(event.body ?? '{}');

  const isValid = validateRefreshToken(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateRefreshToken.errors ?? [],
    statusCode: 400
  };

  const {
    refreshToken,
    appClientId
  } = params.input;

  const details = await refreshUserToken(cognitoClient, appClientId, refreshToken).catch(err => { throw err; });

  return {
    success: true,
    details
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, refreshTokenHandler);

  console.log('Response:', response);
  return response;
}
