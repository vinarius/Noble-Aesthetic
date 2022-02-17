import { spawn, getAppConfig } from '../lib/utils';

export async function hotswap(): Promise<void> {
  const { alias, branch, deployMfa } = await getAppConfig();
  const profile: string = deployMfa ? `${alias}-token` : alias;
  console.log();
  console.log(`>>> Synthesizing '${branch}' branch for deployment to ${alias} account`);
  console.log(`>>> Using profile ${profile}`);
  console.log();
  const stackName: string = process.env.STACK || '--all';
  spawn(`npm run cdk -- deploy ${stackName} --hotswap --require-approval never --profile ${profile} --outputs-file ./dist/cdk-outputs.json`);
}

hotswap().catch(err => {
  console.error(err);
  process.exit(1);
});
