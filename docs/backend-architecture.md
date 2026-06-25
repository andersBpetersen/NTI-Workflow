# Backend-arkitektur

Backend er opdelt i tynde route-moduler, Pydantic-modeller og workflow-services. API-kontrakter og URL'er er uændrede fra fase 4.

## Entry point

```text
uvicorn app.main:app
```

`app/main.py` opretter FastAPI-appen, registrerer routers og mount'er statiske filer. Ingen domænelogik.

## Routers

| Modul | Ansvar | Endpoints |
|-------|--------|-----------|
| `app/routes/pages.py` | HTML-sider | `GET /`, `/workflow`, `/workflow/`, `/vault-config/` |
| `app/routes/system.py` | System | `GET /health`, `GET /api/version` |
| `app/routes/workflow_api.py` | Workflow API | `POST /api/upload`, `POST /api/export/html` |

Routere inkluderes i `main.py` **før** static mount, så side-routes og API ikke skygger for `/static`.

## Modeller

`app/models/workflow.py`:

- `ViewerContext` — viewer-tilstand ved HTML-eksport
- `ExportHtmlRequest` — request body til `/api/export/html`

## Services

| Modul | Ansvar |
|-------|--------|
| `app/services/workflow/parser.py` | Excel-parsing (Vault lifecycle) |
| `app/services/workflow/export_html.py` | Bygger standalone HTML fra payload + static assets |
| `app/services/workflow/upload.py` | Upload-validering og kald til parser |
| `app/services/workflow/export_service.py` | Orkestrering af HTML-eksport (filnavn, viewer context) |

### Grænse mellem route og service

- **Route**: modtager HTTP-input, kalder service, returnerer `Response` / `HTTPException`
- **Service**: validering, parsing, HTML-generering — kender ikke FastAPI request-objekter (undtagen `UploadFile` i upload-laget for minimal ændring)

Importer services direkte, fx `from app.services.workflow.parser import parse_transitions_excel`.

## Core

- `app/core/version.py` — `APP_VERSION`
- `app/core/settings.py` — `STATIC_DIR`, `MAX_UPLOAD_BYTES`, `APP_TITLE`, cache-headers, tilladte upload-extensions

## Static mount

```python
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
```

`STATIC_DIR` peger på projektets `static/`-mappe (locale-filer, workflow, vault-config, shared UI).

## Tilføj et nyt backend-modul

1. **Ny API-endpoint**: tilføj route i passende `app/routes/*.py` (eller opret ny router-fil), registrer i `main.py`
2. **Ny request/response-model**: placer i `app/models/`
3. **Domænelogik**: placer i `app/services/<domæne>/`
4. **Konfiguration**: tilføj konstanter i `app/core/settings.py` hvis de genbruges
5. **Tests**: udvid `tests/test_api.py` eller `tests/test_backend_structure.py`

Undgå at lægge forretningslogik tilbage i `main.py`.

## Relateret dokumentation

- [i18n](i18n.md)
- [Shared frontend](shared-frontend.md)
- [Arkitektur (samlet)](architecture.md)
- [Fase 5 slutrapport](refactor-phase-5-backend-report.md)
