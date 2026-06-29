"""Locale consistency and i18n wiring tests."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
I18N_DIR = STATIC / "i18n"
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
LEGACY = {
    "da.json",
    "de.json",
    "en.json",
    "es.json",
    "fi.json",
    "fr.json",
    "is.json",
    "it.json",
    "nb.json",
    "nl.json",
    "sv.json",
}


def _flatten_keys(payload: object, prefix: str = "") -> set[str]:
    keys: set[str] = set()
    if isinstance(payload, dict):
        for key, value in payload.items():
            full = f"{prefix}.{key}" if prefix else key
            keys.add(full)
            keys.update(_flatten_keys(value, full))
    elif isinstance(payload, list):
        for index, value in enumerate(payload):
            full = f"{prefix}[{index}]"
            keys.add(full)
            keys.update(_flatten_keys(value, full))
    return keys


def _empty_or_raw_value_keys(payload: object, prefix: str = "") -> set[str]:
    invalid: set[str] = set()
    if isinstance(payload, dict):
        for key, value in payload.items():
            full = f"{prefix}.{key}" if prefix else key
            if isinstance(value, str):
                if not value.strip():
                    invalid.add(full)
                elif value.strip() == key:
                    invalid.add(full)
            invalid.update(_empty_or_raw_value_keys(value, full))
    elif isinstance(payload, list):
        for index, value in enumerate(payload):
            full = f"{prefix}[{index}]"
            invalid.update(_empty_or_raw_value_keys(value, full))
    return invalid


def test_registry_uses_authoritative_locale_files_and_no_legacy() -> None:
    script = (STATIC / "i18n.js").read_text(encoding="utf-8")
    assert "const SUPPORTED_LOCALES = {" in script
    for file_name in AUTHORITATIVE:
        assert file_name in script
    for file_name in LEGACY:
        assert file_name not in script


def test_all_authoritative_locale_files_exist_and_parse() -> None:
    existing = {path.name for path in I18N_DIR.glob("*.json")}
    assert AUTHORITATIVE == existing
    for file_name in sorted(AUTHORITATIVE):
        json.loads((I18N_DIR / file_name).read_text(encoding="utf-8"))


def test_en_gb_is_canonical_key_source_and_other_locales_match() -> None:
    reference = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    reference_keys = _flatten_keys(reference)
    mismatches: list[str] = []
    for file_name in sorted(AUTHORITATIVE):
        payload = json.loads((I18N_DIR / file_name).read_text(encoding="utf-8"))
        keys = _flatten_keys(payload)
        missing = sorted(reference_keys - keys)
        extra = sorted(keys - reference_keys)
        invalid = sorted(_empty_or_raw_value_keys(payload))
        if missing or extra or invalid:
            mismatches.append(
                f"{file_name}: missing={len(missing)} extra={len(extra)} invalid={len(invalid)}",
            )
    assert not mismatches, "; ".join(mismatches)


def test_normalization_and_fallback_rules_present_in_i18n_runtime() -> None:
    script = (STATIC / "i18n.js").read_text(encoding="utf-8")
    assert '"da-DK"' in script and "da: \"da-DK\"" in script
    assert "en: \"en-GB\"" in script
    assert '"en-US": "en-GB"' in script
    assert "de: \"de-DE\"" in script
    assert "pt: \"pt-BR\"" in script
    assert '"pt-PT": "pt-BR"' in script
    assert "nb: \"no-NO\"" in script
    assert "chain.push(DEFAULT_LOCALE)" in script


def test_locale_storage_key_and_shared_event_name_are_global() -> None:
    script = (STATIC / "i18n.js").read_text(encoding="utf-8")
    assert 'const LOCALE_STORAGE_KEY = "nti.locale";' in script
    assert 'const LOCALE_CHANGED_EVENT = "nti:locale-changed";' in script


def test_locale_select_is_not_hardcoded_in_multiple_html_files() -> None:
    index_html = (STATIC / "index.html").read_text(encoding="utf-8")
    workflow_html = (STATIC / "workflow" / "index.html").read_text(encoding="utf-8")
    vault_html = (STATIC / "vault-config" / "index.html").read_text(encoding="utf-8")
    assert 'id="localeSelect"' in index_html
    assert 'data-i18n-aria-label="language.label"' in index_html
    assert 'id="localeSelect"' in workflow_html
    assert 'data-i18n-aria-label="language.label"' in workflow_html
    assert 'id="localeSelect"' in vault_html
    assert 'data-i18n-aria-label="language.label"' in vault_html


def test_portuguese_requirements_and_workflow_technical_terms() -> None:
    payload = json.loads((I18N_DIR / "pt-BR.json").read_text(encoding="utf-8"))
    assert payload["language"]["label"] == "Idioma"
    assert payload["nav"]["backHome"] == "Voltar ao início"
    assert payload["upload"]["chooseFile"] == "Escolher arquivo Excel"
    script = (STATIC / "i18n.js").read_text(encoding="utf-8")
    assert "Português (Brasil)" in script
    assert ">Brasil<" not in (STATIC / "index.html").read_text(encoding="utf-8")
    workflow_html = (STATIC / "workflow" / "index.html").read_text(encoding="utf-8")
    assert "LifeCycleDefinitionTransitions" in workflow_html
    assert "LifeCycleDefinitionStates" in workflow_html


def test_vault_config_uses_shared_i18n_runtime_and_not_local_registry() -> None:
    vault_html = (STATIC / "vault-config" / "index.html").read_text(encoding="utf-8")
    assert '<script src="/static/i18n.js"></script>' in vault_html
    assert "function vt(key, params = {})" in vault_html
    assert "window.addEventListener(\"nti:locale-changed\", onVaultLocaleChanged);" in vault_html
    assert "const VAULT_TEXT" not in vault_html


def test_locale_is_preserved_between_home_and_workflow_links() -> None:
    app_shell = (STATIC / "app-shell.js").read_text(encoding="utf-8")
    workflow_ctrl = (STATIC / "workflow" / "workflow-controller.js").read_text(
        encoding="utf-8"
    )
    assert "/workflow/?lang=" in app_shell
    assert "/vault-config/?lang=" in app_shell
    assert "`/?lang=${encodeURIComponent(locale)}`" in workflow_ctrl
    assert "`/vault-config/?lang=${encodeURIComponent(locale)}`" in workflow_ctrl
