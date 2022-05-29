import { CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { ClientAttributes, UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { buildServerlessApi } from '../lib/buildServerlessApi';
import { NobleStackProps } from '../models/cloudResources';
import { HttpMethod } from '../models/enums';
import { LambdaDefinition } from '../models/lambda';

export class UsersStack extends Stack {
  constructor(scope: Construct, id: string, props: NobleStackProps) {
    super(scope, id, props);

    const {
      project,
      stage,
      stack,
      isStagingEnv
    } = props;

    const removalPolicy = isStagingEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    /**
     * Cognito Section
     */
    const userPool = new UserPool(this, `${project}-${stack}-pool-${stage}`, {
      autoVerify: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true
        }
      },
      selfSignUpEnabled: true,
      userInvitation: {
        emailSubject: 'Your Noble Aesthetic Account',
        emailBody: 'A team administrator has created an account for you. Your username is {username} and temporary password is {####}'
      },
      userVerification: {
        emailSubject: 'Your Noble Aesthetic Account',
        emailBody: 'Welcome to your Noble Aesthetic account. Your temporary password is {####}'
      },
      userPoolName: `${project}-${stack}-${stage}`,
      removalPolicy
    });

    new StringParameter(this, `${project}-${stack}-userpoolArnParam-${stage}`, {
      parameterName: `/${project}/${stack}/userPoolArn/${stage}`,
      stringValue: userPool.userPoolArn
    });

    const webAppClient = new UserPoolClient(this, `${project}-webAppClient-${stage}`, {
      userPool,
      userPoolClientName: `${project}-webAppClient-${stage}`,
      authFlows: {
        userPassword: true
      },
      readAttributes: new ClientAttributes().withStandardAttributes({
        email: true,
        emailVerified: true,
        phoneNumber: true
      }),
      accessTokenValidity: Duration.hours(24),
      idTokenValidity: Duration.hours(24),
      supportedIdentityProviders: [
        {
          name: 'COGNITO'
        }
      ],
      writeAttributes: new ClientAttributes().withStandardAttributes({
        email: true,
        phoneNumber: true
      })
    });

    webAppClient.applyRemovalPolicy(removalPolicy);

    new CfnOutput(this, `${project}-webAppClientIdOutput-${stage}`, { value: webAppClient.userPoolClientId });

    /**
     * DynamoDB Section
     */
    const usersTable = new Table(this, `${project}-${stack}-table-${stage}`, {
      tableName: `${project}-${stack}-${stage}`,
      partitionKey: {
        name: 'username',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'dataKey',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy
    });

    const lambdaDefinitions: LambdaDefinition[] = [
      {
        name: 'adminCreateUser',
        skip: true,
        api: {
          httpMethod: HttpMethod.PUT,
          customApiPath: 'admin/create',
          isAuthNeeded: true
        },
        environment: {
          userPoolId: userPool.userPoolId,
          usersTableName: usersTable.tableName
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:ListUsers'],
            resources: [
              userPool.userPoolArn
            ]
          })
        ],
        description: 'Create a user as an admin. Does not require a confirmation code.'
      },
      {
        name: 'adminDelete',
        skip: true,
        api: {
          httpMethod: HttpMethod.DELETE,
          customApiPath: 'admin/{username}',
          isAuthNeeded: true
        },
        environment: {
          userPoolId: userPool.userPoolId,
          usersTableName: usersTable.tableName
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:AdminDeleteUser'],
            resources: [
              userPool.userPoolArn
            ]
          })
        ],
        description: 'Delete a user as an admin. Does not require a confirmation code.'
      },
      {
        name: 'adminResetPassword',
        skip: true,
        api: {
          httpMethod: HttpMethod.POST,
          customApiPath: 'admin/resetPassword',
          isAuthNeeded: true
        },
        environment: {
          userPoolId: userPool.userPoolId,
          usersTableName: usersTable.tableName
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:AdminResetUserPassword'],
            resources: [
              userPool.userPoolArn
            ]
          })
        ]
      },
      {
        name: 'changePassword',
        api: {
          httpMethod: HttpMethod.POST,
          isAuthNeeded: true
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:ChangePassword'],
            resources: [
              userPool.userPoolArn
            ]
          })
        ]
      },
      {
        name: 'confirmForgotPassword',
        api: {
          httpMethod: HttpMethod.POST
        },
        environment: {
          webAppClientId: webAppClient.userPoolClientId
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:ConfirmForgotPassword'],
            resources: [
              userPool.userPoolArn
            ]
          })
        ]
      },
      {
        name: 'confirmSignUp',
        api: {
          httpMethod: HttpMethod.POST
        },
        environment: {
          userPoolId: userPool.userPoolId,
          usersTableName: usersTable.tableName,
          webAppClientId: webAppClient.userPoolClientId
        },
        initialPolicy: [
          new PolicyStatement({
            actions: [
              'cognito-idp:ConfirmSignUp',
              'cognito-idp:AdminGetUser',
              'cognito-idp:AdminDeleteUser'
            ],
            resources: [
              userPool.userPoolArn
            ]
          })
        ]
      },
      {
        name: 'forgotPassword',
        api: {
          httpMethod: HttpMethod.POST
        },
        environment: {
          webAppClientId: webAppClient.userPoolClientId
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:ForgotPassword'],
            resources: [
              userPool.userPoolArn
            ]
          })
        ]
      },
      {
        name: 'getByUserName',
        api: {
          httpMethod: HttpMethod.GET,
          isAuthNeeded: true,
          customApiPath: '{username}'
        },
        environment: {
          usersTableName: usersTable.tableName
        }
      },
      {
        name: 'listUsers',
        skip: true,
        api: {
          httpMethod: HttpMethod.GET,
          isAuthNeeded: true
        },
        environment: {
          usersTableName: usersTable.tableName
        }
      },
      {
        name: 'login',
        api: {
          httpMethod: HttpMethod.POST,
          isAuthNeeded: false
        },
        environment: {
          usersTableName: usersTable.tableName,
          webAppClientId: webAppClient.userPoolClientId
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:InitiateAuth'],
            resources: [
              userPool.userPoolArn
            ]
          }),
          new PolicyStatement({
            actions: ['dynamodb:Query'],
            resources: [`${usersTable.tableArn}/index/email_index`]
          })
        ]
      },
      {
        name: 'logout',
        api: {
          httpMethod: HttpMethod.POST,
          isAuthNeeded: true
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:GlobalSignOut'],
            resources: [
              userPool.userPoolArn
            ]
          })
        ]
      },
      {
        name: 'refreshToken',
        api: {
          httpMethod: HttpMethod.POST,
          isAuthNeeded: true
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:InitiateAuth'],
            resources: [
              userPool.userPoolArn
            ]
          })
        ]
      },
      {
        name: 'resendConfirmation',
        api: {
          httpMethod: HttpMethod.POST
        },
        environment: {
          webAppClientId: webAppClient.userPoolClientId
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:ResendConfirmationCode'],
            resources: [
              userPool.userPoolArn
            ]
          })
        ]
      },
      {
        name: 'signUp',
        api: {
          httpMethod: HttpMethod.POST,
          isAuthNeeded: false
        },
        environment: {
          webAppClientId: webAppClient.userPoolClientId
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:SignUp'],
            resources: [
              userPool.userPoolArn
            ]
          })
        ]
      },
      {
        name: 'updateByUserName',
        api: {
          httpMethod: HttpMethod.POST,
          isAuthNeeded: true,
          customApiPath: '{username}'
        },
        environment: {
          usersTableName: usersTable.tableName
        }
      },
      {
        name: 'verifyToken',
        api: {
          httpMethod: HttpMethod.POST,
          isAuthNeeded: true
        },
        environment: {
          userPoolId: userPool.userPoolId
        }
      }
    ];

    for (const definition of lambdaDefinitions) {
      if (!definition.customLogicFunctions) definition.customLogicFunctions = [];
      definition.customLogicFunctions.push((lambda: NodejsFunction) => {
        usersTable.grantFullAccess(lambda);
      });
    }

    buildServerlessApi({
      isStagingEnv,
      project,
      scope: this,
      stack,
      stage,
      cognitoUserpool: userPool,
      lambdaDefinitions
    });
  }
}
