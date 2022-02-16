import 'source-map-support/register';

import { App } from 'aws-cdk-lib';

import { getAppConfig } from '../lib/utils';
import { CICDStack } from '../stacks/CICD';
import { WebHostStack } from '../stacks/webHost';

async function buildInfrastructure(): Promise<void> {
  const {
    project,
    stage,
    env,
    branch,
    isStagingEnv,
    domainName
  } = await getAppConfig();

  const app = new App();

  const terminationProtection = isStagingEnv;

  new WebHostStack(app, `${project}-WebHostStack-${stage}`, {
    stackName: `${project}-WebHostStack-${stage}`,
    env,
    project,
    stage,
    terminationProtection,
    isStagingEnv,
    domainName
  });

  new CICDStack(app, `${project}-CICDStack-${stage}`, {
    stackName: `${project}-CICDStack-${stage}`,
    env,
    branch,
    project,
    stage,
    terminationProtection,
    isStagingEnv
  });

  app.synth();
}

buildInfrastructure()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });