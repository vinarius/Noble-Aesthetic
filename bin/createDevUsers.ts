import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient, ListUserPoolsCommand,
  UserPoolDescriptionType
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { batchPutWrite } from '../lib/dynamo';
import { getAppConfig } from '../lib/getAppConfig';
import { retryOptions } from '../lib/retryOptions';
import { validateAwsProfile } from '../lib/validateAwsProfile';
import { newUser } from '../src/users/confirmSignUp';

const cognitoClient = new CognitoIdentityProviderClient({ ...retryOptions });
const dynamoClient = new DynamoDBClient({ ...retryOptions });
const docClient = DynamoDBDocument.from(dynamoClient);

export async function createDevUsers(): Promise<void> {
  try {
    const { profile, env } = await getAppConfig();

    await validateAwsProfile(profile);

    process.env.AWS_PROFILE = profile;
    process.env.AWS_REGION = env.region;

    const { UserPools } = await cognitoClient.send(new ListUserPoolsCommand({ MaxResults: 60 }));
    const { Id } = UserPools?.find(pool => pool.Name?.toLowerCase().endsWith('dev')) as UserPoolDescriptionType;

    const users = [
      'vindevccm@gmail.com',
      'lydia.h.kraus@gmail.com',
      'colleenmh55@gmail.com'
    ].map(username => {
      return {
        ...newUser,
        username
      };
    });

    const adminCreateUserPromises = [];
    for (const { username } of users) {
      const adminCreateUserPromise = cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: Id,
          Username: username,
          MessageAction: 'SUPPRESS',
          UserAttributes: [
            {
              Name: 'email_verified',
              Value: 'True'
            },
            {
              Name: 'email',
              Value: username
            }
          ]
        })
      );

      adminCreateUserPromises.push(adminCreateUserPromise);
    }

    await Promise.all(adminCreateUserPromises).catch(err => {
      if (err.name !== 'UsernameExistsException') throw err;
    });

    const adminSetUserPasswordPromises = [];
    for (const { username } of users) {
      const adminSetUserPasswordPromise = cognitoClient.send(
        new AdminSetUserPasswordCommand({
          Username: username,
          Permanent: true,
          UserPoolId: Id,
          Password: username === 'vindevccm@gmail.com' ? 'Fo0B@rBaz' : 'PennYpo0!'
        })
      );

      adminSetUserPasswordPromises.push(adminSetUserPasswordPromise);
    }

    await Promise.all(adminSetUserPasswordPromises);

    const { TableNames } = await dynamoClient.send(new ListTablesCommand({}));
    const tableName = TableNames?.find(name => name.includes('dev')) as string;

    const { success, unprocessedItemsCount } = await batchPutWrite(docClient, tableName, users);

    if (!success) console.error(`createDevUsers unsuccessful. Unprocessed items: ${unprocessedItemsCount}`);
    else console.log('createDevUsers complete');
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);
  }
}

createDevUsers();