# Fase 6 baseline (før oprydning)

## Git

| | |
|---|---|
| **Branch** | `refactor/app-shell-workflow-split` |
| **Commit** | `4308a96` — Refactor backend into routes models and workflow services |
| **Working tree** | Rent |

## Tests

```text
79 passed in ~1.3s
```

`git diff --check` — ren.

## Route-status (TestClient)

| URL | Status |
|-----|--------|
| `/` | 200 |
| `/workflow/` | 200 |
| `/vault-config/` | 200 |
| `/health` | 200 `{"status":"ok"}` |
| `/api/version` | 200 |

## Kendte legacy-filer (kandidater)

| Fil | Runtime | Tests |
|-----|---------|-------|
| `static/app.js` | Nej | Nej |
| `static/vault-config/vault-config.js` | Nej | Nej |
| `static/style.css` | Nej (ingen HTML-link) | Nej |

## Compatibility-shims (kandidater til fjernelse)

| Shim | Brugt af tests før migration |
|------|------------------------------|
| `app/parser.py` | `test_parser.py`, `test_backend_structure.py` |
| `app/export_html.py` | `test_export_html.py` |

## OpenAPI

- `docs/openapi-before-phase-5.json` og `docs/openapi-after-phase-5.json` var identiske (10 645 bytes)
- Plan: én canonical `docs/openapi-contract.json`; historiske filer til `docs/refactor-history/phase-5/`

## review-export/

- I `.gitignore`, ikke tracked
- Ingen runtime- eller test-afhængighed

## Fixture

- `samples/fixture-vault-job-config.json` — anonymiseret, bruges af `test_vault_config.py`

## ZIP/XLAM

- `*.zip`, `_xlam*` ignoreres via `.gitignore`
- Ikke tracked, ikke del af build
