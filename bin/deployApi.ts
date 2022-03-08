import { readFileSync } from 'fs';
import { resolve } from 'path';

import { getAppConfig } from '../lib/getAppConfig';
import { spawn } from '../lib/spawn';
import { validateAwsProfile } from '../lib/validateAwsProfile';

export async function deployApi(): Promise<void> {
  const { IS_CODEBUILD, IS_JEST } = process.env;

  try {
    const { profile, stage, env, project } = await getAppConfig();
    const includeProfile = IS_CODEBUILD ? '' : `--profile ${profile}`;
    
    if (!IS_CODEBUILD) await validateAwsProfile(profile);

    console.log('\n>>> Deploying api gateway api.\n');

    const cdkOutputsRaw = JSON.parse(readFileSync(resolve(__dirname, '..', 'dist', 'cdk-outputs.json')).toString());
    const restApiId = cdkOutputsRaw[`${project}-apiStack-${stage}`][`${project}apiIdOutput${stage.replace(/\W/g, '')}`];

    spawn(`aws apigateway create-deployment --rest-api-id ${restApiId} --stage-name ${stage} ${includeProfile} --region ${env.region}`);

    console.log('\n>>> Deployment complete.');
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);

    if (!IS_JEST) process.exit(1);
  }
}

deployApi();