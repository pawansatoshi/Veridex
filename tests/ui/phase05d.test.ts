import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "assets/veridex-spatial.css"), "utf8");
const js = readFileSync(resolve(process.cwd(), "assets/veridex-spatial.js"), "utf8");
const evidence = readFileSync(resolve(process.cwd(), "evidence/index.html"), "utf8");

describe("Phase 05D spatial evidence UX", () => {
  it("ships the shared spatial stylesheet and controller", () => {
    expect(css).toContain("prefers-reduced-motion:reduce");
    expect(css).toContain("vx-flow");
    expect(js).toContain("VeridexSpatial");
    expect(js).toContain("Conclusive");
  });

  it("integrates the visualization without duplicating analysis logic", () => {
    expect(evidence).toContain("/assets/veridex-spatial.css");
    expect(evidence).toContain("/assets/veridex-spatial.js");
    expect(evidence).toContain("window.VeridexSpatial.render(data,address)");
    expect(evidence).toContain("/api/analyze");
  });
});
