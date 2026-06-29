"""Sync workflow/vault upload-topbar i18n keys across all authoritative locale files."""

from __future__ import annotations

import json
from pathlib import Path

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

LOCALE_PATCHES: dict[str, dict[str, object]] = {
    "cs-CZ.json": {
        "nav": {"backHome": "Zpět na úvodní stránku"},
        "upload": {
            "chooseFile": "Vybrat soubor Excel",
            "dropTitle": "Přetáhněte soubor Excel sem",
            "dropSubtitle": "nebo klikněte pro výběr výstupního souboru Excel z",
            "supportedTypes": "Podporovaný typ souboru: .xlsx",
            "requiredSheet": "Soubor musí obsahovat list",
            "optionalSheet": "Pokud list",
            "optionalSheetSuffix": "existuje, lze zobrazit také state permissions.",
            "ariaLabel": "Nahrát výstupní soubor Excel z NTI Vault Dump Config",
        },
        "vault": {
            "loadConfig": "Načíst konfiguraci",
            "dropTitle": "Přetáhněte sem soubor JSON NTI for Vault Job",
            "dropSubtitle": "nebo klikněte pro výběr konfiguračního souboru",
            "supportedTypes": "Podporovaný typ souboru: .json",
            "ariaLabel": "Nahrát konfigurační soubor JSON NTI for Vault Job",
        },
    },
    "da-DK.json": {
        "nav": {"backHome": "Tilbage til forsiden"},
        "upload": {
            "chooseFile": "Vælg Excel-fil",
            "dropTitle": "Træk Excel-filen hertil",
            "dropSubtitle": "eller klik for at vælge Excel-outputfilen fra",
            "supportedTypes": "Understøttet filtype: .xlsx",
        },
        "vault": {
            "loadConfig": "Indlæs konfiguration",
            "dropTitle": "Træk en NTI for Vault Job JSON-fil hertil",
            "dropSubtitle": "eller klik for at vælge en konfigurationsfil",
            "supportedTypes": "Understøttet filtype: .json",
        },
    },
    "de-DE.json": {
        "nav": {"backHome": "Zurück zur Startseite"},
        "upload": {
            "chooseFile": "Excel-Datei auswählen",
            "dropTitle": "Excel-Datei hierher ziehen",
            "dropSubtitle": "oder klicken, um die Excel-Ausgabedatei aus",
            "supportedTypes": "Unterstützter Dateityp: .xlsx",
        },
        "vault": {
            "loadConfig": "Konfiguration laden",
            "dropTitle": "NTI-for-Vault-Job-JSON-Datei hierher ziehen",
            "dropSubtitle": "oder klicken, um eine Konfigurationsdatei auszuwählen",
            "supportedTypes": "Unterstützter Dateityp: .json",
            "ariaLabel": "NTI-for-Vault-Job-Konfigurations-JSON-Datei hochladen",
        },
    },
    "es-ES.json": {
        "nav": {"backHome": "Volver al inicio"},
        "upload": {
            "chooseFile": "Elegir archivo Excel",
            "dropTitle": "Arrastre el archivo Excel aquí",
            "dropSubtitle": "o haga clic para seleccionar el archivo de salida Excel de",
            "supportedTypes": "Tipo de archivo admitido: .xlsx",
        },
        "vault": {
            "loadConfig": "Cargar configuración",
            "dropTitle": "Arrastre un archivo JSON de NTI for Vault Job aquí",
            "dropSubtitle": "o haga clic para seleccionar un archivo de configuración",
            "supportedTypes": "Tipo de archivo admitido: .json",
        },
    },
    "fi-FI.json": {
        "nav": {"backHome": "Takaisin etusivulle"},
        "upload": {
            "chooseFile": "Valitse Excel-tiedosto",
            "dropTitle": "Vedä Excel-tiedosto tähän",
            "dropSubtitle": "tai napsauta valitaksesi Excel-tulostiedoston kohteesta",
            "supportedTypes": "Tuettu tiedostotyyppi: .xlsx",
        },
        "vault": {
            "loadConfig": "Lataa konfiguraatio",
            "dropTitle": "Vedä NTI for Vault Job JSON -tiedosto tähän",
            "dropSubtitle": "tai napsauta valitaksesi konfiguraatiotiedoston",
            "supportedTypes": "Tuettu tiedostotyyppi: .json",
            "ariaLabel": "Lähetä NTI for Vault Job JSON -konfiguraatiotiedosto",
        },
    },
    "fr-FR.json": {
        "nav": {"backHome": "Retour à l'accueil"},
        "upload": {
            "chooseFile": "Choisir un fichier Excel",
            "dropTitle": "Glissez le fichier Excel ici",
            "dropSubtitle": "ou cliquez pour sélectionner le fichier de sortie Excel depuis",
            "supportedTypes": "Type de fichier pris en charge : .xlsx",
        },
        "vault": {
            "loadConfig": "Charger la configuration",
            "dropTitle": "Glissez un fichier JSON NTI for Vault Job ici",
            "dropSubtitle": "ou cliquez pour sélectionner un fichier de configuration",
            "supportedTypes": "Type de fichier pris en charge : .json",
            "ariaLabel": "Importer un fichier JSON de configuration NTI for Vault Job",
        },
    },
    "it-IT.json": {
        "nav": {"backHome": "Torna alla home"},
        "upload": {
            "chooseFile": "Scegli file Excel",
            "dropTitle": "Trascina il file Excel qui",
            "dropSubtitle": "oppure fai clic per selezionare il file di output Excel da",
            "supportedTypes": "Tipo di file supportato: .xlsx",
        },
        "vault": {
            "loadConfig": "Carica configurazione",
            "dropTitle": "Trascina qui un file JSON NTI for Vault Job",
            "dropSubtitle": "oppure fai clic per selezionare un file di configurazione",
            "supportedTypes": "Tipo di file supportato: .json",
            "ariaLabel": "Carica file di configurazione JSON NTI for Vault Job",
        },
    },
    "nl-NL.json": {
        "nav": {"backHome": "Terug naar start"},
        "upload": {
            "chooseFile": "Excel-bestand kiezen",
            "dropTitle": "Sleep het Excel-bestand hierheen",
            "dropSubtitle": "of klik om het Excel-outputbestand te kiezen uit",
            "supportedTypes": "Ondersteund bestandstype: .xlsx",
        },
        "vault": {
            "loadConfig": "Configuratie laden",
            "dropTitle": "Sleep een NTI for Vault Job JSON-bestand hierheen",
            "dropSubtitle": "of klik om een configuratiebestand te selecteren",
            "supportedTypes": "Ondersteund bestandstype: .json",
            "ariaLabel": "NTI for Vault Job JSON-configuratiebestand uploaden",
        },
    },
    "no-NO.json": {
        "nav": {"backHome": "Tilbake til forsiden"},
        "upload": {
            "chooseFile": "Velg Excel-fil",
            "dropTitle": "Dra Excel-filen hit",
            "dropSubtitle": "eller klikk for å velge Excel-utdatafilen fra",
            "supportedTypes": "Støttet filtype: .xlsx",
        },
        "vault": {
            "loadConfig": "Last inn konfigurasjon",
            "dropTitle": "Dra en NTI for Vault Job JSON-fil hit",
            "dropSubtitle": "eller klikk for å velge en konfigurasjonsfil",
            "supportedTypes": "Støttet filtype: .json",
            "ariaLabel": "Last opp NTI for Vault Job JSON-konfigurasjon",
        },
    },
    "pl-PL.json": {
        "nav": {"backHome": "Wróć do strony głównej"},
        "upload": {
            "chooseFile": "Wybierz plik Excel",
            "dropTitle": "Przeciągnij tutaj plik Excel",
            "dropSubtitle": "lub kliknij, aby wybrać plik wyjściowy Excel z",
            "supportedTypes": "Obsługiwany typ pliku: .xlsx",
            "requiredSheet": "Plik musi zawierać arkusz",
            "optionalSheet": "Jeśli arkusz",
            "optionalSheetSuffix": "istnieje, uprawnienia stanów mogą być również wyświetlone.",
            "ariaLabel": "Prześlij plik wyjściowy Excel z NTI Vault Dump Config",
        },
        "vault": {
            "loadConfig": "Wczytaj konfigurację",
            "dropTitle": "Przeciągnij tutaj plik JSON NTI for Vault Job",
            "dropSubtitle": "lub kliknij, aby wybrać plik konfiguracji",
            "supportedTypes": "Obsługiwany typ pliku: .json",
            "ariaLabel": "Prześlij plik konfiguracji JSON NTI for Vault Job",
        },
    },
    "pt-BR.json": {
        "nav": {"backHome": "Voltar ao início"},
        "upload": {
            "chooseFile": "Escolher arquivo Excel",
            "dropTitle": "Arraste o arquivo Excel aqui",
            "dropSubtitle": "ou clique para selecionar o arquivo de saída Excel do",
            "supportedTypes": "Tipo de arquivo suportado: .xlsx",
        },
        "vault": {
            "loadConfig": "Carregar configuração",
            "dropTitle": "Arraste um arquivo JSON do NTI for Vault Job aqui",
            "dropSubtitle": "ou clique para selecionar um arquivo de configuração",
            "supportedTypes": "Tipo de arquivo suportado: .json",
        },
    },
    "sv-SE.json": {
        "nav": {"backHome": "Tillbaka till startsidan"},
        "upload": {
            "chooseFile": "Välj Excel-fil",
            "dropTitle": "Dra Excel-filen hit",
            "dropSubtitle": "eller klicka för att välja Excel-utdatafilen från",
            "supportedTypes": "Filtyp som stöds: .xlsx",
        },
        "vault": {
            "loadConfig": "Ladda konfiguration",
            "dropTitle": "Dra en NTI for Vault Job JSON-fil hit",
            "dropSubtitle": "eller klicka för att välja en konfigurationsfil",
            "supportedTypes": "Filtyp som stöds: .json",
            "ariaLabel": "Ladda upp NTI for Vault Job JSON-konfiguration",
        },
    },
}


def _deep_merge(target: dict, patch: dict) -> None:
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            _deep_merge(target[key], value)
        else:
            target[key] = value


def main() -> None:
    for locale_file in AUTHORITATIVE:
        path = I18N_DIR / locale_file
        data = json.loads(path.read_text(encoding="utf-8"))
        patch = LOCALE_PATCHES.get(locale_file)
        if patch:
            _deep_merge(data, patch)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated upload/topbar translations in {len(AUTHORITATIVE)} locale files")


if __name__ == "__main__":
    main()
