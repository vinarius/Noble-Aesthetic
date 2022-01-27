import { RemovalPolicy, Stack, StackProps, Aws, CustomResource } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption, EventType, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction as NodeLambda } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaDefinition } from '../models/lambda';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { resolve } from 'path';
import { Role, ServicePrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
interface VODStackProps extends StackProps {
  project: string;
  stage: string;
  adminEmail: string;
}
export class VODStack extends Stack {
  constructor(scope: Construct, id: string, props: VODStackProps) {
    super(scope, id, props);

    const {
      project,
      stage
    } = props;

    /**
     * 1. An Amazon Simple Storage Service (Amazon S3) bucket to store source video files.
     * 2. An AWS Lambda function to create the encoding jobs in AWS Elemental MediaConvert. This is triggered
     *     on video upload to S3.
     * 3. MediaConvert transcodes the video into HLS Adaptive Bitrate files.
     * 4. Amazon EventBridge tracks encoding jobs in MediaConvert and invokes the Lambda job complete function.
     * 5. A Lambda job complete function to process the outputs.
     * 6. An Amazon Simple Notification Service (Amazon SNS) topic to send notifications of completed jobs.
     * 7. A destination S3 bucket to store the outputs from MediaConvert.
     * 8. Amazon CloudFront is configured with the destination S3 bucket as the origin for global distribution
     *     of the transcoded video content.
     */

    const logsBucket = new Bucket(this, `${project}-vodLogsBucket-${stage}`, {
      encryption: BucketEncryption.S3_MANAGED,
      autoDeleteObjects: stage !== 'prod' && stage !== 'dev',
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: stage === 'prod' || stage === 'dev' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    const sourceVideoBucket = new Bucket(this, `${project}-vodSourceBucket-${stage}`, {
      serverAccessLogsBucket: logsBucket,
      serverAccessLogsPrefix: 'source-bucket-logs',
      autoDeleteObjects: stage !== 'prod' && stage !== 'dev',
      encryption: BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: stage === 'prod' || stage === 'dev' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    const destinationVideoBucket = new Bucket(this, `${project}-vodDestinationBucket-${stage}`, {
      serverAccessLogsBucket: logsBucket,
      serverAccessLogsPrefix: 'destination-bucket-logs',
      autoDeleteObjects: stage !== 'prod' && stage !== 'dev',
      encryption: BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: stage === 'prod' || stage === 'dev' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      cors: [
        {
          maxAge: stage === 'prod' || stage === 'dev' ? 3000 : 0,
          allowedMethods: [HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*']
        }
      ]
    });

    const vodTable = new Table(this, `${project}-vod-${stage}`, {
      partitionKey: {
        name: 'videoId',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      tableName: `${project}-vod-${stage}`,
      removalPolicy: stage === 'prod' || stage === 'dev' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    const createJobRole = new Role(this, `${project}-vodMCJobRole-${stage}`, {
      assumedBy: new ServicePrincipal('mediaconvert.amazonaws.com')
    });

    sourceVideoBucket.grantRead(createJobRole);
    destinationVideoBucket.grantWrite(createJobRole);

    // MediaConvert Lambda function to get the endpoint.
    const mediaConvertLambda = new NodeLambda(this, `${project}-vod-getMCEndpoints-${stage}`, {
      runtime: Runtime.NODEJS_14_X,
      functionName: `${project}-vodMediaConvert-${stage}`,
      entry: resolve(__dirname, '..', 'lib', 'getMCEndpoints.ts'),
      bundling: {
        minify: true
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'mediaConvert:DescribeEndpoints'
          ],
          resources: [
            `arn:${Aws.PARTITION}:iam::${Aws.ACCOUNT_ID}:role/*`,
            `arn:${Aws.PARTITION}:mediaconvert:${Aws.REGION}:${Aws.ACCOUNT_ID}:endpoints/*`
          ]
        })
      ],
      projectRoot: resolve(__dirname, '..')
    });

    const mcProviderRole = new Role(this, `${project}-vodMCPJobRole-${stage}`, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    });

    const mcProvider = new Provider(this, `${project}-vodMCProvider-${stage}`, {
      onEventHandler: mediaConvertLambda,
      role: mcProviderRole
    });

    // Consume the mediaconvert lambda function provider 
    const mcProviderResource = new CustomResource(this, `${project}-vodMCProviderResource-${stage}`, { 
      serviceToken: mcProvider.serviceToken,
      properties: {
        project,
        stage
      }
    });

    const endpointMCUrl = mcProviderResource.getAtt('endpointUrl').toString();

    const vodLambdas: LambdaDefinition[] = [
      {
        name: 'createJob',
        environment: {
          destinationS3BucketName: destinationVideoBucket.bucketName,
          roleName: createJobRole.roleArn,
          endpoint: endpointMCUrl
        },
        events: [ 
          new S3EventSource(sourceVideoBucket, { 
            events: [ EventType.OBJECT_CREATED ] 
          }) 
        ],
        initialPolicy: [
          new PolicyStatement({
            actions: [
              'iam:PassRole'
            ],
            resources: [
              `arn:${Aws.PARTITION}:iam::${Aws.ACCOUNT_ID}:role/*`
            ]
          }),
          new PolicyStatement({
            actions: [
              'mediaConvert:CreateJob',
              'mediaConvert:GetJobTemplate'
            ],
            resources: [
              `arn:${Aws.PARTITION}:mediaconvert:${Aws.REGION}:${Aws.ACCOUNT_ID}:queues/Default`,
              `arn:${Aws.PARTITION}:mediaconvert:${Aws.REGION}:${Aws.ACCOUNT_ID}:jobTemplates/System-Ott_Hls_Ts_Avc_Aac`,
              `arn:${Aws.PARTITION}:mediaconvert:${Aws.REGION}:${Aws.ACCOUNT_ID}:presets/*`
            ]
          })
        ]
      },
      {
        name: 'jobComplete'
      },
      {
        name: 'listVideos'
      },
      {
        name: 'getVideoById'
      }
    ];

    for (const lambda of vodLambdas) {
      const { name } = lambda;

      const vodLambda = new NodeLambda(this, `${project}-vod-${name}-${stage}`, {
        ...lambda,
        runtime: Runtime.NODEJS_14_X,
        functionName: `${project}-vod-${name}-${stage}`,
        entry: resolve(__dirname, '..', 'src', 'vod', `${name}.ts`),
        bundling: {
          minify: true
        },
        projectRoot: resolve(__dirname, '..')
      });

      vodTable.grantFullAccess(vodLambda);
    }
  }
}
