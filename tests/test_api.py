"""Tests for FastAPI upload endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.main import MAX_UPLOAD_BYTES

from tests.conftest import SAMPLE_FILE
def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_app_version(client: TestClient) -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert response.json()["info"]["version"] == "0.7.1"


def test_upload_sample_excel(client: TestClient) -> None:
    with SAMPLE_FILE.open("rb") as handle:
        response = client.post(
            "/api/upload",
            files={"file": ("sample-lifecycle.xlsx", handle, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["meta"]["transitionCount"] == 5
    assert len(payload["nodes"]) == 4
    assert len(payload["edges"]) == 5


def test_upload_missing_sheet_returns_422(client: TestClient) -> None:
    from io import BytesIO

    from openpyxl import Workbook

    workbook = Workbook()
    workbook.active.title = "WrongSheet"
    buffer = BytesIO()
    workbook.save(buffer)

    response = client.post(
        "/api/upload",
        files={"file": ("wrong.xlsx", buffer.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Excel-filen mangler arket LifeCycleDefinitionTransitions."


def test_upload_wrong_extension_returns_400(client: TestClient) -> None:
    response = client.post(
        "/api/upload",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )

    assert response.status_code == 400
    detail = response.json()["detail"]
    if isinstance(detail, dict):
        assert detail.get("code") == "invalid_file_type"
    else:
        assert ".xlsx" in detail


def test_upload_empty_file_returns_400(client: TestClient) -> None:
    response = client.post(
        "/api/upload",
        files={"file": ("empty.xlsx", b"", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Filen er tom. Vælg en gyldig Vault Excel-eksport."


def test_upload_invalid_xlsx_returns_422(client: TestClient) -> None:
    response = client.post(
        "/api/upload",
        files={"file": ("fake.xlsx", b"not excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 422
    assert "Excel-fil" in response.json()["detail"]


def test_upload_too_large_returns_400(client: TestClient) -> None:
    oversized = b"x" * (MAX_UPLOAD_BYTES + 1)
    response = client.post(
        "/api/upload",
        files={"file": ("big.xlsx", oversized, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 400
    assert "for stor" in response.json()["detail"].lower()
