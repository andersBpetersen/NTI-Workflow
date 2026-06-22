import type { SimulationDiff, SimulationDiffEntry, SimulationResult } from "../../types/simulation";

function jobKey(job: { id: string; jobType: string }): string {
  return `${job.id}::${job.jobType}`;
}

export function diffResults(
  baseline: SimulationResult,
  compare: SimulationResult,
): SimulationDiff {
  const baselineMap = new Map(
    baseline.queuedJobs.map((job) => [jobKey(job), job]),
  );
  const compareMap = new Map(compare.queuedJobs.map((job) => [jobKey(job), job]));

  const addedJobs: SimulationDiffEntry[] = [];
  const removedJobs: SimulationDiffEntry[] = [];

  compareMap.forEach((job, key) => {
    if (!baselineMap.has(key)) {
      addedJobs.push({ id: job.id, jobType: job.jobType, change: "added" });
    }
  });

  baselineMap.forEach((job, key) => {
    if (!compareMap.has(key)) {
      removedJobs.push({ id: job.id, jobType: job.jobType, change: "removed" });
    }
  });

  return {
    baselineFingerprint: baseline.configFingerprint,
    compareFingerprint: compare.configFingerprint,
    addedJobs,
    removedJobs,
  };
}
