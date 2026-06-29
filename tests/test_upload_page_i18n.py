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
    "vault.uploadIntro",
    "vault.dropTitle",
    "vault.dropSubtitle",
    "vault.supportedTypes",
    "vault.ariaLabel",
}

DROPZONE_TEXT_CLASSES = (
    "nti-file-dropzone-title",
    "nti-file-dropzone-description",
    "nti-file-dropzone-meta",
)

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
        "vault.uploadIntro": "Scegli o trascina un file di configurazione JSON NTI for Vault Job.",
        "vault.dropTitle": "Trascina qui un file JSON NTI for Vault Job",
    },
    "da-DK.json": {
        "nav.backHome": "Tilbage til forsiden",
        "language.label": "Sprog",
        "vault.loadConfig": "Indlæs konfiguration",
        "vault.uploadIntro": "Vælg eller træk en NTI for Vault Job JSON-konfigurationsfil.",
    },
    "pl-PL.json": {
        "nav.backHome": "Wróć do strony głównej",
        "language.label": "Język",
        "vault.loadConfig": "Wczytaj konfigurację",
        "vault.uploadIntro": "Wybierz lub przeciągnij plik konfiguracyjny JSON NTI for Vault Job.",
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


def test_vault_html_has_no_upload_intro_literal() -> None:
    html = VAULT_HTML.read_text(encoding="utf-8")
    match = re.search(
        r'<p class="upload-bar-intro"[^>]*>(.*?)</p>',
        html,
        re.S,
    )
    assert match
    assert "Upload Intro" not in match.group(1)


def test_vault_upload_intro_key_in_en_gb() -> None:
    en = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    assert _nested_get(en, "vault.uploadIntro") == (
        "Choose or drag an NTI for Vault Job JSON configuration file."
    )


def test_vault_upload_intro_key_in_it_it() -> None:
    it = json.loads((I18N_DIR / "it-IT.json").read_text(encoding="utf-8"))
    assert _nested_get(it, "vault.uploadIntro") == (
        "Scegli o trascina un file di configurazione JSON NTI for Vault Job."
    )


def test_vault_upload_intro_key_in_da_dk() -> None:
    da = json.loads((I18N_DIR / "da-DK.json").read_text(encoding="utf-8"))
    assert _nested_get(da, "vault.uploadIntro") == (
        "Vælg eller træk en NTI for Vault Job JSON-konfigurationsfil."
    )


def test_vault_html_has_upload_intro_i18n() -> None:
    html = VAULT_HTML.read_text(encoding="utf-8")
    assert 'data-i18n="vault.uploadIntro"' in html
    assert 'class="upload-bar-intro"' in html
    assert 'class="upload-bar-heading"' in html


def test_workflow_and_vault_share_dropzone_text_classes() -> None:
    workflow = WORKFLOW_HTML.read_text(encoding="utf-8")
    vault = VAULT_HTML.read_text(encoding="utf-8")
    for class_name in DROPZONE_TEXT_CLASSES:
        assert class_name in workflow
        assert class_name in vault


def test_dropzone_css_uses_shared_muted_text_colors() -> None:
    css = (STATIC / "shared" / "ui" / "file-dropzone.css").read_text(encoding="utf-8")
    shell = (STATIC / "shared" / "ui" / "upload-shell.css").read_text(encoding="utf-8")
    assert ".nti-file-dropzone-description,\n.nti-file-dropzone-meta" in css
    assert "color: var(--nti-color-muted)" in css
    assert ".nti-file-dropzone-title" in css
    title_block = css.split(".nti-file-dropzone-title", 1)[1].split("}", 1)[0]
    assert "color: var(--nti-color-muted)" in title_block
    assert "color: inherit" not in css
    assert "color: var(--nti-color-text)" not in title_block
    assert "body.nti-upload-shell .nti-file-dropzone .nti-file-dropzone-title" in shell
    assert "color: var(--nti-color-muted)" in shell


def test_vault_html_has_no_dropzone_title_color_override() -> None:
    html = VAULT_HTML.read_text(encoding="utf-8")
    assert ".nti-file-dropzone-title" not in html
    assert re.search(
        r"\.nti-file-dropzone[^{]*\{[^}]*color\s*:",
        html,
    ) is None


def test_vault_html_has_no_hardcoded_upload_ui_strings() -> None:
    html = VAULT_HTML.read_text(encoding="utf-8")
    assert 'data-i18n="language.label"' in html
    assert 'data-i18n="vault.loadConfig"' in html
    assert 'data-i18n="vault.dropTitle"' in html
    assert 'class="app-topbar"' in html
    assert 'class="upload-bar"' in html
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
    assert 'class="app-topbar"' in workflow
    assert 'class="app-topbar"' in vault
    assert 'class="upload-bar"' in workflow
    assert 'class="upload-bar"' in vault


def test_workflow_and_vault_share_upload_bar_heading_structure() -> None:
    workflow = WORKFLOW_HTML.read_text(encoding="utf-8")
    vault = VAULT_HTML.read_text(encoding="utf-8")
    assert "upload-bar-heading" in workflow
    assert "upload-bar-heading" in vault
    assert "upload-bar-intro" in workflow
    assert "upload-bar-intro" in vault


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
