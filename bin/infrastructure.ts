import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { getAppConfig } from '../lib/getAppConfig';
import { validateAwsProfile } from '../lib/validateAwsProfile';
import { ApiStack } from '../stacks/api';
import { CICDStack } from '../stacks/CICD';
import { HostStack } from '../stacks/host';
import { UsersStack } from '../stacks/users';

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
    const terminationProtection = stage === 'prod';
    const stackProps = {
      env,
      project,
      stage,
      terminationProtection,
      isStagingEnv
    };

    const hostStack = new HostStack(app, `${project}-host-stack-${stage}`, {
      ...stackProps,
      stackName: `${project}-host-stack-${stage}`,
      stack: 'host',
      domainName,
      certificateId
    });

    const apiStack = new ApiStack(app, `${project}-api-stack-${stage}`, {
      ...stackProps,
      stackName: `${project}-api-stack-${stage}`,
      stack: 'api',
      certificateId,
      apiDomainName,
      domainName
    });

    const usersStack = new UsersStack(app, `${project}-users-stack-${stage}`, {
      ...stackProps,
      stackName: `${project}-users-stack-${stage}`,
      stack: 'users'
    });

    usersStack.addDependency(apiStack);

    if (stage === 'prod') {
      const cicdStack = new CICDStack(app, `${project}-cicd-stack-${stage}`, {
        ...stackProps,
        stackName: `${project}-cicd-stack-${stage}`,
        stack: 'cicd',
        branch
      });

      cicdStack.addDependency(hostStack);
    }

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