import { exec, getAppConfig } from '../lib/utils';

async function syncHostBucket(): Promise<void> {
  const { project, stage } = await getAppConfig();

  const hostBucket = `${project}-hostbucket-${stage}`.toLowerCase();
  
  await exec(`aws s3 sync dist/client/* s3://${hostBucket}`);
}

syncHostBucket().catch(err => {
  console.error(err);
  process.exit(1);
});