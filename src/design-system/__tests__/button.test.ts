import { resolveButtonClasses } from "../components/button-classes";

describe("Button design system", () => {
  it("returns expected primary medium classes", () => {
    const { container, label } = resolveButtonClasses("primary", "md");
    expect(container).toContain("bg-brand-600");
    expect(container).toContain("h-12");
    expect(label).toContain("text-surface-50");
  });

  it("supports ghost variant", () => {
    const { container, label } = resolveButtonClasses("ghost", "sm");
    expect(container).toContain("bg-transparent");
    expect(label).toContain("text-brand-600");
  });
});
