import { ErrorObject } from 'ajv';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildValidationError = (validationErrors: ErrorObject<string, Record<string, any>, unknown>[] | null | undefined = []) => ({
  success: false,
  reason: 'ValidationError',
  validationErrors,
  statusCode: 400
});

export const buildBadRequestError = (error: string) => ({
  success: false,
  reason: 'BadRequest',
  error,
  statusCode: 400
});

export const buildNotAuthorizedError = (error: Error | string) => ({
  success: false,
  reason: 'NotAuthorized',
  error: error instanceof Error ? `${error.name && `${error.name}: `}${error.message}` : error,
  statusCode: 401
});

export const buildNotFoundError = (resource: string) => ({
  success: false,
  reason: 'NotFound',
  error: `${resource} not found`,
  statusCode: 404
});

export const buildResourceExistsError = (resource: string) => ({
  success: false,
  reason: 'ResourceExists',
  error: `A resource already exists with the given input: ${resource}`,
  statusCode: 409
});

export const buildUnknownError = (error: Error | string) => ({
  success: false,
  reason: 'Unknown',
  error: error instanceof Error ? `${error.name && `${error.name}: `}${error.message}` : error,
  statusCode: 500
});
