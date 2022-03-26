import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpMethod, UserGroup } from './enums';


export interface LambdaDefinition extends Partial<NodejsFunctionProps> {
  name: string; // Must match the file name without the file extension.
  skip?: boolean;
  api?: {
    httpMethod: HttpMethod;
    customApiPath?: string;
    isBaseResource?: boolean;
    auth?: {
      authorizationScopes: UserGroup[];
    }
  }
}
