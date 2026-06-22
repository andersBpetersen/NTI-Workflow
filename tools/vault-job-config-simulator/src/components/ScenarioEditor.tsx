import type { ChangeEvent } from "react";
import type { VaultTestScenario } from "../types/scenario";

type ScenarioEditorProps = {
  scenario: VaultTestScenario;
  onChange: (scenario: VaultTestScenario) => void;
};

export function ScenarioEditor({ scenario, onChange }: ScenarioEditorProps) {
  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    onChange({ ...scenario, [name]: value });
  }

  function updateFileField(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    onChange({
      ...scenario,
      file: { ...scenario.file, [name]: value },
    });
  }

  return (
    <section className="panel">
      <h2>Scenario editor</h2>
      <p className="placeholder">Lokal test-scenarie (gemmes i browseren senere).</p>
      <div className="form-grid">
        <label>
          ID
          <input name="id" value={scenario.id} onChange={updateField} />
        </label>
        <label>
          Navn
          <input name="name" value={scenario.name} onChange={updateField} />
        </label>
        <label>
          Filnavn
          <input
            value={scenario.file?.name ?? ""}
            onChange={(event) =>
              onChange({
                ...scenario,
                file: { ...scenario.file, name: event.target.value },
              })
            }
          />
        </label>
        <label>
          Lifecycle state
          <input
            name="lifecycleState"
            value={scenario.file?.lifecycleState ?? ""}
            onChange={updateFileField}
          />
        </label>
        <label className="full-width">
          Mappe
          <input
            name="path"
            value={scenario.folder?.path ?? ""}
            onChange={(event) =>
              onChange({
                ...scenario,
                folder: { ...scenario.folder, path: event.target.value },
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
