import { exec, getAppConfig } from '../lib/utils';

async function destroy(): Promise<void> {
  const { alias, branch, deployMfa, stage } = await getAppConfig();
  const profile: string = deployMfa ? `${alias}-token` : alias;

  if (stage === 'prod' || stage === 'dev') {
    throw new Error(`Unable to destroy stacks on branch ${branch} for environment ${stage}. Please check your git branch.`);
  }

  console.log();
  console.log(`>>> Destroying '${branch}' branch stacks from the ${alias} account`);
  console.log(`>>> Using profile ${profile}`);
  console.log();
  
  const stackName: string = process.env.STACK || '--all';
  await exec(`npm run cdk -- destroy ${stackName} --force --profile ${profile}`);
}

destroy().catch(err => {
  console.error(err);
  process.exit(1);
});