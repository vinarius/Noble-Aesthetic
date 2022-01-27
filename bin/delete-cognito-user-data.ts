import { AdminDeleteUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { fromIni } from '@aws-sdk/credential-providers';
import { StandardRetryStrategy } from '@aws-sdk/middleware-retry';

import { listUserPools, listUsers } from '../lib/cognito';

const stage = process.env.STAGE ?? 'dev';
const awsProfile = process.env.AWS_PROFILE ?? `sigsee-${stage}-token`;
const userPoolName = process.env.USER_POOL_NAME ?? `sig-${stage}-pool`;
const maxRetryAttempts = 10;
const defaultDeleteUserQuota = 25;

const cognitoClient = new CognitoIdentityProviderClient({
  credentials: fromIni({
    profile: awsProfile
  }),
  maxAttempts: maxRetryAttempts,
  retryStrategy: new StandardRetryStrategy(async () => maxRetryAttempts)
});

async function deleteCognitoUserData() {
  console.log('deleteCognitoUserData executed');
  const userPools = await listUserPools(cognitoClient);
  const userPool = userPools.find(pool => pool.Name === userPoolName);
  
  if (!userPool) throw new Error(`User pool name: ${userPoolName}, not found in aws account.`);

  const users = await listUsers(cognitoClient, userPool.Id as string);
  const deleteUserPromises = [];
  let deleteUserCount = 0;
  let totalDeletedCount = 0;

  console.log();
  for (const user of users) {
    const deleteUserPromise = cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPool.Id as string,
        Username: user.Username
      })
    );

    deleteUserPromises.push(deleteUserPromise);
    deleteUserCount++;
    totalDeletedCount++;

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Deleted ${totalDeletedCount} users...`);

    if (deleteUserCount === defaultDeleteUserQuota) {
      await Promise.all(deleteUserPromises);
      deleteUserCount = 0;
    }
  }

  await Promise.all(deleteUserPromises);

  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);

  console.log('deleteCognitoUserData execution complete.');
}

deleteCognitoUserData()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
