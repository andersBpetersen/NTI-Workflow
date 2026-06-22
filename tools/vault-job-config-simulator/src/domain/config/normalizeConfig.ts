import type { JobContainerRule, NormalizedJobConfig, ProcessorRule } from "../../types/config";
import { fingerprintConfigJson } from "./fingerprintConfig";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  return typeof value === "string" ? value : undefined;
}

function normalizeProcessor(raw: Record<string, unknown>, index: number): ProcessorRule {
  return {
    id: readString(raw, "Id") ?? readString(raw, "id") ?? `processor-${index + 1}`,
    name: readString(raw, "Name") ?? readString(raw, "name"),
    jobType:
      readString(raw, "JobType") ??
      readString(raw, "jobType") ??
      readString(raw, "Type"),
    conditions: raw.Conditions ?? raw.conditions,
    pathScheme: readString(raw, "PathScheme") ?? readString(raw, "pathScheme"),
    namingScheme: readString(raw, "NamingScheme") ?? readString(raw, "namingScheme"),
    raw,
  };
}

function normalizeContainer(raw: Record<string, unknown>, index: number): JobContainerRule {
  const processorsRaw = raw.Processors ?? raw.processors ?? raw.Rules ?? raw.rules;
  const processors: ProcessorRule[] = Array.isArray(processorsRaw)
    ? processorsRaw
        .map((entry, pIndex) => {
          const record = asRecord(entry);
          return record ? normalizeProcessor(record, pIndex) : null;
        })
        .filter((p): p is ProcessorRule => p !== null)
    : [];

  return {
    id: readString(raw, "Id") ?? readString(raw, "id") ?? `container-${index + 1}`,
    name: readString(raw, "Name") ?? readString(raw, "name"),
    processors,
    raw,
  };
}

export function normalizeConfig(raw: unknown, jsonText: string): NormalizedJobConfig {
  const warnings: string[] = [];
  const root = asRecord(raw);
  let version: string | null = null;
  let containers: JobContainerRule[] = [];

  if (!root) {
    warnings.push("Rod-element er ikke et JSON-objekt.");
    return {
      version,
      fingerprint: fingerprintConfigJson(jsonText),
      containers,
      warnings,
      raw,
    };
  }

  version =
    readString(root, "Version") ??
    readString(root, "version") ??
    readString(root, "ConfigVersion") ??
    null;

  if (!version) {
    warnings.push("Ingen version fundet i konfigurationen.");
  }

  const containersRaw =
    root.JobProcessorContainers ??
    root.jobProcessorContainers ??
    root.Containers ??
    root.containers;

  if (!containersRaw) {
    warnings.push("JobProcessorContainers blev ikke fundet.");
  } else if (!Array.isArray(containersRaw)) {
    warnings.push("JobProcessorContainers er ikke et array.");
  } else {
    containers = containersRaw
      .map((entry, index) => {
        const record = asRecord(entry);
        if (!record) {
          warnings.push(`Container ${index + 1} er ikke et objekt.`);
          return null;
        }
        return normalizeContainer(record, index);
      })
      .filter((c): c is JobContainerRule => c !== null);

    if (containers.length === 0) {
      warnings.push("Ingen gyldige job processor containers fundet.");
    }
  }

  return {
    version,
    fingerprint: fingerprintConfigJson(jsonText),
    containers,
    warnings,
    raw,
  };
}
