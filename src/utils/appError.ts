export type AppErrorCode =
  | 'auth'
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'server'
  | 'mismatch'
  | 'unknown';

export type AppErrorOptions = {
  cause?: unknown;
  details?: Record<string, any>;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: Record<string, any>;

  constructor(code: AppErrorCode, message: string, options?: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = options?.details;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export class DataMismatchException extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('mismatch', message, { details });
    this.name = 'DataMismatchException';
  }
}

export const toAppError = (
  operation: string,
  error: any,
  message?: string
): AppError => {
  if (error instanceof AppError) return error;

  let code: AppErrorCode = 'unknown';

  // Handle Supabase/PostgREST error codes
  if (error?.code) {
    switch (error.code) {
      case '23505': // unique_violation
        code = 'conflict';
        break;
      case 'PGRST116': // no-rows
        code = 'not-found';
        break;
      case '42P01': // undefined_table
      case '42703': // undefined_column
        code = 'server';
        break;
      default:
        code = 'server';
    }
  } else if (error?.status) {
    // Handle HTTP status codes if available
    if (error.status === 404) code = 'not-found';
    else if (error.status === 409) code = 'conflict';
    else if (error.status >= 500) code = 'server';
    else if (error.status === 401 || error.status === 403) code = 'auth';
  }

  return new AppError(code, message || error?.message || 'An unexpected error occurred.', {
    cause: error,
    details: {
      operation,
      originalError: error?.message,
      errorCode: error?.code,
    },
  });
};
