export interface CognitoToken {
  auth_time: number;
  client_id: string;
  exp: number;
  iat: number;
  event_id: string;
  iss: string;
  jti: string;
  origin_jti: string;
  scope: string;
  sub: string;
  token_use: string;
  username: string;
}

export interface AuthFormData {
  email: string;
  password?: string;
  confirmPassword?: string;
  confirmationCode?: string;
}