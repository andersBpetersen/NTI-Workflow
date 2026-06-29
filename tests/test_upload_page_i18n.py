"""Workflow and Vault Config upload/topbar i18n tests."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
I18N_DIR = STATIC / "i18n"
WORKFLOW_HTML = STATIC / "workflow" / "index.html"
VAULT_HTML = STATIC / "vault-config" / "index.html"

AUTHORITATIVE = (
    "cs-CZ.json",
    "da-DK.json",
    "de-DE.json",
    "en-GB.json",
    "es-ES.json",
    "fi-FI.json",
    "fr-FR.json",
    "it-IT.json",
    "nl-NL.json",
    "no-NO.json",
    "pl-PL.json",
    "pt-BR.json",
    "sv-SE.json",
)

WORKFLOW_UPLOAD_KEYS = {
    "nav.backHome",
    "language.label",
    "upload.chooseFile",
    "upload.dropTitle",
    "upload.dropSubtitle",
    "upload.supportedTypes",
    "upload.ariaLabel",
}

VAULT_UPLOAD_KEYS = {
    "nav.backHome",
    "language.label",
    "vault.loadConfig",
    "vault.dropTitle",
    "vault.dropSubtitle",
    "vault.supportedTypes",
    "vault.ariaLabel",
}

CORRUPTION_PATTERNS = (
    re.compile(r"\?bn"),
    re.compile(r"Tr\?k"),
    re.compile(r"Indl\?s"),
    re.compile(r"Ã¦|Ã¸|Ã¥"),
    re.compile(r"\ufffd"),
)

LOCALE_EXPECTATIONS = {
    "it-IT.json": {
        "nav.backHome": "Torna alla home",
        "language.label": "Lingua",
        "upload.chooseFile": "Scegli file Excel",
        "vault.loadConfig": "Carica configurazione",
        "vault.dropTitle": "Trascina qui un file JSON NTI for Vault Job",
    },
    "da-DK.json": {
        "nav.backHome": "Tilbage til forsiden",
        "language.label": "Sprog",
        "vault.loadConfig": "Indlæs konfiguration",
    },
    "pl-PL.json": {
        "nav.backHome": "Wróć do strony głównej",
        "language.label": "Język",
        "vault.loadConfig": "Wczytaj konfigurację",
        "upload.chooseFile": "Wybierz plik Excel",
    },
}


def _nested_get(payload: dict, dotted_key: str) -> str | None:
    node: object = payload
    for part in dotted_key.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node if isinstance(node, str) else None


def _flatten_keys(payload: object, prefix: str = "") -> set[str]:
    keys: set[str] = set()
    if isinstance(payload, dict):
        for key, value in payload.items():
            full = f"{prefix}.{key}" if prefix else key
            if isinstance(value, dict):
                keys.update(_flatten_keys(value, full))
            else:
                keys.add(full)
    return keys


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_workflow_upload_keys_exist_in_en_gb() -> None:
    en = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    for key in WORKFLOW_UPLOAD_KEYS:
        assert _nested_get(en, key), key


def test_vault_upload_keys_exist_in_en_gb() -> None:
    en = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    for key in VAULT_UPLOAD_KEYS:
        assert _nested_get(en, key), key


@pytest.mark.parametrize("locale_file", AUTHORITATIVE)
def test_locale_files_share_key_structure(locale_file: str) -> None:
    en = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    locale = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
    assert _flatten_keys(locale) == _flatten_keys(en), locale_file


@pytest.mark.parametrize("locale_file,expected", LOCALE_EXPECTATIONS.items())
def test_priority_locale_upload_translations(locale_file: str, expected: dict[str, str]) -> None:
    payload = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
    for key, translation in expected.items():
        assert _nested_get(payload, key) == translation


def test_workflow_html_has_no_hardcoded_language_label() -> None:
    html = WORKFLOW_HTML.read_text(encoding="utf-8")
    assert html.count("Language") == 2
    assert 'data-i18n="language.label"' in html
    assert 'data-i18n-aria-label="language.label"' in html


def test_vault_html_has_no_hardcoded_upload_ui_strings() -> None:
    html = VAULT_HTML.read_text(encoding="utf-8")
    assert 'data-i18n="language.label"' in html
    assert 'data-i18n="vault.loadConfig"' in html
    assert 'data-i18n="vault.dropTitle"' in html
    assert html.count("Language") == 2
    assert "Load Config" in html
    assert 'data-i18n="vault.loadConfig"' in html
    assert "Drag an NTI for Vault Job JSON file here" in html
    assert 'data-i18n="vault.dropTitle"' in html


def test_workflow_accepts_excel_upload() -> None:
    html = WORKFLOW_HTML.read_text(encoding="utf-8")
    assert 'accept=".xlsx' in html or "spreadsheetml.sheet" in html


def test_vault_accepts_json_upload() -> None:
    html = VAULT_HTML.read_text(encoding="utf-8")
    assert 'accept=".json"' in html


def test_workflow_and_vault_use_shared_back_home_key() -> None:
    workflow = WORKFLOW_HTML.read_text(encoding="utf-8")
    vault = VAULT_HTML.read_text(encoding="utf-8")
    assert 'data-i18n="nav.backHome"' in workflow
    assert 'data-i18n="nav.backHome"' in vault


@pytest.mark.parametrize("locale_file", AUTHORITATIVE)
def test_locale_files_parse_without_corruption(locale_file: str) -> None:
    text = (I18N_DIR / locale_file).read_text(encoding="utf-8")
    json.loads(text)
    for pattern in CORRUPTION_PATTERNS:
        assert not pattern.search(text), f"{locale_file}: {pattern.pattern}"


def test_workflow_page_loads_i18n(client: TestClient) -> None:
    html = client.get("/workflow/").text
    assert "/static/i18n.js" in html
    assert 'id="localeSelect"' in html


def test_vault_page_loads_i18n(client: TestClient) -> None:
    html = client.get("/vault-config/").text
    assert "/static/i18n.js" in html
    assert "applyVaultLocaleTexts" in html
    assert 'id="localeSelect"' in html
