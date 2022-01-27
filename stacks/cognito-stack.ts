import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { ClientAttributes, UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface SigCognitoProps extends StackProps {
  project: string;
  stage: string;
}

export class CognitoStack extends Stack {
  public userPool: UserPool;

  constructor(scope: Construct, id: string, props: SigCognitoProps) {
    super(scope, id, props);

    const {
      project,
      stage
    } = props;

    const sigUserPool = new UserPool(this, `${project}-users-${stage}`, {
      autoVerify: {
        email: true
      },
      signInAliases: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true
        }
      },
      selfSignUpEnabled: true,
      userPoolName: `${project}-users-${stage}`,
      removalPolicy: stage === 'prod' || stage === 'dev' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    new UserPoolClient(this, `${project}-mobileAppClient-${stage}`, {
      userPool: sigUserPool,
      userPoolClientName: `${project}-mobileAppClient-${stage}`,
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

    new StringParameter(this, `${project}-userPoolIdParam-${stage}`, {
      parameterName: `/${project}/cognitoStack/userPoolId/${stage}`,
      stringValue: sigUserPool.userPoolId
    });

    new StringParameter(this, `${project}-userPoolArnParam-${stage}`, {
      parameterName: `/${project}/cognitoStack/userPoolArn/${stage}`,
      stringValue: sigUserPool.userPoolArn
    });
  }
}
