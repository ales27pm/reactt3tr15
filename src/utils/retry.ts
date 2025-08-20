import { mapApiError, TypedApiError } from "./errors";

export interface RetryOptions {
  retries?: number;
  baseMs?: number;
  jitter?: boolean;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const shouldRetry = (err: TypedApiError) => {
  return err.code === "network" || err.code === "service_unavailable" || err.code === "timeout" || err.code === "rate_limit";
};

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const baseMs = options.baseMs ?? 400;
  const jitter = options.jitter ?? true;

  let attempt = 0;
  let lastError: TypedApiError | null = null;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e: any) {
      const mapped = mapApiError(e);
      lastError = mapped;
      if (attempt === retries || !shouldRetry(mapped)) {
        throw mapped;
      }
      const backoff = baseMs * Math.pow(2, attempt);
      const delay = jitter ? Math.floor(backoff * (0.75 + Math.random() * 0.5)) : backoff;
      await sleep(delay);
      attempt++;
    }
  }
  throw lastError || mapApiError(new Error("Unknown error"));
}
