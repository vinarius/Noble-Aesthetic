import { Aws, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AccessLogField,
  AccessLogFormat,
  AuthorizationType,
  CfnAccount,
  CfnRestApi,
  CognitoUserPoolsAuthorizer,
  Cors,
  EndpointType,
  GatewayResponse,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  ResponseType,
  RestApi,
  SecurityPolicy
} from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { AnyPrincipal, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { readdirSync } from 'fs';
import { resolve } from 'path';

interface SigApiGatewayProps extends StackProps {
  project: string;
  stage: string;
  acmCertificateId: string;
  apiDomainName: string;
  hostedZoneName: string;
}

enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS'
}

export class ApiGatewayStack extends Stack {
  constructor(scope: Construct, id: string, props: SigApiGatewayProps) {
    super(scope, id, props);

    const {
      project,
      stage,
      acmCertificateId,
      hostedZoneName,
      apiDomainName
    } = props;

    const userLambdas: {
      name: string;
      lambda: IFunction;
    }[] = [];
    
    const usersSrcPath = resolve(__dirname, '..', 'src', 'users');
    const userLambdaNames = readdirSync(usersSrcPath).map(fileName => fileName.slice(0, -3));

    const userPoolId = StringParameter.fromStringParameterName(this, `${project}-userPoolIdParam-${stage}`, `/${project}/cognitoStack/userPoolId/${stage}`).stringValue;
    const sigUserPool = UserPool.fromUserPoolId(this, `${project}-users-${stage}`, userPoolId);

    const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(this, `${project}-authorizer-${stage}`, {
      cognitoUserPools: [
        sigUserPool
      ],
      authorizerName: `${project}-authorizer-${stage}`,
      resultsCacheTtl: stage === 'prod' ? Duration.minutes(5) : Duration.minutes(0)
    });

    const apiLogGroup = new LogGroup(this, `${project}-apiLogGroup-${stage}`, {
      logGroupName: `${project}-apiLogGroup-${stage}`,
      removalPolicy: stage === 'prod' || stage === 'dev' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    const sigRestApi = new RestApi(this, `${project}-restApi-${stage}`, {
      restApiName: `${project}-restApi-${stage}`,
      description: `The rest api for ${project} - ${stage}`,
      cloudWatchRole: false,
      policy: new PolicyDocument({
        assignSids: true,
        statements: [
          new PolicyStatement({
            actions: [
              'execute-api:Invoke'
            ],
            principals: [ new AnyPrincipal() ],
            resources: ['*']
          })
        ]
      }),
      deployOptions: {
        dataTraceEnabled: stage !== 'prod',
        stageName: stage,
        loggingLevel: stage === 'prod' ? MethodLoggingLevel.OFF : MethodLoggingLevel.ERROR,
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

    const cloudWatchRole = new Role(this, `${project}-apiCloudWatchRole-${stage}`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
      ]
    });

    const sigApiAccount = new CfnAccount(this, `${project}-account-${stage}`, {
      cloudWatchRoleArn: cloudWatchRole.roleArn
    });

    sigApiAccount.addDependsOn(sigRestApi.node.defaultChild as CfnRestApi);

    if (stage === 'dev' || stage === 'prod') {
      const certArn = `arn:${Aws.PARTITION}:acm:${Aws.REGION}:${Aws.ACCOUNT_ID}:certificate/${acmCertificateId}`;
      const existingCertificate = Certificate.fromCertificateArn(this, `${project}-certificate-${stage}`, certArn);

      sigRestApi.addDomainName(`${project}-apiDomain-${stage}`, {
        certificate: existingCertificate,
        domainName: apiDomainName,
        securityPolicy: SecurityPolicy.TLS_1_2,
        endpointType: EndpointType.EDGE
      });

      const zone = HostedZone.fromLookup(this, `${project}-hostedZoneLookup-${stage}`, { domainName: hostedZoneName });

      new ARecord(this, `${project}-ARecord-${stage}`, {
        zone,
        target: RecordTarget.fromAlias(new ApiGatewayDomain(sigRestApi.domainName!)),
        recordName: apiDomainName
      });
    }

    for (const name of userLambdaNames) {
      const arn = `arn:${Aws.PARTITION}:lambda:${Aws.REGION}:${Aws.ACCOUNT_ID}:function:${project}-users-${name}-${stage}`;
      const userLambda = NodejsFunction.fromFunctionArn(this, `${project}-users-${name}-${stage}`, arn);
      userLambdas.push({
        name,
        lambda: userLambda
      });
    }

    new GatewayResponse(this, `${project}-unauthorizedResponse-${stage}`, {
      restApi: sigRestApi,
      type: ResponseType.UNAUTHORIZED,
      statusCode: '401',
      templates: {
        'application/json': '{\nsuccess: false,\nerror: "unauthorized",\nstatusCode: 401\n}'
      }
    });

    new GatewayResponse(this, `${project}-forbiddenResponse-${stage}`, {
      restApi: sigRestApi,
      type: ResponseType.ACCESS_DENIED,
      statusCode: '403',
      templates: {
        'application/json': '{\nsuccess: false,\nerror: "access denied",\nstatusCode: 403\n}'
      }
    });
   
    new GatewayResponse(this, `${project}-notFoundResponse-${stage}`, {
      restApi: sigRestApi,
      type: ResponseType.RESOURCE_NOT_FOUND,
      statusCode: '404',
      templates: {
        'application/json': '{\nsuccess: false,\nerror: "resource not found",\nstatusCode: 404\n}'
      }
    });

    const authMethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: cognitoAuthorizer
    };

    // POST /login
    const loginRoute = sigRestApi.root.addResource('login');
    const loginLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'login')?.lambda;
    loginRoute.addMethod(HttpMethod.POST, new LambdaIntegration(loginLambda as IFunction));

    // POST /logout
    const logoutRoute = sigRestApi.root.addResource('logout');
    const logoutLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'logout')?.lambda;
    logoutRoute.addMethod(HttpMethod.POST, new LambdaIntegration(logoutLambda as IFunction), authMethodOptions);

    // /users
    const usersRoute = sigRestApi.root.addResource('users');

    // GET /users
    const getUsersLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'get')?.lambda;
    usersRoute.addMethod(HttpMethod.GET, new LambdaIntegration(getUsersLambda as IFunction), authMethodOptions);

