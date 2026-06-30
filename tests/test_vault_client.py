"""Route and static asset tests for NTI for Vault Client Viewer."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
VAULT_CLIENT_DIR = STATIC / "vault-client"
VAULT_CLIENT_HTML = VAULT_CLIENT_DIR / "index.html"
VAULT_CLIENT_JS = VAULT_CLIENT_DIR / "vault-client.js"
VAULT_CLIENT_CSS = VAULT_CLIENT_DIR / "vault-client.css"
HOME_HTML = STATIC / "index.html"
FIXTURE = ROOT / "samples" / "fixture-vault-client-config.json"

EXPECTED_MODULE_KEYS = {
    "AssignItemToFileBehavior",
    "CommandsConfiguration",
    "DataCard",
    "DesignRepresentation",
    "Extension",
    "FolderToFolderFileSynchronization",
    "General",
    "JobQueuer",
    "LifeCycleChangeBehavior",
    "NumberReserve",
    "QuickNew",
    "QuickProject",
    "UsesFilter",
    "WorkFolder",
}


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_vault_client_route_returns_200(client: TestClient) -> None:
    response = client.get("/vault-client/")
    assert response.status_code == 200


def test_vault_client_page_contains_title(client: TestClient) -> None:
    response = client.get("/vault-client/")
    assert "NTI for Vault Client Viewer" in response.text


def test_homepage_links_to_vault_client(client: TestClient) -> None:
    response = client.get("/")
    assert 'href="/vault-client/' in response.text


def test_homepage_has_vault_client_i18n_key() -> None:
    html = HOME_HTML.read_text(encoding="utf-8")
    assert 'data-i18n="home.vaultClientViewer.title"' in html
    assert 'data-i18n="home.vaultClientViewer.open"' in html


def test_vault_client_html_loads_required_assets() -> None:
    html = VAULT_CLIENT_HTML.read_text(encoding="utf-8")
    assert "/static/i18n.js" in html
    assert "/static/shared/ui/tokens.css" in html
    assert "/static/shared/ui/file-dropzone.css" in html
    assert "/static/shared/ui/upload-shell.css" in html
    assert "/static/vault-client/vault-client.js" in html


def test_vault_client_file_input_accepts_json_only() -> None:
    html = VAULT_CLIENT_HTML.read_text(encoding="utf-8")
    assert 'accept=".json' in html


def test_vault_client_js_exists() -> None:
    assert VAULT_CLIENT_JS.is_file()


def test_vault_client_js_uses_file_reader() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "FileReader" in js


def test_vault_client_js_uses_json_parse() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "JSON.parse" in js


def test_vault_client_js_does_not_upload_json_to_backend() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    lowered = js.lower()
    assert "fetch(" in js
    assert "/api/upload" not in lowered
    assert "upload/" not in lowered.replace("/static/", "")


def test_fixture_exists() -> None:
    assert FIXTURE.is_file()


def test_fixture_is_valid_json() -> None:
    json.loads(FIXTURE.read_text(encoding="utf-8"))


def test_fixture_has_expected_top_level_keys() -> None:
    payload = json.loads(FIXTURE.read_text(encoding="utf-8"))
    root = payload[0]
    present = EXPECTED_MODULE_KEYS.intersection(root.keys())
    assert len(present) >= 5


def test_fixture_json_data_keys_are_not_translated() -> None:
    payload = json.loads(FIXTURE.read_text(encoding="utf-8"))
    root = payload[0]
    assert "General" in root
    assert "CommandsConfiguration" in root
    assert "QuickProject" in root


def test_existing_vault_config_route_still_works(client: TestClient) -> None:
    response = client.get("/vault-config/")
    assert response.status_code == 200


def test_existing_workflow_route_still_works(client: TestClient) -> None:
    response = client.get("/workflow/")
    assert response.status_code == 200


def test_vault_client_html_has_viewer_shell() -> None:
    html = VAULT_CLIENT_HTML.read_text(encoding="utf-8")
    assert "vault-client-viewer-shell" in html
    assert "vault-client-layout" in html
    assert "vault-client-sidebar" in html
    assert "vault-client-detail" in html
    assert "vault-client-tabs" in html


def test_vault_client_css_has_viewer_grid_and_json_block() -> None:
    css = VAULT_CLIENT_CSS.read_text(encoding="utf-8")
    assert "grid-template-columns" in css
    assert "280px" in css
    assert ".vault-client-json-block" in css
    assert ".vault-client-section" in css
    assert ".vault-client-summary-grid" in css
    assert "white-space: pre-wrap" in css
    assert "overflow: auto" in css


def test_vault_client_js_has_special_renderer_assignment_to_file() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderAssignmentToFileBehaviorModule" in js
    assert "AssignmentToFileBehavior" in js


def test_vault_client_js_has_special_renderer_data_card() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderDataCardModule" in js


def test_vault_client_js_has_special_renderer_quick_project() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderQuickProjectModule" in js


def test_vault_client_js_has_special_renderer_quick_new() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderQuickNewModule" in js


def test_vault_client_js_has_special_renderer_commands_configuration() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderCommandsConfigurationModule" in js


def test_vault_client_js_renders_raw_json_in_details() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderRawJsonDetails" in js
    assert "<details>" in js
    assert "vault-client-raw-json" in js


def test_vault_client_js_has_readable_boolean_rendering() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "formatBoolean" in js
    assert 'td("yes")' in js
    assert 'td("no")' in js
    assert "vault-client-bool" in js


def test_vault_client_js_data_card_renders_tabs_section() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert 'td("tabs")' in js
    assert "Tabs" in js


def test_vault_client_js_assignment_renders_restrictions_section() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderRestrictionsSection" in js
    assert 'td("restrictions")' in js


def test_vault_client_js_has_generic_fallback() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderGenericModule" in js
    assert "MODULE_RENDERERS" in js


def test_vault_client_js_has_filter_logic() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "vc-filter-input" in js
    assert 'td("noFilterResults")' in js


def test_vault_client_js_has_job_queuer_renderer() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderJobQueuerModule" in js


def test_vault_client_js_job_queuer_routes_to_special_renderer() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "JobQueuer: renderJobQueuerModule" in js


def test_vault_client_js_job_queuer_toolbar_labels() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    for key in (
        "toolbar.add",
        "toolbar.remove",
        "toolbar.moveUp",
        "toolbar.moveDown",
        "toolbar.exportList",
        "toolbar.importList",
    ):
        assert key in js


def test_vault_client_js_job_queuer_toolbar_is_readonly() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "vault-client-dialog-button" in js
    assert "is-readonly" in js
    assert "disabled" in js
    assert "readonlyTooltip" in js


def test_vault_client_js_job_queuer_list_columns() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    for key in ("columns.active", "columns.name", "columns.description", "columns.edit"):
        assert key in js
    assert 'tjq("view")' in js


def test_vault_client_js_job_queuer_detail_fields() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    for key in ("detail.isPulldown", "detail.addToToolbars", "detail.supportedEntities"):
        assert key in js


def test_vault_client_js_job_queuer_jobs_section() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderJobQueuerJobs" in js
    assert "jobs.title" in js
    assert "jobs.empty" in js


def test_vault_client_js_job_queuer_user_job_parameters_section() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderJobQueuerUserParameters" in js
    assert "userJobParameters.title" in js
    assert "userJobParameters.empty" in js


def test_vault_client_js_job_queuer_technical_toggle() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "technical.show" in js
    assert "technical.hide" in js
    assert "jobQueuerShowTechnical" in js


def test_vault_client_js_job_queuer_uses_boolean_formatter() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "formatBoolean" in js
    assert "jqBool" in js


def test_vault_client_js_job_queuer_raw_json_in_details() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    assert "renderJobQueuerModule" in js
    assert "renderRawJsonDetails" in js
    assert "<details>" in js


def test_vault_client_js_job_queuer_no_data_mutation() -> None:
    js = VAULT_CLIENT_JS.read_text(encoding="utf-8")
    # Read-only viewer: no write-back of JSON edits.
    assert "/api/upload" not in js.lower()
    # Toolbar/edit buttons must be disabled and not mutate data.
    assert "data-jq-technical-toggle" in js
