export interface GenericError<E = any, D = any> {
  statusCode: number;
  message?: string;
  data?: D;
  error: E;
  success: boolean;
}

export interface ValidationError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params?: { [key: string]: string };
  message: string;
}

export enum Exception {
  UsernameExists = 'UsernameExistsException',
  InvalidPassword = 'InvalidPasswordException',
}
