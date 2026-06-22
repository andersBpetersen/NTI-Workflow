import type { VaultTestScenario } from "../../types/scenario";

/** MVP: passthrough naming scheme with simple {file.name} token support. */
export function resolveNamingScheme(
  scheme: string | undefined,
  scenario: VaultTestScenario,
): string {
  if (!scheme) return scenario.file?.name ?? "output";

  return scheme.replace(/\{file\.name\}/g, scenario.file?.name ?? "output");
}
