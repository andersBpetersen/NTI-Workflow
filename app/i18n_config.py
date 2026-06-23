"""Locale configuration shared by backend validation and tests."""

from __future__ import annotations

SUPPORTED_LOCALES: dict[str, dict[str, str]] = {
    "da-DK": {"countryLabel": "Danmark", "language": "da"},
    "pt-BR": {"countryLabel": "Brasil", "language": "pt-BR"},
    "de-DE": {"countryLabel": "Deutschland", "language": "de"},
    "fr-FR": {"countryLabel": "France", "language": "fr"},
    "es-ES": {"countryLabel": "España", "language": "es"},
    "en-IE": {"countryLabel": "Ireland", "language": "en"},
    "is-IS": {"countryLabel": "Ísland", "language": "is"},
    "it-IT": {"countryLabel": "Italia", "language": "it"},
    "nl-NL": {"countryLabel": "Nederland", "language": "nl"},
    "nb-NO": {"countryLabel": "Norge", "language": "nb"},
    "fi-FI": {"countryLabel": "Suomi", "language": "fi"},
    "sv-SE": {"countryLabel": "Sverige", "language": "sv"},
    "en-GB": {"countryLabel": "UK", "language": "en"},
}

DEFAULT_LOCALE = "en-GB"

LANGUAGE_LOCALE_PREFERENCES: dict[str, str] = {
    "en": "en-GB",
    "no": "nb-NO",
    "nb": "nb-NO",
    "nn": "nb-NO",
    "pt": "pt-BR",
    "de": "de-DE",
}


def normalize_locale(locale: str | None) -> str:
    if locale and locale in SUPPORTED_LOCALES:
        return locale
    return DEFAULT_LOCALE


def resolve_locale(saved: str | None, browser_locales: list[str]) -> str:
    if saved and saved in SUPPORTED_LOCALES:
        return saved

    for browser_locale in browser_locales:
        if browser_locale in SUPPORTED_LOCALES:
            return browser_locale

    for browser_locale in browser_locales:
        language_code = str(browser_locale or "").split("-")[0].lower()
        if language_code in LANGUAGE_LOCALE_PREFERENCES:
            return LANGUAGE_LOCALE_PREFERENCES[language_code]

        for locale_code, config in SUPPORTED_LOCALES.items():
            lang = config["language"].lower()
            if lang == language_code or lang.split("-")[0] == language_code:
                return locale_code

    return DEFAULT_LOCALE
