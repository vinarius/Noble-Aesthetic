import { UserDetails } from '../app';
import { ResponseCode } from './code';
import { ValidationError } from './error';

export interface ApiResponse<T> {
  statusCode?: ResponseCode;
  success?: boolean;
  payload: T;
  error?: string;
  validationErrors?: ValidationError[];
}

interface AuthenticationResult {
  AccessToken?: string;
  ExpiresIn?: number;
  IdToken?: string;
  RefreshToken?: string;
  TokenType?: string;
}

export interface RefreshTokenResponse {
  details: AuthenticationResult;
}

export interface CodeDeliveryDetails {
  AttributeName: string;
  DeliveryMedium: string;
  Destination: string;
};

export interface LoginResponse {
  result: {
    AuthenticationResult: AuthenticationResult;
    ChallengeParameters: {};
  };
  user: UserDetails;
}

export interface SignupResponse {
  CodeDeliveryDetails: CodeDeliveryDetails;
  UserConfirmed: boolean;
  UserSub: string;
}
