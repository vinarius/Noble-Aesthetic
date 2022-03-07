import axios from 'axios';

import { getAppConfig } from '../../lib/getAppConfig';

const axiosClient = axios.create({
  baseURL: '', // TODO:
  headers: {
    Accept: 'application/json',
    // Authorization: token, 
  }
});

export class ApiClient {
  private baseApiUrl = '';

  constructor () {}

  private async setBaseApiUrl() {
    const { apiDomainName } = await getAppConfig();
    this.baseApiUrl = apiDomainName;
  }
}