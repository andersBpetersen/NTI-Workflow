# Fase 6 — Oprydning og release-klargøring — slutrapport

## 1. Aktiv branch og commit

| | |
|---|---|
| **Branch** | `refactor/app-shell-workflow-split` |
| **Baseline commit** | `4308a96` — Refactor backend into routes models and workflow services |
| **Working tree** | Ændret (fase 6 oprydning, ikke committet) |

## 2. Baseline testresultat

Før oprydning (se `docs/refactor-phase-6-baseline.md`):

```text
79 passed
git diff --check — ren
```

## 3. Undersøgte oprydningskandidater

| Fil/mappe | Runtime | Tests | Docs | Compatibility | Kan slettes | Begrundelse |
|-----------|---------|-------|------|---------------|-------------|-------------|
| `static/app.js` | Nej | Nej | Kun historiske rapporter | Nej | **Ja** | Erstattet af `app-shell.js` + `workflow-controller.js` |
| `static/vault-config/vault-config.js` | Nej | Nej | Historiske rapporter | Nej | **Ja** | Logik inline i `vault-config/index.html` |
| `static/style.css` | Nej | Nej | Nej | Nej | **Ja** | Ingen HTML/CSS-link; gammel monolit-styling |
| `app/parser.py` | Nej (shim) | Var ja → migreret | Fase 5 | Ja | **Ja** | Tests importerer `app.services.workflow.parser` |
| `app/export_html.py` | Nej (shim) | Var ja → migreret | Fase 5 | Ja | **Ja** | Tests importerer `app.services.workflow.export_html` |
| `docs/openapi-before/after-phase-5.json` | Nej | Var ja | Fase 5 | Nej | **Flyttet** | Identiske; canonical = `openapi-contract.json` |
| `review-export/` | Nej | Nej | Nej | Nej | **Nej** | Lokal analyseoutput; `.gitignore` |
| `samples/fixture-vault-job-config.json` | Nej | Ja | Nej | Nej | **Behold** | Anonymiseret fixture |
| `samples/sample-lifecycle.xlsx` | Nej | Ja | Nej | Nej | **Behold** | Parser/upload regression |
| `*.zip`, `_xlam*` | Nej | Nej | Delvist | Nej | **Ignorer** | Allerede i `.gitignore`; ikke tracked |

## 4. Slettede filer

```text
static/app.js
static/vault-config/vault-config.js
static/style.css
app/parser.py
app/export_html.py
docs/openapi-before-phase-5.json   (flyttet, ikke slettet)
docs/openapi-after-phase-5.json    (flyttet, ikke slettet)
```

## 5. Beholdte legacy-filer og begrundelse

Ingen aktive legacy-filer tilbage efter oprydning.

## 6. Compatibility-shims

**Fjernet** efter migration af test-imports til `app.services.workflow.*`.

- Ingen `app/`-kode brugte shims
- Ingen deployment-scripts refererede shims
- Alle tests grønne uden shims

## 7. OpenAPI-dokumentationsbeslutning

- Identiske fase-5 filer flyttet til `docs/refactor-history/phase-5/`
- Canonical kontrakt: **`docs/openapi-contract.json`**
- `tests/test_backend_structure.py` og `tests/test_cleanup_phase6.py` sammenligner live OpenAPI mod contract
- API-kontrakt uændret

## 8. Fixture/sample-vurdering

**`samples/fixture-vault-job-config.json`**

- Bruges af `tests/test_vault_config.py`
- Indhold: generiske container/processor-navne, ingen mail, server, UNC eller kundenavne
- **Beholdt** i `samples/`

**`samples/sample-lifecycle.xlsx`**

- Bruges af parser- og API-tests
- **Beholdt**

## 9. ZIP/XLAM-vurdering

| Mønster | Tracked | Build/runtime | Handling |
|---------|---------|---------------|----------|
| `*.zip` | Nej | Nej | `.gitignore` — kandidat til ekstern arkivering |
| `_xlam.zip`, `_xlam_extract*` | Nej | Nej | `.gitignore` + `.dockerignore` |

Ingen binære filer slettet automatisk.

## 10. Ubrugte imports og kode fjernet

- Hele filer fjernet (se §4) frem for delvis død kode
- Ingen ændring i parser-, viewer- eller vault-logik
- Ingen autofix/lint-kørsel

