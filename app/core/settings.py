"""Application-wide backend settings and paths."""

from __future__ import annotations

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STATIC_DIR = BASE_DIR / "static"

APP_TITLE = "NTI Workflow"
APP_DESCRIPTION = "Visualiser Vault lifecycle transitions fra Excel-eksport."
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
ALLOWED_UPLOAD_EXTENSIONS = (".xlsx", ".xlsm")
NO_CACHE_HEADERS = {"Cache-Control": "no-cache, no-store, must-revalidate"}
