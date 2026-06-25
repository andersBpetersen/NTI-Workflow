"""FastAPI application for NTI Workflow lifecycle transition visualization."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.core.settings import APP_DESCRIPTION, APP_TITLE, MAX_UPLOAD_BYTES, STATIC_DIR
from app.core.version import APP_VERSION
from app.routes.pages import router as pages_router
from app.routes.system import router as system_router
from app.routes.workflow_api import router as workflow_router

app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
)

app.include_router(pages_router)
app.include_router(system_router)
app.include_router(workflow_router)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

__all__ = ["MAX_UPLOAD_BYTES", "app"]
