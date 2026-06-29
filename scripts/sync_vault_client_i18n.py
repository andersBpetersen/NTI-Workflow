"""Add vaultClient i18n keys and generate anonymized client fixture."""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
I18N = ROOT / "static" / "i18n"
SOURCE = Path(r"C:\GitHub\NTI FOR VAULT CLIENT\NTI FOR VAULT Client.json")

HOME_VAULT_CLIENT = {
    "en-GB": {
        "title": "NTI for Vault Client",
        "description": "Browse settings, modules and client features in an NTI for Vault Client JSON configuration.",
        "open": "Open Vault Client Viewer",
    },
    "da-DK": {
        "title": "NTI for Vault Client",
        "description": "Gennemse indstillinger, moduler og klientfunktioner i en NTI for Vault Client JSON-konfiguration.",
        "open": "Åbn Vault Client Viewer",
    },
    "it-IT": {
        "title": "NTI for Vault Client",
        "description": "Esplora impostazioni, moduli e funzioni client in una configurazione JSON NTI for Vault Client.",
        "open": "Apri Vault Client Viewer",
    },
    "pl-PL": {
        "title": "NTI for Vault Client",
        "description": "Przeglądaj ustawienia, moduły i funkcje klienta w konfiguracji JSON NTI for Vault Client.",
        "open": "Otwórz Vault Client Viewer",
    },
    "es-ES": {
        "title": "NTI for Vault Client",
        "description": "Explore ajustes, módulos y funciones de cliente en una configuración JSON de NTI for Vault Client.",
        "open": "Abrir Vault Client Viewer",
    },
    "pt-BR": {
        "title": "NTI for Vault Client",
        "description": "Explore configurações, módulos e recursos do cliente em uma configuração JSON do NTI for Vault Client.",
        "open": "Abrir Vault Client Viewer",
    },
}

