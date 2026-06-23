"""FastAPI application for NTI Workflow lifecycle transition visualization."""

from __future__ import annotations

from pathlib import Path

from datetime import datetime

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator

from app.export_html import build_export_filename, build_standalone_html
from app.i18n_config import normalize_locale
from app.upload_validation import is_supported_excel_filename
from app.parser import TransitionParseError, parse_result_to_dict, parse_transitions_excel

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

MAX_UPLOAD_BYTES = 25 * 1024 * 1024

app = FastAPI(
    title="NTI Workflow",
    description="Visualiser Vault lifecycle transitions fra Excel-eksport.",
    version="0.7.1",
)

@app.get("/")
async def index() -> FileResponse:
    return FileResponse(
        STATIC_DIR / "index.html",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
    )


class ViewerContext(BaseModel):
    selectedLifeCycle: str | None = None
    selectedRole: str | None = None
    selectedState: str | None = None
    selectedDirection: str | None = None
    showAllow: bool | None = None
    showDeny: bool | None = None
    showNone: bool | None = None
    showJobs: bool | None = None
    showPerms: bool | None = None
    permissionMode: str | None = None
    hideUnrelated: bool | None = None
    layoutMode: str | None = None
    locale: str | None = None

    @field_validator("locale", mode="before")
    @classmethod
    def validate_locale(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return normalize_locale(str(value))


class ExportHtmlRequest(BaseModel):
    payload: dict
    sourceFileName: str | None = None
    selectedLifeCycle: str | None = None
    title: str | None = None
    viewerContext: ViewerContext | None = None


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_excel(file: UploadFile = File(...)) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Ingen fil modtaget.")

    if not is_supported_excel_filename(file.filename):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "invalid_file_type",
                "message": "Only .xlsx files are supported.",
            },
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=400,
            detail="Filen er tom. Vælg en gyldig Vault Excel-eksport.",
        )

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Filen er for stor. Maksimal filstørrelse er 25 MB.",
        )

    try:
        result = parse_transitions_excel(content)
    except TransitionParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return parse_result_to_dict(result)


@app.post("/api/export/html")
async def export_html(request: ExportHtmlRequest) -> Response:
    payload = request.payload
    if not isinstance(payload.get("edges"), list):
        raise HTTPException(status_code=400, detail="Ugyldig workflow-payload.")

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

    return Response(
        content=html_content.encode("utf-8"),
        media_type="text/html; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
