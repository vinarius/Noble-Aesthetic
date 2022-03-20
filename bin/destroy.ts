import {
  CloudWatchLogsClient,
  DeleteLogGroupCommand,
  DescribeLogGroupsCommand,
  DescribeLogGroupsCommandOutput,
  LogGroup
} from '@aws-sdk/client-cloudwatch-logs';

import { getAppConfig } from '../lib/getAppConfig';
import { retryOptions } from '../lib/retryOptions';
import { spawn } from '../lib/spawn';
import { validateAwsProfile } from '../lib/validateAwsProfile';

async function destroy(): Promise<void> {
  const { IS_JEST } = process.env;
  const cloudWatchLogsClient = new CloudWatchLogsClient({ ...retryOptions });

  try {
    const { alias, branch, profile, stage, env, isStagingEnv } = await getAppConfig();

    if (isStagingEnv)
      throw new Error(`Unable to destroy stacks on branch ${branch} for environment ${stage}. Please check your git branch.`);

    await validateAwsProfile(profile);

    process.env.AWS_PROFILE = profile;
    process.env.AWS_REGION = env.region;

    console.log('>>> Cleaning up log groups');

    let totalLogGroupNames: string[] = [];
    let nextToken;

    do {
      const describeLogGroupsOutput: DescribeLogGroupsCommandOutput = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({ nextToken }));

      totalLogGroupNames = [
        ...totalLogGroupNames,
        ...(describeLogGroupsOutput.logGroups as LogGroup[] ?? []).map(group => group.logGroupName as string).filter(logGroupName => logGroupName.includes(stage))
      ];

      nextToken = describeLogGroupsOutput.nextToken;
    } while (nextToken);

    for (const logGroupName of totalLogGroupNames) {
      await cloudWatchLogsClient.send(new DeleteLogGroupCommand({ logGroupName }));
    }

    console.log('>>> Log groups cleaned successfully.');

    console.log(`\n>>> Destroying '${branch}' branch stacks from the ${alias} account`);
    console.log(`>>> Using profile ${profile}\n`);

    spawn('npm run cdk -- destroy --all --force');
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);

    if (!IS_JEST) process.exit(1);
  }
}

destroy();