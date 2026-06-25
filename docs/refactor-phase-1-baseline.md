# Refactor Phase 1 Baseline

- Dato/tid: 2026-06-25 (lokal kørsel)
- Branch: `refactor/app-shell-workflow-split`
- Commit ved baseline: `a5707d2`

## Git-status før ændringer i denne fase

```text
 M README.md
 M app/main.py
MM static/app.js
AM static/i18n.js
A  static/i18n/da.json
A  static/i18n/de.json
A  static/i18n/en.json
A  static/i18n/es.json
A  static/i18n/fi.json
A  static/i18n/fr.json
A  static/i18n/is.json
A  static/i18n/it.json
A  static/i18n/nb.json
A  static/i18n/nl.json
AM static/i18n/pt-BR.json
A  static/i18n/sv.json
MM static/index.html
MM static/viewer.css
M  static/viewer.js
?? review-export/
?? samples/fixture-vault-job-config.json
?? static/i18n/cs-CZ.json
?? static/i18n/da-DK.json
?? static/i18n/de-DE.json
?? static/i18n/en-GB.json
?? static/i18n/es-ES.json
?? static/i18n/fi-FI.json
?? static/i18n/fr-FR.json
?? static/i18n/it-IT.json
?? static/i18n/nl-NL.json
?? static/i18n/no-NO.json
?? static/i18n/pl-PL.json
?? static/i18n/sv-SE.json
?? static/vault-config/
?? tests/test_i18n_locales.py
?? tests/test_vault_config.py
```

## Baseline test/build (før faseændringer)

- Testkommando: `pytest tests/ -q`
- Testresultat: `31 passed in 1.12s`
- Buildkommando: `docker build -t nti-workflow:phase1-baseline .`
- Buildresultat: fejlede pga. ikke-kørende Docker daemon:
  - `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`

## Aktuel route-struktur ved baseline

- `GET /` → `static/index.html` (forside + indlejret Workflow Viewer-markup i samme HTML)
- `GET /vault-config/` → `static/vault-config/index.html`
- `GET /health` → health
- `POST /api/upload` → workflow upload/parse
- `POST /api/export/html` → workflow eksport
- `GET /static/*` → statiske filer

## Kendte fejl før ændringer

- Docker-build kan ikke verificeres i baseline-miljøet, fordi Docker daemon ikke var startet.
- Ingen baseline testfejl i pytest.

## Efter fase 1+2 (sammenligning)

- Ny route: `GET /workflow` og `GET /workflow/` til selvstændig Workflow Viewer-side.
- Forside (`/`) er adskilt fra Workflow Viewer-markup.
- Ny read-only versionskilde via backend endpoint: `GET /api/version`.
- Testresultat efter ændringer: `41 passed in 1.07s`.
- Build-check efter ændringer: fortsat ikke verificerbar lokalt pga. ikke-kørende Docker daemon.
