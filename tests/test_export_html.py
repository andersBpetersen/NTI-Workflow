"""Tests for standalone HTML export."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.export_html import (
    build_export_filename,
    build_standalone_html,
    embed_json,
    sanitize_filename_part,
)
from app.main import app

SAMPLE_FILE = Path(__file__).resolve().parent.parent / "samples" / "sample-lifecycle.xlsx"


@pytest.fixture(scope="module", autouse=True)
def ensure_sample_file() -> None:
    if not SAMPLE_FILE.exists():
        from scripts.create_sample_excel import main

        main()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_payload(client: TestClient) -> dict:
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
    return response.json()


def test_embed_json_escapes_script_breakout() -> None:
    payload = {"note": "</script><script>alert(1)</script>"}
    embedded = embed_json(payload)
    assert "<\\/script>" in embedded
    assert "</script>" not in embedded


def test_sanitize_filename_part_replaces_invalid_chars() -> None:
    assert sanitize_filename_part('Bad<>:"/\\|?*Name') == "Bad_Name"


def test_build_export_filename_uses_safe_lifecycle_name() -> None:
    filename = build_export_filename("Basic Release Process")
    assert filename.startswith("NTI_Workflow_Basic Release Process_")
    assert filename.endswith(".html")


def test_build_standalone_html_contains_viewer_and_payload(sample_payload: dict) -> None:
    html = build_standalone_html(
        payload=sample_payload,
        source_file_name="sample-lifecycle.xlsx",
        selected_life_cycle="Basic Release Process",
    )

    assert "LifeCycle transition flow" in html
    assert "sample-lifecycle.xlsx" in html
    assert "Eksporteret:" in html
    assert "window.EXPORTED_WORKFLOW_PAYLOAD" in html
    assert "Basic Release Process" in html
    assert "initWorkflowViewer" in html
    assert "Tilbage til forside" not in html
    assert "Lifecycle Compare" not in html
    assert "open-workflow-btn" not in html
    assert "control-row-main" in html
    assert "control-row-options" in html
    assert "permModeSelect" not in html
    assert "Summering" not in html
    assert 'id="excel-drop-zone"' not in html
    assert "splitCircleStateLabel" in html


def test_export_html_endpoint_returns_download(client: TestClient, sample_payload: dict) -> None:
    response = client.post(
        "/api/export/html",
        json={
            "payload": sample_payload,
            "sourceFileName": "sample-lifecycle.xlsx",
            "selectedLifeCycle": "Basic Release Process",
        },
    )

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert ".html" in response.headers["content-disposition"].lower()
    assert "LifeCycle transition flow" in response.text
    assert "window.EXPORTED_WORKFLOW_PAYLOAD" in response.text
    assert "Tilbage til forside" not in response.text
    assert "Lifecycle Compare" not in response.text


def test_export_html_invalid_payload_returns_400(client: TestClient) -> None:
    response = client.post("/api/export/html", json={"payload": {"meta": {}}})
    assert response.status_code == 400
