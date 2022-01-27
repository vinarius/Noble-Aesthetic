import { exec, getAppConfig } from '../lib/utils';

async function cdkWatch(): Promise<void> {
  const { alias, deployMfa } = await getAppConfig();
  const profile: string = deployMfa ? `${alias}-token` : alias;
  console.log();
  console.log(`>>> Using profile ${profile}`);
  console.log();
  await exec(`npm run cdk -- watch --profile ${profile}`);
}

cdkWatch().catch(err => {
  console.error(err);
  process.exit(1);
});