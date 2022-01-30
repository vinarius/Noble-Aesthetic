import { App, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { resolve } from 'path';

interface WebHostStackProps extends StackProps {
  project: string;
  stage: string;
}

export class WebHostStack extends Stack {
  constructor(scope: App, id: string, props: WebHostStackProps) {
    super(scope, id, props);

    const {
      project,
      stage
    } = props;

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
      removalPolicy: stage === 'dev' || stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    const cloudfrontDist = new Distribution(this, `${project}-siteDistribution-${stage}`, {
      defaultBehavior: {
        origin: new S3Origin(hostBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      defaultRootObject: 'index.html'
    });

    new BucketDeployment(this, `${project}-bucketDeploy-${stage}`, {
      destinationBucket: hostBucket,
      sources: [
        Source.asset(resolve(__dirname, '..', 'dist', 'client'))
      ],
      distribution: cloudfrontDist
    });
  }
}