import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { getAppConfig } from '../lib/getAppConfig';
import { resolveFromRoot } from '../lib/resolveFromRoot';
import { spawn } from '../lib/spawn';

export interface ClientStageDefinition {
  apiDomainName: string;
  webAppClientId: string;
}

export interface ClientConfig {
  [key: string]: ClientStageDefinition;
}

async function setEnvVars(): Promise<void> {
  try {
    const { stage, apiDomainName, project, isStagingEnv } = await getAppConfig();
    const envFilePath = resolveFromRoot('client', '.env');

    if (existsSync(envFilePath))
      rmSync(envFilePath);

    writeFileSync(envFilePath, `NEXT_PUBLIC_STAGE=${stage}`);
    const input = isStagingEnv ? [`cdk-outputs-${stage}.json`] : ['dist', `cdk-outputs-${stage}.json`];
    const outputsPath = resolveFromRoot(...input);
    const cdkOutputsRaw = JSON.parse(readFileSync(outputsPath).toString());
    const webAppClientId = cdkOutputsRaw[`${project}-usersStack-${stage}`][`${project}webAppClientIdOutput${stage.replace(/\W/g, '')}`];
    const apiUrl = cdkOutputsRaw[`${project}-apiStack-${stage}`][`${project}apiUrlOutput${stage.replace(/\W/g, '')}`];

    const envVars: ClientStageDefinition = {
      apiDomainName: isStagingEnv ? apiDomainName : apiUrl,
      webAppClientId
    };

    const clientConfigPath = resolveFromRoot('client', 'clientConfig.json');

    if (!existsSync(clientConfigPath)) {
      const defaultClientConfig: ClientConfig = {
        dev: {
          apiDomainName: '',
          webAppClientId: ''
        },
        prod: {
          apiDomainName: '',
          webAppClientId: ''
        }
      };

      writeFileSync(clientConfigPath, JSON.stringify(defaultClientConfig));
    }

    const clientConfigOriginal = JSON.parse(readFileSync(clientConfigPath).toString()) as ClientConfig;
    const clientConfigRefreshed: ClientConfig = {
      ...clientConfigOriginal,
      [stage]: envVars
    };

    writeFileSync(clientConfigPath, JSON.stringify(clientConfigRefreshed));

    spawn('cd client && npm run build');
    console.log('\n>>> Client build complete.\n');
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);
    console.error(error);

    process.exit(1);
  }
}

setEnvVars();