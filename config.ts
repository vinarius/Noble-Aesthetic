interface StageDefinition {
  branch: string;
  alias: string;
  env: {
    account: string;
    region: string;
  };
  description?: string;
  deployMfa: boolean;
  adminEmail: string;
  acmCertificateId: string;
  apiDomainName: string;
  hostedZoneName: string;
}

export interface ApplicationDefinition extends StageDefinition {
  project: string;
  stage: string;
}

export const project = 'sig';
export const repo = 'sig-backend';

export const stages: StageDefinition[] = [
  {
    branch: 'individual',
    alias: 'sigsee-dev',
    env: {
      account: '476324220602',
      region: 'us-east-1'
    },
    description: 'An ephemeral stage devs can use for creating isolated resources during development.',
    deployMfa: true,
    adminEmail: 'mark@itserv.io',
    acmCertificateId: '',
    apiDomainName: '',
    hostedZoneName: ''
  },
  {
    branch: 'develop',
    alias: 'sigsee-dev',
    env: {
      account: '476324220602',
      region: 'us-east-1'
    },
    description: 'The Sig AWS dev account',
    deployMfa: true,
    adminEmail: 'mark@itserv.io',
    acmCertificateId: '05902979-b41e-4919-91c3-ae58b10f0e92',
    apiDomainName: 'api.dev.sig-see.com',
    hostedZoneName: 'dev.sig-see.com'
  },
  {
    branch: 'master',
    alias: 'sigsee-prod',
    env: {
      account: '597119195378',
      region: 'us-east-1'
    },
    description: 'The Sig AWS prod account',
    deployMfa: true,
    adminEmail: 'mark@itserv.io', // TODO: need this
    acmCertificateId: 'c422ceab-130b-4774-94b1-2f4948697ef4',
    apiDomainName: 'api.sig-see.com',
    hostedZoneName: 'sig-see.com'
  }
];
