import { Aws, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  AccessLogField,
  AccessLogFormat,
  AuthorizationType,
  CfnAccount,
  CfnRestApi,
  Cors,
  EndpointType,
  GatewayResponse,
  LogGroupLogDestination,
  MethodLoggingLevel,
  ResponseType,
  RestApi,
  SecurityPolicy
} from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { AnyPrincipal, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

import { NobleStackProps } from '../models/cloudResources';

interface ApiStackProps extends NobleStackProps {
  apiDomainName: string;
  certificateId: string;
  domainName: string;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const {
      project,
      stage,
      certificateId,
      apiDomainName,
      domainName,
      stack,
      isStagingEnv
    } = props;

    const removalPolicy = isStagingEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    const apiLogGroup = new LogGroup(this, `${project}-${stack}-ApiLogGroup-${stage}`, {
      logGroupName: `${project}-${stack}-ApiLogGroup-${stage}`,
      removalPolicy
    });

    const restApi = new RestApi(this, `${project}-api-${stage}`, {
      restApiName: `${project}-api-${stage}`,
      description: `The api for ${project} - ${stage}`,
      cloudWatchRole: false,
      policy: new PolicyDocument({
        assignSids: true,
        statements: [
          new PolicyStatement({
            actions: [
              'execute-api:Invoke'
            ],
            principals: [new AnyPrincipal()],
            resources: ['*']
          })
        ]
      }),
      deployOptions: {
        dataTraceEnabled: stage !== 'prod',
        stageName: stage,
        loggingLevel: stage === 'prod' ? MethodLoggingLevel.OFF : MethodLoggingLevel.INFO,
        accessLogDestination: new LogGroupLogDestination(apiLogGroup),
        accessLogFormat: AccessLogFormat.custom(JSON.stringify({
          requestId: AccessLogField.contextRequestId(),
          method: AccessLogField.contextHttpMethod(),
          errorMessage: AccessLogField.contextErrorMessage(),
          validation: AccessLogField.contextErrorValidationErrorString(),
          ipAddress: AccessLogField.contextIdentitySourceIp(),
          integrationError: '$context.integrationErrorMessage',
          authorizeError: '$context.authorize.error',
          authenticateError: '$context.authenticate.error'
        }))
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowHeaders: ['*'],
        allowCredentials: true,
        allowMethods: Cors.ALL_METHODS
      },
      defaultMethodOptions: {
        authorizationType: AuthorizationType.NONE,
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json': {
                modelId: 'Empty'
              }
            }
          }
        ]
      }
    });

    restApi.applyRemovalPolicy(RemovalPolicy.DESTROY);

    new StringParameter(this, `${project}-apiIdParam-${stage}`, {
      parameterName: `/${project}/api/id/${stage}`,
      stringValue: restApi.restApiId
    });

    new StringParameter(this, `${project}-rootResourceIdParam-${stage}`, {
      parameterName: `/${project}/api/rootResourceId/${stage}`,
      stringValue: restApi.root.resourceId
    });

    const cloudWatchRole = new Role(this, `${project}-${stack}-apiCloudWatchRole-${stage}`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
      ]
    });

    const apiAccount = new CfnAccount(this, `${project}-${stack}-account-${stage}`, {
      cloudWatchRoleArn: cloudWatchRole.roleArn
    });

    apiAccount.addDependsOn(restApi.node.defaultChild as CfnRestApi);

    if (isStagingEnv) {
      const certArn = `arn:${Aws.PARTITION}:acm:${Aws.REGION}:${Aws.ACCOUNT_ID}:certificate/${certificateId}`;
      const existingCertificate = Certificate.fromCertificateArn(this, `${project}-certificate-${stage}`, certArn);

      const apiCustomDomain = restApi.addDomainName(`${project}-apiDomain-${stage}`, {
        certificate: existingCertificate,
        domainName: apiDomainName,
        securityPolicy: SecurityPolicy.TLS_1_2,
        endpointType: EndpointType.EDGE
      });

      apiCustomDomain.applyRemovalPolicy(RemovalPolicy.DESTROY);

      const zone = HostedZone.fromLookup(this, `${project}-${stack}-hostedZoneLookup-${stage}`, { domainName });

      const aRecord = new ARecord(this, `${project}-${stack}-ARecord-${stage}`, {
        zone,
        target: RecordTarget.fromAlias(new ApiGatewayDomain(restApi.domainName!)),
        recordName: apiDomainName
      });

      aRecord.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }

    new GatewayResponse(this, `${project}-${stack}-unauthorizedResponse-${stage}`, {
      restApi,
      type: ResponseType.UNAUTHORIZED,
      statusCode: '401',
      templates: {
        'application/json': '{\nsuccess: false,\nerror: "unauthorized",\nstatusCode: 401\n}'
      }
    });

    new GatewayResponse(this, `${project}-${stack}-forbiddenResponse-${stage}`, {
      restApi,
      type: ResponseType.ACCESS_DENIED,
      statusCode: '403',
      templates: {
        'application/json': '{\nsuccess: false,\nerror: "access denied",\nstatusCode: 403\n}'
      }
    });

    new GatewayResponse(this, `${project}-${stack}-notFoundResponse-${stage}`, {
      restApi,
      type: ResponseType.RESOURCE_NOT_FOUND,
      statusCode: '404',
      templates: {
        'application/json': '{\nsuccess: false,\nerror: "resource not found",\nstatusCode: 404\n}'
      }
    });

    // deployApi.ts script is dependent on reading this logical id.
    new CfnOutput(this, `${project}-apiIdOutput-${stage}`, { value: restApi.restApiId });
    new CfnOutput(this, `${project}-apiUrlOutput-${stage}`, { value: restApi.url });
  }
}