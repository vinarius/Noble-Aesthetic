import { existsSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { getAppConfig } from '../lib/getAppConfig';

async function setEnvVars(): Promise<void> {
  const { stage, apiDomainName } = await getAppConfig();

  const envFilePath = resolve(__dirname, '..', 'client', '.env');

  if (existsSync(envFilePath))
    rmSync(envFilePath);

  const envVars = {
    stage,
    apiDomainName
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