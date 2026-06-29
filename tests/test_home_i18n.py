"""Home page / app shell i18n tests for all supported locales."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
I18N_DIR = STATIC / "i18n"
I18N_JS = STATIC / "i18n.js"
HOME_HTML = STATIC / "index.html"
APP_SHELL_JS = STATIC / "app-shell.js"

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

EXPECTED_LOCALE_LABELS = {
    "cs-CZ": "Čeština",
    "da-DK": "Dansk",
    "de-DE": "Deutsch",
    "en-GB": "English",
    "es-ES": "Español",
    "fi-FI": "Suomi",
    "fr-FR": "Français",
    "it-IT": "Italiano",
    "nl-NL": "Nederlands",
    "no-NO": "Norsk",
    "pl-PL": "Polski",
    "pt-BR": "Português (Brasil)",
    "sv-SE": "Svenska",
}

HOME_KEYS = {
    "language.label",
    "home.title",
    "home.intro",
    "home.workflowViewer.title",
    "home.workflowViewer.description",
    "home.workflowViewer.open",
    "home.lifecycleCompare.title",
    "home.lifecycleCompare.description",
    "home.lifecycleCompare.comingSoon",
    "home.vaultConfigViewer.title",
    "home.vaultConfigViewer.description",
    "home.vaultConfigViewer.open",
    "home.vaultConfigTools.title",
    "home.vaultConfigTools.description",
    "home.vaultConfigTools.comingSoon",
}

CORRUPTION_PATTERNS = (
    re.compile(r"\?bn"),
    re.compile(r"Tr\?k"),
    re.compile(r"Indl\?s"),
    re.compile(r"Ã¦|Ã¸|Ã¥"),
    re.compile(r"\ufffd"),
)

LOCALE_EXPECTATIONS = {
    "pl-PL.json": {
        "language.label": "Język",
        "home.lifecycleCompare.comingSoon": "Wkrótce",
        "home.workflowViewer.open": "Otwórz Workflow Viewer",
        "home.vaultConfigViewer.open": "Otwórz Vault Config Viewer",
    },
    "da-DK.json": {
        "language.label": "Sprog",
        "home.workflowViewer.open": "Åbn Workflow Viewer",
        "home.lifecycleCompare.comingSoon": "Kommer senere",
        "home.vaultConfigViewer.open": "Åbn Vault Config Viewer",
    },
    "es-ES.json": {
        "language.label": "Idioma",
        "home.workflowViewer.open": "Abrir Workflow Viewer",
    },
    "de-DE.json": {
        "language.label": "Sprache",
        "home.workflowViewer.open": "Workflow Viewer öffnen",
    },
    "cs-CZ.json": {
        "language.label": "Jazyk",
        "home.lifecycleCompare.comingSoon": "Již brzy",
    },
}


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


def _nested_get(payload: dict, dotted_key: str) -> str | None:
    node: object = payload
    for part in dotted_key.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node if isinstance(node, str) else None


def test_all_authoritative_locale_files_exist() -> None:
    for locale_file in AUTHORITATIVE:
        assert (I18N_DIR / locale_file).is_file()


def test_supported_locales_registry_has_thirteen_entries() -> None:
    script = I18N_JS.read_text(encoding="utf-8")
    for code, label in EXPECTED_LOCALE_LABELS.items():
        assert f'"{code}"' in script
        assert label in script


def test_all_locales_share_home_key_structure() -> None:
    en = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))
    en_home_keys = {k for k in _flatten_keys(en) if k.startswith("home.") or k == "language.label"}
    for locale_file in AUTHORITATIVE:
        payload = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
        locale_home_keys = {
            k for k in _flatten_keys(payload) if k.startswith("home.") or k == "language.label"
        }
        assert locale_home_keys == en_home_keys, locale_file


@pytest.mark.parametrize("locale_file", AUTHORITATIVE)
def test_home_keys_present_and_non_empty(locale_file: str) -> None:
    payload = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
    for key in HOME_KEYS:
        value = _nested_get(payload, key)
        assert value and value.strip(), f"{locale_file}: {key}"


@pytest.mark.parametrize("locale_file,expected", LOCALE_EXPECTATIONS.items())
def test_priority_locale_home_translations(locale_file: str, expected: dict[str, str]) -> None:
    payload = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))
    for key, translation in expected.items():
        assert _nested_get(payload, key) == translation


def test_non_english_locales_do_not_use_english_home_intro() -> None:
    en_intro = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))["home"]["intro"]
    for locale_file in AUTHORITATIVE:
        if locale_file == "en-GB.json":
            continue
        intro = json.loads((I18N_DIR / locale_file).read_text(encoding="utf-8"))["home"]["intro"]
        assert intro != en_intro, locale_file


def test_home_html_language_only_as_i18n_fallback() -> None:
    html = HOME_HTML.read_text(encoding="utf-8")
    assert html.count("Language") == 2  # label span + select aria-label fallback
    assert 'data-i18n="language.label"' in html
    assert 'data-i18n-aria-label="language.label"' in html


def test_home_html_uses_data_i18n() -> None:
    html = HOME_HTML.read_text(encoding="utf-8")
    assert 'data-i18n="language.label"' in html
    assert 'data-i18n="home.intro"' in html
    assert 'data-i18n="home.lifecycleCompare.comingSoon"' in html
    assert 'data-i18n="home.workflowViewer.open"' in html
    assert 'data-i18n-aria-label="language.label"' in html
    assert 'id="localeSelect"' in html
    assert "/static/i18n.js" in html


def test_home_html_coming_soon_only_as_i18n_fallback() -> None:
    html = HOME_HTML.read_text(encoding="utf-8")
    assert html.count("Coming soon") == 2
    assert 'data-i18n="home.lifecycleCompare.comingSoon"' in html
    assert 'data-i18n="home.vaultConfigTools.comingSoon"' in html


def test_app_shell_has_no_hardcoded_home_ui_strings() -> None:
    js = APP_SHELL_JS.read_text(encoding="utf-8")
    for forbidden in ("Coming soon", "Open Workflow Viewer", "Open Vault Config Viewer"):
        assert forbidden not in js


def test_app_shell_bootstraps_i18n() -> None:
    js = APP_SHELL_JS.read_text(encoding="utf-8")
    assert "await initI18n()" in js
    assert "bindLocaleSelect()" in js


@pytest.mark.parametrize("locale_file", AUTHORITATIVE)
def test_locale_files_parse_as_utf8_without_corruption(locale_file: str) -> None:
    text = (I18N_DIR / locale_file).read_text(encoding="utf-8")
    json.loads(text)
    for pattern in CORRUPTION_PATTERNS:
        assert not pattern.search(text), f"{locale_file}: {pattern.pattern}"


def test_pt_br_locale_label_in_registry() -> None:
    script = I18N_JS.read_text(encoding="utf-8")
    assert "Português (Brasil)" in script
