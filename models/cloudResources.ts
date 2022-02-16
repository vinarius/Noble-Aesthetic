import { StackProps } from 'aws-cdk-lib';

export interface NobleStackProps extends StackProps {
  project: string;
  stage: string;
  isStagingEnv: boolean;
  branch?: string;
}