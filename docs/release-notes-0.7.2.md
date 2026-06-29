# Release notes — 0.7.2

## Overblik

Patch-release der færdiggør internationalisering (i18n) i **NTI for Vault Config Viewer** efter en JSON-konfiguration er indlæst.

## Problem

Vault Config Viewer brugte fælles i18n til topbar, dropzone og upload, men mange interne UI-tekster (tabs, tabeller, søgning, status og tomme tilstande) forblev på engelsk eller dansk i markup og render-funktioner.

## Løsning

- Alle primære Vault Config UI-tekster kobles via `vault.*` keys i `static/i18n/*.json`
- `applyVaultLocaleTexts()` og `data-vault-i18n` opdaterer chrome uden reload
- Sprogskift efter JSON-load genrenderer paneler uden at miste data
- Statuslinje bruger placeholder-skabelon: `Loaded: {name} — {count} containers`

## Hvad oversættes nu

- Top-tabs (containers, deactivate, file paths)
- Skjul/vis inaktive, søgefelt, Find next
- Tabelheaders i venstre panel og jobprocessor-grid
- Tomme tilstande og statuslinje
- Modal-labels for Name, Description, Active, Priority

## Hvad oversættes IKKE

- Jobnavne fra JSON (fx `PreProcessFile`, `Inventor.Create.pdf`)
- Processor keys og container names
- JSON property names og brugerdata
- Vault tekniske type-navne i konfigurationen

## API og parser

- Ingen ændringer i API-kontrakt (kun `info.version` → `0.7.2`)
- Ingen ændringer i JSON-parser eller Workflow Viewer

## Opgradering fra 0.7.1

```text
NTI_WORKFLOW_IMAGE=tickjf/nti-workflow:0.7.2
```

```powershell
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
curl.exe http://localhost:8000/api/version
```

Forventet: `{"version":"0.7.2"}`

Docker image: `tickjf/nti-workflow:0.7.2`

## Rollback til 0.7.1

```text
NTI_WORKFLOW_IMAGE=tickjf/nti-workflow:0.7.1
```

Se [release-0.7.2-report.md](release-0.7.2-report.md) for testresultat.
