/** MVP: deterministic simple hash (djb2) — not cryptographic. */
export function fingerprintConfigJson(jsonText: string): string {
  let hash = 5381;
  for (let i = 0; i < jsonText.length; i += 1) {
    hash = (hash * 33) ^ jsonText.charCodeAt(i);
  }
  return "fp-" + (hash >>> 0).toString(16).padStart(8, "0");
}

export async function fingerprintConfigJsonWebCrypto(
  jsonText: string,
): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest !== "function") {
    return fingerprintConfigJson(jsonText);
  }
  const data = new TextEncoder().encode(jsonText);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "sha256-" + hex.slice(0, 16);
}
