import { logError } from "./logger";

export type ApiErrorCode =
  | "network"
  | "rate_limit"
  | "service_unavailable"
  | "auth_missing"
  | "invalid_request"
  | "timeout"
  | "unknown";

export interface TypedApiError extends Error {
  code: ApiErrorCode;
  title: string;
  message: string;
  status?: number;
  provider?: string;
  details?: any;
  retryable: boolean;
}

export const toApiError = (e: Partial<TypedApiError>): TypedApiError => {
  const err: TypedApiError = Object.assign(new Error(e.message || ""), {
    code: e.code || "unknown",
    title: e.title || "Something went wrong",
    message: e.message || "An unexpected error occurred.",
    status: e.status,
    provider: e.provider,
    details: e.details,
    retryable: e.retryable ?? false,
  });
  return err;
};

export const mapApiError = (error: any, provider?: string): TypedApiError => {
  try {
    const status = error?.status || error?.response?.status;
    const msg: string =
      error?.message || error?.response?.data?.error?.message || error?.response?.data?.message || error?.error || "";

    // Network or fetch TypeError
    if (error?.name === "TypeError" || msg?.toLowerCase().includes("network") || !navigator?.onLine) {
      return toApiError({
        code: "network",
        title: "No connection",
        message: "You appear to be offline. Please check your connection and try again.",
        provider,
        retryable: true,
      });
    }

    if (status === 429) {
      return toApiError({
        code: "rate_limit",
        title: "Too many requests",
        message: "You are being rate limited. Please wait a moment and try again.",
        status,
        provider,
        retryable: true,
      });
    }

    if (status === 401 || status === 403 || /api key/i.test(msg)) {
      return toApiError({
        code: "auth_missing",
        title: "Authorization required",
        message: "AI is unavailable right now due to missing or invalid credentials.",
        status,
        provider,
        retryable: false,
      });
    }

    if (status === 400 || status === 422) {
      return toApiError({
        code: "invalid_request",
        title: "Invalid request",
        message: "The request could not be processed. Please adjust input and try again.",
        status,
        provider,
        retryable: false,
      });
    }

    if (status === 408 || status === 504) {
      return toApiError({
        code: "timeout",
        title: "Request timed out",
        message: "The server took too long to respond. Please try again.",
        status,
        provider,
        retryable: true,
      });
    }

    if (status && status >= 500) {
      return toApiError({
        code: "service_unavailable",
        title: "Service unavailable",
        message: "Service is currently unavailable. Please try again later.",
        status,
        provider,
        retryable: true,
      });
    }

    return toApiError({
      code: "unknown",
      title: "Unexpected error",
      message: msg || "An unexpected error occurred.",
      status,
      provider,
      retryable: true,
    });
  } catch (unknownError) {
    logError("Failed to normalize provider error", { context: "api-errors" }, unknownError);
    return toApiError({
      code: "unknown",
      title: "Unexpected error",
      message: "An unexpected error occurred.",
      retryable: true,
      provider,
    });
  }
};
