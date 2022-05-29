import { Aws, Stack } from 'aws-cdk-lib';
import { EventAction, FilterGroup, LinuxBuildImage, Project, Source } from 'aws-cdk-lib/aws-codebuild';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { repo } from '../config';
import { NobleStackProps } from '../models/cloudResources';


export class CICDStack extends Stack {
  constructor(scope: Construct, id: string, props: NobleStackProps) {
    super(scope, id, props);

    const {
      project,
      stage,
      branch,
      stack
    } = props;

    const { PARTITION, ACCOUNT_ID } = Aws;

    const hostBucketArn = StringParameter.fromStringParameterName(this, `${project}-${stack}-hostBucketArnParam-${stage}`, `/${project}/webhost/hostbucketArn/${stage}`).stringValue;
    const siteDistributionId = StringParameter.fromStringParameterName(this, `${project}-${stack}-siteDistributionIdParam-${stage}`, `/${project}/webhost/siteDistributionId/${stage}`).stringValue;

    new Project(this, `${project}-codeBuildProject-${stage}`, {
      projectName: `${project}-codeBuildProject-${stage}`,
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0
      },
      environmentVariables: {
        BRANCH: {
          value: branch
        },
        IS_CODEBUILD: {
          value: true
        },
        STAGE: {
          value: stage
        }
      },
      source: Source.gitHub({
        owner: 'vinarius',
        repo,
        branchOrRef: branch,
        webhook: true,
        webhookFilters: [
          FilterGroup.inEventOf(EventAction.PUSH).andBranchIs(branch as string),
          FilterGroup.inEventOf(EventAction.PULL_REQUEST_MERGED).andBranchIs(branch as string)
        ]
      }),
      role: new Role(this, `${project}-codeBuildRole-${stage}`, {
        assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
        roleName: `${project}-codeBuildRole-${stage}`,
        inlinePolicies: {
          [project]: new PolicyDocument({
            statements: [
              new PolicyStatement({
                actions: ['sts:assumeRole'],
                resources: [
                  `arn:${PARTITION}:iam::${ACCOUNT_ID}:role/cdk-hnb659fds-*`
                ]
              }),
              new PolicyStatement({
                actions: ['s3:*'],
                resources: [
                  hostBucketArn,
                  `${hostBucketArn}/*`
                ]
              }),
              new PolicyStatement({
                actions: ['cloudfront:CreateInvalidation'],
                resources: [
                  `arn:${PARTITION}:cloudfront::${ACCOUNT_ID}:distribution/${siteDistributionId}`
                ]
              })
            ]
          })
        }
      })
    });
  }
}