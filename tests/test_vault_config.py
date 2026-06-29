"""Tests for Vault Config Viewer static route."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_vault_config_page_is_available(client: TestClient) -> None:
    response = client.get("/vault-config/")
    assert response.status_code == 200
    assert "NTI for Vault Job Viewer" in response.text
    assert 'data-i18n="vault.loadConfig"' in response.text
    assert 'accept=".json' in response.text
    assert "id=\"topbar\"" in response.text
    assert "id=\"splitView\"" in response.text
    assert "id=\"detailTabBar\"" in response.text


def test_homepage_links_to_vault_config(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "NTI for Vault Config" in response.text
    assert 'href="/vault-config/"' in response.text


def test_vault_config_standalone_contains_required_logic(client: TestClient) -> None:
    page = client.get("/vault-config/")
    assert page.status_code == 200
    assert "function readFile(file)" in page.text
    assert "function tabProperties(p)" in page.text
    assert "FromPropertyDefinition ?? c.SourcePropertyDefinition" in page.text
    assert "s.PropertyValue ?? s.Value ?? ''" in page.text


def test_fixture_vault_job_config_has_copy_properties_fields() -> None:
    import json
    from pathlib import Path

    payload = json.loads(
        Path(__file__).resolve().parent.parent.joinpath(
            "samples", "fixture-vault-job-config.json"
        ).read_text(encoding="utf-8"),
    )
    copy_props = payload["JobProcessorContainers"][0]["JobProcessors"][0]["CopyProperties"][0]
    assert copy_props["FromPropertyDefinition"] == "Created By"
    assert copy_props["ToPropertyDefinition"] == "Release By"
