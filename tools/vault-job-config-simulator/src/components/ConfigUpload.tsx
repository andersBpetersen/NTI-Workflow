import type { ChangeEvent } from "react";

type ConfigUploadProps = {
  fileName: string | null;
  onFileSelected: (file: File, text: string) => void;
};

export function ConfigUpload({ fileName, onFileSelected }: ConfigUploadProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onFileSelected(file, String(reader.result ?? ""));
    };
    reader.readAsText(file);
  }

  return (
    <section className="panel">
      <h2>Config upload</h2>
      <p className="note">
        Data behandles lokalt i browseren. Ingen Vault-konfiguration uploades til en server.
      </p>
      <label className="upload-label">
        Vælg NTI For Vault Job Processor JSON
        <input type="file" accept=".json,application/json" onChange={handleChange} />
      </label>
      {fileName ? <p className="meta">Fil: <strong>{fileName}</strong></p> : null}
    </section>
  );
}
