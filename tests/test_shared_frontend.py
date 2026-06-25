"""Shared frontend assets and wiring tests."""

from __future__ import annotations

import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app


ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"

SHARED_CSS = [
    "shared/ui/tokens.css",
    "shared/ui/buttons.css",
    "shared/ui/forms.css",
    "shared/ui/feedback.css",
]
SHARED_JS = [
    "shared/utils/html.js",
    "shared/utils/files.js",
    "shared/utils/dom.js",
]


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _read_static(relative_path: str) -> str:
    return (STATIC / relative_path).read_text(encoding="utf-8")


def test_shared_css_files_exist() -> None:
    for relative_path in SHARED_CSS:
        assert (STATIC / relative_path).is_file(), relative_path


def test_shared_js_files_exist() -> None:
    for relative_path in SHARED_JS:
        assert (STATIC / relative_path).is_file(), relative_path


@pytest.mark.parametrize("relative_path", SHARED_CSS + SHARED_JS)
def test_shared_assets_are_served_without_404(client: TestClient, relative_path: str) -> None:
    response = client.get(f"/static/{relative_path}")
    assert response.status_code == 200


def test_homepage_loads_shared_assets(client: TestClient) -> None:
    html = client.get("/").text
    for relative_path in SHARED_CSS:
        assert f"/static/{relative_path}" in html


def test_workflow_page_loads_shared_assets(client: TestClient) -> None:
    html = client.get("/workflow/").text
    for relative_path in SHARED_CSS + SHARED_JS:
        assert f"/static/{relative_path}" in html


def test_vault_config_page_loads_shared_assets(client: TestClient) -> None:
    html = client.get("/vault-config/").text
    assert "/static/shared/utils/html.js" in html
    assert "/static/shared/utils/files.js" in html
    assert "window.NTIShared.files.bindDropZone" in html


def test_routes_still_work(client: TestClient) -> None:
    assert client.get("/").status_code == 200
    assert client.get("/workflow/").status_code == 200
    assert client.get("/vault-config/").status_code == 200


def test_workflow_page_still_contains_upload_markup(client: TestClient) -> None:
    html = client.get("/workflow/").text
    assert 'id="file-input"' in html
    assert 'accept=".xlsx' in html
    assert 'class="excel-drop-zone nti-drop-zone"' in html


def test_vault_config_page_still_contains_json_accept_and_readfile(client: TestClient) -> None:
    html = client.get("/vault-config/").text
    assert 'accept=".json' in html
    assert "function readFile(file)" in html
    assert 'hasExtension(file, [".json"])' in html


def test_workflow_uses_shared_file_validation_helpers() -> None:
    controller = _read_static("workflow/workflow-controller.js")
    assert "NTIShared.files.hasExtension" in controller
    assert 'EXCEL_EXTENSIONS = [".xlsx"]' in controller
    assert "NTIShared.files.validateSize" in controller


def test_vault_config_uses_shared_escape_and_dropzone_helpers() -> None:
    vault_html = _read_static("vault-config/index.html")
    assert "NTIShared.html.escape" in vault_html
    assert "NTIShared.files.bindDropZone" in vault_html


def test_html_escape_contract_matches_shared_implementation() -> None:
    html_js = _read_static("shared/utils/html.js")

    def escape(value: object) -> str:
        if value is None:
            return ""
        return (
            str(value)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#039;")
        )

    assert 'replaceAll("&", "&amp;")' in html_js
    assert escape('a & b <c> "d" \'e\'') == "a &amp; b &lt;c&gt; &quot;d&quot; &#039;e&#039;"


def test_file_extension_helpers_are_case_insensitive_in_shared_js() -> None:
    files_js = _read_static("shared/utils/files.js")
    assert "toLowerCase()" in files_js
    workflow = _read_static("workflow/workflow-controller.js")
    vault = _read_static("vault-config/index.html")
    assert '[".xlsx"]' in workflow
    assert '[".json"]' in vault


def test_shared_files_do_not_reference_module_domain_logic() -> None:
    combined = "\n".join(_read_static(path) for path in SHARED_JS)
    forbidden = [
        "LifeCycleDefinitionTransitions",
        "JobProcessorContainers",
        "/api/upload",
        "vault.",
        "workflow.",
    ]
    for token in forbidden:
        assert token not in combined


def test_locale_runtime_still_present_on_all_pages(client: TestClient) -> None:
    for route in ("/", "/workflow/", "/vault-config/"):
        html = client.get(route).text
        assert "/static/i18n.js" in html
        assert "localeSelect" in html or route == "/vault-config/"


def test_api_contract_endpoints_unchanged(client: TestClient) -> None:
    openapi = client.get("/openapi.json").json()
    paths = set(openapi.get("paths", {}))
    assert "/api/upload" in paths
    assert "/api/export/html" in paths
    assert "/api/version" in paths
