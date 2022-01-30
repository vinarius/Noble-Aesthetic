import 'source-map-support/register';

import { App } from 'aws-cdk-lib';

import { getAppConfig } from '../lib/utils';
import { CICDStack } from '../stacks/CICD-stack';

async function buildInfrastructure(): Promise<void> {
  const {
    project,
    stage,
    branch
  } = await getAppConfig();

  const app = new App();

  const terminationProtection = stage === 'prod' || stage === 'dev';

  new CICDStack(app, `${project}-CICDStack-${stage}`, {
    stackName: `${project}-CICDStack-${stage}`,
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