import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { getAppConfig } from '../lib/getAppConfig';
import { resolveFromRoot } from '../lib/resolveFromRoot';
import { spawn } from '../lib/spawn';

export interface ClientStageDefinition {
  stage: string;
  apiDomainName: string;
  webAppClientId: string;
}

export interface ClientConfig {
  stages: ClientStageDefinition[];
}

async function setEnvVars(): Promise<void> {
  try {
    const { stage, apiDomainName, project, isStagingEnv } = await getAppConfig();
    const envFilePath = resolveFromRoot('client', '.env');

    if (existsSync(envFilePath))
      rmSync(envFilePath);

    writeFileSync(envFilePath, `NEXT_PUBLIC_STAGE=${stage}`);

    const cdkOutputsRaw = JSON.parse(readFileSync(resolveFromRoot(`cdk-outputs-${stage}.json`)).toString());
    const webAppClientId = cdkOutputsRaw[`${project}-usersStack-${stage}`][`${project}webAppClientIdOutput${stage.replace(/\W/g, '')}`];
    const apiUrl = cdkOutputsRaw[`${project}-apiStack-${stage}`][`${project}apiUrlOutput${stage.replace(/\W/g, '')}`];

    const envVars = {
      stage,
      apiDomainName: isStagingEnv ? apiDomainName : apiUrl,
      webAppClientId
    };

    const clientConfigPath = resolveFromRoot('client', 'clientConfig.json');

    if (!existsSync(clientConfigPath)) {
      const defaultClientConfig: ClientConfig = {
        stages: [
          {
            stage: 'dev',
            apiDomainName: '',
            webAppClientId: ''
          },
          {
            stage: 'prod',
            apiDomainName: '',
            webAppClientId: ''
          }
        ]
      };

      writeFileSync(clientConfigPath, JSON.stringify(defaultClientConfig));
    }

    const clientConfigOriginal = JSON.parse(readFileSync(clientConfigPath).toString()) as ClientConfig;
    const clientConfigRefreshed: ClientConfig = {
      stages: clientConfigOriginal.stages.map(stageDefinition => stageDefinition.stage === stage ? envVars : stageDefinition)
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