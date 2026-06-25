"""Phase 6 cleanup verification tests."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
OPENAPI_CONTRACT = ROOT / "docs" / "openapi-contract.json"

LEGACY_FRONTEND = [
    STATIC / "app.js",
    STATIC / "vault-config" / "vault-config.js",
]
LEGACY_SHIMS = [
    ROOT / "app" / "parser.py",
    ROOT / "app" / "export_html.py",
]

ACTIVE_PAGES = [
    STATIC / "index.html",
    STATIC / "workflow" / "index.html",
    STATIC / "vault-config" / "index.html",
]

REQUIRED_STATIC = [
    "app-shell.js",
    "app-shell.css",
    "i18n.js",
    "viewer.js",
    "viewer.css",
    "workflow/workflow-controller.js",
    "shared/utils/html.js",
    "shared/utils/files.js",
    "shared/utils/dom.js",
    "shared/ui/tokens.css",
]

DOCKER_FILES = [
    ROOT / "Dockerfile",
    ROOT / "docker-compose.yml",
    ROOT / "docker-compose.prod.yml",
    ROOT / ".dockerignore",
    ROOT / ".env.example",
]


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_legacy_frontend_files_removed() -> None:
    for path in LEGACY_FRONTEND:
        assert not path.exists(), f"Legacy file still present: {path}"


def test_compatibility_shims_removed() -> None:
    for path in LEGACY_SHIMS:
        assert not path.exists(), f"Compatibility shim still present: {path}"


def test_active_pages_do_not_reference_legacy_js() -> None:
    for page in ACTIVE_PAGES:
        html = page.read_text(encoding="utf-8")
        assert "app.js" not in html
        assert "vault-config.js" not in html


def test_no_imports_of_removed_shims() -> None:
    forbidden = ("from app.parser", "from app.export_html", "import app.parser", "import app.export_html")
    for py_file in (ROOT / "app").rglob("*.py"):
        text = py_file.read_text(encoding="utf-8")
        for token in forbidden:
            assert token not in text, f"{token} found in {py_file}"
    for py_file in (ROOT / "tests").glob("*.py"):
        if py_file.name == "test_cleanup_phase6.py":
            continue
        text = py_file.read_text(encoding="utf-8")
        for token in forbidden:
            assert token not in text, f"{token} found in {py_file}"


@pytest.mark.parametrize("relative_path", REQUIRED_STATIC)
def test_required_static_assets_return_200(client: TestClient, relative_path: str) -> None:
    response = client.get(f"/static/{relative_path}")
    assert response.status_code == 200


def test_openapi_matches_contract(client: TestClient) -> None:
    contract = json.loads(OPENAPI_CONTRACT.read_text(encoding="utf-8"))
    live = client.get("/openapi.json").json()
    for path, methods in contract["paths"].items():
        if path.startswith("/api/") or path == "/health":
            assert path in live["paths"]
            for method, op in methods.items():
                assert method in live["paths"][path]
                assert op.get("requestBody") == live["paths"][path][method].get("requestBody")
                for status, resp in op.get("responses", {}).items():
                    assert resp.get("content") == live["paths"][path][method]["responses"][status].get("content")


def test_docker_deployment_files_exist() -> None:
    for path in DOCKER_FILES:
        assert path.is_file(), path.name
