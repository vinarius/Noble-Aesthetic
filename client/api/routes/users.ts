export const UsersRequest = 'users';
export const LoginRequest = `${UsersRequest}/login`;
export const LogoutRequest = `${UsersRequest}/logout`;
export const SignUpRequest = `${UsersRequest}/signUp`;
export const ConfirmSignUpRequest = `${UsersRequest}/confirmSignUp`;
export const ForgotPasswordRequest = `${UsersRequest}/forgotPassword`;
export const ConfirmForgotPasswordRequest = `${UsersRequest}/confirmForgotPassword`;
export const ResendConfirmationRequest = `${UsersRequest}/resendConfirmation`;
export const ChangePasswordRequest = `${UsersRequest}/changePassword`;
export const VerifyTokenRequest = `${UsersRequest}/verifyToken`;
export const RefreshTokenRequest = `${UsersRequest}/refreshToken`;
export const SearchUsersRequest = `${UsersRequest}/search`;

export const VideosRequest = 'videos';
export const ListVideosRequest = `${VideosRequest}/listVideos`;
export const GetVideoRequets = `${VideosRequest}/getVideo`;

export const ProductsRequest = 'products';
export const ListProductsRequest = `${ProductsRequest}/listProducts`;
export const GetProductRequets = `${ProductsRequest}/getProduct`;
