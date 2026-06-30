"""i18n tests for NTI for Vault Client Viewer."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
I18N_DIR = ROOT / "static" / "i18n"

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

VAULT_CLIENT_DETAIL_KEYS = (
    "vaultClient.detail.summary",
    "vaultClient.detail.settings",
    "vaultClient.detail.actions",
    "vaultClient.detail.restrictions",
    "vaultClient.detail.tabs",
    "vaultClient.detail.commands",
    "vaultClient.detail.rawJson",
    "vaultClient.detail.showRawJson",
    "vaultClient.detail.yes",
    "vaultClient.detail.no",
    "vaultClient.detail.name",
    "vaultClient.detail.displayName",
    "vaultClient.detail.description",
    "vaultClient.detail.active",
    "vaultClient.detail.checked",
    "vaultClient.detail.id",
    "vaultClient.detail.itemsCount",
    "vaultClient.detail.tabsCount",
    "vaultClient.detail.entityClassesCount",
)

VAULT_CLIENT_JOB_QUEUER_KEYS = (
    "vaultClient.jobQueuer.title",
    "vaultClient.jobQueuer.helpText",
    "vaultClient.jobQueuer.readonlyTooltip",
    "vaultClient.jobQueuer.view",
    "vaultClient.jobQueuer.emptyValue",
    "vaultClient.jobQueuer.yes",
    "vaultClient.jobQueuer.no",
    "vaultClient.jobQueuer.emptyQueuers",
    "vaultClient.jobQueuer.toolbar.add",
    "vaultClient.jobQueuer.toolbar.remove",
    "vaultClient.jobQueuer.toolbar.moveUp",
    "vaultClient.jobQueuer.toolbar.moveDown",
    "vaultClient.jobQueuer.toolbar.exportList",
    "vaultClient.jobQueuer.toolbar.importList",
    "vaultClient.jobQueuer.list.title",
    "vaultClient.jobQueuer.columns.active",
    "vaultClient.jobQueuer.columns.name",
    "vaultClient.jobQueuer.columns.description",
    "vaultClient.jobQueuer.columns.edit",
    "vaultClient.jobQueuer.columns.priority",
    "vaultClient.jobQueuer.columns.value",
    "vaultClient.jobQueuer.detail.title",
    "vaultClient.jobQueuer.detail.name",
    "vaultClient.jobQueuer.detail.description",
    "vaultClient.jobQueuer.detail.active",
    "vaultClient.jobQueuer.detail.id",
    "vaultClient.jobQueuer.detail.isPulldown",
    "vaultClient.jobQueuer.detail.addToToolbars",
    "vaultClient.jobQueuer.detail.supportedEntities",
    "vaultClient.jobQueuer.jobs.title",
    "vaultClient.jobQueuer.jobs.empty",
    "vaultClient.jobQueuer.userJobParameters.title",
    "vaultClient.jobQueuer.userJobParameters.empty",
    "vaultClient.jobQueuer.technical.show",
    "vaultClient.jobQueuer.technical.hide",
    "vaultClient.jobQueuer.technical.title",
    "vaultClient.jobQueuer.technical.jsonKey",
    "vaultClient.jobQueuer.technical.jsonPath",
    "vaultClient.jobQueuer.rawJson.title",
)

VAULT_CLIENT_KEYS = (
    "vaultClient.title",
    "vaultClient.open",
    "vaultClient.description",
    "vaultClient.loadConfig",
    "vaultClient.uploadIntro",
    "vaultClient.dropTitle",
    "vaultClient.dropSubtitle",
    "vaultClient.supportedTypes",
    "vaultClient.ariaLabel",
    "vaultClient.filterPlaceholder",
    "vaultClient.emptyModule",
    "vaultClient.invalidJson",
    "vaultClient.errorJsonOnly",
    "vaultClient.statusLoaded",
    "vaultClient.tableKey",
    "vaultClient.tableValue",
    "vaultClient.arrayItems",
    "vaultClient.tabs.modules",
    "vaultClient.detail.object",
    "vaultClient.detail.array",
    "vaultClient.detail.string",
    "vaultClient.detail.number",
    "vaultClient.detail.boolean",
    "vaultClient.detail.null",
    "vaultClient.detail.keys",
    "vaultClient.detail.items",
    "vaultClient.detail.noFilterResults",
    "vaultClient.detail.nestedValue",
    "vaultClient.detail.rawJson",
    *VAULT_CLIENT_DETAIL_KEYS,
    "home.vaultClientViewer.title",
    "home.vaultClientViewer.description",
    "home.vaultClientViewer.open",
    *VAULT_CLIENT_JOB_QUEUER_KEYS,
)


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


@pytest.mark.parametrize("locale_file", AUTHORITATIVE)
def test_locale_files_include_vault_client_keys(locale_file: str) -> None:
    en = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    locale = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
    assert _flatten_keys(locale) == _flatten_keys(en), locale_file
    for key in VAULT_CLIENT_KEYS:
        value = _nested_get(locale, key)
        assert value, f"{locale_file}: {key}"
        assert value.strip(), f"{locale_file}: empty {key}"


def test_da_dk_has_danish_upload_intro() -> None:
    da = json.loads((I18N_DIR / "da-DK.json").read_text(encoding="utf-8"))
    assert _nested_get(da, "vaultClient.uploadIntro") == (
        "Vælg eller træk en NTI for Vault Client JSON-konfigurationsfil."
    )


def test_en_gb_has_english_upload_intro() -> None:
    en = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    assert _nested_get(en, "vaultClient.uploadIntro") == (
        "Choose or drag an NTI for Vault Client JSON configuration file."
    )


def test_da_dk_has_modules_tab_label() -> None:
    da = json.loads((I18N_DIR / "da-DK.json").read_text(encoding="utf-8"))
    assert _nested_get(da, "vaultClient.tabs.modules") == "Moduler"


def test_en_gb_has_modules_tab_label() -> None:
    en = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    assert _nested_get(en, "vaultClient.tabs.modules") == "Modules"


def test_all_locales_have_raw_json_label() -> None:
    for locale_file in AUTHORITATIVE:
        payload = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
        value = _nested_get(payload, "vaultClient.detail.rawJson")
        assert value and value.strip(), locale_file


def test_all_locales_have_new_detail_keys() -> None:
    for locale_file in AUTHORITATIVE:
        payload = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
        for key in VAULT_CLIENT_DETAIL_KEYS:
            value = _nested_get(payload, key)
            assert value and value.strip(), f"{locale_file}: {key}"


def test_da_dk_has_danish_yes_no_and_restrictions() -> None:
    da = json.loads((I18N_DIR / "da-DK.json").read_text(encoding="utf-8"))
    assert _nested_get(da, "vaultClient.detail.yes") == "Ja"
    assert _nested_get(da, "vaultClient.detail.no") == "Nej"
    assert _nested_get(da, "vaultClient.detail.restrictions") == "Restriktioner"


def test_en_gb_has_english_restrictions() -> None:
    en = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    assert _nested_get(en, "vaultClient.detail.restrictions") == "Restrictions"


def test_all_locales_have_job_queuer_keys() -> None:
    for locale_file in AUTHORITATIVE:
        payload = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
        for key in VAULT_CLIENT_JOB_QUEUER_KEYS:
            value = _nested_get(payload, key)
            assert value and value.strip(), f"{locale_file}: {key}"


def test_da_dk_job_queuer_danish_labels() -> None:
    da = json.loads((I18N_DIR / "da-DK.json").read_text(encoding="utf-8"))
    assert _nested_get(da, "vaultClient.jobQueuer.toolbar.add") == "Tilføj"
    assert _nested_get(da, "vaultClient.jobQueuer.toolbar.remove") == "Fjern"
    assert _nested_get(da, "vaultClient.jobQueuer.toolbar.moveUp") == "Flyt op"
    assert _nested_get(da, "vaultClient.jobQueuer.technical.show") == "Vis teknisk info"
    assert _nested_get(da, "vaultClient.jobQueuer.rawJson.title") == "Rå JSON"
    assert _nested_get(da, "vaultClient.jobQueuer.yes") == "Ja"
    assert _nested_get(da, "vaultClient.jobQueuer.no") == "Nej"


def test_en_gb_job_queuer_english_labels() -> None:
    en = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    assert _nested_get(en, "vaultClient.jobQueuer.toolbar.add") == "Add"
    assert _nested_get(en, "vaultClient.jobQueuer.toolbar.remove") == "Remove"
    assert _nested_get(en, "vaultClient.jobQueuer.toolbar.moveUp") == "Move up"
    assert _nested_get(en, "vaultClient.jobQueuer.technical.show") == "Show technical info"
    assert _nested_get(en, "vaultClient.jobQueuer.rawJson.title") == "Raw JSON"
    assert _nested_get(en, "vaultClient.jobQueuer.yes") == "Yes"
    assert _nested_get(en, "vaultClient.jobQueuer.no") == "No"
