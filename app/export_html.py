"""Build standalone HTML export of the Workflow Viewer."""

from __future__ import annotations

import html
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

_VIEWER_BODY = """\
<header class="viewer-header">
  <h1>{page_title}</h1>
  <p class="export-meta"><b>Kilde:</b> {source_file} &nbsp;|&nbsp; <b>Eksporteret:</b> {export_date}</p>
  <p>State permissions kan vises for den valgte rolle.</p>
  <div class="legend">
    <span class="green"><b>Grøn</b> = Allow</span>
    <span class="red"><b>Rød stiplet</b> = Deny</span>
    <span class="gray"><b>Grå</b> = mangler info / ikke specificeret</span>
    <span class="jobLegend"><b>Orange tekst</b> = Custom JobTypes</span>
  </div>
</header>

<main class="viewer-main">
  <section class="controls">
    <div class="control-row control-row-main">
      <label>
        <b>LifeCycleDefinition</b>
        <select id="lifeSelect"></select>
      </label>

      <label>
        <b>Fokus-state</b>
        <select id="stateSelect"></select>
      </label>

      <label>
        <b>Visning</b>
        <select id="directionSelect">
          <option value="all">Alle transitions</option>
          <option value="from">Fra valgt state</option>
          <option value="to">Til valgt state</option>
          <option value="connected">Til/fra valgt state</option>
        </select>
      </label>

      <label>
        <b>Layout</b>
        <select id="layoutModeSelect">
          <option value="auto">Auto</option>
          <option value="normal">Normal</option>
          <option value="dense">Kompakt</option>
          <option value="large">Stor</option>
        </select>
      </label>
    </div>

    <div class="control-row control-row-roles">
      <div class="role-control">
        <b>Rolle</b>
        <div id="roleButtons"></div>
      </div>
    </div>

    <div class="control-row control-row-options">
      <label>
        <input type="checkbox" id="showAllow" checked>
        Vis Allow
      </label>

      <label>
        <input type="checkbox" id="showDeny" checked>
        Vis Deny
      </label>

      <label>
        <input type="checkbox" id="showNone">
        Vis ikke specificeret
      </label>

      <label>
        <input type="checkbox" id="showJobs" checked>
        Vis Custom JobTypes
      </label>

      <label>
        <input type="checkbox" id="showPerms" checked>
        Vis state permissions
      </label>

      <label>
        <input type="checkbox" id="hideUnrelated" checked>
        Skjul irrelevante states
      </label>
    </div>
  </section>

  <section id="selectedSummary"></section>
  {warnings_html}

  <div class="diagram-layout">
    <div class="diagram-column">
      <div class="diagram-toolbar">
        <button type="button" class="zoom-btn" id="zoom-in-btn">Zoom ind</button>
        <button type="button" class="zoom-btn" id="zoom-out-btn">Zoom ud</button>
        <button type="button" class="zoom-btn" id="zoom-reset-btn">Nulstil visning</button>
        <button type="button" class="zoom-btn" id="focus-selected-btn">Vis kun valgt state</button>
      </div>
      <svg id="diagram" viewBox="0 0 1600 1220" role="img" aria-label="LifeCycle transition diagram"></svg>
    </div>
    <aside id="details-panel" class="details-panel">
      <p class="details-placeholder">Klik på en state, transition eller jobmarkering for at se detaljer.</p>
    </aside>
  </div>

  <h2>Overgange for valgt rolle</h2>
  <div class="tableWrap">
    <table>
      <thead>
        <tr>
          <th>Id</th><th>Fra state</th><th>Til state</th><th>Resultat</th>
          <th>Custom JobTypes</th><th>Security</th>
        </tr>
      </thead>
      <tbody id="transitionTable"></tbody>
    </table>
  </div>

  <h2>State permissions – alle detaljer</h2>
  <p class="note">Denne sektion viser alle roller og alle fire permission-typer for den valgte LifeCycleDefinition. <b>?</b> betyder mangler info.</p>
  <div class="tableWrap">
    <table>
      <thead>
        <tr>
          <th>State</th><th>Rolle</th><th>Read</th><th>Write</th><th>Delete</th><th>Download</th>
        </tr>
      </thead>
      <tbody id="permissionTable"></tbody>
    </table>
  </div>
</main>
"""

_EXPORT_EXTRA_CSS = """
.export-meta{font-size:14px;color:var(--muted);margin:0 0 8px}
"""


def _load_static_file(name: str) -> str:
    return (STATIC_DIR / name).read_text(encoding="utf-8")


def embed_json(data: Any) -> str:
    """Serialize JSON safely for embedding in a <script> tag."""
    text = json.dumps(data, ensure_ascii=False)
    return text.replace("</", "<\\/")


def sanitize_filename_part(name: str) -> str:
    cleaned = re.sub(r'[<>:"/\\|?*]+', "_", name).strip(" ._")
    return cleaned or "Workflow"


def build_export_filename(
    lifecycle_name: str | None = None,
    exported_at: datetime | None = None,
) -> str:
    when = exported_at or datetime.now()
    stamp = when.strftime("%Y%m%d_%H%M")
    life_part = sanitize_filename_part(lifecycle_name or "Workflow")
    return f"NTI_Workflow_{life_part}_{stamp}.html"


def _render_warnings_html(warnings: list[str]) -> str:
    if not warnings:
        return '<section id="importWarnings" class="warning-box hidden"></section>'
    items = "".join(f"<li>{html.escape(w)}</li>" for w in warnings)
    return (
        '<section id="importWarnings" class="warning-box">'
        "<h3>Advarsler fra import</h3><ul>"
        f"{items}</ul></section>"
    )


def build_standalone_html(
    payload: dict[str, Any],
    source_file_name: str | None = None,
    title: str | None = None,
    selected_life_cycle: str | None = None,
    viewer_context: dict[str, Any] | None = None,
    exported_at: datetime | None = None,
) -> str:
    """Build a self-contained HTML page with inlined CSS, JS and workflow data."""
    when = exported_at or datetime.now()
    page_title = title or "LifeCycle transition flow"
    source_file = source_file_name or "Ukendt fil"
    export_date = when.strftime("%Y-%m-%d %H:%M")

    warnings = []
    meta = payload.get("meta")
    if isinstance(meta, dict):
        raw_warnings = meta.get("warnings")
        if isinstance(raw_warnings, list):
            warnings = [str(w) for w in raw_warnings]

    context = dict(viewer_context or {})
    if selected_life_cycle and not context.get("selectedLifeCycle"):
        context["selectedLifeCycle"] = selected_life_cycle

    viewer_css = _load_static_file("viewer.css")
    viewer_js = _load_static_file("viewer.js")
    payload_json = embed_json(payload)
    context_json = embed_json(context) if context else "null"

    body = _VIEWER_BODY.format(
        page_title=html.escape(page_title),
        source_file=html.escape(source_file),
        export_date=html.escape(export_date),
        warnings_html=_render_warnings_html(warnings),
    )

    document_title = html.escape(f"NTI Workflow – {page_title}")

    return f"""<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{document_title}</title>
  <style>
{viewer_css}
{_EXPORT_EXTRA_CSS}
  </style>
</head>
<body>
{body}
  <script>
{viewer_js}
  </script>
  <script>
window.EXPORTED_WORKFLOW_PAYLOAD = {payload_json};
window.EXPORTED_VIEWER_CONTEXT = {context_json};
initWorkflowViewer(window.EXPORTED_WORKFLOW_PAYLOAD, window.EXPORTED_VIEWER_CONTEXT || undefined);
  </script>
</body>
</html>
"""
