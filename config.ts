interface StageDefinition {
  branch: string;
  alias: string;
  env: {
    account: string;
    region: string;
  };
  description?: string;
  deployMfa: boolean;
}

export interface ApplicationDefinition extends StageDefinition {
  project: string;
  stage: string;
}

export const project = 'noble';
export const repo = 'noble-aesthetic';

export const stages: StageDefinition[] = [
  {
    branch: 'individual',
    alias: 'noble-dev',
    env: {
      account: '396993419739',
      region: 'us-east-1'
    },
    description: 'An ephemeral stage devs can use for creating isolated resources during development.',
    deployMfa: true
  },
  {
    branch: 'develop',
    alias: 'noble-dev',
    env: {
      account: '396993419739',
      region: 'us-east-1'
    },
    description: 'The Noble Aesthetic AWS dev account',
    deployMfa: true
  },
  {
    branch: 'master',
    alias: 'noble-prod',
    env: {
      account: '210844447961',
      region: 'us-east-1'
    },
    description: 'The Noble Aesthetic AWS prod account',
    deployMfa: true
  }
];