## 11. Dokumentationsændringer

| Fil | Ændring |
|-----|---------|
| `docs/architecture.md` | **Ny** — samlet arkitektur med Mermaid |
| `docs/final-project-structure.txt` | **Ny** — filtreret slutstruktur |
| `docs/refactor-phase-6-baseline.md` | **Ny** — baseline før oprydning |
| `docs/backend-architecture.md` | Shim-sektion fjernet; link til architecture |
| `README.md` | Opdateret projektstruktur + architecture-link |
| `docs/openapi-contract.json` | **Ny** — canonical API-schema |

## 12. Versionsforskelle (ingen bump udført)

| Kilde | Værdi |
|-------|-------|
| `app/core/version.py` | `0.6.6` |
| FastAPI `version=` | `0.6.6` |
| `.env.example` image tag | `tickjf/nti-workflow:0.6.6` |
| README/DEPLOY/PUBLISH | `0.6.6` |
| Frontend cache-busting `?v=` | Ingen i aktive HTML-sider |

**Anbefalet næste version:** `0.7.0` (intern refaktorering uden API-brud).

## 13. Docker/deployment-kontrol (read-only)

| Check | Status |
|-------|--------|
| `Dockerfile` kopierer `app/` + `static/` | OK |
| Start: `uvicorn app.main:app` | OK |
| `.dockerignore` ekskluderer tests/docs/venv | Delvist (kun venv/cache) |
| Backend-struktur (`routes/`, `services/`) i image | OK via `COPY app` |
| Health via `/health` | OK |
| Port 8000 | OK |

Ingen deploymentændringer nødvendige.

## 14. Testresultat

```text
94 passed in ~1.7s
```

Nye tests: `tests/test_cleanup_phase6.py` (15 tests).

## 15. Manuel regressionstest

TestClient smoke (server import uden fejl):

| Check | Resultat |
|-------|----------|
| `/`, `/workflow/`, `/vault-config/` | 200 |
| `/health`, `/api/version` | 200 |
| Kritiske static assets | 200 (ingen 404) |
| Legacy `app.js` / `vault-config.js` | Filer findes ikke; HTML refererer ikke |

Fuld browser-test (Excel-upload UI, diagram, Vault JSON-modaler) ikke gentaget i denne fase; API og static wiring bekræftet programmatisk. Fase 4–5 manuel godkendelse gælder for UI-adfærd.

## 16. Slutstruktur

Se `docs/final-project-structure.txt`.

## 17. Kendte resterende tekniske gældspunkter

- `upload.py` bruger stadig `UploadFile` (FastAPI-type i service-lag)
- `export_html.py` læser static assets direkte fra disk
- `review-export/` kan findes lokalt (ignoreret, ikke produktionsdel)
- Version `0.6.6` i kode vs. anbefalet `0.7.0` ved næste release — ikke bumpet i fase 6

## 18. Anbefalet næste version

**`0.7.0`** — dækker modulopdeling, i18n, shared frontend, backend-split og oprydning.

## 19. Bekræftelse på uændret API-kontrakt

Live OpenAPI matcher `docs/openapi-contract.json` for `/health`, `/api/version`, `/api/upload`, `/api/export/html`.

## 20. Bekræftelse på uændret parser- og eksportlogik

- `app/services/workflow/parser.py` — uændret siden fase 5
- `tests/test_parser.py`, upload-fixture: samme transition/node-tal
- `tests/test_export_html.py` — grøn

## 21. `git status --short`

```text
 M README.md
 D app/export_html.py
 D app/parser.py
 M docs/backend-architecture.md
 D docs/openapi-after-phase-5.json
 D docs/openapi-before-phase-5.json
 D static/app.js
 D static/style.css
 D static/vault-config/vault-config.js
 M tests/test_backend_structure.py
 M tests/test_export_html.py
 M tests/test_parser.py
?? docs/architecture.md
?? docs/final-project-structure.txt
?? docs/openapi-contract.json
?? docs/refactor-history/
?? docs/refactor-phase-6-baseline.md
?? docs/refactor-phase-6-cleanup-report.md
?? tests/test_cleanup_phase6.py
```

Ingen staged ændringer. Ingen automatisk commit.
