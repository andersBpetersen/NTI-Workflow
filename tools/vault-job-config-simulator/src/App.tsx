import { useMemo, useState } from "react";
import { ConfigUpload } from "./components/ConfigUpload";
import { ConfigSummary } from "./components/ConfigSummary";
import { ScenarioEditor } from "./components/ScenarioEditor";
import { SimulationResultView } from "./components/SimulationResultView";
import { parseConfig } from "./domain/config/parseConfig";
import { createDefaultScenario } from "./domain/scenarios/scenarioStorage";
import { diffResults } from "./domain/simulation/diffResults";
import { simulate } from "./domain/simulation/simulate";
import type { NormalizedJobConfig } from "./types/config";
import type { SimulationResult } from "./types/simulation";
import type { VaultTestScenario } from "./types/scenario";

export default function App() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [config, setConfig] = useState<NormalizedJobConfig | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [scenario, setScenario] = useState<VaultTestScenario>(createDefaultScenario);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [baseline, setBaseline] = useState<SimulationResult | null>(null);

  const diff = useMemo(() => {
    if (!baseline || !result) return null;
    return diffResults(baseline, result);
  }, [baseline, result]);

  function handleFileSelected(file: File, text: string) {
    const parsed = parseConfig(text);
    setFileName(file.name);
    setConfig(parsed.config);
    setWarnings(parsed.warnings);
    setResult(null);
  }

  function handleSimulate() {
    if (!config) return;
    const next = simulate(config, scenario);
    setResult(next);
  }

  function handleSetBaseline() {
    if (result) setBaseline(result);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="back-link" href="/">
          Tilbage til forside
        </a>
        <h1>Vault Job Config Simulator</h1>
        <p className="note">
          Data behandles lokalt i browseren. Ingen Vault-konfiguration uploades til en server.
        </p>
      </header>

      <main className="app-main">
        <ConfigUpload fileName={fileName} onFileSelected={handleFileSelected} />
        <ConfigSummary config={config} warnings={warnings} />
        <ScenarioEditor scenario={scenario} onChange={setScenario} />

        <section className="panel actions">
          <button type="button" onClick={handleSimulate} disabled={!config}>
            Kør simulering
          </button>
          <button type="button" onClick={handleSetBaseline} disabled={!result}>
            Gem som baseline
          </button>
        </section>

        <SimulationResultView result={result} diff={diff} />
      </main>
    </div>
  );
}
