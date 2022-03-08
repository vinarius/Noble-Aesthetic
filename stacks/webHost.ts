import { App, Aws, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { resolve } from 'path';

import { NobleStackProps } from '../models/cloudResources';

interface WebHostStackProps extends NobleStackProps {
  domainName: string;
  certificateId: string;
}

export class WebHostStack extends Stack {
  constructor(scope: App, id: string, props: WebHostStackProps) {
    super(scope, id, props);

    const {
      project,
      stage,
      isStagingEnv,
      domainName,
      certificateId
    } = props;

    const removalPolicy = isStagingEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    const hostBucket = new Bucket(this, `${project}-hostBucket-${stage}`, {
      autoDeleteObjects: stage !== 'dev' && stage !== 'prod',
      cors: [
        {
          maxAge: stage === 'prod' || stage === 'dev' ? 3000 : 0,
          allowedMethods: [HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*']
        }
      ],
      enforceSSL: true,
      removalPolicy,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    new CfnOutput(this, `${project}-hostBucketNameOutput-${stage}`, {
      value: hostBucket.bucketName
    });

    const distribution = new Distribution(this, `${project}-siteDistribution-${stage}`, {
      defaultBehavior: {
        origin: new S3Origin(hostBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      defaultRootObject: 'index.html',
      ...isStagingEnv && {
        certificate: Certificate.fromCertificateArn(this, `${project}-certificateLookup-${stage}`, `arn:${Aws.PARTITION}:acm:${Aws.REGION}:${Aws.ACCOUNT_ID}:certificate/${certificateId}`)
      },
      ...isStagingEnv && { domainNames: [domainName] }
    });

    distribution.applyRemovalPolicy(removalPolicy);

    new CfnOutput(this, `${project}-siteDistributionIdOutput-${stage}`, {
      value: distribution.distributionId
    });

    if (isStagingEnv) {
      const zone = HostedZone.fromLookup(this, `${project}-hostedZoneLookup-${stage}`, { domainName });

      new ARecord(this, `${project}-aRecord-${stage}`, {
        zone,
        target: RecordTarget.fromAlias(new CloudFrontTarget(distribution))
      });
    }

    // new BucketDeployment(this, `${project}-bucketDeploy-${stage}`, {
    //   destinationBucket: hostBucket,
    //   sources: [
    //     Source.asset(resolve(__dirname, '..', 'dist', 'client'))
    //   ],
    //   distribution
    // });
  }
}