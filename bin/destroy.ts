import {
  CloudFormationClient,
  DeleteStackCommand,
  ListStacksCommand,
  ListStacksCommandOutput,
  StackSummary
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchLogsClient,
  DeleteLogGroupCommand,
  DescribeLogGroupsCommand,
  DescribeLogGroupsCommandOutput,
  LogGroup
} from '@aws-sdk/client-cloudwatch-logs';
import { writeFileSync } from 'fs';
import clientConfig from '../client/clientConfig.json';
import { getAppConfig } from '../lib/getAppConfig';
import { retryOptions } from '../lib/retryOptions';
import { validateAwsProfile } from '../lib/validateAwsProfile';

/**
 * Destroy all cloudformation stacks in parallel by stage name.
 * Delete all cloudwatch log groups by stage name.
 */
async function destroy(): Promise<void> {
  const { IS_JEST } = process.env;
  const cloudWatchLogsClient = new CloudWatchLogsClient({ ...retryOptions });
  const cloudformationClient = new CloudFormationClient({ ...retryOptions });

  try {
    const {
      branch,
      profile,
      stage,
      env,
      isStagingEnv
    } = await getAppConfig();

    if (isStagingEnv)
      throw new Error(`Unable to destroy stacks on branch ${branch} for environment ${stage}. Please check your git branch.`);

    await validateAwsProfile(profile);

    process.env.AWS_PROFILE = profile;
    process.env.AWS_REGION = env.region;

    const totalLogGroupNames: string[] = [];
    let nextToken;

    do {
      const describeLogGroupsOutput: DescribeLogGroupsCommandOutput = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({ nextToken }));

      totalLogGroupNames.push(
        ...(describeLogGroupsOutput.logGroups as LogGroup[] ?? [])
          .map(group => group.logGroupName as string)
          .filter(logGroupName => logGroupName.includes(stage))
      );

      nextToken = describeLogGroupsOutput.nextToken;
    } while (nextToken);

    for (const logGroupName of totalLogGroupNames) await cloudWatchLogsClient.send(new DeleteLogGroupCommand({ logGroupName }));

    const stacks: string[] = [];
    nextToken = undefined;

    do {
      const listStacksOutput: ListStacksCommandOutput = await cloudformationClient.send(
        new ListStacksCommand({
          NextToken: nextToken
        })
      );

      nextToken = listStacksOutput.NextToken;
      const filteredStacks = listStacksOutput.StackSummaries!
        .map((stack: StackSummary) => stack.StackName as string)
        .filter((stackName: string) => stackName.includes(stage));

      stacks.push(...filteredStacks);
    } while (nextToken);

    const deleteStackPromises = stacks.map(StackName => cloudformationClient.send(new DeleteStackCommand({ StackName })));
    await Promise.all(deleteStackPromises);

    if (stage in clientConfig) {
      delete (clientConfig as { [key: string]: unknown; })[stage];
      writeFileSync('./client/clientConfig.json', JSON.stringify(clientConfig, null, 2));
    }

    console.log('>>> Destroy complete.');
  } catch (error) {
    const { name, message } = error as Error;
    console.error(`${name}: ${message}`);

    if (!IS_JEST) process.exit(1);
  }
}

destroy();