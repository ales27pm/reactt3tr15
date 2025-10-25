import { palette, typography, spacing, radii } from "../tokens";

describe("design tokens", () => {
  it("exposes brand palette with accessible contrast", () => {
    expect(palette.brand[600]).toBe("#4F46E5");
    expect(palette.text.primary).toBe("#0F172A");
  });

  it("defines typography scale", () => {
    expect(typography.sizes).toMatchObject({
      xs: 12,
      md: 16,
      display: 32,
    });
    expect(typography.lineHeights.display).toBeGreaterThan(typography.sizes.display);
  });

  it("provides spacing rhythm", () => {
    expect(spacing[4]).toBe(16);
    expect(spacing[20]).toBe(80);
  });

  it("includes rounded shapes", () => {
    expect(radii.lg).toBe(24);
    expect(radii.pill).toBeGreaterThan(100);
  });
});
