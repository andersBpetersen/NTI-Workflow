"""Add vault.uploadIntro to all authoritative locale files."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
I18N_DIR = ROOT / "static" / "i18n"

TRANSLATIONS: dict[str, str] = {
    "en-GB.json": "Choose or drag an NTI for Vault Job JSON configuration file.",
    "da-DK.json": "Vælg eller træk en NTI for Vault Job JSON-konfigurationsfil.",
    "it-IT.json": "Scegli o trascina un file di configurazione JSON NTI for Vault Job.",
    "pl-PL.json": "Wybierz lub przeciągnij plik konfiguracyjny JSON NTI for Vault Job.",
    "es-ES.json": "Elija o arrastre un archivo de configuración JSON de NTI for Vault Job.",
    "pt-BR.json": "Escolha ou arraste um arquivo de configuração JSON do NTI for Vault Job.",
    "de-DE.json": "Wählen oder ziehen Sie eine NTI-for-Vault-Job-JSON-Konfigurationsdatei.",
    "cs-CZ.json": "Vyberte nebo přetáhněte konfigurační soubor JSON NTI for Vault Job.",
    "fi-FI.json": "Valitse tai vedä NTI for Vault Job JSON -konfiguraatiotiedosto.",
    "fr-FR.json": "Choisissez ou faites glisser un fichier de configuration JSON NTI for Vault Job.",
    "nl-NL.json": "Kies of sleep een NTI for Vault Job JSON-configuratiebestand.",
    "no-NO.json": "Velg eller dra en NTI for Vault Job JSON-konfigurasjonsfil.",
    "sv-SE.json": "Välj eller dra en NTI for Vault Job JSON-konfigurationsfil.",
}


def main() -> None:
    for locale_file, text in TRANSLATIONS.items():
        path = I18N_DIR / locale_file
        data = json.loads(path.read_text(encoding="utf-8"))
        vault = data.setdefault("vault", {})
        vault["uploadIntro"] = text
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Added vault.uploadIntro to {len(TRANSLATIONS)} locale files")


if __name__ == "__main__":
    main()
