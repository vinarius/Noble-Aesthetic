import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { store } from '../appState/store';
import { config, stage } from '../getConfig';
import { getUsersApi } from './usersApi';

const { apiDomainName } = config;
const isProd = stage === 'prod';
export class ApiClient {
  private client: AxiosInstance;
  private config: AxiosRequestConfig = { headers: {} };

  constructor() {
    this.client = axios.create({
      baseURL: stage === 'prod' || stage === 'dev' ? `https://${apiDomainName}/` : apiDomainName,
      headers: { Accept: '*/*' }
    });

    this.setAuthToken();

    this.client.interceptors.request.use(
      (req) => {
        if (!isProd) console.log(`Sending ${req.method} request to ${req.baseURL}${req.url}:\n`, JSON.parse(req.data));
        return req
      },
      (error) => {
        if (!isProd) console.log('request error:', error);
        return error;
      }
    );

    this.client.interceptors.response.use(
      (res) => {
        if (!isProd) console.log('response:\n', res.data);
        return Promise.resolve({ ...res.data });
      },
      (error) => {
        if (!isProd) console.log('response error:', error.response?.data);
        return Promise.reject({ ...error.response?.data });
      }
    );
  }

  public setAuthToken(token?: string) {
    const idToken = token ?? store.getState().auth.idToken ?? '';
    this.client.defaults.headers.common.Authorization = idToken;
    this.config.headers!.Authorization = idToken;
  }

  public async get<T>(route: string, options?: AxiosRequestConfig): Promise<T> {
    return await this.client.get(route, {
      ...this.config,
      ...options
    });
  }

  public async post<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    return await this.client.post(route, body, {
      ...this.config,
      ...options
    });
  }

  public async put<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    return await this.client.put(route, body, {
      ...this.config,
      ...options
    });
  }

  public async delete<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    return await this.client.delete(route, {
      data: { ...body },
      ...this.config,
      ...options
    });
  }
}

const api = new ApiClient();
export const apiClient = {
  axios: api,
  users: getUsersApi(api)
};