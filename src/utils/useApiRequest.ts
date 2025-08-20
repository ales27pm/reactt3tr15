import { useCallback, useRef, useState } from "react";
import { TypedApiError, mapApiError } from "./errors";
import { withRetry, RetryOptions } from "./retry";

export function useApiRequest<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  retryOptions: RetryOptions = {}
) {
  const [data, setData] = useState<TResult | null>(null);
  const [error, setError] = useState<TypedApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const lastArgs = useRef<TArgs | null>(null);

  const run = useCallback(async (...args: TArgs) => {
    setLoading(true);
    setError(null);
    lastArgs.current = args;
    try {
      const result = await withRetry(() => fn(...args), retryOptions);
      setData(result);
      return result;
    } catch (e: any) {
      const mapped = mapApiError(e);
      setError(mapped);
      throw mapped;
    } finally {
      setLoading(false);
    }
  }, [fn, retryOptions]);

  const retry = useCallback(async () => {
    if (!lastArgs.current) return;
    return run(...lastArgs.current);
  }, [run]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    lastArgs.current = null as any;
  }, []);

  return { data, error, loading, run, retry, reset } as const;
}
