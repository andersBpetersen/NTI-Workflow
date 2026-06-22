export interface ProcessorRule {
  id: string;
  name?: string;
  jobType?: string;
  conditions?: unknown;
  pathScheme?: string;
  namingScheme?: string;
  raw: Record<string, unknown>;
}

export interface JobContainerRule {
  id: string;
  name?: string;
  processors: ProcessorRule[];
  raw: Record<string, unknown>;
}

export interface NormalizedJobConfig {
  version: string | null;
  fingerprint: string;
  containers: JobContainerRule[];
  warnings: string[];
  raw: unknown;
}

export interface ParseConfigResult {
  config: NormalizedJobConfig;
  warnings: string[];
}
