import { App, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';

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
      websiteIndexDocument: 'index.html'
    });

    process.env.HOST_BUCKET_NAME = hostBucket.bucketName; // TODO: how to sync post deploy??

    const s3Origin = new S3Origin(hostBucket);

    new Distribution(this, `${project}-siteDistribution-${stage}`, {
      defaultBehavior: {
        origin: s3Origin
      }
    });

    
  }
}