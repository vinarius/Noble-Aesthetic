import 'source-map-support/register';

import { App } from 'aws-cdk-lib';

import { getAppConfig } from '../lib/utils';
import { CICDStack } from '../stacks/CICD';
import { WebHostStack } from '../stacks/webHost';
import { ApiStack } from '../stacks/api';
import { UsersStack } from '../stacks/users';

async function buildInfrastructure(): Promise<void> {
  const {
    project,
    stage,
    env,
    branch,
    isStagingEnv,
    domainName,
    certificateId,
    apiDomainName
  } = await getAppConfig();

  const app = new App();

  const terminationProtection = isStagingEnv;

  new WebHostStack(app, `${project}-WebHostStack-${stage}`, {
    stackName: `${project}-WebHostStack-${stage}`,
    stack: 'webhost',
    env,
    project,
    stage,
    terminationProtection,
    isStagingEnv,
    domainName,
    certificateId
  });

  new CICDStack(app, `${project}-CICDStack-${stage}`, {
    stackName: `${project}-CICDStack-${stage}`,
    stack: 'cicd',
    env,
    branch,
    project,
    stage,
    terminationProtection,
    isStagingEnv
  });

  const apiStack = new ApiStack(app, `${project}-apiStack-${stage}`, {
    stackName: `${project}-apiStack-${stage}`,
    stack: 'api',
    env,
    project,
    stage,
    terminationProtection,
    isStagingEnv,
    certificateId,
    apiDomainName,
    domainName
  });

  const usersStack = new UsersStack(app, `${project}-usersStack-${stage}`, {
    stackName: `${project}-usersStack-${stage}`,
    stack: 'users',
    env,
    project,
    stage,
    terminationProtection,
    isStagingEnv
  });

  usersStack.addDependency(apiStack);

  app.synth();
}

buildInfrastructure()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });