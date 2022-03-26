import { config } from '../getConfig';
import { LambdaResponse } from '../models/api/response';
import { ChangePasswordResponse, ConfirmForgotPasswordResponse, ConfirmSignUpResponse, ForgotPasswordResponse, GetByUserNameResponse, LoginResponse, LogoutResponse, RefreshTokenResponse, ResendConfirmationResponse, SignUpResponse, UpdateByUserNameResponse, VerifyTokenResponse } from '../models/api/users';
import { UserDetails } from '../models/app';
import { AuthFormData } from '../models/auth';
import { ApiClient } from './apiClient';
import { buildRequestBody } from './utilities';

const { webAppClientId } = config;
const appClientId = webAppClientId;
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
    ): Promise<LambdaResponse<ChangePasswordResponse>> => {
      return await api
        .post<LambdaResponse<ChangePasswordResponse>>(
          `${basePath}/changePassword`,
          buildRequestBody({
            accessToken,
            previousPassword,
            proposedPassword
          }),
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Reset a forgotten password
     */
    confirmForgotPassword: async ({ email, password, confirmationCode }: AuthFormData): Promise<LambdaResponse<ConfirmForgotPasswordResponse>> => {
      return await api
        .post<LambdaResponse<ConfirmForgotPasswordResponse>>(
          `${basePath}/confirmForgotPassword`,
          buildRequestBody({
            username: email,
            proposedPassword: password,
            confirmationCode,
            appClientId
          }),
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Self confirm a new user
     */
    confirmSignUp: async ({ email, confirmationCode }: AuthFormData): Promise<LambdaResponse<ConfirmSignUpResponse>> => {
      return await api
        .post<LambdaResponse<ConfirmSignUpResponse>>(
          `${basePath}/confirmSignUp`,
          buildRequestBody({
            username: email,
            appClientId,
            confirmationCode
          }),
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Reset a user's password with an access token
     */
    forgotPassword: async ({ email }: AuthFormData): Promise<LambdaResponse<ForgotPasswordResponse>> => {
      return await api
        .post<LambdaResponse<ForgotPasswordResponse>>(
          `${basePath}/forgotPassword`,
          buildRequestBody({
            username: email,
            appClientId
          }),
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Get user by username
     */
    getByUserName: async (username: string): Promise<LambdaResponse<GetByUserNameResponse>> => {
      return await api
        .get<LambdaResponse<GetByUserNameResponse>>(
          `${basePath}/${username}`,
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Initiate authentication
     */
    login: async ({ email, password }: AuthFormData): Promise<LambdaResponse<LoginResponse>> => {
      return await api
        .post<LambdaResponse<LoginResponse>>(
          `${basePath}/login`,
          buildRequestBody({
            username: email,
            password: password,
            appClientId
          }),
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Logout a user
     */
    logout: async (accessToken: string): Promise<LambdaResponse<LogoutResponse>> => {
      return await api
        .post<LambdaResponse<LogoutResponse>>(
          `${basePath}/logout`,
          buildRequestBody({ accessToken }),
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Refresh tokens
     */
    refreshToken: async (
      refreshToken: string,
    ): Promise<LambdaResponse<RefreshTokenResponse>> => {
      return await api
        .post<LambdaResponse<RefreshTokenResponse>>(
          `${basePath}/refreshToken`,
          buildRequestBody({
            appClientId,
            refreshToken
          }),
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Resend the confirmation code used to register a new user
     */
    resendConfirmation: async (username: string): Promise<LambdaResponse<ResendConfirmationResponse>> => {
      return await api
        .post<LambdaResponse<ResendConfirmationResponse>>(
          `${basePath}/resendConfirmation`,
          buildRequestBody({
            appClientId,
            username
          }),
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Self signup a new user
     */
    signUp: async ({ email, password }: AuthFormData): Promise<LambdaResponse<SignUpResponse>> => {
      return await api
        .post<LambdaResponse<SignUpResponse>>(
          `${basePath}/signUp`,
          buildRequestBody({
            username: email,
            password: password,
            appClientId
          }),
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Update user by username
     */
    updateByUserName: async (username: string, details: UserDetails): Promise<LambdaResponse<UpdateByUserNameResponse>> => {
      return await api
        .post<LambdaResponse<UpdateByUserNameResponse>>(
          `${basePath}/${username}`,
          buildRequestBody({ ...details }),
          RequestHeaders
        ).catch(err => err);
    },

    /**
     * Verify access token
     */
    verifyToken: async (accessToken: string): Promise<LambdaResponse<VerifyTokenResponse>> => {
      return await api
        .post<LambdaResponse<VerifyTokenResponse>>(
          `${basePath}/verifyToken`,
          buildRequestBody({
            appClientId,
            accessToken
          }),
          RequestHeaders
        ).catch(err => err);
    }
  };
}
