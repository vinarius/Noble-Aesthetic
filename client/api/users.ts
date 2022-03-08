import { ApiClient } from './apiClient';
import {
  changePasswordPath,
  confirmForgotPasswordPath,
  confirmSignUpPath,
  forgotPasswordPath,
  loginPath,
  logoutPath,
  refreshTokenPath,
  resendConfirmationPath,
  signUpPath,
  usersPath,
  verifyTokenPath,
} from './routes/users';

export function Users(api: ApiClient) {
  return {
    /**
     * Initiate authentication
     */
    login: async (data: IAuthFormData): Promise<IApiResponse<ILoginResponse>> => {
      console.debug('login form data:', data);
      return api.post(
        ,loginPath
        createRequest({
          appClientId: EnvConfig.appClientId,
          userName: data.email,
          password: data.password,
        }),
        RequestHeaders,
      );
    },

    /**
     * Logout a user
     */
    logout: async (accessToken: string): Promise<IApiResponse<{}>> => {
      return api.authenticated().post(
        LogoutRequest,
        createRequest({
          accessToken,
        }),
        RequestHeaders,
      );
    },

    /**
     * Self signup a new user
     */
    signUp: async (data: IAuthFormData): Promise<IApiResponse<{ details: ISignupResponse }>> => {
      console.debug('signup form data:', data);
      return api.post(
        SignUpRequest,
        createRequest({
          appClientId: EnvConfig.appClientId,
          userName: data.email,
          password: data.password,
        }),
        RequestHeaders,
      );
    },

    /**
     * Self confirm a new user
     */
    confirmSignUp: async (data: IAuthFormData): Promise<IApiResponse<{}>> => {
      console.debug('confirmation signup form data:', data);
      return api.post(
        ConfirmSignUpRequest,
        createRequest({
          appClientId: EnvConfig.appClientId,
          userName: data.email,
          confirmationCode: data.confirmationCode,
          birthdate: data.birthDate,
        }),
        RequestHeaders,
      );
    },

    /**
     * Reset a user's password with an access token
     */
    forgotPassword: async (
      data: IAuthFormData,
    ): Promise<IApiResponse<{ CodeDeliveryDetails: ICodeDeliveryDetails }>> => {
      console.debug('forgot password form data:', data);
      return api.post(
        ForgotPasswordRequest,
        createRequest({
          appClientId: EnvConfig.appClientId,
          userName: data.email,
        }),
        RequestHeaders,
      );
    },

    /**
     * Reset a forgotten password
     */
    confirmPassword: async (data: IAuthFormData): Promise<IApiResponse<{}>> => {
      console.debug('confirm password form data:', data);
      return api.post(
        ConfirmForgotPasswordRequest,
        createRequest({
          appClientId: EnvConfig.appClientId,
          userName: data.email,
          proposedPassword: data.password,
          confirmationCode: data.confirmationCode,
        }),
        RequestHeaders,
      );
    },

    /**
     * Resend the confirmation code used to register a new user
     */
    resendConfirmation: async (
      username: string,
    ): Promise<IApiResponse<{ CodeDeliveryDetails: ICodeDeliveryDetails }>> => {
      return api.post(
        ResendConfirmationRequest,
        createRequest({
          appClientId: EnvConfig.appClientId,
          username,
        }),
        RequestHeaders,
      );
    },

    /**
     * Change a user's password with an access token
     */
    changePassword: async (
      accessToken: string,
      previousPassword: string,
      proposedPassword: string,
    ): Promise<IApiResponse<{ success: boolean }>> => {
      return api.authenticated().post(
        ChangePasswordRequest,
        createRequest({
          accessToken,
          previousPassword,
          proposedPassword,
        }),
        RequestHeaders,
      );
    },

    /**
     * Verify access token
     */
    verifyToken: async (accessToken: string): Promise<IApiResponse<{}>> => {
      return api.post(
        VerifyTokenRequest,
        createRequest({
          appClientId: EnvConfig.appClientId,
          accessToken,
        }),
        RequestHeaders,
      );
    },

    /**
     * Refresh tokens
     */
    refresh: async (
      refreshToken: string,
    ): Promise<IApiResponse<{ details: { AuthenticationResult: IAuthenticationResult } }>> => {
      return api.authenticated().post(
        RefreshTokenRequest,
        createRequest({
          appClientId: EnvConfig.appClientId,
          refreshToken,
        }),
        RequestHeaders,
      );
    },

    /**
     * Get user by userName
     */
    get: async (userName: string): Promise<IApiResponse<{ user: IUserDetails }>> => {
      return await api.authenticated().get(`${UsersRequest}/${userName}`, undefined, RequestHeaders);
    },

    /**
     * Update user by userName
     */
    updateUser: async (userName: string, details: IUserDetails): Promise<IApiResponse<{ user: IUserDetails }>> => {
      return await api
        .authenticated()
        .post(`${UsersRequest}/${userName}`, createRequest({ ...details }), RequestHeaders);
    }
  };
}
