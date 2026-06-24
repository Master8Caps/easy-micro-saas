import { describe, it, expect } from "vitest";
import { resolveVariant, BRANDS } from "./variant";

describe("resolveVariant", () => {
  it("returns calm only for the exact 'calm' string", () => {
    expect(resolveVariant("calm")).toBe("calm");
  });
  it("defaults to techy for undefined", () => {
    expect(resolveVariant(undefined)).toBe("techy");
  });
  it("defaults to techy for unknown values", () => {
    expect(resolveVariant("xyz")).toBe("techy");
  });
});

describe("BRANDS", () => {
  it("calm brand is Taiga on gettaiga.com", () => {
    expect(BRANDS.calm.name).toBe("Taiga");
    expect(BRANDS.calm.domain).toBe("gettaiga.com");
  });
  it("techy brand keeps the existing title", () => {
    expect(BRANDS.techy.metaTitle).toContain("Easy Micro SaaS");
  });
});