    // TODO:
    // /users/admin
    // const usersAdminRoute = usersRoute.addResource('admin');

    // TODO:
    // PUT /users/admin/create
    // const usersAdminCreateUserRoute = usersAdminRoute.addResource('create');
    // const adminCreateUserLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'adminCreateUser')?.lambda;
    // usersAdminCreateUserRoute.addMethod(HttpMethod.PUT, new LambdaIntegration(adminCreateUserLambda as IFunction), authMethodOptions);

    // TODO:
    // POST /users/admin/resetPassword
    // const usersAdminResetPasswordRoute = usersAdminRoute.addResource('resetPassword');
    // const adminResetPasswordByIdLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'adminResetPasswordById')?.lambda;
    // usersAdminResetPasswordRoute.addMethod(HttpMethod.POST, new LambdaIntegration(adminResetPasswordByIdLambda as IFunction), authMethodOptions);

    // TODO:
    // DELETE /users/admin/:userId
    // const usersAdminByIdRoute = usersAdminRoute.addResource('{userId}');
    // const usersAdminDeleteByIdLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'adminDeleteById')?.lambda;
    // usersAdminByIdRoute.addMethod(HttpMethod.DELETE, new LambdaIntegration(usersAdminDeleteByIdLambda as IFunction), authMethodOptions);

    // POST /users/changePassword
    const usersChangePasswordRoute = usersRoute.addResource('changePassword');
    const changePasswordLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'changePassword')?.lambda;
    usersChangePasswordRoute.addMethod(HttpMethod.POST, new LambdaIntegration(changePasswordLambda as IFunction), authMethodOptions);

    // POST /users/forgotPassword
    const usersForgotPasswordRoute = usersRoute.addResource('forgotPassword');
    const forgotPasswordLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'forgotPassword')?.lambda;
    usersForgotPasswordRoute.addMethod(HttpMethod.POST, new LambdaIntegration(forgotPasswordLambda as IFunction), authMethodOptions);

    // POST /users/confirmForgotPassword
    const usersConfirmForgotPasswordRoute = usersRoute.addResource('confirmForgotPassword');
    const confirmForgotPasswordLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'confirmForgotPassword')?.lambda;
    usersConfirmForgotPasswordRoute.addMethod(HttpMethod.POST, new LambdaIntegration(confirmForgotPasswordLambda as IFunction), authMethodOptions);

    // GET /users/:userId
    const userByIdRoute = usersRoute.addResource('{userId}');
    const getUserByIdLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'getById')?.lambda;
    userByIdRoute.addMethod(HttpMethod.GET, new LambdaIntegration(getUserByIdLambda as IFunction), authMethodOptions);

    // POST /users/:userId
    const updateUserByIdLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'updateById')?.lambda;
    userByIdRoute.addMethod(HttpMethod.POST, new LambdaIntegration(updateUserByIdLambda as IFunction), authMethodOptions);

    // POST /users/signUp
    const usersSignUpRoute = usersRoute.addResource('signUp');
    const signUpLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'signUp')?.lambda;
    usersSignUpRoute.addMethod(HttpMethod.POST, new LambdaIntegration(signUpLambda as IFunction));

    // POST /users/confirmSignUp
    const usersConfirmSignUpRoute = usersRoute.addResource('confirmSignUp');
    const confirmSignUpLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'confirmSignUp')?.lambda;
    usersConfirmSignUpRoute.addMethod(HttpMethod.POST, new LambdaIntegration(confirmSignUpLambda as IFunction));

    // POST /users/resendConfirmation
    const usersResendConfirmationRoute = usersRoute.addResource('resendConfirmation');
    const resendConfirmationLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'resendConfirmation')?.lambda;
    usersResendConfirmationRoute.addMethod(HttpMethod.POST, new LambdaIntegration(resendConfirmationLambda as IFunction));

    // POST /users/verifyToken
    const usersVerifyTokenRoute = usersRoute.addResource('verifyToken');
    const verifyTokenLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'verifyToken')?.lambda;
    usersVerifyTokenRoute.addMethod(HttpMethod.POST, new LambdaIntegration(verifyTokenLambda as IFunction));

    // POST /users/refreshToken
    const usersRefreshTokenRoute = usersRoute.addResource('refreshToken');
    const refreshTokenLambda = userLambdas.find(lambdaObj => lambdaObj.name === 'refreshToken')?.lambda;
    usersRefreshTokenRoute.addMethod(HttpMethod.POST, new LambdaIntegration(refreshTokenLambda as IFunction));
  }
}
