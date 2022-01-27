import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface LambdaDefinition extends Partial<NodejsFunctionProps> {
  name: string; // Must match the file name without the file extension.
}
