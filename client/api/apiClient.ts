import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getUsersApi } from './usersApi';

export class ApiClient {
  private client: AxiosInstance;
  private authToken: string = '';
  private config: AxiosRequestConfig = { headers: {} };

  constructor (token?: string) {
    this.client = axios.create({
      baseURL: `https://${process.env.NEXT_PUBLIC_APIDOMAINNAME}/`,
      headers: {
        Accept: 'application/json',
        ...token && { Authorization: token } 
      }
    });

    if (token) this.authToken = token;
  }

  public authenticate(authToken?: string) {
    this.config.headers!.Authorization = authToken ?? this.authToken;
    return this;
  }

  public async get<T>(route: string, options?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.get(encodeURIComponent(route), {
      ...this.config,
      ...options
    });

    return data;
  }

  public async post<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.post(encodeURIComponent(route), body, {
      ...this.config,
      ...options
    });

    return data;
  }

  public async put<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.put(encodeURIComponent(route), body, {
      ...this.config,
      ...options
    });

    return data;
  }

  public async delete<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.delete(encodeURIComponent(route), {
      data: { ...body },
      ...this.config,
      ...options
    });

    return data;
  }
}

export function buildApiClient() {
  const api = new ApiClient(); // TODO: read auth token from redux store

  return {
    axios: api,
    users: getUsersApi(api)
  };
}