import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getUsersApi } from './usersApi';

export class ApiClient {
  private client: AxiosInstance;
  private authToken: string = '';
  private config: AxiosRequestConfig = { headers: {} };

  constructor(token?: string) {
    this.client = axios.create({
      baseURL: `https://${process.env.NEXT_PUBLIC_APIDOMAINNAME}/`,
      headers: {
        Accept: 'application/json',
        ...token && { Authorization: token }
      }
    });

    if (token) this.authToken = token;
  }

  public setAuthToken(authToken: string) {
    this.authToken = authToken;
    this.client.defaults.headers.common.Authorization = authToken;
  }

  public async get<T>(route: string, options?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.get(route, {
      ...this.config,
      ...options
    });

    return data;
  }

  public async post<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.post(route, body, {
      ...this.config,
      ...options
    });

    return data;
  }

  public async put<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.put(route, body, {
      ...this.config,
      ...options
    });

    return data;
  }

  public async delete<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.delete(route, {
      data: { ...body },
      ...this.config,
      ...options
    });

    return data;
  }
}

const api = new ApiClient(); // TODO: read auth token from redux store
export const apiClient = {
  axios: api,
  users: getUsersApi(api)
};