"""Build standalone HTML export of the Workflow Viewer."""

from __future__ import annotations

import html
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from app.i18n_config import normalize_locale

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
I18N_DIR = STATIC_DIR / "i18n"

_VIEWER_BODY = """\
<header class="app-topbar">
  <span class="app-brand" data-i18n="home.title">NTI Workflow</span>
  <label class="locale-control">
    <span data-i18n="language.label">Language</span>
    <select id="localeSelect" aria-label="Language">
      <option value="da-DK">Danmark</option>
      <option value="pt-BR">Brasil</option>
      <option value="de-DE">Deutschland</option>
      <option value="fr-FR">France</option>
      <option value="es-ES">España</option>
      <option value="en-IE">Ireland</option>
      <option value="is-IS">Ísland</option>
      <option value="it-IT">Italia</option>
      <option value="nl-NL">Nederland</option>
      <option value="nb-NO">Norge</option>
      <option value="fi-FI">Suomi</option>
      <option value="sv-SE">Sverige</option>
      <option value="en-GB">UK</option>
    </select>
  </label>
</header>

<header class="viewer-header">
  <h1 data-i18n="viewer.pageTitle">{page_title}</h1>
  <p class="export-meta"><b data-i18n="export.sourceLabel">Source</b>: {source_file} &nbsp;|&nbsp; <b data-i18n="export.exportedLabel">Exported</b>: {export_date}</p>
  <p data-i18n="viewer.permissionsIntro">State permissions can be shown for the selected role.</p>
  <div class="legend">
    <span class="green"><b data-i18n="legend.allowGreen">Green</b> <span data-i18n="common.equals">=</span> <span data-i18n="legend.allow">Allow</span></span>
    <span class="red"><b data-i18n="legend.denyRed">Red dashed</b> <span data-i18n="common.equals">=</span> <span data-i18n="legend.deny">Deny</span></span>
    <span class="gray"><b data-i18n="legend.unspecifiedGray">Gray</b> <span data-i18n="common.equals">=</span> <span data-i18n="legend.unspecified">missing info / unspecified</span></span>
    <span class="jobLegend"><b data-i18n="legend.customJobsOrange">Orange marker</b> <span data-i18n="common.equals">=</span> <span data-i18n="legend.customJobs">Custom JobTypes</span></span>
  </div>
</header>

<main class="viewer-main">
  <section class="controls">
    <div class="control-row control-row-main">
      <label>
        <b data-i18n="controls.lifecycle">LifeCycleDefinition</b>
        <select id="lifeSelect"></select>
      </label>

      <label>
        <b data-i18n="controls.focusState">Focus state</b>
        <select id="stateSelect"></select>
      </label>

      <label>
        <b data-i18n="controls.view">View</b>
        <select id="directionSelect">
          <option value="all" data-i18n="direction.all">All transitions</option>
          <option value="from" data-i18n="direction.from">From selected state</option>
          <option value="to" data-i18n="direction.to">To selected state</option>
          <option value="connected" data-i18n="direction.connected">To/from selected state</option>
        </select>
      </label>

      <label>
        <b data-i18n="controls.layout">Layout</b>
        <select id="layoutModeSelect">
          <option value="auto" data-i18n="layout.auto">Auto</option>
          <option value="normal" data-i18n="layout.normal">Normal</option>
          <option value="dense" data-i18n="layout.compact">Compact</option>
          <option value="large" data-i18n="layout.large">Large</option>
        </select>
      </label>
    </div>

    <div class="control-row control-row-roles">
      <div class="role-control">
        <b data-i18n="controls.role">Role</b>
        <div id="roleButtons"></div>
      </div>
    </div>

    <div class="control-row control-row-options">
      <label>
        <input type="checkbox" id="showAllow" checked>
        <span data-i18n="filters.showAllow">Show Allow</span>
      </label>

      <label>
        <input type="checkbox" id="showDeny" checked>
        <span data-i18n="filters.showDeny">Show Deny</span>
      </label>

      <label>
        <input type="checkbox" id="showNone">
        <span data-i18n="filters.showUnspecified">Show unspecified</span>
      </label>

      <label>
        <input type="checkbox" id="showJobs" checked>
        <span data-i18n="filters.showCustomJobs">Show Custom JobTypes</span>
      </label>

      <label>
        <input type="checkbox" id="showPerms" checked>
        <span data-i18n="filters.showStatePermissions">Show state permissions</span>
      </label>

      <label>
        <input type="checkbox" id="hideUnrelated" checked>
        <span data-i18n="filters.hideUnrelatedStates">Hide unrelated states</span>
      </label>
    </div>
  </section>

  <section id="selectedSummary"></section>
  {warnings_html}

  <div class="diagram-layout">
    <div class="diagram-column">
      <div class="diagram-toolbar">
        <button type="button" class="zoom-btn" id="zoom-in-btn" data-i18n="toolbar.zoomIn">Zoom in</button>
        <button type="button" class="zoom-btn" id="zoom-out-btn" data-i18n="toolbar.zoomOut">Zoom out</button>
        <button type="button" class="zoom-btn" id="zoom-reset-btn" data-i18n="toolbar.zoomReset">Reset view</button>
        <button type="button" class="zoom-btn" id="focus-selected-btn" data-i18n="toolbar.focusSelected">Show selected state only</button>
      </div>
      <svg id="diagram" viewBox="0 0 1600 1220" role="img" data-i18n-aria-label="viewer.diagramAria" aria-label="LifeCycle transition diagram"></svg>
    </div>
    <aside id="details-panel" class="details-panel">
      <p class="details-placeholder" data-i18n="details.placeholder">Click a state, transition, or job marker to view details.</p>
    </aside>
  </div>

  <h2 data-i18n="table.transitionsTitle">Transitions for selected role</h2>
  <div class="tableWrap">
    <table>
      <thead>
        <tr>
          <th data-i18n="table.id">Id</th>
          <th data-i18n="table.fromState">From state</th>
          <th data-i18n="table.toState">To state</th>
          <th data-i18n="table.result">Result</th>
          <th data-i18n="table.customJobs">Custom JobTypes</th>
          <th data-i18n="table.security">Security</th>
        </tr>
      </thead>
      <tbody id="transitionTable"></tbody>
    </table>
  </div>

  <h2 data-i18n="table.permissionsTitle">State permissions – full details</h2>
  <p class="note">
    <span data-i18n="table.permissionsNote">This section shows all roles and all four permission types for the selected LifeCycleDefinition.</span>
    <b>?</b> <span data-i18n="table.permissionsMissing">means missing info.</span>
  </p>
  <div class="tableWrap">
    <table>
      <thead>
        <tr>
          <th data-i18n="table.state">State</th>
          <th data-i18n="table.role">Role</th>
          <th data-i18n="permission.read">Read</th>
          <th data-i18n="permission.write">Write</th>
          <th data-i18n="permission.delete">Delete</th>
          <th data-i18n="permission.download">Download</th>
        </tr>
      </thead>
      <tbody id="permissionTable"></tbody>
    </table>
  </div>
</main>
"""

