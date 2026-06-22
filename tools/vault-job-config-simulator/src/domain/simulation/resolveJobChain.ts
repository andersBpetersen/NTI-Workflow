import type { NormalizedJobConfig } from "../../types/config";
import type { QueuedJob } from "../../types/simulation";
import type { VaultTestScenario } from "../../types/scenario";
import { evaluateConditions } from "./evaluateConditions";

export function resolveJobChain(
  config: NormalizedJobConfig,
  scenario: VaultTestScenario,
): QueuedJob[] {
  const jobs: QueuedJob[] = [];
  const context = {
    file: scenario.file,
    folder: scenario.folder,
    item: scenario.item,
    execution: scenario.execution,
  };

  config.containers.forEach((container) => {
    container.processors.forEach((processor) => {
      if (!evaluateConditions(processor.conditions, context)) return;
      jobs.push({
        id: `${container.id}:${processor.id}`,
        jobType: processor.jobType ?? processor.name ?? processor.id,
        containerId: container.id,
        processorId: processor.id,
        sourceRule: processor.name ?? processor.id,
      });
    });
  });

  return jobs;
}
