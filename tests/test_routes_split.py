"""Tests for app-shell/workflow split routes."""

import pytest
from fastapi.testclient import TestClient

from app.core.version import APP_VERSION
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_homepage_route_returns_200(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200


def test_workflow_route_returns_200(client: TestClient) -> None:
    response = client.get("/workflow/")
    assert response.status_code == 200


def test_workflow_route_without_slash_returns_200(client: TestClient) -> None:
    response = client.get("/workflow")
    assert response.status_code == 200


def test_vault_config_route_returns_200(client: TestClient) -> None:
    response = client.get("/vault-config/")
    assert response.status_code == 200


def test_homepage_links_to_workflow(client: TestClient) -> None:
    response = client.get("/")
    assert 'href="/workflow/' in response.text


def test_homepage_does_not_contain_workflow_upload_markup(client: TestClient) -> None:
    response = client.get("/")
    assert 'id="file-input"' not in response.text
    assert 'id="excel-drop-zone"' not in response.text


def test_workflow_page_contains_upload_markup(client: TestClient) -> None:
    response = client.get("/workflow/")
    assert 'id="file-input"' in response.text
    assert 'id="excel-drop-zone"' in response.text


def test_workflow_page_loads_viewer_script(client: TestClient) -> None:
    response = client.get("/workflow/")
    assert "/static/viewer.js" in response.text


def test_homepage_does_not_load_viewer_script(client: TestClient) -> None:
    response = client.get("/")
    assert "/static/viewer.js" not in response.text


def test_version_endpoint_returns_central_version(client: TestClient) -> None:
    response = client.get("/api/version")
    assert response.status_code == 200
    assert response.json() == {"version": APP_VERSION}