_EXPORT_EXTRA_CSS = """
.export-meta{font-size:14px;color:var(--muted);margin:0 0 8px}
.app-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 32px;background:#fff;border-bottom:1px solid #ddd;flex-wrap:wrap}
.app-brand{font-weight:700;font-size:18px}
.locale-control{display:flex;align-items:center;gap:8px}
.locale-control select{min-width:150px;padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff}
"""


def _load_static_file(name: str) -> str:
    return (STATIC_DIR / name).read_text(encoding="utf-8")


def load_all_translations() -> dict[str, Any]:
    translations: dict[str, Any] = {}
    for path in sorted(I18N_DIR.glob("*.json")):
        translations[path.stem] = json.loads(path.read_text(encoding="utf-8"))
    return translations


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
        '<h3 data-i18n="upload.warningsTitle">Import warnings</h3><ul>'
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
    source_file = source_file_name or "Unknown file"
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
    if context.get("locale"):
        context["locale"] = normalize_locale(str(context["locale"]))

    viewer_css = _load_static_file("viewer.css")
    i18n_js = _load_static_file("i18n.js")
    viewer_js = _load_static_file("viewer.js")
    translations = load_all_translations()
    payload_json = embed_json(payload)
    context_json = embed_json(context) if context else "null"
    translations_json = embed_json(translations)

    body = _VIEWER_BODY.format(
        page_title=html.escape(page_title),
        source_file=html.escape(source_file),
        export_date=html.escape(export_date),
        warnings_html=_render_warnings_html(warnings),
    )

    document_title = html.escape(f"NTI Workflow – {page_title}")

    return f"""<!DOCTYPE html>
<html lang="en">
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
window.NTI_TRANSLATIONS = {translations_json};
{i18n_js}
  </script>
  <script>
{viewer_js}
  </script>
  <script>
window.EXPORTED_WORKFLOW_PAYLOAD = {payload_json};
window.EXPORTED_VIEWER_CONTEXT = {context_json};
initI18n().then(function () {{
  bindLocaleSelect();
  initWorkflowViewer(window.EXPORTED_WORKFLOW_PAYLOAD, window.EXPORTED_VIEWER_CONTEXT || undefined);
}});
  </script>
</body>
</html>
"""
