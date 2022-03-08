import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { changePassword } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { notAuthorizedError } from '../../models/error';
import { HandlerResponse } from '../../models/response';
import { ChangePasswordReqBody, validateChangePassword } from '../../models/user';

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const changePasswordHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  validateEnvVars([]);

  const userParams: ChangePasswordReqBody = JSON.parse(event.body ?? '{}');

  const isValid = validateChangePassword(userParams);
  if (!isValid) throw {
    success: false,
    validationErrors: validateChangePassword.errors ?? [],
    statusCode: 400
  };

  const {
    accessToken,
    previousPassword,
    proposedPassword
  } = userParams.input;

  await changePassword(cognitoClient, accessToken, previousPassword, proposedPassword).catch(err => {
    throw err.name?.toLowerCase() === 'notauthorizedexception' ? notAuthorizedError : err;
  });

  return {
    success: true
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, changePasswordHandler);

  console.log('Response:', response);
  return response;
}
