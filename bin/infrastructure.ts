import 'source-map-support/register';

import { App } from 'aws-cdk-lib';

import { getAppConfig } from '../lib/utils';
import { CICDStack } from '../stacks/CICD-stack';
import { CognitoStack } from '../stacks/cognito-stack';
import { DataSourcesStack } from '../stacks/dataSources-stack';
import { UserLambdasStack } from '../stacks/userLambdas-stack';
import { ApiGatewayStack } from '../stacks/apiGateway-stack';
import { VODStack } from '../stacks/VOD-stack';

async function buildInfrastructure(): Promise<void> {
  const {
    project,
    stage,
    env,
    branch,
    adminEmail,
    apiDomainName,
    acmCertificateId,
    hostedZoneName
  } = await getAppConfig();

  const app = new App();

  const terminationProtection = stage === 'prod' || stage === 'dev';

  const cognitoStack = new CognitoStack(app, `${project}-cognitoStack-${stage}`, {
    stackName: `${project}-cognitoStack-${stage}`,
    project,
    stage,
    env,
    terminationProtection
  });

  const dataSourcesStack = new DataSourcesStack(app, `${project}-dataSourcesStack-${stage}`, {
    stackName: `${project}-dataSourcesStack-${stage}`,
    project,
    stage,
    env,
    terminationProtection
  });

  const userLambdasStack = new UserLambdasStack(app, `${project}-userLambdasStack-${stage}`, {
    stackName: `${project}-userLambdasStack-${stage}`,
    project,
    stage,
    env,
    terminationProtection
  });

  const apigatewayStack = new ApiGatewayStack(app, `${project}-apiGatewayStack-${stage}`, {
    stackName: `${project}-apiGatewayStack-${stage}`,
    project,
    stage,
    env,
    terminationProtection,
    apiDomainName,
    acmCertificateId,
    hostedZoneName
  });

  new VODStack(app, `${project}-VODStack-${stage}`, {
    stackName: `${project}-VODStack-${stage}`,
    project,
    stage,
    env,
    terminationProtection,
    adminEmail
  });

  if (stage === 'prod' || stage === 'dev') {
    new CICDStack(app, `${project}-CICDStack-${stage}`, {
      stackName: `${project}-CICDStack-${stage}`,
      branch,
      project,
      stage,
      terminationProtection
    });
  }

  userLambdasStack.addDependency(cognitoStack);
  userLambdasStack.addDependency(dataSourcesStack);
  apigatewayStack.addDependency(cognitoStack);

  app.synth();
}

buildInfrastructure()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });