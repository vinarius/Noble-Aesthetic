import {
  LambdaResponse,
  CodeDeliveryDetails,
  RefreshTokenResponse,
  SignupResponse,
} from '../models/api/response';
import { LoginResponse } from '../models/api/users';
import { UserDetails } from '../models/app';
import { AuthFormData } from '../models/auth';
import { ApiClient } from './apiClient';
import { buildRequestBody } from './utilities';

const appClientId = process.env.NEXT_PUBLIC_WEBAPPCLIENTID;
const RequestHeaders = {
  headers: {
    'Content-Type': 'application/json',
    Accept: '*/*',
  }
};
const basePath = 'users';

export function getUsersApi(api: ApiClient) {
  return {
    /**
     * Change a user's password with an access token
     */
    changePassword: async (
      accessToken: string,
      previousPassword: string,
      proposedPassword: string
    ): Promise<LambdaResponse<{ success: boolean }>> => {
      return await api
        .post(
          `${basePath}/changePassword`,
          buildRequestBody({
            accessToken,
            previousPassword,
            proposedPassword
          }),
          RequestHeaders
        );
    },

    /**
     * Reset a forgotten password
     */
    confirmForgotPassword: async ({ email, password, confirmationCode }: AuthFormData): Promise<LambdaResponse<{ success: boolean }>> => {
      return await api
        .post(
          `${basePath}/confirmForgotPassword`,
          buildRequestBody({
            userName: email,
            proposedPassword: password,
            confirmationCode,
            appClientId
          }),
          RequestHeaders
        );
    },

    /**
     * Self confirm a new user
     */
    confirmSignUp: async ({ email, confirmationCode }: AuthFormData): Promise<LambdaResponse<{ success: boolean }>> => {
      return await api
        .post(
          `${basePath}/confirmSignUp`,
          buildRequestBody({
            userName: email,
            appClientId,
            confirmationCode
          }),
          RequestHeaders
        );
    },

    /**
     * Reset a user's password with an access token
     */
    forgotPassword: async ({ email }: AuthFormData): Promise<LambdaResponse<CodeDeliveryDetails>> => {
      return await api
        .post(
          `${basePath}/forgotPassword`,
          buildRequestBody({
            userName: email,
            appClientId
          }),
          RequestHeaders
        );
    },

    /**
     * Get user by userName
     */
    getByUserName: async (userName: string): Promise<LambdaResponse<{ user: UserDetails }>> => {
      return await api
        .get(
          `${basePath}/${userName}`,
          RequestHeaders
        );
    },

    /**
     * Initiate authentication
     */
    login: async ({ email, password }: AuthFormData): Promise<LambdaResponse<LoginResponse>> => {
      return await api
        .post<LambdaResponse<LoginResponse>>(
          `${basePath}/login`,
          buildRequestBody({
            userName: email,
            password: password,
            appClientId
          }),
          RequestHeaders
        );
    },

    /**
     * Logout a user
     */
    logout: async (accessToken: string): Promise<LambdaResponse<{ success: boolean }>> => {
      return await api
        .post(
          `${basePath}/logout`,
          buildRequestBody({ accessToken }),
          RequestHeaders
        );
    },

    /**
     * Refresh tokens
     */
    refreshToken: async (
      refreshToken: string,
    ): Promise<LambdaResponse<RefreshTokenResponse>> => {
      return await api
        .post(
          `${basePath}/refreshToken`,
          buildRequestBody({
            appClientId,
            refreshToken
          }),
          RequestHeaders
        );
    },

    /**
     * Resend the confirmation code used to register a new user
     */
    resendConfirmation: async (username: string): Promise<LambdaResponse<CodeDeliveryDetails>> => {
      return await api
        .post(
          `${basePath}/resendConfirmation`,
          buildRequestBody({
            appClientId,
            username
          }),
          RequestHeaders
        );
    },

    /**
     * Self signup a new user
     */
    signUp: async ({ email, password }: AuthFormData): Promise<LambdaResponse<{ details: SignupResponse }>> => {
      return await api
        .post(
          `${basePath}/signUp`,
          buildRequestBody({
            userName: email,
            password: password,
            appClientId
          }),
          RequestHeaders
        );
    },

    /**
     * Update user by userName
     */
    updateByUserName: async (userName: string, details: UserDetails): Promise<LambdaResponse<{ user: UserDetails }>> => {
      return await api
        .post(
          `${basePath}/${userName}`,
          buildRequestBody({ ...details }),
          RequestHeaders
        );
    },

    /**
     * Verify access token
     */
    verifyToken: async (accessToken: string): Promise<LambdaResponse<{ success: boolean }>> => {
      return await api
        .post(
          `${basePath}/verifyToken`,
          buildRequestBody({
            appClientId,
            accessToken
          }),
          RequestHeaders
        );
    }
  };
}
