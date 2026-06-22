import { describe, expect, it } from "vitest";
import { evaluateConditions } from "../domain/simulation/evaluateConditions";

describe("evaluateConditions", () => {
  it("returns true when conditions are null", () => {
    expect(evaluateConditions(null, {})).toBe(true);
  });

  it("evaluates equals against file context", () => {
    const result = evaluateConditions(
      { equals: { field: "file.lifecycleState", value: "Released" } },
      { file: { lifecycleState: "Released" } },
    );
    expect(result).toBe(true);
  });

  it("evaluates and-combinations", () => {
    const result = evaluateConditions(
      {
        and: [
          { equals: { field: "file.extension", value: "dwg" } },
          { equals: { field: "file.lifecycleState", value: "Work in Progress" } },
        ],
      },
      { file: { extension: "dwg", lifecycleState: "Work in Progress" } },
    );
    expect(result).toBe(true);
  });
});
