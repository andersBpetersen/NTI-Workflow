"""System health and version endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.version import APP_VERSION

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/api/version")
async def api_version() -> dict[str, str]:
    return {"version": APP_VERSION}
