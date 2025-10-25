declare module "detox" {
  const detox: Detox.DetoxExportWrapper & {
    init: (config?: Detox.DetoxConfig, options?: Partial<DetoxInternals.DetoxInitOptions>) => Promise<void>;
    cleanup: () => Promise<void>;
  };

  export = detox;
}

declare module "detox/runners/jest/adapter" {
  const adapter: {
    beforeEach: () => Promise<void>;
    afterEach: () => Promise<void>;
  };

  export = adapter;
}
