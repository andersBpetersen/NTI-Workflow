"""HTML page routes for the app shell and module viewers."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.core.settings import NO_CACHE_HEADERS, STATIC_DIR

router = APIRouter()


@router.get("/")
async def index() -> FileResponse:
    return FileResponse(
        STATIC_DIR / "index.html",
        headers=NO_CACHE_HEADERS,
    )


@router.get("/workflow")
@router.get("/workflow/")
async def workflow_viewer() -> FileResponse:
    return FileResponse(
        STATIC_DIR / "workflow" / "index.html",
        headers=NO_CACHE_HEADERS,
    )


@router.get("/vault-config/")
async def vault_config_viewer() -> FileResponse:
    return FileResponse(
        STATIC_DIR / "vault-config" / "index.html",
        headers=NO_CACHE_HEADERS,
    )
