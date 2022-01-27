import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface SigDataSourcesProps extends StackProps {
  project: string;
  stage: string;
}

export class DataSourcesStack extends Stack {
  usersTable: Table;

  constructor(scope: Construct, id: string, props: SigDataSourcesProps) {
    super(scope, id, props);

    const {
      project,
      stage
    } = props;

    const usersTable = new Table(this, `${project}-users-${stage}`, {
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      tableName: `${project}-users-${stage}`,
      removalPolicy: stage === 'prod' || stage === 'dev' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    usersTable.addGlobalSecondaryIndex({
      indexName: 'email_index',
      partitionKey: {
        name: 'email',
        type: AttributeType.STRING
      }
    });
  }
}