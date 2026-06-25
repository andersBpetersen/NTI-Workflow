# Release notes — 0.7.0

**Dato:** 2026-06-25  
**Type:** Intern arkitektur-release uden API-brud

## 1. Releaseoversigt

Version 0.7.0 samler refaktoreringen fra fase 1–6: modulær frontend, fælles i18n, shared utilities, opdelt backend og oprydning af legacy-kode. Funktionel adfærd og Workflow API er bevaret.

## 2. Nye moduler

| Modul | Route | Beskrivelse |
|-------|-------|-------------|
| App shell | `/` | Forside med modulkort og sprogvalg |
| Workflow Viewer | `/workflow/` | Excel-upload og lifecycle-diagram |
| Vault Config Viewer | `/vault-config/` | NTI for Vault Job JSON (kun browser) |

## 3. Arkitekturændringer

- **Frontend:** tre selvstændige HTML-entrypoints + `static/shared/`
- **Backend:** `app/routes/`, `app/models/`, `app/services/workflow/`
- **Entry point:** `uvicorn app.main:app` (uændret)
- Se [architecture.md](architecture.md)

## 4. i18n og understøttede sprog

13 autoritative locales: `cs-CZ`, `da-DK`, `de-DE`, `en-GB`, `es-ES`, `fi-FI`, `fr-FR`, `it-IT`, `nl-NL`, `no-NO`, `pl-PL`, `pt-BR`, `sv-SE`.

Delt registry i `static/i18n.js`. Se [i18n.md](i18n.md).

## 5. Workflow Viewer

- Upload `.xlsx`/`.xlsm` via `POST /api/upload`
- Diagram, filtre, state permissions, HTML-eksport via `POST /api/export/html`
- Parser og eksportlogik uændret siden 0.6.x

## 6. Vault Config Viewer

- JSON indlæses lokalt med `FileReader`
- Ingen data sendes til serveren
- Viser containere, processorer, jobs, conditions m.m.

## 7. API-kompatibilitet

OpenAPI-kontrakten er funktionelt uændret; kun `info.version` er `0.7.0`.

Canonical schema: [openapi-contract.json](openapi-contract.json)

## 8. Deployment

**Lokal:**

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Docker (anbefalet tag):**

```powershell
docker build -t tickjf/nti-workflow:0.7.0 .
docker run --rm -p 8000:8000 tickjf/nti-workflow:0.7.0
```

**Compose (produktion):**

```powershell
copy .env.example .env
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Se [DEPLOY.md](../DEPLOY.md) og [PUBLISH.md](../PUBLISH.md).

## 9. Kendte begrænsninger

- Vault Config kører lokalt i browseren — ingen serverside lagring
- Ingen database eller login
- Upload-service bruger FastAPI `UploadFile` i service-laget
- HTML-eksport læser statiske assets fra disk (`static/viewer.css`, `viewer.js`)
- Nogle Vault Config-tekster kan falde tilbage til engelsk

## 10. Opgradering fra 0.6.6

1. Opdatér image-tag til `tickjf/nti-workflow:0.7.0` i `.env` eller compose
2. `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d`
3. Verificér `GET /api/version` → `{"version":"0.7.0"}`
4. Bogmærker til `/workflow/` og `/vault-config/` — forsiden er nu app shell

Ingen database-migration. Ingen API-ændringer for Workflow-klienter.

## 11. Testresultat

Se [release-0.7.0-report.md](release-0.7.0-report.md) for fuld test- og Docker-log.

## 12. Rollback-procedure

**Git:**

```powershell
git checkout v0.6.6
```

**Docker:**

```powershell
# I .env:
# NTI_WORKFLOW_IMAGE=tickjf/nti-workflow:0.6.6
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Slet ikke eksisterende `0.6.6`-image lokalt før rollback er verificeret.
