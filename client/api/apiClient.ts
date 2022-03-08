import axios, { AxiosInstance } from 'axios';

export class ApiClient {
  private client: AxiosInstance;

  constructor (token?: string) {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_APIDOMAINNAME,
      headers: {
        Accept: 'application/json',
        ...token && { Authorization: token } 
      }
    });
  }

  public get(route: string) {
    return this.client.get(route);
  }

  public post(route: string, data: any) {
    return this.client.post(route, data);
  }

  public put(route: string, data: any) {
    return this.client.put(route, data);
  }

  public delete(route: string, data: any) {
    return this.client.delete(route, data);
  }
}