# Fase 5 — Backend-opdeling — slutrapport

## 1. Aktiv branch

`refactor/app-shell-workflow-split` (seneste commit før fase 5: `e80fa41`)

## 2. Backendstruktur før

```text
app/
  main.py              # routes, modeller, upload, export, static mount
  parser.py            # Excel-parsing
  export_html.py       # HTML-eksport
  core/
    version.py
```

## 3. Backendstruktur efter

```text
app/
  main.py              # FastAPI app, router-registration, static mount
  parser.py            # compatibility shim
  export_html.py       # compatibility shim
  core/
    version.py
    settings.py
  routes/
    pages.py
    system.py
    workflow_api.py
  models/
    workflow.py
  services/
    workflow/
      parser.py
      export_html.py
      upload.py
      export_service.py
```

## 4. Nye route-moduler

| Modul | Type | Indhold |
|-------|------|---------|
| `app/routes/pages.py` | route | Forside, workflow, vault-config HTML |
| `app/routes/system.py` | route | `/health`, `/api/version` |
| `app/routes/workflow_api.py` | route | `/api/upload`, `/api/export/html` |

## 5. Nye modelmoduler

| Modul | Type | Indhold |
|-------|------|---------|
| `app/models/workflow.py` | model | `ViewerContext`, `ExportHtmlRequest` |

## 6. Nye service-moduler

| Modul | Type | Indhold |
|-------|------|---------|
| `app/services/workflow/parser.py` | service | Excel-parsing (flyttet uændret) |
| `app/services/workflow/export_html.py` | service | HTML template/string-bygning |
| `app/services/workflow/upload.py` | service | Upload-validering + parse |
| `app/services/workflow/export_service.py` | service | Eksport-orkestrering |

## 7. Hvad der blev i `main.py`

- `FastAPI(...)` med titel, beskrivelse og version fra settings/core
- `include_router` for pages, system, workflow_api
- `StaticFiles` mount på `/static`
- Re-export af `MAX_UPLOAD_BYTES` (bagudkompatibilitet for tests)

## 8. Parserens placering og compatibility

- **Implementering**: `app/services/workflow/parser.py` (kopi af original `app/parser.py`)
- **Shim**: `app/parser.py` re-eksporterer alle symboler
- **Tests**: `tests/test_parser.py` importerer stadig `app.parser` — grønne
- **Algoritme**: uændret

## 9. HTML-exportens placering

- **Implementering**: `app/services/workflow/export_html.py`
- **STATIC_DIR**: importeres fra `app.core.settings` (samme fysiske sti som før)
- **Shim**: `app/export_html.py`
- **HTTP-response**: oprettes i `app/routes/workflow_api.py`
- **Orkestrering**: `app/services/workflow/export_service.py`

## 10. Settings-beslutning

Oprettet `app/core/settings.py` med:

- `BASE_DIR`, `STATIC_DIR`
- `APP_TITLE`, `APP_DESCRIPTION`
- `MAX_UPLOAD_BYTES` (25 MB)
- `ALLOWED_UPLOAD_EXTENSIONS`
- `NO_CACHE_HEADERS`

Ingen Pydantic Settings eller miljøvariabler — kun konstanter som før var hardkodede i `main.py`.

## 11. OpenAPI-sammenligning

Filer:

- `docs/openapi-before-phase-5.json`
- `docs/openapi-after-phase-5.json`

| Path | Metode | Resultat |
|------|--------|----------|
| `/health` | GET | MATCH (parameters, responses) |
| `/api/version` | GET | MATCH |
| `/api/upload` | POST | MATCH |
| `/api/export/html` | POST | MATCH |

Paths uændret: `/`, `/workflow`, `/workflow/`, `/vault-config/` samt alle API-paths.

Tilladte forskelle: `operationId` kan afvige internt; rækkefølge i JSON.

## 12. Testresultat

```text
79 passed in ~1.3s
```

Nye tests i `tests/test_backend_structure.py` (import, side-routes, health/version, upload/export URLs, fixture-upload, parser-struktur, OpenAPI-sammenligning).

Eksisterende suites grønne: API, parser, export_html, routes_split, vault_config, i18n_locales, shared_frontend.

## 13. Parser-regressionstest

