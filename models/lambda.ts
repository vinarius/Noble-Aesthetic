import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

import { HttpMethod } from './enums';

export enum UserGroup {
  ADMIN = 'admin',
  USER = 'user'
}

export interface LambdaDefinition extends Partial<NodejsFunctionProps> {
  name: string; // Must match the file name without the file extension.
  skip?: boolean;
  api?: {
    httpMethod: HttpMethod;
    customApiPath?: string;
    auth?: {
      authorizationScopes: UserGroup[];
    }
  }
}
