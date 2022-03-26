import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { getAppConfig } from '../lib/getAppConfig';
import { resolveFromRoot } from '../lib/resolveFromRoot';

export interface ClientStageDefinition {
  stage: string;
  apiDomainName: string;
  webAppClientId: string;
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
      apiDomainName: isStagingEnv ? apiDomainName : apiUrl,
      stage,
      webAppClientId
    };

    const clientConfigOriginal = JSON.parse(readFileSync(resolveFromRoot('client', 'clientConfig.json')).toString()) as { stages: ClientStageDefinition[] };

    const clientConfigRefreshed = {
      stages: clientConfigOriginal.map(stage => {

      })
    };

    // spawn('cd client && npm run build');
    console.log('\n>>> Client build complete.\n');
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);
    console.error(error);

    process.exit(1);
  }
}

setEnvVars();