- `tests/test_parser.py` — grøn (fuld parser-dækning med fixtures)
- `tests/test_api.py::test_upload_sample_excel` — 5 transitions, 4 nodes, 5 edges
- `tests/test_backend_structure.py::test_parser_output_structure_unchanged` — samme strukturelle tal

Ingen baseline-JSON gemt på disk (afvist af sikkerhedscheck); regression dækket via eksisterende + nye strukturtests.

## 14. Manuel test

Server startet med `uvicorn app.main:app` — ingen importfejl.

TestClient smoke:

| URL | Status |
|-----|--------|
| `/` | 200 HTML |
| `/workflow/` | 200 HTML |
| `/vault-config/` | 200 HTML |
| `/health` | 200 `{"status":"ok"}` |
| `/api/version` | 200 med version |
| `POST /api/upload` (sample) | 200, 5 transitions |

Fuld browser-test af diagram/eksport/Vault JSON blev ikke gentaget i denne fase; fase 4 manuel godkendelse gælder for frontend. API-upload bekræftet programmatisk.

## 15. Bekræftelse på uændrede API-kontrakter

- URL'er uændrede
- HTTP-metoder uændrede
- Multipart feltnavn `file` uændret
- Request/response JSON og fejlformat uændrede (400/422 med samme danske beskeder)
- HTML-eksport content-type og `Content-Disposition` uændrede

## 16. Bekræftelse på uændret parserlogik

Parserfil kopieret uændret til `app/services/workflow/parser.py`. Ingen ændring i sheet-navne, kolonner eller outputstruktur.

## 17. Bekræftelse på uændret eksport-output

`export_html.py` logik uændret; kun `STATIC_DIR`-import flyttet til settings. `tests/test_export_html.py` grøn.

## 18. Kendte resterende backend-koblinger

- `export_html` læser stadig `static/viewer.css`, `static/viewer.js` m.m. fra `STATIC_DIR`
- Compatibility shims (`app/parser.py`, `app/export_html.py`) kan fjernes i senere fase når alle imports peger på services
- `upload.py` bruger `UploadFile` fra FastAPI (pragmatisk; kan isoleres yderligere senere)

## 19. Legacy frontend-observationer

| Fil | Aktiv HTML? | Tests? | Næste fase |
|-----|-------------|--------|------------|
| `static/app.js` | Nej — `index.html` bruger `app-shell.js`; workflow bruger `workflow-controller.js` | Nej | Kandidat til oprydning |
| `static/vault-config/vault-config.js` | Nej — `vault-config/index.html` bruger inline script | Nej | Kandidat til oprydning |

Ingen af filerne slettet i fase 5.

## 20. `git status --short`

```text
 M app/export_html.py
 M app/main.py
 M app/parser.py
?? app/core/settings.py
?? app/models/
?? app/routes/
?? app/services/
?? docs/backend-architecture.md
?? docs/openapi-after-phase-5.json
?? docs/openapi-before-phase-5.json
?? docs/refactor-phase-5-backend-report.md
?? tests/test_backend_structure.py
```

Ingen staged ændringer. Ingen automatisk commit.

## Ansvarskortlægning (fase 5)

| Ansvar | Nuværende fil (før) | Funktion/klasse | Målmodul |
|--------|---------------------|-----------------|----------|
| App-konfiguration | `app/main.py` | `FastAPI`, static mount | `app/main.py` |
| Side-route | `app/main.py` | `index`, `workflow_viewer`, `vault_config_viewer` | `app/routes/pages.py` |
| System-route | `app/main.py` | `health`, `api_version` | `app/routes/system.py` |
| Workflow-route | `app/main.py` | `upload_excel`, `export_html` | `app/routes/workflow_api.py` |
| Model | `app/main.py` | `ViewerContext`, `ExportHtmlRequest` | `app/models/workflow.py` |
| Upload service | `app/main.py` | validering + parse | `app/services/workflow/upload.py` |
| Export service | `app/main.py` + `export_html.py` | HTML-eksport | `export_service.py` + `export_html.py` |
| Parser | `app/parser.py` | `parse_transitions_excel` | `app/services/workflow/parser.py` |
| Settings | `app/main.py` | `STATIC_DIR`, `MAX_UPLOAD_BYTES` | `app/core/settings.py` |
| Version | `app/core/version.py` | `APP_VERSION` | uændret |
