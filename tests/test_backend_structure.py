"""Backend module structure and API contract smoke tests (phase 5)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.parser import parse_result_to_dict, parse_transitions_excel

SAMPLE_FILE = Path(__file__).resolve().parent.parent / "samples" / "sample-lifecycle.xlsx"
OPENAPI_BEFORE = Path(__file__).resolve().parent.parent / "docs" / "openapi-before-phase-5.json"
OPENAPI_AFTER = Path(__file__).resolve().parent.parent / "docs" / "openapi-after-phase-5.json"

RELEVANT_OPENAPI_PATHS = {
    "/health",
    "/api/version",
    "/api/upload",
    "/api/export/html",
}


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_app_importable() -> None:
    from app.main import app as imported_app

    assert imported_app is not None


def test_home_returns_200(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")


def test_workflow_page_returns_200(client: TestClient) -> None:
    response = client.get("/workflow/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")


def test_vault_config_page_returns_200(client: TestClient) -> None:
    response = client.get("/vault-config/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")


def test_health_payload_unchanged(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_version_payload_unchanged(client: TestClient) -> None:
    response = client.get("/api/version")
    assert response.status_code == 200
    assert "version" in response.json()


def test_upload_endpoint_method_and_url(client: TestClient) -> None:
    openapi = client.get("/openapi.json").json()
    upload = openapi["paths"]["/api/upload"]["post"]
    assert upload is not None


def test_export_endpoint_method_and_url(client: TestClient) -> None:
    openapi = client.get("/openapi.json").json()
    export = openapi["paths"]["/api/export/html"]["post"]
    assert export is not None


def test_upload_fixture_response_structure(client: TestClient) -> None:
    with SAMPLE_FILE.open("rb") as handle:
        response = client.post(
            "/api/upload",
            files={
                "file": (
                    "sample-lifecycle.xlsx",
                    handle,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["meta"]["transitionCount"] == 5


def test_parser_output_structure_unchanged() -> None:
    data = SAMPLE_FILE.read_bytes()
    result = parse_transitions_excel(data)
    payload = parse_result_to_dict(result)
    assert payload["meta"]["transitionCount"] == 5
    assert len(payload["nodes"]) == 4
    assert len(payload["edges"]) == 5
    assert "lifecycleDefinitions" in payload


def test_openapi_relevant_paths_match_baseline(client: TestClient) -> None:
    if not OPENAPI_BEFORE.exists():
        pytest.skip("openapi-before-phase-5.json not found")

    before = json.loads(OPENAPI_BEFORE.read_text(encoding="utf-8"))
    after = client.get("/openapi.json").json()

    for path in RELEVANT_OPENAPI_PATHS:
        assert path in before["paths"]
        assert path in after["paths"]
        for method in before["paths"][path]:
            assert method in after["paths"][path]
            before_op = before["paths"][path][method]
            after_op = after["paths"][path][method]
            assert before_op.get("parameters") == after_op.get("parameters")
            assert before_op.get("requestBody") == after_op.get("requestBody")
            for status, before_resp in before_op.get("responses", {}).items():
                after_resp = after_op.get("responses", {}).get(status)
                assert after_resp is not None
                assert before_resp.get("content") == after_resp.get("content")


def test_openapi_after_snapshot_saved(client: TestClient) -> None:
    """Persist post-refactor OpenAPI for documentation comparison."""
    if OPENAPI_AFTER.exists():
        return
    OPENAPI_AFTER.write_text(
        json.dumps(client.get("/openapi.json").json(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
