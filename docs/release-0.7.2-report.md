# Release 0.7.2 — rapport

## 1. Branch og baseline

| Felt | Værdi |
|------|-------|
| Branch | `refactor/app-shell-workflow-split` |
| Baseline commit | `a6ed0c8` (Add Danish user guide PDFs) |
| Seneste release-tag ved start | `v0.7.1` |

## 2. Vault Config i18n-gap (før ændring)

| UI-tekst | Fil | Kontekst | Skal oversættes |
|----------|-----|----------|-----------------|
| Job processor containers | `index.html` top tabs | Tab-nav | Ja |
| Deactivate job processors | `index.html` top tabs | Tab-nav | Ja |
| File paths to exclude… | `index.html` top tabs | Tab-nav | Ja |
| Hide inactive / Vis alle | `index.html` toolbar | Knap | Ja |
| Find… / Find next | `index.html` søgning | Placeholder/knap | Ja |
| Name / Description | `index.html` thead | Tabelheader | Ja |
| Active / Job processor key / Run only via… | `index.html` proc thead | Tabelheader | Ja |
| Vælg en container / jobprocessor | `renderProc` / `renderDetail` | Tom tilstand | Ja |
| Statuslinje (Loaded/Indlæst) | `initConfig` | Status | Ja |
| PreProcessFile / Inventor.Create.pdf | JSON + `getTabsForProcessor` | Teknisk data | **Nej** |

`applyVaultLocaleTexts()` dækkede kun topbar og tabs — ikke thead, render-tekster eller status efter JSON-load.

## 3. Hardkodede tekster flyttet til i18n

- Top-tabs, skjul/vis inaktive, søgefelt, Find next
- Venstre og processor tabelheaders
- Tomme tilstande i `renderLeft`, `renderProc`, `renderDetail`
- Statuslinje med `{name}` og `{count}` placeholders
- General-tab labels (Active, Description, Job processor key, Run only via…)
- Jobs-tabeller og modal-felter (Name, Description, Active, Priority)
- Modal tabs (Conditions, Parameters) og Close

## 4. Nye/opdaterede `vault.*` keys

`searchPlaceholder`, `tableName`, `tableDescription`, `tableActive`, `tableJobProcessorKey`, `tableRunOnlyViaJobProcessorKey`, `tablePriority`, `emptyChooseContainer`, `emptyChooseJobProcessor`, `emptyNoContainers`, `emptyNoProcessors`, `emptyNoFilePaths`, `emptyNoDeactivateConfig`, `statusLoaded` (med placeholders), `statusVersionPrefix`, `modalClose`, `modalConditions`, `modalParameters`, `modalJob`, `unknownConfigName`, `readonlyViewerTitle`

Fjernet: `containersCountSuffix` (erstattet af `statusLoaded` skabelon).

## 5. Sprog opdateret

| Locale | Status |
|--------|--------|
| en-GB | Canonical |
| da-DK | Fuld oversættelse |
| es-ES | Fuld oversættelse |
| pt-BR | Fuld oversættelse (UTF-8 rettet) |
| øvrige 9 locales | Samme key-struktur, engelsk fallback for nye keys |

## 6. Tekniske data der ikke oversættes

- `PreProcessFile`, `PreProcessItem`, `Inventor.Create.pdf`, `Autocad.Create.*`
- Processor keys, container names, JSON property names
- Brugerdata fra indlæst konfiguration

## 7. Tests tilføjet/ændret

| Fil | Ændring |
|-----|---------|
| `tests/test_vault_config_i18n.py` | **Ny** — 44 tests for keys, locales, hardcoded UI, tekniske data |
| `tests/test_release_072.py` | **Ny** — version 0.7.2 |
| `tests/test_release_071.py` | Fjernet (erstattet af 072) |
| `tests/test_vault_config.py` | Opdateret loadConfig assertion |
| `tests/test_i18n_locales.py` | Opdateret `vt()` og locale-change listener |

## 8. Version

| | Før | Efter |
|---|-----|-------|
| APP_VERSION | 0.7.1 | **0.7.2** |
| OpenAPI info.version | 0.7.1 | **0.7.2** |
| Docker default tag | 0.7.1 | **0.7.2** |

## 9. OpenAPI

Kun `info.version` ændret. Paths, schemas og responses uændret (verificeret i `test_release_072.py`).

## 10. Testresultat

```text
200 passed, 1 warning
```

## 11. Lokal browsertest

Ikke kørt manuelt i browser. Programmatisk verifikation:

- Vault HTML bruger `data-vault-i18n` og `onVaultLocaleChanged`
- Locale-filer valideret for key-struktur og prioritets-sprog
- Workflow Viewer-tests uændret og består

## 12. Docker build

```text
FEJL: Docker Desktop kører ikke (npipe:////./pipe/dockerDesktopLinuxEngine ikke tilgængelig)
```

Image `tickjf/nti-workflow:0.7.2` er **ikke** bygget i denne session.

## 13. Docker runtime-test

Ikke kørt — afhænger af Docker Desktop.

## 14. Compose

Med `docker compose --env-file NUL -f docker-compose.prod.yml config`:

```text
image: tickjf/nti-workflow:0.7.2
```

Lokal `.env` kan stadig overskrive image-tag.

## 15. Kendte begrænsninger

- Detaljepaneler (Properties, Export, iLogic m.fl.) har stadig engelske formularlabels i dybere tabs — uden for denne patches primære chrome-scope
- `getTabsForProcessor` bruger stadig hardkodede danske/engelske tab-labels (`Generelt`, `Eksport`) — tekniske processor-type tabs
- Docker build/runtime afventer kørende Docker Desktop

## 16. Rollback-plan

```text
NTI_WORKFLOW_IMAGE=tickjf/nti-workflow:0.7.1
git checkout v0.7.1
```

## 17. Anbefalet commit

```text
Complete Vault Config i18n in 0.7.2
```

## 18. Anbefalet tag

```text
v0.7.2
```

## 19. Git-status

Se `git status --short` ved aflevering (ingen commit/tag/push udført automatisk).
