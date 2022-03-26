import { DynamoUserItem } from '../../../models/user';
import { UserDetails } from '../app';
import { AuthenticationResult, CodeDeliveryDetails, SignupResponse } from './response';

export interface ChangePasswordResponse { success: boolean }

export interface ConfirmForgotPasswordResponse { success: boolean }

export interface ConfirmSignUpResponse { success: boolean }

export interface ForgotPasswordResponse extends CodeDeliveryDetails { }

export interface GetByUserNameResponse { user: UserDetails }

export interface LoginResponse {
  AccessToken: string;
  ExpiresIn: number;
  IdToken: string;
  RefreshToken: string;
  user: DynamoUserItem;
}

export interface LogoutResponse { success: boolean }

export interface RefreshTokenResponse {
  details: AuthenticationResult;
}

export interface ResendConfirmationResponse extends CodeDeliveryDetails { }

export interface SignUpResponse { details: SignupResponse }

export interface UpdateByUserNameResponse { user: UserDetails }

export interface VerifyTokenResponse { success: boolean }