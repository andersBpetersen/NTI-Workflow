"""UTF-8 and Danish character regression tests."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
DA_DK = STATIC / "i18n" / "da-DK.json"

ACTIVE_HTML = [
    STATIC / "index.html",
    STATIC / "workflow" / "index.html",
    STATIC / "vault-config" / "index.html",
]
ACTIVE_JS = [
    STATIC / "app-shell.js",
    STATIC / "workflow" / "workflow-controller.js",
    STATIC / "i18n.js",
]

CORRUPTED_PATTERNS = [
    "?bn",
    "Tr?k",
    "Indl?s",
    "Indl?st",
    "p? Indl",
    "n?ste",
    "indl?s",
    "underst?ttes",
    "l?ses",
    "V?lg",
    "ogs?",
    "v?rkt",
]

EXPECTED_DANISH = [
    "Åbn",
    "Træk",
    "Indlæs",
    "Vælg",
    "også",
    "værktøjer",
]


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_da_dk_json_is_valid_utf8() -> None:
    text = DA_DK.read_text(encoding="utf-8")
    payload = json.loads(text)
    assert payload["language"]["label"] == "Sprog"


@pytest.mark.parametrize("path", ACTIVE_HTML)
def test_active_html_files_are_utf8(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    assert 'charset="utf-8"' in text.lower() or "charset=utf-8" in text.lower()


@pytest.mark.parametrize("path", ACTIVE_JS)
def test_active_js_files_are_utf8(path: Path) -> None:
    path.read_text(encoding="utf-8")


def test_da_dk_contains_expected_danish_strings() -> None:
    payload = json.loads(DA_DK.read_text(encoding="utf-8"))
    blob = json.dumps(payload, ensure_ascii=False)
    for token in EXPECTED_DANISH:
        assert token in blob, f"Missing expected Danish text: {token}"


def test_da_dk_has_no_corrupted_danish_patterns() -> None:
    text = DA_DK.read_text(encoding="utf-8")
    for pattern in CORRUPTED_PATTERNS:
        assert pattern not in text, f"Corrupted pattern found: {pattern}"


def test_no_unicode_replacement_in_active_runtime_files() -> None:
    for base in (STATIC / "i18n", STATIC):
        for path in base.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix not in {".json", ".html", ".js", ".css"}:
                continue
            if path.name != "da-DK.json" and "i18n" in path.parts and path.suffix == ".json":
                continue
            text = path.read_text(encoding="utf-8")
            assert "\ufffd" not in text, f"Replacement char in {path.relative_to(ROOT)}"


@pytest.mark.parametrize("route", ["/", "/workflow/", "/vault-config/"])
def test_html_routes_return_utf8_content_type(client: TestClient, route: str) -> None:
    response = client.get(route)
    assert response.status_code == 200
    content_type = response.headers.get("content-type", "").lower()
    assert "text/html" in content_type
    assert "charset=utf-8" in content_type


def test_da_dk_locale_served_and_parses(client: TestClient) -> None:
    response = client.get("/static/i18n/da-DK.json")
    assert response.status_code == 200
    payload = response.json()
    assert payload["home"]["vaultConfigViewer"]["open"] == "Åbn Vault Config Viewer"
    assert payload["vault"]["dropTitle"].startswith("Træk")


def test_vault_specific_strings_in_locale() -> None:
    payload = json.loads(DA_DK.read_text(encoding="utf-8"))
    vault = payload["vault"]
    assert vault["loadConfig"] == "Indlæs konfiguration"
    assert "Træk" in vault["dropTitle"]
    assert "vælg" in vault["dropSubtitle"]
    assert ".json" in vault["supportedTypes"]


def test_workflow_danish_upload_strings_unchanged() -> None:
    payload = json.loads(DA_DK.read_text(encoding="utf-8"))
    assert payload["upload"]["chooseFile"] == "Vælg Excel-fil"
    assert payload["upload"]["dropTitle"] == "Træk Excel-filen hertil"


def test_home_intro_contains_værktøjer() -> None:
    payload = json.loads(DA_DK.read_text(encoding="utf-8"))
    assert "værktøjer" in payload["home"]["intro"]


def test_corrupted_patterns_not_in_served_home_locale_chain(client: TestClient) -> None:
    """Ensure locale file used by app shell has no known corruption markers."""
    text = client.get("/static/i18n/da-DK.json").text
    for pattern in CORRUPTED_PATTERNS:
        assert pattern not in text
