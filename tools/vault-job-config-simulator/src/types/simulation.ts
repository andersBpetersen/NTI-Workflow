import type { NormalizedJobConfig } from "./config";
import type { VaultTestScenario } from "./scenario";

export interface QueuedJob {
  id: string;
  jobType: string;
  containerId?: string;
  processorId?: string;
  sourceRule?: string;
}

export interface GeneratedFile {
  path: string;
  name: string;
  sourceJobId?: string;
}

export interface SimulationResult {
  scenarioId: string;
  configFingerprint: string;
  queuedJobs: QueuedJob[];
  generatedFiles: GeneratedFile[];
  messages: string[];
  warnings: string[];
}

export interface SimulationDiffEntry {
  id: string;
  jobType: string;
  change: "added" | "removed";
}

export interface SimulationDiff {
  baselineFingerprint: string;
  compareFingerprint: string;
  addedJobs: SimulationDiffEntry[];
  removedJobs: SimulationDiffEntry[];
}

export interface SimulateInput {
  config: NormalizedJobConfig;
  scenario: VaultTestScenario;
}
