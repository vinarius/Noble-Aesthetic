import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { adminDeleteUserById, adminGetUserById, confirmSignUp } from '../../lib/cognito';
import { setDefaultProps } from '../../lib/lambda';
import { retryOptions } from '../../lib/retryOptions';
import { validateEnvVars } from '../../lib/validateEnvVars';
import { codeMismatchError } from '../../models/error';
import { HandlerResponse } from '../../models/response';
import { ConfirmSignUpUserReqBody, DynamoUserItem, validateConfirmSignUpUser } from '../../models/user';

const {
  usersTableName = '',
  userPoolId = ''
} = process.env;

const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });

const confirmSignUpHandler = async (event: APIGatewayProxyEvent): Promise<HandlerResponse> => {
  validateEnvVars(['usersTableName', 'userPoolId']);
  
  const params: ConfirmSignUpUserReqBody = JSON.parse(event.body ?? '{}');

  const isValid = validateConfirmSignUpUser(params);
  if (!isValid) throw {
    success: false,
    validationErrors: validateConfirmSignUpUser.errors ?? [],
    statusCode: 400
  };

  const {
    appClientId,
    username,
    confirmationCode,
    birthdate
  } = params.input;

  await confirmSignUp(cognitoClient, appClientId, username, confirmationCode).catch(err => {
    throw err.name?.toLowerCase() === 'codemismatchexception' ? codeMismatchError : err;
  });

  const userId = (await adminGetUserById(cognitoClient, userPoolId, username)).Username as string;

  const timestamp = new Date().toISOString();

  const newUser: DynamoUserItem = {
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    },
    biography: '',
    birthdate,
    email: username,
    firstName: '',
    gender: '',
    lastName: '',
    phoneNumber: '',
    subscription: {
      current: {
        datePurchased: timestamp,
        renewalDate: '',
        tier: 'basic'
      },
      history: [
        {
          datePurchased: timestamp,
          renewalDate: '',
          tier: 'basic'
        }
      ],
      isActive: false,
      lastPaid: '',
      nextBilling: '',
      paymentFrequency: 'na',
      trial: {
        dateEnded: '',
        dateStarted: '',
        isActive: false,
        isExpired: false
      }
    },
    userId,
    vault: []
  };

  await docClient.put({
    TableName: usersTableName,
    Item: newUser
  }).catch(async (error) => {
    await adminDeleteUserById(cognitoClient, userPoolId, username);
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
