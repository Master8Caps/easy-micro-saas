import { describe, it, expect } from "vitest";
import { resolveVariant, APP_BRANDS } from "./variant";

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

describe("APP_BRANDS", () => {
  it("calm brand is Taiga", () => {
    expect(APP_BRANDS.calm.name).toBe("Taiga");
    expect(APP_BRANDS.calm.title).toBe("Taiga");
  });
  it("techy brand keeps Easy Micro SaaS", () => {
    expect(APP_BRANDS.techy.name).toBe("Easy Micro SaaS");
  });
});
