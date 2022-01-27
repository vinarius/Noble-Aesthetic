import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fromIni } from '@aws-sdk/credential-providers';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { listUserPools, listUsers } from '../code/shared/cognito';

import { DynamoScanItemsResponse, scan } from '../code/shared/dynamo';
import { DynamoUserItem } from '../code/shared/models/user';
import { data } from '../data/users-mock-data.json';

const stage = process.env.STAGE ?? 'dev';
const awsProfile = process.env.AWS_PROFILE ?? `sigsee-${stage}-token`;
const tableName = process.env.TABLE_NAME ?? `sig-${stage}-users`;
const userPoolName = process.env.USER_POOL_NAME ?? `sig-${stage}-pool`;

const dynamoClient = new DynamoDBClient({
  credentials: fromIni({
    profile: awsProfile
  })
});

const ddbDocClient = DynamoDBDocument.from(dynamoClient);

const cognitoClient = new CognitoIdentityProviderClient({
  credentials: fromIni({
    profile: awsProfile
  })
});

async function loadDynamoUserData() {
  console.log('loadDynamoUserData executed');

  const tableData: DynamoScanItemsResponse[] = await scan(ddbDocClient, tableName);
  if (tableData.length > 0) {
    console.log('Data already exists in the table.');
    console.log('loadDynamoUserData execution complete');
    return;
  }

  const userPools = await listUserPools(cognitoClient);
  const userPool = userPools.find(pool => pool.Name === userPoolName);
  if (!userPool) throw new Error(`User pool name: ${userPoolName}, not found in aws account.`);

  const cognitoUsers = await listUsers(cognitoClient, userPool.Id!);

  const dynamoItems = [...cognitoUsers].map(cognitoUser => {
    const cognitoEmail = cognitoUser.Attributes?.find(att => att.Name?.toLowerCase() === 'email')?.Value;
    const mockDataUser = data.find(mockUser => mockUser.email === cognitoEmail);
    const Item = {
      userId: cognitoUser.Username,
      ...mockDataUser
    } as DynamoUserItem;

    return {
      PutRequest: { Item }
    };
  });

  const batchWritePromises = [];
  let batch = [];

  for (let i=1; i<dynamoItems.length+1; i++) {
    batch.push(dynamoItems[i]);

    if (batch.length === 25) {
      const batchWritePromise = ddbDocClient.batchWrite({
        RequestItems: {
          [tableName]: batch
        }
      });

      batchWritePromises.push(batchWritePromise);
      batch = [];
    }
  }

  if (batch.length > 0) {
    const batchWritePromise = ddbDocClient.batchWrite({
      RequestItems: {
        [tableName]: batch
      }
    });

    batchWritePromises.push(batchWritePromise);
    batch = [];
  }

  await Promise.all(batchWritePromises);

  console.log('loadDynamoUserData execution complete');
}

loadDynamoUserData();