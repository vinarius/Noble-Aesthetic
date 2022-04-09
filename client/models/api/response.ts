import { ResponseCode } from './code';
import { ValidationError } from './error';

export interface LambdaResponse<T> {
  statusCode?: ResponseCode;
  success?: boolean;
  payload: T;
  error?: string;
  reason?: string;
  validationErrors?: ValidationError[];
}

export interface AuthenticationResult {
  AccessToken?: string;
  ExpiresIn?: number;
  IdToken?: string;
  RefreshToken?: string;
  TokenType?: string;
}

export interface CodeDeliveryDetails {
  AttributeName: string;
  DeliveryMedium: string;
  Destination: string;
};

export interface SignupResponse {
  CodeDeliveryDetails: CodeDeliveryDetails;
  UserConfirmed: boolean;
  UserSub: string;
}