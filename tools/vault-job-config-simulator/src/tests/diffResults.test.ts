import { describe, expect, it } from "vitest";
import { diffResults } from "../domain/simulation/diffResults";
import type { SimulationResult } from "../types/simulation";

function makeResult(
  fingerprint: string,
  jobs: Array<{ id: string; jobType: string }>,
): SimulationResult {
  return {
    scenarioId: "s1",
    configFingerprint: fingerprint,
    queuedJobs: jobs.map((job) => ({ ...job })),
    generatedFiles: [],
    messages: [],
    warnings: [],
  };
}

describe("diffResults", () => {
  it("finds added and removed jobs", () => {
    const baseline = makeResult("fp-a", [
      { id: "c1:p1", jobType: "Publish" },
      { id: "c1:p2", jobType: "Convert" },
    ]);
    const compare = makeResult("fp-b", [
      { id: "c1:p1", jobType: "Publish" },
      { id: "c1:p3", jobType: "Archive" },
    ]);

    const diff = diffResults(baseline, compare);

    expect(diff.addedJobs).toEqual([
      { id: "c1:p3", jobType: "Archive", change: "added" },
    ]);
    expect(diff.removedJobs).toEqual([
      { id: "c1:p2", jobType: "Convert", change: "removed" },
    ]);
  });
});
