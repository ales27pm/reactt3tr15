declare module "sentry-expo" {
  type ScopeCallback = (scope: {
    setTag(key: string, value: string): void;
    setExtra(key: string, value: unknown): void;
  }) => void;

  interface NativeModule {
    captureException(
      error: unknown,
      context?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
    ): void;
    captureMessage(
      message: string,
      context?: { level?: string; extra?: Record<string, unknown> },
    ): void;
    addBreadcrumb(breadcrumb: {
      category?: string;
      level?: string;
      message?: string;
      data?: Record<string, unknown>;
    }): void;
    configureScope(callback: ScopeCallback): void;
    setTag(key: string, value: string): void;
    setExtra(key: string, value: unknown): void;
    close(): Promise<void>;
  }

  export function init(options: Record<string, unknown>): void;

  export const Native: NativeModule;

  interface SentryExpoMock {
    reset(): void;
    getScope(): { tags: Record<string, string>; extras: Record<string, unknown> };
    getBreadcrumbs(): Array<{
      category?: string;
      level?: string;
      message?: string;
      data?: Record<string, unknown>;
    }>;
    getCapturedErrors(): Array<{
      error: unknown;
      context?: { tags?: Record<string, string>; extra?: Record<string, unknown> };
    }>;
    getCapturedMessages(): Array<{
      message: string;
      context?: { level?: string; extra?: Record<string, unknown> };
    }>;
    getInitCalls(): Array<Record<string, unknown>>;
    getCloseCallCount(): number;
  }

  export const __mock: SentryExpoMock;
}
