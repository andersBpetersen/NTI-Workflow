"""Tests for standalone HTML export."""

import pytest
from fastapi.testclient import TestClient

from app.export_html import (
    build_export_filename,
    build_standalone_html,
    embed_json,
    sanitize_filename_part,
)

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
    assert 'data-i18n="export.exportedLabel"' in html
    assert "window.EXPORTED_WORKFLOW_PAYLOAD" in html
    assert "Basic Release Process" in html
    assert "initWorkflowViewer" in html
    assert "initI18n().then" in html
    assert "window.NTI_TRANSLATIONS" in html
    assert 'id="localeSelect"' in html
    assert 'id="back-home-btn"' not in html
    assert "open-workflow-btn" not in html
    assert "control-row-main" in html
    assert "control-row-options" in html
    assert "permModeSelect" not in html
    assert "Summering" not in html
    assert 'id="showAllow"' in html
    assert "addJobMarker" in html
    assert "markerUnits=\"userSpaceOnUse\"" in html
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
    assert 'id="back-home-btn"' not in response.text


def test_export_html_invalid_payload_returns_400(client: TestClient) -> None:
    response = client.post("/api/export/html", json={"payload": {"meta": {}}})
    assert response.status_code == 400
