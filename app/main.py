"""FastAPI application for NTI Workflow lifecycle transition visualization."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.parser import TransitionParseError, parse_result_to_dict, parse_transitions_excel

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

MAX_UPLOAD_BYTES = 25 * 1024 * 1024

app = FastAPI(
    title="NTI Workflow",
    description="Visualiser Vault lifecycle transitions fra Excel-eksport.",
    version="0.1.0",
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_excel(file: UploadFile = File(...)) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Ingen fil modtaget.")

    if not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(
            status_code=400,
            detail="Kun Excel-filer (.xlsx, .xlsm) understøttes.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Filen er tom.")

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
