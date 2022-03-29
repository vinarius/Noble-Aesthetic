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

    const targetStage = stage === 'prod' ? stage : 'dev';

    if (existsSync(envFilePath))
      rmSync(envFilePath);

    writeFileSync(envFilePath, `NEXT_PUBLIC_STAGE=${targetStage}`);

    const cdkOutputsRaw = JSON.parse(readFileSync(resolveFromRoot(`cdk-outputs-${targetStage}.json`)).toString());
    const webAppClientId = cdkOutputsRaw[`${project}-usersStack-${targetStage}`][`${project}webAppClientIdOutput${targetStage.replace(/\W/g, '')}`];
    const apiUrl = cdkOutputsRaw[`${project}-apiStack-${targetStage}`][`${project}apiUrlOutput${targetStage.replace(/\W/g, '')}`];

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
      [targetStage]: envVars
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