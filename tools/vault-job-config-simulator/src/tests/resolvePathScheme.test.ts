import { describe, expect, it } from "vitest";
import { resolvePathScheme } from "../domain/simulation/resolvePathScheme";

describe("resolvePathScheme", () => {
  it("returns static text unchanged", () => {
    expect(resolvePathScheme("$/Design/Output", {})).toBe("$/Design/Output");
  });

  it("replaces simple file tokens", () => {
    expect(
      resolvePathScheme("$/Design/{file.name}", {
        file: { name: "part.dwg" },
      }),
    ).toBe("$/Design/part.dwg");
  });

  it("replaces folder path tokens", () => {
    expect(
      resolvePathScheme("{folder.path}/Publish", {
        folder: { path: "$/Released" },
      }),
    ).toBe("$/Released/Publish");
  });
});
