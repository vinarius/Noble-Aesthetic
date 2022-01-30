import 'source-map-support/register';

import { App } from 'aws-cdk-lib';

import { getAppConfig } from '../lib/utils';
import { CICDStack } from '../stacks/CICD-stack';
import { WebHostStack } from '../stacks/webHost-stack';

async function buildInfrastructure(): Promise<void> {
  const {
    project,
    stage,
    env,
    branch
  } = await getAppConfig();

  const app = new App();

  const terminationProtection = stage === 'prod' || stage === 'dev';

  new WebHostStack(app, `${project}-WebHostStack-${stage}`, {
    stackName: `${project}-WebHostStack-${stage}`,
    env,
    project,
    stage,
    terminationProtection
  });

  new CICDStack(app, `${project}-CICDStack-${stage}`, {
    stackName: `${project}-CICDStack-${stage}`,
    env,
    branch,
    project,
    stage,
    terminationProtection
  });

  app.synth();
}

buildInfrastructure()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });