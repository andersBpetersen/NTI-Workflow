import type { SimulationDiff, SimulationResult } from "../types/simulation";

type SimulationResultViewProps = {
  result: SimulationResult | null;
  diff: SimulationDiff | null;
};

export function SimulationResultView({ result, diff }: SimulationResultViewProps) {
  return (
    <section className="panel">
      <h2>Simulation result</h2>
      {!result ? (
        <p className="placeholder">Kør simulering når config og scenarie er klar.</p>
      ) : (
        <>
          <ul className="messages">
            {result.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <h3>Queued jobs</h3>
          {result.queuedJobs.length ? (
            <ul>
              {result.queuedJobs.map((job) => (
                <li key={job.id}>
                  <code>{job.id}</code> — {job.jobType}
                </li>
              ))}
            </ul>
          ) : (
            <p className="placeholder">Ingen jobs i kø.</p>
          )}
          <h3>Generated files</h3>
          {result.generatedFiles.length ? (
            <ul>
              {result.generatedFiles.map((file) => (
                <li key={`${file.sourceJobId}-${file.path}-${file.name}`}>
                  {file.path}/{file.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="placeholder">Ingen genererede filer.</p>
          )}
        </>
      )}

      <h3>Diff / baseline</h3>
      {!diff ? (
        <p className="placeholder">Diff vises når baseline og ny simulering findes.</p>
      ) : (
        <>
          <p className="meta">
            Baseline: <code>{diff.baselineFingerprint}</code> → Compare:{" "}
            <code>{diff.compareFingerprint}</code>
          </p>
          <p>Tilføjet: {diff.addedJobs.length} · Fjernet: {diff.removedJobs.length}</p>
        </>
      )}
    </section>
  );
}
