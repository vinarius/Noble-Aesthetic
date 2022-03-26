import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { getAppConfig } from '../lib/getAppConfig';
import { validateAwsProfile } from '../lib/validateAwsProfile';
import { ApiStack } from '../stacks/api';
import { CICDStack } from '../stacks/CICD';
import { UsersStack } from '../stacks/users';
import { WebHostStack } from '../stacks/webHost';



async function buildInfrastructure(): Promise<void> {
  const { IS_JEST, IS_CODEBUILD } = process.env;

  try {
    const {
      project,
      stage,
      env,
      branch,
      isStagingEnv,
      domainName,
      certificateId,
      apiDomainName,
      profile
    } = await getAppConfig();

    if (!IS_CODEBUILD) await validateAwsProfile(profile);

    const app = new App();

    const terminationProtection = isStagingEnv;

    const webhostStack = new WebHostStack(app, `${project}-WebHostStack-${stage}`, {
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

    if (stage === 'prod') {
      const cicdStack = new CICDStack(app, `${project}-CICDStack-${stage}`, {
        stackName: `${project}-CICDStack-${stage}`,
        stack: 'cicd',
        env,
        branch,
        project,
        stage,
        terminationProtection,
        isStagingEnv
      });

      cicdStack.addDependency(webhostStack);
    }

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
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);

    if (!IS_JEST) process.exit(1);
  }
}

buildInfrastructure()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });