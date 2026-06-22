import type { VaultTestScenario } from "../../types/scenario";

export type PathTokenContext = {
  file?: VaultTestScenario["file"];
  folder?: VaultTestScenario["folder"];
  item?: VaultTestScenario["item"];
};

/** MVP: static text plus {token} placeholders from file/folder/item context. */
export function resolvePathScheme(
  scheme: string | undefined,
  context: PathTokenContext,
): string {
  if (!scheme) return "";

  return scheme.replace(/\{([^}]+)\}/g, (_match, token: string) => {
    const value = readToken(context, token.trim());
    return value ?? "";
  });
}

function readToken(context: PathTokenContext, token: string): string | undefined {
  const [scope, ...rest] = token.split(".");
  const key = rest.length ? rest.join(".") : scope;
  const source =
    scope === "file"
      ? context.file
      : scope === "folder"
        ? context.folder
        : scope === "item"
          ? context.item
          : context.file ?? context.folder ?? context.item;

  if (!source || typeof source !== "object") return undefined;

  const record = source as Record<string, unknown>;
  const direct = record[key];
  if (typeof direct === "string") return direct;
  if (scope === "file" && key === "name" && typeof record.name === "string") {
    return record.name;
  }
  return undefined;
}
