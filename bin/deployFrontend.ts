import { S3Client } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { readFileSync } from 'fs';

import { fromRoot } from '../lib/fromRoot';
import { getAppConfig } from '../lib/getAppConfig';
import { retryOptions } from '../lib/retryOptions';
import { validateAwsProfile } from '../lib/validateAwsProfile';

const S3SyncClient = require('s3-sync-client');

const cloudfrontClient = new CloudFrontClient({ ...retryOptions });
const s3Client = new S3Client({ ...retryOptions });
const { sync } = new S3SyncClient({ client: s3Client });

async function syncHostBucket () {
  const { IS_CODEBUILD } = process.env;

  try {
    const { profile, project, stage, isStagingEnv } = await getAppConfig();

    if (!IS_CODEBUILD && isStagingEnv) throw new Error(`Unable to execute deployFrontend, is a staging environment - ${stage}`);
    
    if (!IS_CODEBUILD) await validateAwsProfile(profile);

    const cdkOutputsRaw = JSON.parse(readFileSync(fromRoot(['dist', 'cdk-outputs.json'])).toString());
    const hostBucketName = cdkOutputsRaw[`${project}-WebHostStack-${stage}`][`${project}hostBucketNameOutput${stage.replace(/\W/g, '')}`];
    const distributionId = cdkOutputsRaw[`${project}-WebHostStack-${stage}`][`${project}siteDistributionIdOutput${stage.replace(/\W/g, '')}`];

    console.log('\n>>> Syncing client build with host bucket');
    await sync(fromRoot(['dist', 'client']), `s3://${hostBucketName}`, { del: true });
    console.log('>>> Host bucket deployment complete.');

    console.log('>>> Invalidating cloudfront cache.');
    await cloudfrontClient.send(new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: new Date().toISOString(),
        Paths: {
          Items: ['/*'],
          Quantity: 1
        }
      }
    }));
    console.log('>>> Cache invalidation complete.');
    
    console.log('>>> Frontend deployment complete.\n');
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);

    process.exit(1);
  }
}

syncHostBucket();