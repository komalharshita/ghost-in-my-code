import { describe, expect, it } from "vitest";
import { extractJson, validateReport } from "@/lib/ghost/validate";
import { validateInput } from "@/lib/ghost/analyze.functions";
import { runDeterministic } from "@/lib/ghost/deterministic";
import { SAMPLES } from "@/lib/ghost/samples";

describe("input validation", () => {
  it("rejects empty code", () => expect(() => validateInput({ code: "  ", language: "python" })).toThrow());
  it("rejects code over 8000 chars", () => expect(() => validateInput({ code: "x".repeat(8001), language: "python" })).toThrow());
  it("rejects unknown language", () => expect(() => validateInput({ code: "x", language: "cobol" })).toThrow());
  it("accepts valid input", () => expect(validateInput({ code: "x=1", language: "python" }).language).toBe("python"));
});

describe("model output validation", () => {
  it("extracts JSON from fenced replies", () => expect(extractJson('```json\n{"summary":"hi"}\n```')).toEqual({ summary: "hi" }));
  it("throws on malformed JSON", () => expect(() => extractJson("not json")).toThrow());
  it("rejects a report without summary", () => expect(() => validateReport({ language: "x" })).toThrow());
  it("coerces missing arrays and bad severity", () => {
    const r = validateReport({ summary: "s", potential_issues: [{ issue: "i", severity: "critical" }] });
    expect(r.potential_issues[0]!.severity).toBe("low");
    expect(r.changes).toEqual([]);
  });
});

describe("deterministic checks", () => {
  it("flags Python 2 print in the sample", () => {
    const f = runDeterministic(SAMPLES[0]!.code, "python").findings.map((x) => x.rule);
    expect(f).toContain("Python 2 print statement");
  });
  it("flags gets/strcpy in the C sample", () => {
    expect(runDeterministic(SAMPLES[3]!.code, "c").findings.map((x) => x.rule)).toContain("Unbounded string function");
  });
  it("detects triple loop nesting in Java sample", () => {
    expect(runDeterministic(SAMPLES[2]!.code, "java").stats.maxNesting).toBe(3);
  });
});
