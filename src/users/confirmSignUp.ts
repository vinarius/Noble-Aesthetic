import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { adminDeleteUserByUserName, confirmSignUp } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { codeMismatchError } from '../../models/error';
import { HandlerResponse } from '../../models/response';
import { ConfirmSignUpUserReqBody, DynamoUserItem, validateConfirmSignUpUser } from '../../models/user';

const {
  usersTableName = '',
  userPoolId = '',
  webAppClientId = ''
} = process.env;

const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

export const newUser: DynamoUserItem = {
  userName: '',
  dataKey: 'details',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  },
  birthdate: '',
  firstName: '',
  gender: '',
  lastName: '',
  phoneNumber: ''
};

const confirmSignUpHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  validateEnvVars([
    'usersTableName', 
    'userPoolId',
    'webAppClientId'
  ]);
  
  const params: ConfirmSignUpUserReqBody = JSON.parse(event.body ?? '{}');
  const validClientIds = [webAppClientId];

  const isValid = validateConfirmSignUpUser(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateConfirmSignUpUser.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    userName,
    confirmationCode
  } = params.input;

  if (!validClientIds.includes(appClientId)) {
    throw {
      success: false,
      error: `Appclient ID '${appClientId}' is Invalid`,
      statusCode: 401
    };
  }
  
  await confirmSignUp(cognitoClient, appClientId, userName, confirmationCode).catch(err => {
    throw err.name?.toLowerCase() === 'codemismatchexception' ? codeMismatchError : err;
  });

  newUser.userName = userName;

  await docClient.put({
    TableName: usersTableName,
    Item: newUser
  }).catch(async (error) => {
    await adminDeleteUserByUserName(cognitoClient, userPoolId, userName);
    throw error;
  });

  return {
    success: true
  };
};

export async function handler(event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, confirmSignUpHandler);

  console.log('Response:', response);
  return response;
}
