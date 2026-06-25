"""HTML export orchestration for Workflow API."""

from __future__ import annotations

from datetime import datetime

from app.models.workflow import ExportHtmlRequest
from app.services.workflow.export_html import build_export_filename, build_standalone_html


class InvalidExportPayloadError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


def export_workflow_html(request: ExportHtmlRequest) -> tuple[str, str]:
    """Return UTF-8 HTML content and attachment filename."""
    payload = request.payload
    if not isinstance(payload.get("edges"), list):
        raise InvalidExportPayloadError("Ugyldig workflow-payload.")

    exported_at = datetime.now()
    lifecycle_name = request.selectedLifeCycle
    if not lifecycle_name:
        definitions = payload.get("lifecycleDefinitions")
        if isinstance(definitions, list) and definitions:
            lifecycle_name = str(definitions[0])

    viewer_context = (
        request.viewerContext.model_dump(exclude_none=True)
        if request.viewerContext
        else None
    )

    filename = build_export_filename(lifecycle_name, exported_at)
    html_content = build_standalone_html(
        payload=payload,
        source_file_name=request.sourceFileName,
        title=request.title,
        selected_life_cycle=request.selectedLifeCycle,
        viewer_context=viewer_context,
        exported_at=exported_at,
    )
    return html_content, filename
