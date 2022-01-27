import {
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  CognitoIdentityProviderClient,
  MessageActionType,
  UsernameAttributeType,
  UserType
} from '@aws-sdk/client-cognito-identity-provider';
import { fromIni } from '@aws-sdk/credential-providers';
import { StandardRetryStrategy } from '@aws-sdk/middleware-retry';

import { listUserPools, listUsers } from '../code/shared/cognito';
import { data } from '../data/users-mock-data.json';

const stage = process.env.STAGE ?? 'dev';
const awsProfile = process.env.AWS_PROFILE ?? `sigsee-${stage}-token`;
const userPoolName = process.env.USER_POOL_NAME ?? `sig-${stage}-pool`;
const maxRetryAttempts = 10;
const userCreationDefaultQuota = 50;

const cognitoClient = new CognitoIdentityProviderClient({
  credentials: fromIni({
    profile: awsProfile
  }),
  maxAttempts: maxRetryAttempts,
  retryStrategy: new StandardRetryStrategy(async () => maxRetryAttempts)
});

let userCreationCount = 0;

async function loadCognitoFrom() {
  console.log('loadCognitoFrom executed');

  const userPools = await listUserPools(cognitoClient);
  const userPool = userPools.find(pool => pool.Name === userPoolName);
  
  if (!userPool) throw new Error(`User pool name: ${userPoolName}, not found in aws account.`);

  const existingUsers: UserType[] = await listUsers(cognitoClient, userPool.Id!);
  if (existingUsers.length > 0) {
    console.log('Users already exist in the user pool.');
    console.log('loadCognitoFrom execution complete');
    return;
  }

  const users = data.map(user => {
    const {
      email,
      phoneNumber
    } = user;

    return { email, phoneNumber };
  });

  const createUserPromises = [];

  let batchCreateCount = 0;
  console.log();
  for (const {
    email,
    phoneNumber
  } of users) {
    const input: AdminCreateUserCommandInput = {
      UserPoolId: userPool.Id,
      Username: email,
      UserAttributes: [
        {
          Name: UsernameAttributeType.EMAIL,
          Value: email
        },
        {
          Name: UsernameAttributeType.PHONE_NUMBER,
          Value: phoneNumber
        }
      ],
      MessageAction: MessageActionType.SUPPRESS
    };
    const command = new AdminCreateUserCommand(input);
    createUserPromises.push(cognitoClient.send(command));
    batchCreateCount++;
    userCreationCount++;

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Created ${userCreationCount} users...`);

    if (batchCreateCount === userCreationDefaultQuota) {
      await Promise.all(createUserPromises);
      batchCreateCount = 0;
    }
  }

  await Promise.all(createUserPromises);
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);

  console.log(`Created ${userCreationCount} users.`);
  console.log('loadCognitoFrom execution complete');
}

loadCognitoFrom()
  .catch(err => {
    console.error(err);
    console.log(`Created ${userCreationCount} users.`);
    process.exit(1);
  });