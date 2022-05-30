import { App, Aws, CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution, LambdaEdgeEventType, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { resolve } from 'path';
import { NobleStackProps } from '../models/cloudResources';

interface HostStackProps extends NobleStackProps {
  domainName: string;
  certificateId: string;
}

export class HostStack extends Stack {
  constructor(scope: App, id: string, props: HostStackProps) {
    super(scope, id, props);

    const {
      project,
      stage,
      isStagingEnv,
      domainName,
      certificateId,
      stack
    } = props;

    const { ACCOUNT_ID, PARTITION, REGION } = Aws;

    const removalPolicy = isStagingEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    const hostBucket = new Bucket(this, `${project}-hostBucket-${stage}`, {
      autoDeleteObjects: !isStagingEnv,
      cors: [
        {
          maxAge: isStagingEnv ? 3000 : 0,
          allowedMethods: [HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*']
        }
      ],
      enforceSSL: true,
      removalPolicy,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    new StringParameter(this, `${project}-${stack}-hostBucketArnParam-${stage}`, {
      parameterName: `/${project}/${stack}/hostbucketArn/${stage}`,
      stringValue: hostBucket.bucketArn
    });

    new CfnOutput(this, `${project}-hostBucketNameOutput-${stage}`, {
      value: hostBucket.bucketName
    });

    const hostEdgeLambda = new NodejsFunction(this, `${project}-${stack}-hostEdgeLambda-${stage}`, {
      functionName: `${project}-${stack}-hostEdgeLambda-${stage}`,
      runtime: Runtime.NODEJS_16_X,
      bundling: {
        minify: true
      },
      entry: resolve(__dirname, '..', 'src', stack, 'hostEdgeLambda.ts'),
      logRetention: isStagingEnv ? RetentionDays.TWO_YEARS : RetentionDays.THREE_DAYS,
      projectRoot: resolve(__dirname, '..')
    });

    const distribution = new Distribution(this, `${project}-siteDistribution-${stage}`, {
      comment: `${project}-host-${stage}`,
      defaultBehavior: {
        edgeLambdas: [
          {
            eventType: LambdaEdgeEventType.VIEWER_REQUEST,
            functionVersion: hostEdgeLambda.currentVersion
          }
        ],
        origin: new S3Origin(hostBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.days(1)
        }
      ],
      ...isStagingEnv && {
        certificate: Certificate.fromCertificateArn(this, `${project}-certificateLookup-${stage}`, `arn:${PARTITION}:acm:${REGION}:${ACCOUNT_ID}:certificate/${certificateId}`)
      },
      ...isStagingEnv && { domainNames: [domainName] }
    });

    distribution.applyRemovalPolicy(removalPolicy);

    new StringParameter(this, `${project}-${stack}-siteDistributionIdParam-${stage}`, {
      parameterName: `/${project}/${stack}/siteDistributionId/${stage}`,
      stringValue: distribution.distributionId
    });

    new CfnOutput(this, `${project}-siteDistributionIdOutput-${stage}`, {
      value: distribution.distributionId
    });

    if (isStagingEnv) {
      const zone = HostedZone.fromLookup(this, `${project}-hostedZoneLookup-${stage}`, { domainName });

      new ARecord(this, `${project}-aRecord-${stage}`, {
        zone,
        target: RecordTarget.fromAlias(new CloudFrontTarget(distribution))
      });
    } else {
      new CfnOutput(this, `${project}-siteDistributionDomainNameOutput-${stage}`, {
        value: distribution.distributionDomainName
      });
    }
  }
}