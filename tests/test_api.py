"""Tests for FastAPI upload endpoint."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

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


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


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
    assert "LifeCycleDefinitionTransitions" in response.json()["detail"]