VAULT_CLIENT = {
    "en-GB": {
        "title": "NTI for Vault Client Viewer",
        "open": "Open Vault Client Viewer",
        "description": "Browse settings, modules and client features in an NTI for Vault Client JSON configuration.",
        "loadConfig": "Load Client Config",
        "uploadIntro": "Choose or drag an NTI for Vault Client JSON configuration file.",
        "dropTitle": "Drag an NTI for Vault Client JSON file here",
        "dropSubtitle": "or click to select a configuration file",
        "supportedTypes": "Supported file type: .json",
        "ariaLabel": "Upload NTI for Vault Client JSON configuration file",
        "filterPlaceholder": "Find module...",
        "emptyModule": "Select a module to see details.",
        "invalidJson": "The selected file is not valid JSON.",
        "errorJsonOnly": "Only .json files are supported.",
        "statusLoaded": "Loaded: {name} — {count} modules",
        "tableKey": "Key",
        "tableValue": "Value",
        "arrayItems": "{count} items",
    },
    "da-DK": {
        "title": "NTI for Vault Client Viewer",
        "open": "Åbn Vault Client Viewer",
        "description": "Gennemse indstillinger, moduler og klientfunktioner i en NTI for Vault Client JSON-konfiguration.",
        "loadConfig": "Indlæs Client Config",
        "uploadIntro": "Vælg eller træk en NTI for Vault Client JSON-konfigurationsfil.",
        "dropTitle": "Træk en NTI for Vault Client JSON-fil hertil",
        "dropSubtitle": "eller klik for at vælge en konfigurationsfil",
        "supportedTypes": "Understøttet filtype: .json",
        "ariaLabel": "Upload NTI for Vault Client JSON-konfiguration",
        "filterPlaceholder": "Find modul...",
        "emptyModule": "Vælg et modul for at se detaljer.",
        "invalidJson": "Den valgte fil er ikke gyldig JSON.",
        "errorJsonOnly": "Kun .json-filer understøttes.",
        "statusLoaded": "Indlæst: {name} — {count} moduler",
        "tableKey": "Nøgle",
        "tableValue": "Værdi",
        "arrayItems": "{count} elementer",
    },
    "it-IT": {
        "title": "NTI for Vault Client Viewer",
        "open": "Apri Vault Client Viewer",
        "description": "Esplora impostazioni, moduli e funzioni client in una configurazione JSON NTI for Vault Client.",
        "loadConfig": "Carica configurazione client",
        "uploadIntro": "Scegli o trascina un file di configurazione JSON NTI for Vault Client.",
        "dropTitle": "Trascina qui un file JSON NTI for Vault Client",
        "dropSubtitle": "oppure fai clic per selezionare un file di configurazione",
        "supportedTypes": "Tipo di file supportato: .json",
        "ariaLabel": "Carica configurazione JSON NTI for Vault Client",
        "filterPlaceholder": "Trova modulo...",
        "emptyModule": "Seleziona un modulo per vedere i dettagli.",
        "invalidJson": "Il file selezionato non è JSON valido.",
        "errorJsonOnly": "Sono supportati solo file .json.",
        "statusLoaded": "Caricato: {name} — {count} moduli",
        "tableKey": "Chiave",
        "tableValue": "Valore",
        "arrayItems": "{count} elementi",
    },
    "pl-PL": {
        "title": "NTI for Vault Client Viewer",
        "open": "Otwórz Vault Client Viewer",
        "description": "Przeglądaj ustawienia, moduły i funkcje klienta w konfiguracji JSON NTI for Vault Client.",
        "loadConfig": "Wczytaj konfigurację klienta",
        "uploadIntro": "Wybierz lub przeciągnij plik konfiguracyjny JSON NTI for Vault Client.",
        "dropTitle": "Przeciągnij tutaj plik JSON NTI for Vault Client",
        "dropSubtitle": "lub kliknij, aby wybrać plik konfiguracyjny",
        "supportedTypes": "Obsługiwany typ pliku: .json",
        "ariaLabel": "Prześlij konfigurację JSON NTI for Vault Client",
        "filterPlaceholder": "Znajdź moduł...",
        "emptyModule": "Wybierz moduł, aby zobaczyć szczegóły.",
        "invalidJson": "Wybrany plik nie jest prawidłowym JSON.",
        "errorJsonOnly": "Obsługiwane są tylko pliki .json.",
        "statusLoaded": "Wczytano: {name} — {count} modułów",
        "tableKey": "Klucz",
        "tableValue": "Wartość",
        "arrayItems": "{count} elementów",
    },
    "es-ES": {
        "title": "NTI for Vault Client Viewer",
        "open": "Abrir Vault Client Viewer",
        "description": "Explore ajustes, módulos y funciones de cliente en una configuración JSON de NTI for Vault Client.",
        "loadConfig": "Cargar configuración de cliente",
        "uploadIntro": "Elija o arrastre un archivo de configuración JSON de NTI for Vault Client.",
        "dropTitle": "Arrastre aquí un archivo JSON de NTI for Vault Client",
        "dropSubtitle": "o haga clic para seleccionar un archivo de configuración",
        "supportedTypes": "Tipo de archivo admitido: .json",
        "ariaLabel": "Cargar configuración JSON de NTI for Vault Client",
        "filterPlaceholder": "Buscar módulo...",
        "emptyModule": "Seleccione un módulo para ver los detalles.",
        "invalidJson": "El archivo seleccionado no es JSON válido.",
        "errorJsonOnly": "Solo se admiten archivos .json.",
        "statusLoaded": "Cargado: {name} — {count} módulos",
        "tableKey": "Clave",
        "tableValue": "Valor",
        "arrayItems": "{count} elementos",
    },
    "pt-BR": {
        "title": "NTI for Vault Client Viewer",
        "open": "Abrir Vault Client Viewer",
        "description": "Explore configurações, módulos e recursos do cliente em uma configuração JSON do NTI for Vault Client.",
        "loadConfig": "Carregar configuração do cliente",
        "uploadIntro": "Escolha ou arraste um arquivo de configuração JSON do NTI for Vault Client.",
        "dropTitle": "Arraste um arquivo JSON do NTI for Vault Client aqui",
        "dropSubtitle": "ou clique para selecionar um arquivo de configuração",
        "supportedTypes": "Tipo de arquivo suportado: .json",
        "ariaLabel": "Carregar configuração JSON do NTI for Vault Client",
        "filterPlaceholder": "Encontrar módulo...",
        "emptyModule": "Selecione um módulo para ver os detalhes.",
        "invalidJson": "O arquivo selecionado não é JSON válido.",
        "errorJsonOnly": "Somente arquivos .json são suportados.",
        "statusLoaded": "Carregado: {name} — {count} módulos",
        "tableKey": "Chave",
        "tableValue": "Valor",
        "arrayItems": "{count} itens",
    },
}

VAULT_CLIENT_TABS = {
    "en-GB": {"modules": "Modules"},
    "da-DK": {"modules": "Moduler"},
    "it-IT": {"modules": "Moduli"},
    "pl-PL": {"modules": "Moduły"},
    "es-ES": {"modules": "Módulos"},
    "pt-BR": {"modules": "Módulos"},
}

