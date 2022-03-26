import { getAppConfig } from '../lib/getAppConfig';
import { spawn } from '../lib/spawn';
import { validateAwsProfile } from '../lib/validateAwsProfile';

export async function deploy(): Promise<void> {
  const { IS_JEST, IS_CODEBUILD, STACK } = process.env;

  try {
    const { alias, branch, profile, stage, isStagingEnv } = await getAppConfig();
    const profileFlag = IS_CODEBUILD ? '' : `--profile ${profile}`;
    const outputsFlag = STACK ? '' :
      isStagingEnv ? `--outputs-file ./cdk-outputs-${stage}.json` :
        `--outputs-file ./dist/cdk-outputs-${stage}.json`;

    if (!IS_CODEBUILD) await validateAwsProfile(profile);

    console.log(`\n>>> Synthesizing '${branch}' branch for deployment to ${alias} account`);

    const stackName: string = STACK || '--all';
    spawn(`npm run cdk -- deploy ${stackName} --require-approval never ${profileFlag} ${outputsFlag}`);
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);

    if (!IS_JEST) process.exit(1);
  }
}

deploy();