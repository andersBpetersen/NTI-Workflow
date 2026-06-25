# Release 0.7.0 — rapport

## 1. Branch og baseline commit

| | |
|---|---|
| **Branch** | `refactor/app-shell-workflow-split` |
| **Baseline commit** | `1ba381c` — Complete modular refactor and remove legacy code |
| **Working tree ved start** | Rent |

## 2. Version før og efter

| Kilde | Før | Efter |
|-------|-----|-------|
| `app/core/version.py` | 0.6.6 | **0.7.0** |
| `/api/version` | 0.6.6 | **0.7.0** |
| OpenAPI `info.version` | 0.6.6 | **0.7.0** |
| `.env.example` image | `0.6.6` | **`0.7.0`** |
| `docker-compose.prod.yml` default | `0.6.6` | **`0.7.0`** |

## 3. Filer med versionsændringer

| Fil | Ændring |
|-----|---------|
| `app/core/version.py` | `APP_VERSION` |
| `.env.example` | `NTI_WORKFLOW_IMAGE` |
| `docker-compose.prod.yml` | default image tag |
| `docs/openapi-contract.json` | `info.version` |
| `README.md` | aktuel version, API-eksempel, Docker-eksempler, links |
| `DEPLOY.md` | pull/run eksempler |
| `PUBLISH.md` | version, build/push eksempler |
| `.github/workflows/docker-publish.yml.example` | default tag |
| `tests/test_api.py` | bruger `APP_VERSION` |
| `tests/test_release_070.py` | **ny** — version og kontrakt-tests |
| `CHANGELOG.md` | **ny** |
| `docs/release-notes-0.7.0.md` | **ny** |
| `docs/release-0.7.0-baseline.md` | **ny** |
| `docs/release-checklist-0.7.0.md` | **ny** |

**Ikke ændret (historisk):** `docs/refactor-phase-*.md`, `docs/refactor-history/phase-5/*.json`, README's v0.6.x release-noter.

## 4. Changelog

Se [CHANGELOG.md](../CHANGELOG.md) — sektion `[0.7.0] - 2026-06-25`.

## 5. Release notes

Se [release-notes-0.7.0.md](release-notes-0.7.0.md).

## 6. OpenAPI-sammenligning

- Canonical: `docs/openapi-contract.json` — `info.version` = `0.7.0`
- Live `/openapi.json` — matcher contract for paths, requestBody, responses på API-endpoints
- `tests/test_release_070.py::test_openapi_contract_paths_unchanged_except_version` — grøn
- Historiske fase-5 OpenAPI-filer forbliver med `0.6.6` i `docs/refactor-history/phase-5/`

## 7. Testresultat

```text
108 passed in ~1.3s
git diff --check — ren
```

## 8. Manuel browsertest

**TestClient smoke (lokal):**

| Check | Resultat |
|-------|----------|
| `/api/version` | `0.7.0` |
| `/`, `/workflow/`, `/vault-config/`, `/health` | 200 |
| Kritiske static assets | 200 |
| OpenAPI version | 0.7.0 |

Fuld browser-test (Excel-upload UI, diagram, Vault-modaler) ikke gentaget — version hentes dynamisk fra `/api/version` i `app-shell.js` og `workflow-controller.js`.

## 9. Docker build-resultat

```text
FEJL: Docker daemon ikke tilgængelig
npipe:////./pipe/dockerDesktopLinuxEngine — filen findes ikke
```

**Årsag:** Docker Desktop kører ikke på build-maskinen.

**Forsøgt kommando:**

```powershell
docker build --pull -t tickjf/nti-workflow:0.7.0 .
```

**Alternativ når Docker kører:**

```powershell
docker build -t tickjf/nti-workflow:0.7.0 .
```

## 10. Docker image ID og størrelse

Ikke tilgængelig — build ikke gennemført.

## 11. Docker runtime-test

Ikke kørt — kræver bygget image og kørende daemon.

Planlagt kommando:

```powershell
docker run --rm -d --name nti-workflow-release-test -p 18000:8000 tickjf/nti-workflow:0.7.0
# curl http://localhost:18000/api/version
docker stop nti-workflow-release-test
```

## 12. Compose-validering

`docker compose config` — syntaks OK, healthcheck og port 8000 OK.

`docker-compose.prod.yml` default (uden lokal `.env`):

```yaml
image: ${NTI_WORKFLOW_IMAGE:-tickjf/nti-workflow:0.7.0}
```

**Bemærk:** Lokal `.env` kan overskrive `NTI_WORKFLOW_IMAGE` ved `docker compose config` (observeret `0.4.0` i miljøet).

## 13. Kendte begrænsninger

- Vault Config: kun browser, ingen server-lagring
- Ingen database/login
- Upload-service: FastAPI `UploadFile`
- HTML-eksport: læser static fra disk
- Vault Config: delvis engelsk fallback

## 14. Rollback-plan

**Git:**

```powershell
git checkout v0.6.6
```

**Docker:**

```powershell
# .env:
NTI_WORKFLOW_IMAGE=tickjf/nti-workflow:0.6.6
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 15. Release-checklist status

Se [release-checklist-0.7.0.md](release-checklist-0.7.0.md). Docker-punkter afventer kørende Docker Desktop.

## 16. Anbefalet commit-besked

```text
Release version 0.7.0
```

## 17. Anbefalet Git-tag

```text
v0.7.0
```

## 18. `git status --short`

Se slutvisning efter alle ændringer (uncommitted).
