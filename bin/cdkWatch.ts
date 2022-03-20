import { getAppConfig } from '../lib/getAppConfig';
import { spawn } from '../lib/spawn';
import { validateAwsProfile } from '../lib/validateAwsProfile';

async function cdkWatch(): Promise<void> {
  const { IS_JEST } = process.env;
  
  try {
    const { profile } = await getAppConfig();
    
    await validateAwsProfile(profile);

    spawn(`npm run cdk -- watch --profile ${profile}`);
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);

    if (!IS_JEST) process.exit(1);
  }
}

cdkWatch();