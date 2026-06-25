"""Workflow upload and HTML export API routes."""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.models.workflow import ExportHtmlRequest
from app.services.workflow.export_service import (
    InvalidExportPayloadError,
    export_workflow_html,
)
from app.services.workflow.upload import (
    UploadRejected,
    WorkbookParseRejected,
    parse_uploaded_workbook,
)

router = APIRouter()


@router.post("/api/upload")
async def upload_excel(file: UploadFile = File(...)) -> dict:
    try:
        return await parse_uploaded_workbook(file)
    except UploadRejected as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except WorkbookParseRejected as exc:
        raise HTTPException(status_code=422, detail=exc.detail) from exc


@router.post("/api/export/html")
async def export_html(request: ExportHtmlRequest) -> Response:
    try:
        html_content, filename = export_workflow_html(request)
    except InvalidExportPayloadError as exc:
        raise HTTPException(status_code=400, detail=exc.detail) from exc

    return Response(
        content=html_content.encode("utf-8"),
        media_type="text/html; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
