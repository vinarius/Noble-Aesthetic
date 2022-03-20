import { IAMClient, ListMFADevicesCommand } from '@aws-sdk/client-iam';
import { GetSessionTokenCommand, STSClient } from '@aws-sdk/client-sts';
import * as credentialProviderIni from '@aws-sdk/credential-provider-ini';
import { mockClient } from 'aws-sdk-client-mock';
import { mockProcessExit } from 'jest-mock-process';

import { setSessionToken } from '../awsToken';

jest.mock('../../lib/spawn', ()=> ({
  spawn: jest.fn()
}));

const stsMock = mockClient(STSClient);
const iamMock = mockClient(IAMClient);
const mockExit = mockProcessExit();

const mfaResponse = {
  MFADevices: [
    {
      SerialNumber: '1234',
      EnableDate: new Date(),
      UserName: 'asdf'
    }
  ]
};

const getSessionTokenResposne = {
  Credentials: {
    AccessKeyId: 'asdf',
    Expiration: new Date(),
    SecretAccessKey: 'asdf',
    SessionToken: 'asdf'
  }
};

describe('SetSessionToken', () => {
  const originalEnvVars = { ...process.env };

  beforeEach(()=>{
    stsMock.reset();
    iamMock.reset();
  });

  it('should set a session token', async () => {
    iamMock.on(ListMFADevicesCommand).resolves(mfaResponse);
    stsMock.on(GetSessionTokenCommand).resolves(getSessionTokenResposne);

    await setSessionToken();
  });

  it('should catch a thrown error and log the message to the console', async ()=>{
    const testError = 'MyTestExceptionName: my test error message';
    iamMock.on(ListMFADevicesCommand).rejects(testError);
    await setSessionToken().catch(err => expect(err.message).toBe(testError));
  });

  it('should throw an error if getSessionTokenResponse rejects', async ()=>{
    iamMock.on(ListMFADevicesCommand).resolves(mfaResponse);
    stsMock.on(GetSessionTokenCommand).rejects('test rejection message successful');

    await setSessionToken();
  });

  it('should set credentials from local ini file if not testing with jest', async ()=> {
    jest.resetModules();
    process.env.IS_JEST = undefined;
    const fromIniSpy = jest.spyOn(credentialProviderIni, 'fromIni');

    const { setSessionToken } = require('../awsToken');

    await setSessionToken();
    expect(fromIniSpy.mock.calls.length > 0);
  });

  afterEach(()=>{
    process.env = { ...originalEnvVars };
  });

  afterAll(()=>{
    stsMock.restore();
    iamMock.restore();
    mockExit.mockRestore();

    console.log(process.env);
  });
});