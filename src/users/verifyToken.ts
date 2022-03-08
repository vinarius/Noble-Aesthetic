import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { setDefaultProps } from '../../lib/lambda';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { HandlerResponse } from '../../models/response';
import { validateVerifyToken, VerifyTokenReqBody } from '../../models/user';

const {
  userPoolId = ''
} = process.env;

const verifyTokenHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {  
  validateEnvVars(['userPoolId']);

  const params: VerifyTokenReqBody = JSON.parse(event.body ?? '{}');

  const isValid = validateVerifyToken(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateVerifyToken.errors ?? [],
    statusCode: 400
  };

  const {
    accessToken,
    appClientId
  } = params.input;

  const verifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId: appClientId,
    tokenUse: 'access'
  });

  await verifier.verify(accessToken).catch(error => {
    throw {
      success: false,
      statusCode: 400,
      message: 'invalid token',
      error
    };
  });

  return {
    success: true
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, verifyTokenHandler);

  console.log('Response:', response);
  return response;
}
