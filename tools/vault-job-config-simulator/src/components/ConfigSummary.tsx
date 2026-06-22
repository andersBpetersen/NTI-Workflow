import type { NormalizedJobConfig } from "../types/config";

type ConfigSummaryProps = {
  config: NormalizedJobConfig | null;
  warnings: string[];
};

export function ConfigSummary({ config, warnings }: ConfigSummaryProps) {
  return (
    <section className="panel">
      <h2>Config summary</h2>
      {!config ? (
        <p className="placeholder">Upload en JSON-konfiguration for at se summary.</p>
      ) : (
        <>
          <dl className="summary-grid">
            <dt>Version</dt>
            <dd>{config.version ?? "—"}</dd>
            <dt>Fingerprint</dt>
            <dd><code>{config.fingerprint}</code></dd>
            <dt>Containers</dt>
            <dd>{config.containers.length}</dd>
            <dt>Processors</dt>
            <dd>
              {config.containers.reduce((sum, c) => sum + c.processors.length, 0)}
            </dd>
          </dl>
          {warnings.length ? (
            <div className="warnings">
              <h3>Advarsler</h3>
              <ul>
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="ok">Ingen parse-advarsler.</p>
          )}
        </>
      )}
    </section>
  );
}
