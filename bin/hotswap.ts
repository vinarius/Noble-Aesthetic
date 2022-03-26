import { getAppConfig } from '../lib/getAppConfig';
import { spawn } from '../lib/spawn';
import { validateAwsProfile } from '../lib/validateAwsProfile';

export async function hotswap(): Promise<void> {
  const { IS_JEST } = process.env;

  try {
    const { profile } = await getAppConfig();
    
    await validateAwsProfile(profile);

    const stackName: string = process.env.STACK || '--all';
    spawn(`npm run cdk -- deploy ${stackName} --hotswap --require-approval never --profile ${profile} --outputs-file ./dist/cdk-outputs.json`);
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);

    if (!IS_JEST) process.exit(1);
  }
}

hotswap();