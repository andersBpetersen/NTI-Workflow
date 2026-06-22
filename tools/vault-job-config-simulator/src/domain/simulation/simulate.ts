import type { NormalizedJobConfig } from "../../types/config";
import type { SimulationResult } from "../../types/simulation";
import type { VaultTestScenario } from "../../types/scenario";
import { resolveJobChain } from "./resolveJobChain";
import { resolveNamingScheme } from "./resolveNamingScheme";
import { resolvePathScheme } from "./resolvePathScheme";

export function simulate(
  config: NormalizedJobConfig,
  scenario: VaultTestScenario,
): SimulationResult {
  const queuedJobs = resolveJobChain(config, scenario);
  const pathContext = {
    file: scenario.file,
    folder: scenario.folder,
    item: scenario.item,
  };

  const generatedFiles = queuedJobs.map((job) => {
    const processor = config.containers
      .flatMap((c) => c.processors.map((p) => ({ container: c, processor: p })))
      .find((entry) => entry.processor.id === job.processorId);

    const path = resolvePathScheme(processor?.processor.pathScheme, pathContext);
    const name = resolveNamingScheme(processor?.processor.namingScheme, scenario);

    return {
      path: path || "$/Output",
      name,
      sourceJobId: job.id,
    };
  });

  return {
    scenarioId: scenario.id,
    configFingerprint: config.fingerprint,
    queuedJobs,
    generatedFiles,
    messages: [
      queuedJobs.length
        ? `Simulering fandt ${queuedJobs.length} job(s) i kæden.`
        : "Ingen jobs matchede scenariet (MVP-simulator).",
    ],
    warnings: config.warnings,
  };
}
