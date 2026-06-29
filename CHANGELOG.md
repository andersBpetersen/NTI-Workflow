# Changelog

Alle bemærkelsesværdige ændringer i dette projekt dokumenteres i denne fil.

## [0.7.2] - 2026-06-29

### Fixed
- Færdiggjort i18n i NTI for Vault Config Viewer efter JSON-indlæsning.
- Oversat tabs, knapper, søgefelt, tabelheaders, statuslinje og tomme tilstande i Vault Config Viewer.
- Sikret at tekniske jobnavne, processor keys og brugerdata ikke oversættes.

## [0.7.1] - 2026-06-25

### Fixed

- Rettet beskadigede danske tegn i app shell og Vault Config Viewer.
- Sikret UTF-8-kodning for aktive locale-, HTML- og JavaScript-filer.
- Tilføjet regressionstest for danske specialtegn.
- Ensrettet uploadområderne i Workflow Viewer og Vault Config Viewer.

## [0.7.0] - 2026-06-25

### Added

- App shell med separate moduler (forside, Workflow, Vault Config)
- Vault Config Viewer på `/vault-config/` (lokal JSON i browseren)
- Fælles internationalisering (`static/i18n.js`, 13 locale-filer)
- Shared frontend (`static/shared/` — UI tokens, forms, file/DOM helpers)
- Backend routes, models og services (`app/routes/`, `app/models/`, `app/services/`)
- Canonical OpenAPI-kontrakt (`docs/openapi-contract.json`)
- Arkitekturdokumentation (`docs/architecture.md`, `docs/backend-architecture.md`)

### Changed

- Workflow Viewer flyttet til `/workflow/` med egen controller
- Backend opdelt uden ændring af API-kontrakt
- Locale-håndtering samlet på tværs af moduler (`nti.locale`, `nti:locale-changed`)
- Frontend-styles og utilities konsolideret i shared-lag
- Projektstruktur og dokumentation opdateret

### Removed

- Legacy frontend-monolit (`static/app.js`)
- Ubrugt Vault Config JS (`static/vault-config/vault-config.js`)
- Ubrugt `static/style.css`
- Midlertidige compatibility-shims (`app/parser.py`, `app/export_html.py`)
- Dublerede korte locale-filer (fx `en.json`, `da.json`)
- Dublerede OpenAPI-filer i dokumentationsroden (flyttet til `docs/refactor-history/phase-5/`)

### Compatibility

- Eksisterende Workflow API er uændret (`/api/upload`, `/api/export/html`, `/health`, `/api/version`)
- Parser-output er uændret
- HTML-eksport er uændret
- Docker startkommando uændret: `uvicorn app.main:app`

## [0.6.6] - tidligere

- Allow-, Deny- og ikke-specificerede pilespidser gjort dobbelt så store i workflowdiagrammet.

## [0.6.5] - tidligere

- Ens pilespidser, Vis Allow-filter og Custom JobTypes som klikbare markeringer.

## [0.6.4] - tidligere

- Samlet UI-opdatering med drag-and-drop, state permissions og kontrollayout.
