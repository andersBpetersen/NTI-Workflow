import type { VaultTestScenario } from "../../types/scenario";

const STORAGE_KEY = "vault-job-config-simulator.scenarios";

export function loadScenariosFromStorage(): VaultTestScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as VaultTestScenario[]) : [];
  } catch {
    return [];
  }
}

export function saveScenariosToStorage(scenarios: VaultTestScenario[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function createDefaultScenario(): VaultTestScenario {
  return {
    id: "scenario-1",
    name: "Eksempel-scenarie",
    file: { name: "drawing.dwg", extension: "dwg", lifecycleState: "Work in Progress" },
    folder: { path: "$/Design", name: "Design" },
    execution: { trigger: "Manual", user: "Administrator" },
  };
}
