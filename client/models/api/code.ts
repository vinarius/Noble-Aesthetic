export type Success_ResponseCode = 200;
export const SuccessResponseCode: Success_ResponseCode = 200;

export type GenericError_ResponseCode = 400;
export const GenericErrorResponseCode: GenericError_ResponseCode = 400;

export type Unauthorized_ResponseCode = 401;
export const UnauthorizedResponseCode: Unauthorized_ResponseCode = 401;

export type AccessDenied_ResponseCode = 403;
export const ApiAccessDeniedResponseCode: AccessDenied_ResponseCode = 403;

export type ServerError_ResponseCode = 500;
export const ServerErrorResponseCode: ServerError_ResponseCode = 500;

export type ResponseCode =
  | Success_ResponseCode
  | GenericError_ResponseCode
  | Unauthorized_ResponseCode
  | AccessDenied_ResponseCode
  | ServerError_ResponseCode;

export interface ResponseCodeDescription {
  name: string;
  description: ((message: string) => string) | string;
}

export const ResponseCodes: Record<ResponseCode, ResponseCodeDescription> = {
  200: {
    name: 'Success',
    description: 'Request was successful',
  },
  400: {
    name: 'GenericError',
    description: 'Generic failure response for request',
  },
  401: {
    name: 'Unauthorized',
    description: 'Credentials were not supplied.',
  },
  403: {
    name: 'AccessDenied',
    description: 'Credentials were supplied that were invalid or unauthorized.',
  },
  500: {
    name: 'ServerError',
    description: 'Internal Server Error',
  },
};
