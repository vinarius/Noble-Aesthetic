import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class ApiClient {
  private client: AxiosInstance;
  private config?: AxiosRequestConfig;

  constructor (token?: string) {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_APIDOMAINNAME,
      headers: {
        Accept: 'application/json',
        ...token && { Authorization: token } 
      }
    });

    this.config = {
      headers: {},
    };
  }

  public async get<T>(route: string, options?: AxiosRequestConfig): Promise<T> {
    return await this.client.get(route, {
      ...this.config,
      ...options
    }).then(res => res.data);
  }

  public async post<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    return await this.client.post(route, body, {
      ...this.config,
      ...options
    }).then(res => res.data);
  }

  public async put<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    return await this.client.put(route, body, {
      ...this.config,
      ...options
    }).then(res => res.data);
  }

  public async delete<T>(route: string, body: any, options?: AxiosRequestConfig): Promise<T> {
    return await this.client.delete(route, {
      ...this.config,
      data: {
        ...body
      },
      ...options
    }).then(res => res.data);
  }
}