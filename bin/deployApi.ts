import { spawn, getAppConfig } from '../lib/utils';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export async function deployApi(): Promise<void> {
  const { alias, deployMfa, stage, env, project } = await getAppConfig();
  const profile: string = deployMfa ? `${alias}-token` : alias;

  console.log('\n>>> Deploying api gateway api.\n');

  const cdkOutputsRaw = JSON.parse(readFileSync(resolve(__dirname, '..', 'dist', 'cdk-outputs.json')).toString());
  const restApiId = cdkOutputsRaw[`${project}-apiStack-${stage}`][`${project}apiIdOutput${stage.replace(/\W/g, '')}`];

  spawn(`aws apigateway create-deployment --rest-api-id ${restApiId} --stage-name ${stage} --profile ${profile} --region ${env.region}`);

  console.log('\n>>> Deployment complete.');
}

deployApi().catch(err => {
  console.error(err);
  process.exit(1);
});
