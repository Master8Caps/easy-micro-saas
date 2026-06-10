import { describe, it, expect } from "vitest";
import { extractColors } from "./colors";

describe("extractColors", () => {
  it("returns declared brand custom-properties first", () => {
    const css = `:root{--primary:#0d9488;--brand-accent:#155e75;--text:#111}`;
    const out = extractColors(css);
    expect(out[0]).toBe("#0d9488");
    expect(out).toContain("#155e75");
  });

  it("expands 3-digit hex and lowercases", () => {
    expect(extractColors(":root{--brand:#0AB}")).toContain("#00aabb");
  });

  it("converts rgb() to hex", () => {
    expect(extractColors(":root{--primary:rgb(13,148,136)}")).toContain("#0d9488");
  });

  it("filters near-white, near-black and greys when real colours exist", () => {
    const css = `:root{--primary:#0d9488}.x{color:#ffffff}.y{background:#000}.z{border:#f5f5f5}`;
    const out = extractColors(css);
    expect(out).toContain("#0d9488");
    expect(out).not.toContain("#ffffff");
    expect(out).not.toContain("#000000");
    expect(out).not.toContain("#f5f5f5");
  });

  it("ranks more frequent colours higher (after declared)", () => {
    const css = `.a{color:#ff0000}.b{color:#00ff00}.c{color:#00ff00}.d{color:#00ff00}`;
    const out = extractColors(css);
    expect(out.indexOf("#00ff00")).toBeLessThan(out.indexOf("#ff0000"));
  });

  it("returns an empty array when there are no colours", () => {
    expect(extractColors("body{font-size:14px}")).toEqual([]);
  });

  it("caps the result to 5 colours", () => {
    const css = `.a{color:#111abc}.b{color:#22abcd}.c{color:#3abcde}.d{color:#4bcdef}.e{color:#5cdef0}.f{color:#6def01}`;
    expect(extractColors(css).length).toBeLessThanOrEqual(5);
  });
});