VAULT_CLIENT_DETAIL = {
    "en-GB": {
        "object": "Object",
        "array": "Array",
        "string": "String",
        "number": "Number",
        "boolean": "Boolean",
        "null": "Null",
        "keys": "Keys",
        "items": "Items",
        "noFilterResults": "No modules match the filter.",
        "nestedValue": "Nested value",
        "rawJson": "Raw JSON",
    },
    "da-DK": {
        "object": "Objekt",
        "array": "Liste",
        "string": "Tekst",
        "number": "Tal",
        "boolean": "Sand/falsk",
        "null": "Null",
        "keys": "nøgler",
        "items": "elementer",
        "noFilterResults": "Ingen moduler matcher filteret.",
        "nestedValue": "Underliggende værdi",
        "rawJson": "Rå JSON",
    },
    "it-IT": {
        "object": "Oggetto",
        "array": "Elenco",
        "string": "Testo",
        "number": "Numero",
        "boolean": "Booleano",
        "null": "Null",
        "keys": "chiavi",
        "items": "elementi",
        "noFilterResults": "Nessun modulo corrisponde al filtro.",
        "nestedValue": "Valore annidato",
        "rawJson": "JSON grezzo",
    },
    "pl-PL": {
        "object": "Obiekt",
        "array": "Lista",
        "string": "Tekst",
        "number": "Liczba",
        "boolean": "Wartość logiczna",
        "null": "Null",
        "keys": "klucze",
        "items": "elementy",
        "noFilterResults": "Żaden moduł nie pasuje do filtra.",
        "nestedValue": "Wartość zagnieżdżona",
        "rawJson": "Surowy JSON",
    },
    "es-ES": {
        "object": "Objeto",
        "array": "Lista",
        "string": "Texto",
        "number": "Número",
        "boolean": "Booleano",
        "null": "Null",
        "keys": "claves",
        "items": "elementos",
        "noFilterResults": "Ningún módulo coincide con el filtro.",
        "nestedValue": "Valor anidado",
        "rawJson": "JSON sin formato",
    },
    "pt-BR": {
        "object": "Objeto",
        "array": "Lista",
        "string": "Texto",
        "number": "Número",
        "boolean": "Booleano",
        "null": "Null",
        "keys": "chaves",
        "items": "itens",
        "noFilterResults": "Nenhum módulo corresponde ao filtro.",
        "nestedValue": "Valor aninhado",
        "rawJson": "JSON bruto",
    },
}

GUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


def scrub(value: object, key: str | None = None) -> object:
    if isinstance(value, dict):
        cleaned: dict[str, object] = {}
        for child_key, child_value in value.items():
            if child_key == "Icon" and isinstance(child_value, str) and len(child_value) > 80:
                cleaned[child_key] = None
                continue
            cleaned[child_key] = scrub(child_value, child_key)
        return cleaned
    if isinstance(value, list):
        return [scrub(item, key) for item in value[:3]]
    if isinstance(value, str):
        if GUID_RE.match(value):
            return "00000000-0000-0000-0000-000000000001"
        if key and "Path" in key:
            return "$/Sample/Path"
        if len(value) > 200:
            return "sample-value"
        return value
    return value


def update_locales() -> None:
    english = VAULT_CLIENT["en-GB"]
    english_tabs = VAULT_CLIENT_TABS["en-GB"]
    english_detail = VAULT_CLIENT_DETAIL["en-GB"]
    for path in sorted(I18N.glob("*.json")):
        locale = path.stem
        data = json.loads(path.read_text(encoding="utf-8"))
        data.setdefault("home", {})["vaultClientViewer"] = copy.deepcopy(
            HOME_VAULT_CLIENT.get(locale, HOME_VAULT_CLIENT["en-GB"])
        )
        vault_client = copy.deepcopy(VAULT_CLIENT.get(locale, english))
        vault_client["tabs"] = copy.deepcopy(VAULT_CLIENT_TABS.get(locale, english_tabs))
        vault_client["detail"] = copy.deepcopy(VAULT_CLIENT_DETAIL.get(locale, english_detail))
        data["vaultClient"] = vault_client
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_fixture() -> None:
    raw = json.loads(SOURCE.read_text(encoding="utf-8-sig"))
    obj = raw[0] if isinstance(raw, list) else raw
    fixture_obj = scrub(obj)
    fixture_obj["Name"] = "Sample Vault Client Config"
    fixture_obj["DisplayName"] = "Sample Vault Client"
    fixture_obj["Description"] = "Anonymized sample configuration for tests"
    fixture_obj["Version"] = "1.0.0-sample"
    fixture_obj["Id"] = "00000000-0000-0000-0000-000000000001"
    out = ROOT / "samples" / "fixture-vault-client-config.json"
    out.write_text(json.dumps([fixture_obj], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    update_locales()
    write_fixture()
    print("vaultClient i18n and fixture updated")


if __name__ == "__main__":
    main()
