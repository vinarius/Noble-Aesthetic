/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorObject } from 'ajv';

export const throwValidationError = (validationErrors: ErrorObject<string, Record<string, any>, unknown>[] | null | undefined = []) => {
  throw {
    reason: 'ValidationError',
    validationErrors,
    statusCode: 400
  };
};

export const throwBadRequestError = (error: any) => {
  throw {
    reason: error.name ?? 'BadRequest',
    error: error.Error?.Message ?? error ?? 'The request could not be understood by the server due to malformed syntax.',
    statusCode: 400
  };
};

export const throwNotAuthorizedError = (error: any) => {
  throw {
    reason: error.name ?? 'NotAuthorized',
    error: error.Error?.Message ?? error ?? 'The request requires user authentication or, if the request included authorization credentials, authorization has been refused for those credentials.',
    statusCode: 401
  };
};

export const throwNotFoundError = (error: any) => {
  throw {
    reason: error.name ?? 'NotFound',
    error: error.Error?.Message ?? error ?? 'The requested resource could not be found. This error can be due to a temporary or permanent condition.',
    statusCode: 404
  };
};

export const throwResourceExistsError = (error: any) => {
  throw {
    reason: error.name ?? 'ResourceExists',
    error: error.Error?.Message ?? error ?? 'A resource already exists with the given input.',
    statusCode: 409
  };
};

export const throwUnknownError = (error: any) => {
  throw {
    reason: error.name ?? 'Unknown',
    error: error.Error?.Message ?? error.message ?? 'Unknown error',
    statusCode: error.$metadata?.httpStatusCode ?? 500
  };
};
