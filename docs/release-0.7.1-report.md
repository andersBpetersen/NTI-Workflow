# Release 0.7.1 — rapport

## 1. Branch og baseline commit

| | |
|---|---|
| **Branch** | `refactor/app-shell-workflow-split` |
| **Baseline** | `7865183` — Release version 0.7.0 |
| **Tag** | `v0.7.0` |

## 2. Filer med beskadigede tegn

| Fil | Status |
|-----|--------|
| `static/i18n/da-DK.json` | **Rettet** (eneste aktiv runtimefil med fejl) |

Ingen fejl fundet i: `static/index.html`, `app-shell.js`, `workflow/*`, hardcoded HTML i `vault-config/index.html` (korrekt UTF-8).

## 3. Konkrete rettede værdier

| Før | Efter | Nøgle |
|-----|-------|-------|
| `?bn` | `Åbn` | `home.vaultConfigViewer.open` |
| `Indl?s` | `Indlæs` | `vault.loadConfig`, `vault.dropSubtitle` |
| `Tr?k` | `Træk` | `vault.dropTitle` |
| `p?` | `på` | `vault.dropSubtitle` |
| `n?ste` | `næste` | `vault.findNext` |
| `indl?s` | `indlæs` | `vault.statusReady` |
| `underst?ttes` | `understøttes` | `vault.errorJsonOnly` |
| `l?ses` | `læses` | `vault.errorInvalidFormat`, `errorMissingContainers`, `errorParsePrefix` |
| `Indl?st` | `Indlæst` | `vault.statusLoaded` |

## 3b. Ensrettede uploadområder

| Fil | Ændring |
|-----|---------|
| `static/shared/ui/file-dropzone.css` | **Ny** — fælles dropzone-styling |
| `static/workflow/index.html` | Bruger `nti-file-dropzone` markup |
| `static/vault-config/index.html` | Samme markup; fjernet mappeikon/`.drop-zone` |
| `static/i18n/*.json` | Nye nøgler `vault.supportedTypes`, `vault.ariaLabel` |
| `tests/test_file_dropzone.py` | **Ny** — konsistenstests |

## 4. Encoding-vurdering

- `da-DK.json`: gyldig UTF-8 efter rettelse
- Aktive HTML: `<meta charset="UTF-8">` på alle tre sider
- Ingen BOM introduceret
- Ingen bulk-konvertering af andre filer

## 5. Response header-vurdering

| Route | Content-Type |
|-------|----------------|
| `/` | `text/html; charset=utf-8` |
| `/workflow/` | `text/html; charset=utf-8` |
| `/vault-config/` | `text/html; charset=utf-8` |
| `/static/i18n/da-DK.json` | JSON 200, parses korrekt |

Ingen header-ændringer nødvendige.

## 6. Nye eller ændrede tests

| Fil | Ændring |
|-----|---------|
| `tests/test_utf8_danish.py` | **Ny** — 18 tests |
| `tests/test_file_dropzone.py` | **Ny** — dropzone-konsistens |
| `tests/test_release_071.py` | Omdøbt/opdateret fra `test_release_070.py` (version 0.7.1) |

## 7. Version før og efter

| Kilde | Før | Efter |
|-------|-----|-------|
| `APP_VERSION` | 0.7.0 | **0.7.1** |
| Docker default tag | 0.7.0 | **0.7.1** |
| OpenAPI `info.version` | 0.7.0 | **0.7.1** |

## 8. OpenAPI-sammenligning

Kun `info.version` ændret. API-paths og schemas uændrede (`tests/test_release_071.py`).

## 9. Testresultat

```text
126 passed in ~2.1s
git diff --check — ren
```

## 10. Lokal browsertest

TestClient smoke:

- Version `0.7.1`
- `da-DK.json` indeholder `Åbn`, `Træk`, `Indlæs`, `Vælg`, `værktøjer`
- HTML charset headers korrekte

Fuld visuel browser-test ikke kørt i denne session.

## 11. Docker build

```text
docker build --pull -t tickjf/nti-workflow:0.7.1 .
```

**Status:** OK

## 12. Docker runtime-test

```text
docker run --rm -d --name nti-workflow-071-test -p 18001:8000 tickjf/nti-workflow:0.7.1
```

| Check | Resultat |
|-------|----------|
| `/health` | `{"status":"ok"}` |
| `/api/version` | `{"version":"0.7.1"}` |
| `/static/i18n/da-DK.json` | 200 |
| Container log | Ingen importfejl |

Container stoppet efter test.

## 13. Compose-resultat

```text
image: tickjf/nti-workflow:0.7.1
```

(prod YAML default uden lokal `.env`-override)

## 14. Docker image

| | |
|---|---|
| **ID** | `sha256:f66510e24f048b4dc300d39782038bba282c26599b9ff8848674eb5cecc1265b` |
| **Størrelse** | ~56 MB |
| **Oprettet** | 2026-06-25T13:06:31Z |

## 15. Kendte begrænsninger

Uændret fra 0.7.0. Vault Config har stadig engelsk fallback i visse tekniske felter.

## 16. Rollback-plan

```powershell
NTI_WORKFLOW_IMAGE=tickjf/nti-workflow:0.7.0
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 17. Anbefalet commit

```text
Fix Danish UTF-8 text rendering in 0.7.1
```

## 18. Anbefalet tag

```text
v0.7.1
```

## 19. `git status --short`

Se slutvisning (uncommitted).
