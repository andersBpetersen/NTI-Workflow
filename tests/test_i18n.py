"""Tests for internationalization configuration and translation files."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.export_html import build_standalone_html, load_all_translations
from app.i18n_config import DEFAULT_LOCALE, SUPPORTED_LOCALES, normalize_locale, resolve_locale

I18N_DIR = Path(__file__).resolve().parent.parent / "static" / "i18n"
EN_FILE = I18N_DIR / "en.json"


def _collect_keys(data: dict, prefix: str = "") -> set[str]:
    keys: set[str] = set()
    for key, value in data.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            keys.update(_collect_keys(value, full_key))
        else:
            keys.add(full_key)
    return keys


@pytest.fixture(scope="module")
def en_keys() -> set[str]:
    return _collect_keys(json.loads(EN_FILE.read_text(encoding="utf-8")))


def test_all_locale_files_exist() -> None:
    expected = {
        "en",
        "da",
        "pt-BR",
        "de",
        "fr",
        "es",
        "is",
        "it",
        "nl",
        "nb",
        "fi",
        "sv",
    }
    found = {path.stem for path in I18N_DIR.glob("*.json")}
    assert expected.issubset(found)


def test_all_locale_files_have_same_keys_as_en(en_keys: set[str]) -> None:
    for path in I18N_DIR.glob("*.json"):
        keys = _collect_keys(json.loads(path.read_text(encoding="utf-8")))
        assert keys == en_keys, f"Key mismatch in {path.name}"


def test_supported_locales_include_required_countries() -> None:
    labels = {config["countryLabel"] for config in SUPPORTED_LOCALES.values()}
    for country in [
        "Danmark",
        "Brasil",
        "Deutschland",
        "France",
        "España",
        "Ireland",
        "Ísland",
        "Italia",
        "Nederland",
        "Norge",
        "Suomi",
        "Sverige",
        "UK",
    ]:
        assert country in labels


def test_normalize_locale_known_values() -> None:
    assert normalize_locale("da-DK") == "da-DK"
    assert normalize_locale("en-GB") == "en-GB"


def test_normalize_locale_unknown_defaults_to_en_gb() -> None:
    assert normalize_locale("xx-YY") == DEFAULT_LOCALE
    assert normalize_locale(None) == DEFAULT_LOCALE


@pytest.mark.parametrize(
    ("browser_locales", "expected"),
    [
        (["da-DK", "en-US"], "da-DK"),
        (["de-AT", "en-US"], "de-DE"),
        (["pt-PT", "en-US"], "pt-BR"),
        (["no-NO", "en-US"], "nb-NO"),
        (["en-US", "en"], "en-GB"),
        (["xx-YY", "zz-ZZ"], DEFAULT_LOCALE),
    ],
)
def test_resolve_locale_browser_matching(browser_locales: list[str], expected: str) -> None:
    assert resolve_locale(None, browser_locales) == expected


def test_resolve_locale_saved_value_has_priority() -> None:
    assert resolve_locale("fr-FR", ["da-DK"]) == "fr-FR"


def test_resolve_locale_invalid_saved_value_ignored() -> None:
    assert resolve_locale("invalid-locale", ["da-DK"]) == "da-DK"


def test_load_all_translations_includes_english() -> None:
    translations = load_all_translations()
    assert "en" in translations
    assert translations["en"]["language"]["label"] == "Language"


def test_standalone_html_embeds_translations(sample_payload: dict) -> None:
    html = build_standalone_html(
        payload=sample_payload,
        source_file_name="sample-lifecycle.xlsx",
        selected_life_cycle="Basic Release Process",
        viewer_context={"locale": "da-DK"},
    )

    assert 'id="localeSelect"' in html
    assert "window.NTI_TRANSLATIONS" in html
    assert '"da":' in html
    assert '"en":' in html
    assert "initI18n().then" in html
    assert "bindLocaleSelect" in html
    assert 'data-i18n="filters.showAllow"' in html
    assert '"language":' in html


def test_i18n_js_exposes_locale_resolution() -> None:
    i18n_js = (Path(__file__).resolve().parent.parent / "static" / "i18n.js").read_text(
        encoding="utf-8",
    )
    assert "resolveInitialLocale" in i18n_js
    assert "markerUnits" not in i18n_js
    assert "LOCALE_STORAGE_KEY" in i18n_js
    assert "window.NTI_TRANSLATIONS" in i18n_js or "NTI_TRANSLATIONS" in i18n_js
