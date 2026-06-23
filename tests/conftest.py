"""Shared pytest fixtures."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

SAMPLE_FILE = Path(__file__).resolve().parent.parent / "samples" / "sample-lifecycle.xlsx"


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
