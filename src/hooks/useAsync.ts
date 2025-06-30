// src/hooks/useAsync.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { AppError } from '../core/errors/AppError';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Keep track of the current request to prevent race conditions
  const currentRequestRef = useRef<number>(0);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      const requestId = ++currentRequestRef.current;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFunction(...args);

        // Only update state if this is still the current request
        if (requestId === currentRequestRef.current) {
          setState({ data: result, loading: false, error: null });
          return result;
        }
        return null;
      } catch (error) {
        // Only update state if this is still the current request
        if (requestId === currentRequestRef.current) {
          const appError = error instanceof AppError 
            ? error 
            : new AppError(
                'UNKNOWN_ERROR' as any,
                error instanceof Error ? error.message : 'Unknown error',
                'An unexpected error occurred',
                true
              );

          setState({ data: null, loading: false, error: appError });
        }
        return null;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    currentRequestRef.current++;
    setState({ data: null, loading: false, error: null });
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
}
