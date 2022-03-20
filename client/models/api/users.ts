import { DynamoUserItem } from '../../../models/user';

export interface LoginResponse {
  AccessToken: string;
  ExpiresIn: number;
  IdToken: string;
  RefreshToken: string;
  user: DynamoUserItem;
}