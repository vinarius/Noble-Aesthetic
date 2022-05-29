import { Duration } from 'aws-cdk-lib';
import { AuthorizationType, CognitoUserPoolsAuthorizer, Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { IUserPool, UserPool } from 'aws-cdk-lib/aws-cognito';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function as Lambda, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction as NodeLambda } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { resolve } from 'path';
import { HttpMethod } from '../models/enums';
import { LambdaDefinition } from '../models/lambda';
import { fromRoot } from './fromRoot';

interface ServerlessApiProps {
  project: string;
  stage: string;
  isStagingEnv: boolean;
  scope: Construct;
  stack: string;
  lambdaDefinitions: LambdaDefinition[];
  apiRootResource?: string;
  cognitoUserpool?: UserPool;
}

export function buildServerlessApi(props: ServerlessApiProps): void {
  const {
    project,
    stage,
    isStagingEnv,
    scope,
    stack,
    cognitoUserpool,
    lambdaDefinitions = [],
    apiRootResource = stack
  } = props;

  let sigUserPool = cognitoUserpool;

  if (!sigUserPool) {
    const userPoolArn = StringParameter.fromStringParameterName(scope, `${project}-${stack}-userpoolArnParam-${stage}`, `/${project}/users/userPoolArn/${stage}`).stringValue;
    sigUserPool = UserPool.fromUserPoolArn(scope, `${project}-users-pool-${stage}`, userPoolArn) as UserPool;
  }

  const apiId = StringParameter.fromStringParameterName(scope, `${project}-baseApiIdParam-${stage}`, `/${project}/api/id/${stage}`).stringValue;
  const baseRootResourceId = StringParameter.fromStringParameterName(scope, `${project}-rootResourceIdParam-${stage}`, `/${project}/api/rootResourceId/${stage}`).stringValue;

  const restApi = RestApi.fromRestApiAttributes(scope, `${project}-api-${stage}`, {
    restApiId: apiId,
    rootResourceId: baseRootResourceId
  });

  const apiSpecificRoute = restApi.root.addResource(apiRootResource); // IE api requests map to {domain}/users/...

  const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(
    scope,
    `${project}-${stack}-authorizer-${stage}`,
    {
      cognitoUserPools: [
        sigUserPool as IUserPool
      ],
      authorizerName: `${project}-${stack}-authorizer-${stage}`,
      resultsCacheTtl: stage === 'prod' ? Duration.minutes(5) : Duration.minutes(0)
    }
  );

  for (const definition of lambdaDefinitions) {
    const {
      name,
      skip,
      api,
      loggingLevel = 'debug',
      entry,
      customLogicFunctions,
      useTsc
    } = definition;

    if (skip) continue;

    let nodeLambda;
    if (useTsc) {
      const { code, handler } = definition;

      nodeLambda = new Lambda(scope, `${project}-${stack}-${name}-${stage}`, {
        ...definition,
        environment: {
          ...definition.environment,
          LOGGING_LEVEL: stage === 'prod' ? 'warn' : loggingLevel
        },
        runtime: Runtime.NODEJS_16_X,
        functionName: `${project}-${stack}-${name}-${stage}`,
        logRetention: isStagingEnv ? RetentionDays.INFINITE : RetentionDays.THREE_DAYS,
        code: code ?? Code.fromAsset(fromRoot(['dist', 'src'])),
        handler: handler ?? `src/${stack}/${name}.handler`
      });
    } else {
      nodeLambda = new NodeLambda(scope, `${project}-${stack}-${name}-${stage}`, {
        ...definition,
        environment: {
          ...definition.environment,
          LOGGING_LEVEL: stage === 'prod' ? 'warn' : loggingLevel
        },
        runtime: Runtime.NODEJS_16_X,
        functionName: `${project}-${stack}-${name}-${stage}`,
        entry: entry ?? resolve(__dirname, '..', 'src', stack, `${name}.ts`),
        bundling: {
          ...definition.bundling,
          minify: true
        },
        logRetention: isStagingEnv ? RetentionDays.TWO_YEARS : RetentionDays.THREE_DAYS,
        projectRoot: resolve(__dirname, '..')
      });
    }

    if (customLogicFunctions?.length)
      for (const applyCustomLogic of customLogicFunctions) applyCustomLogic(nodeLambda);

    if (api) {
      const { httpMethod, customApiPath, isAuthNeeded, isBaseResource } = api;
      const childResourceName = customApiPath ?? name;

      const apiRoute = isBaseResource ? apiSpecificRoute :
        apiSpecificRoute.getResource(childResourceName) ??
        apiSpecificRoute.addResource(childResourceName, {
          defaultCorsPreflightOptions: {
            allowOrigins: Cors.ALL_ORIGINS,
            allowHeaders: ['*'],
            allowCredentials: true,
            allowMethods: Cors.ALL_METHODS
          }
        });

      const apiMethod = apiRoute.addMethod(
        httpMethod as HttpMethod,
        new LambdaIntegration(nodeLambda),
        {
          ...isAuthNeeded && {
            authorizer: cognitoAuthorizer,
            authorizationType: AuthorizationType.COGNITO
          }
        }
      );

      // Allows the specific route from api gateway to invoke said lambda function.
      nodeLambda.addPermission(`${project}-${stack}-${name}-InvokePermission-${stage}`, {
        principal: new ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: apiMethod.methodArn
      });
    }
  }
}