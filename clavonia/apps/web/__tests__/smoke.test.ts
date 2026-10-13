import { describe, expect, it } from "vitest";
import config from "../tailwind.config";

describe("web app tailwind config", () => {
  it("declares the @clavonia/ui preset", () => {
    expect(Array.isArray(config.presets)).toBe(true);
    expect(config.presets?.length).toBeGreaterThan(0);
  });

  it("declares content globs for app, components, lib and shared packages", () => {
    expect(Array.isArray(config.content)).toBe(true);
    expect(config.content).toEqual(
      expect.arrayContaining([
        expect.stringContaining("./app/"),
        expect.stringContaining("./components/"),
        expect.stringContaining("./lib/"),
        expect.stringContaining("../../packages/"),
      ]),
    );
  });
});
