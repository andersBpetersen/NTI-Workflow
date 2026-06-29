"""Sync home/app-shell translations into all authoritative locale files."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
I18N_DIR = ROOT / "static" / "i18n"

HOME_TRANSLATIONS: dict[str, dict] = {
    "en-GB.json": {
        "language": {"label": "Language"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Internal tools for Vault configuration and lifecycle analysis.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Upload Excel output from NTI Vault Dump Config and visualize lifecycle transitions, roles and state permissions.",
                "open": "Open Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Compare two Vault lifecycle exports and find differences.",
                "comingSoon": "Coming soon",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Browse containers, processors, jobs and settings in an NTI for Vault Job JSON configuration.",
                "open": "Open Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Analysis tools for Vault configuration.",
                "comingSoon": "Coming soon",
            },
        },
    },
    "da-DK.json": {
        "language": {"label": "Sprog"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Interne værktøjer til Vault-konfiguration og lifecycle-analyse.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Upload Excel-output fra NTI Vault Dump Config og visualisér lifecycle transitions, roller og state permissions.",
                "open": "Åbn Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Sammenlign to Vault lifecycle-eksporter og find forskelle.",
                "comingSoon": "Kommer senere",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Gennemse containere, processorer, jobs og indstillinger i en NTI for Vault Job JSON-konfiguration.",
                "open": "Åbn Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Analyseværktøjer til Vault-konfiguration.",
                "comingSoon": "Kommer senere",
            },
        },
    },
    "pl-PL.json": {
        "language": {"label": "Język"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Wewnętrzne narzędzia do konfiguracji Vault i analizy cyklu życia.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Prześlij wynik Excel z NTI Vault Dump Config i wizualizuj przejścia cyklu życia, role oraz uprawnienia stanów.",
                "open": "Otwórz Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Porównaj dwa eksporty cyklu życia Vault i znajdź różnice.",
                "comingSoon": "Wkrótce",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Przeglądaj kontenery, procesory, zadania i ustawienia w konfiguracji JSON NTI for Vault Job.",
                "open": "Otwórz Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Narzędzia analityczne do konfiguracji Vault.",
                "comingSoon": "Wkrótce",
            },
        },
    },
    "de-DE.json": {
        "language": {"label": "Sprache"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Interne Werkzeuge für Vault-Konfiguration und Lifecycle-Analyse.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Laden Sie die Excel-Ausgabe aus NTI Vault Dump Config hoch und visualisieren Sie Lifecycle-Übergänge, Rollen und Statusberechtigungen.",
                "open": "Workflow Viewer öffnen",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Vergleichen Sie zwei Vault-Lifecycle-Exporte und finden Sie Unterschiede.",
                "comingSoon": "Demnächst",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Durchsuchen Sie Container, Prozessoren, Jobs und Einstellungen in einer NTI for Vault Job JSON-Konfiguration.",
                "open": "Vault Config Viewer öffnen",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Analysewerkzeuge für Vault-Konfiguration.",
                "comingSoon": "Demnächst",
            },
        },
    },
    "es-ES.json": {
        "language": {"label": "Idioma"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Herramientas internas para la configuración de Vault y el análisis del ciclo de vida.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Cargue la salida Excel de NTI Vault Dump Config y visualice transiciones del ciclo de vida, roles y permisos de estado.",
                "open": "Abrir Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Compare dos exportaciones del ciclo de vida de Vault y encuentre diferencias.",
                "comingSoon": "Próximamente",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Explore contenedores, procesadores, jobs y configuraciones en una configuración JSON de NTI for Vault Job.",
                "open": "Abrir Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Herramientas de análisis para la configuración de Vault.",
                "comingSoon": "Próximamente",
            },
        },
    },
    "fi-FI.json": {
        "language": {"label": "Kieli"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Sisäiset työkalut Vault-konfiguraatioon ja elinkaarianalyysiin.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Lataa NTI Vault Dump Configin Excel-tuloste ja visualisoi elinkaarisiirtymät, roolit ja tilojen käyttöoikeudet.",
                "open": "Avaa Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Vertaa kahta Vault-elinkaarivientiä ja etsi erot.",
                "comingSoon": "Tulossa myöhemmin",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Selaa kontteja, prosessoreita, töitä ja asetuksia NTI for Vault Job JSON -konfiguraatiossa.",
                "open": "Avaa Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Analyysityökalut Vault-konfiguraatioon.",
                "comingSoon": "Tulossa myöhemmin",
            },
        },
    },
    "fr-FR.json": {
        "language": {"label": "Langue"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Outils internes pour la configuration Vault et l’analyse du cycle de vie.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Importez la sortie Excel de NTI Vault Dump Config et visualisez les transitions de cycle de vie, les rôles et les autorisations d’état.",
                "open": "Ouvrir Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Comparez deux exports de cycle de vie Vault et trouvez les différences.",
                "comingSoon": "Bientôt disponible",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Parcourez les conteneurs, processeurs, jobs et paramètres dans une configuration JSON NTI for Vault Job.",
                "open": "Ouvrir Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Outils d’analyse pour la configuration Vault.",
                "comingSoon": "Bientôt disponible",
            },
        },
    },
    "it-IT.json": {
        "language": {"label": "Lingua"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Strumenti interni per la configurazione Vault e l’analisi del ciclo di vita.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Carica l’output Excel di NTI Vault Dump Config e visualizza transizioni del ciclo di vita, ruoli e autorizzazioni degli stati.",
                "open": "Apri Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Confronta due esportazioni del ciclo di vita Vault e trova le differenze.",
                "comingSoon": "Prossimamente",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Esplora contenitori, processori, jobs e impostazioni in una configurazione JSON NTI for Vault Job.",
                "open": "Apri Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Strumenti di analisi per la configurazione Vault.",
                "comingSoon": "Prossimamente",
            },
        },
    },
    "nl-NL.json": {
        "language": {"label": "Taal"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Interne tools voor Vault-configuratie en lifecycle-analyse.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Upload de Excel-uitvoer van NTI Vault Dump Config en visualiseer lifecycle-overgangen, rollen en statusmachtigingen.",
                "open": "Workflow Viewer openen",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Vergelijk twee Vault-lifecycle-exports en vind verschillen.",
                "comingSoon": "Binnenkort",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Bekijk containers, processors, jobs en instellingen in een NTI for Vault Job JSON-configuratie.",
                "open": "Vault Config Viewer openen",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Analysetools voor Vault-configuratie.",
                "comingSoon": "Binnenkort",
            },
        },
    },
    "no-NO.json": {
        "language": {"label": "Språk"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Interne verktøy for Vault-konfigurasjon og lifecycle-analyse.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Last opp Excel-utdata fra NTI Vault Dump Config og visualiser lifecycle-overganger, roller og state-tillatelser.",
                "open": "Åpne Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Sammenlign to Vault lifecycle-eksporter og finn forskjeller.",
                "comingSoon": "Kommer snart",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Bla gjennom containere, prosessorer, jobs og innstillinger i en NTI for Vault Job JSON-konfigurasjon.",
                "open": "Åpne Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Analyseverktøy for Vault-konfigurasjon.",
                "comingSoon": "Kommer snart",
            },
        },
    },
    "pt-BR.json": {
        "language": {"label": "Idioma"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Ferramentas internas para configuração do Vault e análise de ciclo de vida.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Envie a saída Excel do NTI Vault Dump Config e visualize transições de ciclo de vida, funções e permissões de estado.",
                "open": "Abrir Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Compare duas exportações de ciclo de vida do Vault e encontre diferenças.",
                "comingSoon": "Em breve",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Navegue por contêineres, processadores, jobs e configurações em uma configuração JSON do NTI for Vault Job.",
                "open": "Abrir Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Ferramentas de análise para configuração do Vault.",
                "comingSoon": "Em breve",
            },
        },
    },
    "sv-SE.json": {
        "language": {"label": "Språk"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Interna verktyg för Vault-konfiguration och lifecycle-analys.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Ladda upp Excel-utdata från NTI Vault Dump Config och visualisera lifecycle-övergångar, roller och state-behörigheter.",
                "open": "Öppna Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Jämför två Vault lifecycle-exporter och hitta skillnader.",
                "comingSoon": "Kommer snart",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Bläddra bland containrar, processorer, jobs och inställningar i en NTI for Vault Job JSON-konfiguration.",
                "open": "Öppna Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Analysverktyg för Vault-konfiguration.",
                "comingSoon": "Kommer snart",
            },
        },
    },
    "cs-CZ.json": {
        "language": {"label": "Jazyk"},
        "home": {
            "title": "NTI Workflow",
            "intro": "Interní nástroje pro konfiguraci Vault a analýzu životního cyklu.",
            "workflowViewer": {
                "title": "Workflow Viewer",
                "description": "Nahrajte výstup Excel z NTI Vault Dump Config a vizualizujte přechody životního cyklu, role a oprávnění stavů.",
                "open": "Otevřít Workflow Viewer",
            },
            "lifecycleCompare": {
                "title": "Lifecycle Compare",
                "description": "Porovnejte dva exporty životního cyklu Vault a najděte rozdíly.",
                "comingSoon": "Již brzy",
            },
            "vaultConfigViewer": {
                "title": "NTI for Vault Config",
                "description": "Procházejte kontejnery, procesory, úlohy a nastavení v JSON konfiguraci NTI for Vault Job.",
                "open": "Otevřít Vault Config Viewer",
            },
            "vaultConfigTools": {
                "title": "Vault Config Tools",
                "description": "Analytické nástroje pro konfiguraci Vault.",
                "comingSoon": "Již brzy",
            },
        },
    },
}


def main() -> None:
    for file_name, block in HOME_TRANSLATIONS.items():
        path = I18N_DIR / file_name
        data = json.loads(path.read_text(encoding="utf-8"))
        data["language"] = block["language"]
        data["home"] = block["home"]
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated home translations in {len(HOME_TRANSLATIONS)} locale files")


if __name__ == "__main__":
    main()
