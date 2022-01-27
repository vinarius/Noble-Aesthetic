import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fromIni } from '@aws-sdk/credential-providers';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { scan } from '../lib/dynamo';

const stage = process.env.STAGE ?? 'dev';
const awsProfile = process.env.AWS_PROFILE ?? `sigsee-${stage}-token`;
const tableName = process.env.TABLE_NAME ?? `sig-${stage}-users`;

const dynamoClient = new DynamoDBClient({
  credentials: fromIni({
    profile: awsProfile
  })
});

const docClient = DynamoDBDocument.from(dynamoClient);

async function deleteDynamoUserData() {
  console.log('deleteDynamoUserData executed');

  const items = await scan(docClient, tableName);
  console.log(`Total items count: ${items.length}.`);

  const mockData = items.map(item => {
    return {
      DeleteRequest: {
        Key: {
          userId: item.userId
        }
      }
    };
  });

  const batchWritePromises = [];
  let batch = [];
  let deletionCount = 0;

  for (let i=0; i<mockData.length; i++) {
    batch.push(mockData[i]);

    if (batch.length === 25) {
      const batchWritePromise = docClient.batchWrite({
        RequestItems: {
          [tableName]: batch
        }
      });

      batchWritePromises.push(batchWritePromise);
      deletionCount += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    const batchWritePromise = docClient.batchWrite({
      RequestItems: {
        [tableName]: batch
      }
    });

    batchWritePromises.push(batchWritePromise);
    deletionCount += batch.length;
    batch = [];
  }

  await Promise.all(batchWritePromises);

  console.log(`Deleted ${deletionCount} items.`);
  console.log('deleteDynamoUserData execution complete');
}

deleteDynamoUserData()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });