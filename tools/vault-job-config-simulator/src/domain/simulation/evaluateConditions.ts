import type { VaultTestScenario } from "../../types/scenario";

export type ConditionContext = {
  file?: VaultTestScenario["file"];
  folder?: VaultTestScenario["folder"];
  item?: VaultTestScenario["item"];
  execution?: VaultTestScenario["execution"];
};

/** MVP: supports { equals: { field, value } } and { and: [...] } */
export function evaluateConditions(
  conditions: unknown,
  context: ConditionContext,
): boolean {
  if (conditions == null) return true;

  const record =
    conditions && typeof conditions === "object" && !Array.isArray(conditions)
      ? (conditions as Record<string, unknown>)
      : null;

  if (!record) return false;

  if (Array.isArray(record.and)) {
    return record.and.every((entry) => evaluateConditions(entry, context));
  }

  const equals = record.equals;
  if (equals && typeof equals === "object" && !Array.isArray(equals)) {
    const eq = equals as Record<string, unknown>;
    const field = typeof eq.field === "string" ? eq.field : "";
    const expected = eq.value;
    const actual = readContextField(context, field);
    return actual === expected;
  }

  return true;
}

function readContextField(context: ConditionContext, field: string): unknown {
  const parts = field.split(".");
  let current: unknown = context as unknown;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
