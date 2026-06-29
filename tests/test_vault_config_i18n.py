"""Vault Config Viewer i18n regression tests for release 0.7.2."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
VAULT_HTML = ROOT / "static" / "vault-config" / "index.html"
EN_GB = ROOT / "static" / "i18n" / "en-GB.json"
I18N_DIR = ROOT / "static" / "i18n"
AUTHORITATIVE = {
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
}
FIXTURE = ROOT / "samples" / "fixture-vault-job-config.json"

VAULT_UI_STRINGS = [
    "Job processor containers",
    "Deactivate job processors",
    "File paths to exclude during job clean up",
    "Hide inactive",
    "Find next",
    "Run only via job processor key",
    "Choose a container.",
    "Choose a jobprocessor to see details.",
]

PRIORITY_LOCALES = {
    "da-DK.json": {
        "topContainers": "Jobprocessor-containere",
        "hideInactive": "Skjul inaktive",
        "findNext": "Find næste",
        "tableActive": "Aktiv",
        "tableName": "Navn",
        "tableDescription": "Beskrivelse",
        "emptyChooseContainer": "Vælg en container.",
    },
    "es-ES.json": {
        "topContainers": "Contenedores de procesadores de trabajos",
        "hideInactive": "Ocultar inactivos",
        "findNext": "Buscar siguiente",
        "tableActive": "Activo",
        "tableName": "Nombre",
        "tableDescription": "Descripción",
        "emptyChooseContainer": "Seleccione un contenedor.",
    },
    "pt-BR.json": {
        "topContainers": "Contêineres de processadores de jobs",
        "hideInactive": "Ocultar inativos",
        "findNext": "Buscar próximo",
        "tableActive": "Ativo",
        "tableName": "Nome",
        "tableDescription": "Descrição",
        "emptyChooseContainer": "Selecione um contêiner.",
    },
}

TECHNICAL_DATA = [
    "PreProcessFile",
    "PreProcessItem",
    "Inventor.Create.pdf",
]


def _vault_keys(payload: dict) -> set[str]:
    vault = payload.get("vault", {})
    return set(vault.keys())


def _empty_vault_values(payload: dict) -> list[str]:
    invalid: list[str] = []
    for key, value in payload.get("vault", {}).items():
        if isinstance(value, str) and not value.strip():
            invalid.append(key)
    return invalid


@pytest.fixture
def vault_html() -> str:
    return VAULT_HTML.read_text(encoding="utf-8")


@pytest.fixture
def en_vault() -> dict:
    return json.loads(EN_GB.read_text(encoding="utf-8"))["vault"]


def test_all_vault_keys_exist_in_en_gb(en_vault: dict) -> None:
    required = {
        "topContainers",
        "topDeactivate",
        "topFilepaths",
        "hideInactive",
        "showAll",
        "findNext",
        "searchPlaceholder",
        "tableName",
        "tableDescription",
        "tableActive",
        "tableJobProcessorKey",
        "tableRunOnlyViaJobProcessorKey",
        "emptyChooseContainer",
        "emptyChooseJobProcessor",
        "statusReady",
        "statusLoaded",
    }
    assert required.issubset(en_vault.keys())


@pytest.mark.parametrize("locale_file", sorted(AUTHORITATIVE))
def test_locale_files_share_vault_key_structure(locale_file: str, en_vault: dict) -> None:
    payload = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
    assert _vault_keys(payload) == set(en_vault.keys())


@pytest.mark.parametrize("locale_file", sorted(AUTHORITATIVE))
def test_vault_locale_values_not_empty(locale_file: str) -> None:
    payload = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
    assert not _empty_vault_values(payload), locale_file


@pytest.mark.parametrize("locale_file,expected", PRIORITY_LOCALES.items())
def test_priority_locale_translations(locale_file: str, expected: dict) -> None:
    vault = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))["vault"]
    for key, translation in expected.items():
        assert vault[key] == translation


@pytest.mark.parametrize("ui_text", VAULT_UI_STRINGS)
def test_vault_ui_strings_not_hardcoded_in_html(vault_html: str, ui_text: str) -> None:
    assert ui_text not in vault_html, f"Hardcoded UI text found in vault-config: {ui_text}"


def test_vault_html_uses_data_vault_i18n_attributes(vault_html: str) -> None:
    assert 'data-vault-i18n="topContainers"' in vault_html
    assert 'data-vault-i18n="tableActive"' in vault_html
    assert "applyVaultLocaleTexts" in vault_html
    assert "onVaultLocaleChanged" in vault_html


def test_status_loaded_supports_placeholders(en_vault: dict) -> None:
    assert "{name}" in en_vault["statusLoaded"]
    assert "{count}" in en_vault["statusLoaded"]


def test_fixture_technical_job_names_unchanged() -> None:
    payload = json.loads(FIXTURE.read_text(encoding="utf-8"))
    names = json.dumps(payload)
    for token in TECHNICAL_DATA:
        assert token in names


def test_vault_html_preserves_technical_job_name_literals(vault_html: str) -> None:
    for token in ("PreProcessFile", "PreProcessItem", "Inventor.Create.pdf", "Autocad.Create."):
        assert token in vault_html


def test_i18n_t_supports_placeholders() -> None:
    script = (ROOT / "static" / "i18n.js").read_text(encoding="utf-8")
    assert "Object.entries(params)" in script
    assert "replaceAll(`{${name}}`" in script or 'replaceAll(`{${name}}`' in script


def test_vault_page_still_loads_json_logic(vault_html: str) -> None:
    assert "function readFile(file)" in vault_html
    assert "JobProcessorContainers" in vault_html


def test_workflow_viewer_untouched() -> None:
    workflow = (ROOT / "static" / "workflow" / "index.html").read_text(encoding="utf-8")
    assert "data-i18n=" in workflow
    assert "vault.topContainers" not in workflow
