export type AppErrorCode =
  | 'auth'
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'server'
  | 'unknown';

export type AppErrorOptions = {
  cause?: unknown;
  details?: Record<string, any>;
};

export class AppError extends Error {
  code: AppErrorCode;
  cause?: unknown;
  details?: Record<string, any>;

  constructor(code: AppErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.code = code;
    this.cause = options.cause;
    this.details = options.details;
  }
}

const networkHints = ['Failed to fetch', 'Network request failed', 'fetch failed', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'];

const isNetworkError = (err: unknown) => {
  const message = (err as any)?.message ?? String(err ?? '');
  return networkHints.some(hint => message.includes(hint));
};

export const toAppError = (
  context: string,
  err: unknown,
  fallbackMessage: string,
  overrides?: { code?: AppErrorCode },
): AppError => {
  if (err instanceof AppError) return err;

  const codeOverride = overrides?.code;

  // Supabase/PostgREST error shape
  const supaCode = (err as any)?.code as string | undefined;
  const supaMessage = (err as any)?.message as string | undefined;

  if (codeOverride) {
    return new AppError(codeOverride, fallbackMessage, { cause: err });
  }

  if (isNetworkError(err)) {
    return new AppError('server', fallbackMessage, { cause: err });
  }

  if (supaCode === 'PGRST116') {
    return new AppError('not-found', fallbackMessage, { cause: err });
  }

  if (supaCode === '23505') {
    // unique_violation
    return new AppError('conflict', fallbackMessage, { cause: err });
  }

  if (supaCode === '42501' || supaCode === 'PGRST301') {
    return new AppError('auth', 'You are not authorized to perform this action.', { cause: err });
  }

  if (supaCode === '22001') {
    return new AppError('validation', fallbackMessage, { cause: err });
  }

  return new AppError('server', supaMessage ?? fallbackMessage, { cause: err });
};

export const requireUser = (user: { id: string } | null, message: string): asserts user is { id: string } => {
  if (!user) {
    throw new AppError('auth', message);
  }
};
