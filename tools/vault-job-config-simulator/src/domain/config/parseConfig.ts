import type { ParseConfigResult } from "../../types/config";
import { normalizeConfig } from "./normalizeConfig";

export function parseConfig(jsonText: string): ParseConfigResult {
  const warnings: string[] = [];

  if (!jsonText.trim()) {
    return {
      config: normalizeConfig(null, jsonText),
      warnings: ["Filen er tom."],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt JSON-fejl";
    warnings.push(`Ugyldig JSON: ${message}`);
    return {
      config: normalizeConfig(null, jsonText),
      warnings,
    };
  }

  const config = normalizeConfig(parsed, jsonText);
  return {
    config,
    warnings: [...warnings, ...config.warnings],
  };
}
