import { getAppConfig } from '../lib/getAppConfig';
import { spawn } from '../lib/spawn';
import { validateAwsProfile } from '../lib/validateAwsProfile';

export async function synth(): Promise<void> {
  const { IS_JEST, IS_GITHUB } = process.env;

  try {
    const { alias, branch, stage, profile } = await getAppConfig();
    const includeProfile = IS_GITHUB ? '' : `--profile ${profile}`;
    
    if (!IS_GITHUB) await validateAwsProfile(profile);

    console.log(`\n>>> Synthesizing '${branch}' branch for deployment to ${alias} account`);

    if (IS_GITHUB) {
      const {
        DEV_ACCESS_KEY_ID = '',
        DEV_SECRET_ACCESS_KEY = '',
        PROD_ACCESS_KEY_ID = '',
        PROD_SECRET_ACCESS_KEY = ''
      } = process.env;

      process.env.AWS_ACCESS_KEY_ID = stage === 'prod' ? PROD_ACCESS_KEY_ID : DEV_ACCESS_KEY_ID;
      process.env.AWS_SECRET_ACCESS_KEY = stage === 'prod' ? PROD_SECRET_ACCESS_KEY : DEV_SECRET_ACCESS_KEY;
      process.env.AWS_DEFAULT_REGION = 'us-east-1';

      console.log(`>>> Access key credentials set for github for stage ${stage}\n`);
    } else {
      console.log(`>>> Using profile ${profile}`);
    }

    spawn(`npm run cdk -- synth ${includeProfile}`);
    console.log('>>> Synthesis complete');
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);

    if (!IS_JEST) process.exit(1);
  }
}

synth();