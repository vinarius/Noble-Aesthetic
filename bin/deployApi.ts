import { readFileSync } from 'fs';
import { getAppConfig } from '../lib/getAppConfig';
import { resolveFromRoot } from '../lib/resolveFromRoot';
import { spawn } from '../lib/spawn';
import { validateAwsProfile } from '../lib/validateAwsProfile';

export async function deployApi(): Promise<void> {
  const { IS_CODEBUILD, IS_JEST } = process.env;

  try {
    const { profile, stage, env, project, isStagingEnv } = await getAppConfig();
    const includeProfile = IS_CODEBUILD ? '' : `--profile ${profile}`;

    if (!IS_CODEBUILD) await validateAwsProfile(profile);

    console.log('\n>>> Deploying api gateway api.\n');

    const input = isStagingEnv ? [`cdk-outputs-${stage}.json`] : ['dist', `cdk-outputs-${stage}.json`];
    const cdkOutputsPath = resolveFromRoot(...input);
    const cdkOutputsRaw = JSON.parse(readFileSync(cdkOutputsPath).toString());
    const restApiId = cdkOutputsRaw[`${project}-api-stack-${stage}`][`${project}apiIdOutput${stage.replace(/\W/g, '')}`];

    spawn(`aws apigateway create-deployment --rest-api-id ${restApiId} --stage-name ${stage} ${includeProfile} --region ${env.region}`);

    console.log('\n>>> Api deployment complete.');
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);

    if (!IS_JEST) process.exit(1);
  }
}

deployApi();