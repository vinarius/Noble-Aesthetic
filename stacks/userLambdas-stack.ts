import { Stack, StackProps } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction as NodeLambda } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { resolve } from 'path';

import { LambdaDefinition } from '../models/lambda';

interface SigLambdasProps extends StackProps {
  project: string;
  stage: string;
}

export class UserLambdasStack extends Stack {
  constructor(scope: Construct, id: string, props: SigLambdasProps) {
    super(scope, id, props);

    const {
      project,
      stage
    } = props;

    const userPoolArn = StringParameter.fromStringParameterName(this, `${project}-userPoolArnParam-${stage}`, `/${project}/cognitoStack/userPoolArn/${stage}`).stringValue;
    const userPoolId = StringParameter.fromStringParameterName(this, `${project}-userPoolIdParam-${stage}`, `/${project}/cognitoStack/userPoolId/${stage}`).stringValue;
    const usersTable = Table.fromTableName(this, `${project}-users-${stage}`, `${project}-users-${stage}`);

    // Lambda specific configuration is defined here.
    const lambdaDefinitions: LambdaDefinition[] = [
      {
        name: 'adminCreateUser',
        environment: {
          userPoolId,
          usersTableName: usersTable.tableName
        },
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:ListUsers' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ],
        description: 'Create a user as an admin. Does not require a confirmation code.'
      },
      {
        name: 'adminDeleteById',
        environment: {
          userPoolId,
          usersTableName: usersTable.tableName
        },
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:AdminDeleteUser' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ],
        description: 'Delete a user as an admin. Does not require a confirmation code.'
      },
      {
        name: 'adminResetPasswordById',
        environment: {
          userPoolId,
          usersTableName: usersTable.tableName
        },
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:AdminResetUserPassword' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ]
      },
      {
        name: 'changePassword',
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:ChangePassword' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ]
      },
      {
        name: 'confirmForgotPassword',
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:ConfirmForgotPassword' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ]
      },
      {
        name: 'confirmSignUp',
        environment: {
          userPoolId,
          usersTableName: usersTable.tableName
        },
        initialPolicy: [
          new PolicyStatement({
            actions: [ 
              'cognito-idp:ConfirmSignUp',
              'cognito-idp:AdminGetUser'
            ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ]
      },
      {
        name: 'forgotPassword',
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:ForgotPassword' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ]
      },
      {
        name: 'get',
        environment: {
          usersTableName: usersTable.tableName
        }
      },
      {
        name: 'getById',
        environment: {
          usersTableName: usersTable.tableName
        }
      },
      {
        name: 'login',
        environment: {
          usersTableName: usersTable.tableName
        },
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:InitiateAuth' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          }),
          new PolicyStatement({
            actions: [ 'dynamodb:Query' ],
            effect: Effect.ALLOW,
            resources: [ `${usersTable.tableArn}/index/email_index` ]
          })
        ]
      },
      {
        name: 'logout',
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:GlobalSignOut' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ]
      },
      {
        name: 'refreshToken',
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:InitiateAuth' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ]
      },
      {
        name: 'resendConfirmation',
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:ResendConfirmationCode' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ]
      },
      {
        name: 'signUp',
        initialPolicy: [
          new PolicyStatement({
            actions: [ 'cognito-idp:SignUp' ],
            effect: Effect.ALLOW,
            resources: [ userPoolArn ]
          })
        ]
      },
      {
        name: 'updateById',
        environment: {
          usersTableName: usersTable.tableName
        }
      },
      {
        name: 'verifyToken',
        environment: {
          userPoolId
        }
      }
    ];

    // Configuration for all lambdas is defined here.
    for (const lambda of lambdaDefinitions) {
      const {
        name
      } = lambda;

      const nodeLambda = new NodeLambda(this, `${project}-users-${name}-${stage}`, {
        ...lambda,
        runtime: Runtime.NODEJS_14_X,
        functionName: `${project}-users-${name}-${stage}`,
        entry: resolve(__dirname, '..', 'src', 'users', `${name}.ts`),
        bundling: {
          minify: true
        },
        logRetention: stage === 'prod' || stage === 'dev' ? RetentionDays.INFINITE : RetentionDays.THREE_DAYS,
        projectRoot: resolve(__dirname, '..')
      });

      usersTable.grantFullAccess(nodeLambda);

      // Allows api gateway to invoke said lambda functions.
      nodeLambda.addPermission(`${project}-${name}-InvokePermission-${stage}`, {
        principal: new ServicePrincipal('apigateway.amazonaws.com')
      });
    }
  }
}
