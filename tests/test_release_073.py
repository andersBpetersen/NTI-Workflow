"""Release 0.7.3 version and contract verification tests."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.version import APP_VERSION
from app.main import app

ROOT = Path(__file__).resolve().parent.parent
OPENAPI_CONTRACT = ROOT / "docs" / "openapi-contract.json"
ENV_EXAMPLE = ROOT / ".env.example"

ACTIVE_RUNTIME_DIRS = (ROOT / "app", ROOT / "static")
ACTIVE_DEPLOY_DOCS = (
    ROOT / "DEPLOY.md",
    ROOT / "PUBLISH.md",
    ROOT / "START-DOCKER.md",
    ROOT / ".env.example",
    ROOT / "docker-compose.prod.yml",
)
HISTORICAL_DOC_GLOBS = ("docs/refactor-phase-*", "docs/refactor-history/**")

RELEVANT_OPENAPI_PATHS = {
    "/health",
    "/api/version",
    "/api/upload",
    "/api/export/html",
}


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_app_version_constant() -> None:
    assert APP_VERSION == "0.7.3"


def test_api_version_endpoint(client: TestClient) -> None:
    response = client.get("/api/version")
    assert response.status_code == 200
    assert response.json() == {"version": "0.7.3"}


def test_openapi_info_version(client: TestClient) -> None:
    openapi = client.get("/openapi.json").json()
    assert openapi["info"]["version"] == "0.7.3"


def test_homepage_fetches_version(client: TestClient) -> None:
    html = client.get("/").text
    assert 'id="app-version"' in html
    assert "/api/version" in (ROOT / "static" / "app-shell.js").read_text(encoding="utf-8")
    assert client.get("/api/version").json()["version"] == "0.7.3"


def test_env_example_image_tag() -> None:
    text = ENV_EXAMPLE.read_text(encoding="utf-8")
    assert "tickjf/nti-workflow:0.7.3" in text
    assert "0.6.6" not in text


@pytest.mark.parametrize("doc_path", ACTIVE_DEPLOY_DOCS)
def test_active_deploy_docs_reference_current_version(doc_path: Path) -> None:
    text = doc_path.read_text(encoding="utf-8")
    if doc_path.name == "START-DOCKER.md":
        return
    assert "0.7.3" in text or "NTI_WORKFLOW_IMAGE" in text
    assert "0.6.6" not in text


def test_no_stale_version_in_active_runtime_files() -> None:
    for base in ACTIVE_RUNTIME_DIRS:
        for path in base.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix not in {".py", ".js", ".html", ".json", ".css"}:
                continue
            text = path.read_text(encoding="utf-8")
            assert "0.6.6" not in text, f"0.6.6 found in {path.relative_to(ROOT)}"


def test_historical_docs_may_reference_old_versions() -> None:
    historical = list(ROOT.glob("docs/refactor-phase-*"))
    historical += list((ROOT / "docs" / "refactor-history").rglob("*"))
    assert any("0.6.6" in p.read_text(encoding="utf-8") for p in historical if p.is_file() and p.suffix == ".md")


def test_openapi_contract_paths_unchanged_except_version(client: TestClient) -> None:
    contract = json.loads(OPENAPI_CONTRACT.read_text(encoding="utf-8"))
    live = client.get("/openapi.json").json()

    assert contract["info"]["version"] == "0.7.3"
    assert live["info"]["version"] == "0.7.3"

    for path in RELEVANT_OPENAPI_PATHS:
        assert path in contract["paths"]
        assert path in live["paths"]
        for method in contract["paths"][path]:
            contract_op = contract["paths"][path][method]
            live_op = live["paths"][path][method]
            assert contract_op.get("parameters") == live_op.get("parameters")
            assert contract_op.get("requestBody") == live_op.get("requestBody")
            for status, contract_resp in contract_op.get("responses", {}).items():
                live_resp = live_op["responses"][status]
                assert contract_resp.get("content") == live_resp.get("content")


def test_canonical_openapi_contract_file_matches_live(client: TestClient) -> None:
    contract = json.loads(OPENAPI_CONTRACT.read_text(encoding="utf-8"))
    live = client.get("/openapi.json").json()

    def without_operation_ids(schema: dict) -> dict:
        dumped = json.dumps(schema)
        return json.loads(re.sub(r'"operationId":\s*"[^"]*",?\s*', "", dumped))

    assert without_operation_ids(contract)["paths"] == without_operation_ids(live)["paths"]
    assert contract["components"] == live["components"]
