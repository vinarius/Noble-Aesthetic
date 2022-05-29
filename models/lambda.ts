import { AssetCode } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction as NodeLambda, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpMethod } from './enums';

export interface LambdaDefinition extends Partial<NodejsFunctionProps> {
  name: string; // Must match the file name without the file extension.
  skip?: boolean;
  customLogicFunctions?: ((lambda: NodeLambda) => void)[];
  api?: {
    httpMethod: HttpMethod;
    customApiPath?: string;
    isAuthNeeded: boolean;
    isBaseResource?: boolean;
  };
  loggingLevel?: 'error' | 'warn' | 'info' | 'debug';
  useTsc?: boolean;
  code?: AssetCode; // only necessary for regular lambda function construct if tsc is used instead of esbuild
  handler?: string; // only necessary for regular lambda function construct if tsc is used instead of esbuild
}
