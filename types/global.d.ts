declare module "detox" {
  export const device: any;
  export const element: any;
  export const by: any;
  export const expect: any;
}

declare module "react-test-renderer" {
  export const act: any;
}

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
      context?: { level?: string; extras?: Record<string, unknown> },
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

  export const __mock: unknown;
}
