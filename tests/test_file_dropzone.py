"""Shared file dropzone consistency tests."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
I18N_DIR = STATIC / "i18n"
DROPZONE_CLASS = "nti-file-dropzone"
DROPZONE_CSS = "shared/ui/file-dropzone.css"


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _read(path: str) -> str:
    return (STATIC / path).read_text(encoding="utf-8")


def test_workflow_and_vault_use_shared_dropzone_class() -> None:
    workflow = _read("workflow/index.html")
    vault = _read("vault-config/index.html")
    assert f'class="{DROPZONE_CLASS} nti-drop-zone"' in workflow
    assert f'class="{DROPZONE_CLASS}"' in vault
    assert 'class="drop-zone"' not in vault
    assert "dz-icon" not in vault


def test_both_pages_load_file_dropzone_css(client: TestClient) -> None:
    assert client.get(f"/static/{DROPZONE_CSS}").status_code == 200
    workflow = client.get("/workflow/").text
    vault = client.get("/vault-config/").text
    assert f"/static/{DROPZONE_CSS}" in workflow
    assert f"/static/{DROPZONE_CSS}" in vault


def test_workflow_accepts_excel_extensions() -> None:
    html = _read("workflow/index.html")
    controller = _read("workflow/workflow-controller.js")
    assert 'accept=".xlsx' in html
    assert 'EXCEL_EXTENSIONS = [".xlsx"]' in controller


def test_vault_accepts_json_only() -> None:
    vault = _read("vault-config/index.html")
    assert 'accept=".json"' in vault
    assert 'hasExtension(file, [".json"])' in vault


def test_workflow_still_uses_api_upload() -> None:
    controller = _read("workflow/workflow-controller.js")
    assert 'fetch("/api/upload"' in controller


def test_vault_still_uses_filereader() -> None:
    vault = _read("vault-config/index.html")
    assert "new FileReader()" in vault
    assert "readAsText(file)" in vault


def test_both_dropzones_support_keyboard_activation() -> None:
    workflow = _read("workflow/index.html")
    vault = _read("vault-config/index.html")
    for html in (workflow, vault):
        assert 'role="button"' in html
        assert 'tabindex="0"' in html
    files_js = _read("shared/utils/files.js")
    assert "Enter" in files_js and " " in files_js
    assert "clickInput.click()" in files_js


def test_dropzone_css_has_no_domain_specific_selectors() -> None:
    css = _read(DROPZONE_CSS)
    for token in (".xlsx", ".json", "workflow", "vault", "LifeCycle"):
        assert token not in css


def test_vault_dropzone_i18n_keys_exist_in_all_locales() -> None:
    required = {
        "vault.dropTitle",
        "vault.dropSubtitle",
        "vault.supportedTypes",
        "vault.ariaLabel",
    }
    for path in sorted(I18N_DIR.glob("*.json")):
        keys = set()
        payload = json.loads(path.read_text(encoding="utf-8"))

        def walk(obj: object, prefix: str = "") -> None:
            if isinstance(obj, dict):
                for k, v in obj.items():
                    full = f"{prefix}.{k}" if prefix else k
                    keys.add(full)
                    walk(v, full)

        walk(payload)
        missing = required - keys
        assert not missing, f"{path.name} missing {missing}"


def test_danish_dropzone_strings_in_locale(client: TestClient) -> None:
    payload = client.get("/static/i18n/da-DK.json").json()
    vault = payload["vault"]
    assert "Træk" in vault["dropTitle"]
    assert "Indlæs" not in vault["dropSubtitle"] or "vælg" in vault["dropSubtitle"]
    assert ".json" in vault["supportedTypes"]
    assert "?bn" not in payload["home"]["vaultConfigViewer"]["open"]
