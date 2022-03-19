import { DynamoUserItem } from '../../../models/user';

export interface LoginResponse {
  success: boolean;
  payload: {
    AccessToken: string;
    ExpiresIn: number;
    IdToken: string;
    RefreshToken: string;
  };
  user: DynamoUserItem;
}