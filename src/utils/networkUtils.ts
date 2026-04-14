/**
 * Network utility functions for handling timeouts, cancellation, and connection quality
 */

import { AppError } from './appError';

export interface RequestOptions {
  timeout?: number; // Timeout in milliseconds
  signal?: AbortSignal; // For request cancellation
}

/**
 * Create an AbortController with timeout
 */
export const createTimeoutSignal = (timeoutMs: number = 30000): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
};

/**
 * Wrap a promise with timeout handling
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  errorMessage: string = 'Request timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new AppError('server', errorMessage));
      }, timeoutMs);
    }),
  ]);
};

/**
 * Check if error is due to timeout
 */
export const isTimeoutError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('timeout') || 
           error.message.includes('aborted') ||
           error.name === 'AbortError';
  }
  return false;
};

/**
 * Check if error is due to network issues
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const networkHints = [
      'Failed to fetch',
      'Network request failed',
      'fetch failed',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NetworkError',
      'TypeError',
    ];
    return networkHints.some(hint => 
      error.message.includes(hint) || error.name.includes(hint)
    );
  }
  return false;
};

/**
 * Check if request was cancelled
 */
export const isCancelledError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.name === 'AbortError' || 
           error.message.includes('aborted') ||
           error.message.includes('cancelled');
  }
  return false;
};

/**
 * Create a cancellable promise wrapper
 */
export const createCancellablePromise = <T>(
  promise: Promise<T>,
  signal?: AbortSignal
): Promise<T> => {
  if (!signal) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    // If already aborted, reject immediately
    if (signal.aborted) {
      reject(new AppError('server', 'Request was cancelled'));
      return;
    }

    // Listen for abort signal
    signal.addEventListener('abort', () => {
      reject(new AppError('server', 'Request was cancelled'));
    });

    // Execute the promise
    promise
      .then(resolve)
      .catch(reject);
  });
};

