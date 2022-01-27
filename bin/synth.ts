import { exec, getAppConfig } from '../lib/utils';

export async function synth(): Promise<void> {
  const { alias, branch, deployMfa, stage } = await getAppConfig();
  const profile: string = deployMfa ? `${alias}-token` : alias;
  let includeProfile = `--profile ${profile}`;

  console.log(`\n>>> Synthesizing '${branch}' branch for deployment to ${alias} account`);

  if (process.env.IS_GITHUB) {
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
    
    includeProfile = '';
  } else {
    console.log(`>>> Using profile ${profile}\n`);
  }

  await exec(`npm run cdk -- synth ${includeProfile}`);
  console.log('>>> Synthesis complete');
}

synth().catch(err => {
  console.error(err);
  process.exit(1);
});
