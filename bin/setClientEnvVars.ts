import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { fromRoot } from '../lib/fromRoot';

import { getAppConfig } from '../lib/getAppConfig';

async function setEnvVars(): Promise<void> {
  const envFilePath = fromRoot(['client', '.env']);

  if (existsSync(envFilePath))
    rmSync(envFilePath);

  const { stage, apiDomainName, project } = await getAppConfig();
  
  const cdkOutputsRaw = JSON.parse(readFileSync(fromRoot(['dist', 'cdk-outputs.json'])).toString());
  const webAppClientId = cdkOutputsRaw[`${project}-usersStack-${stage}`][`${project}webAppClientIdOutput${stage.replace(/\W/g, '')}`];

  const envVars = {
    stage,
    apiDomainName,
    webAppClientId
  };

  let envFileString = '';

  for (const [key, value] of Object.entries(envVars))
    envFileString += `NEXT_PUBLIC_${key.toUpperCase()}=${value}\n`;

  writeFileSync(envFilePath, envFileString);
}

setEnvVars().catch(err => {
  console.error(err);
  process.exit(1);
});