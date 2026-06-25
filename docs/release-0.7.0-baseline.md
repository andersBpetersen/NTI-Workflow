# Release 0.7.0 — baseline (før versionsændringer)

## Git

| | |
|---|---|
| **Root** | `C:/GitHub/NTI Workflow` |
| **Branch** | `refactor/app-shell-workflow-split` |
| **Commit** | `1ba381c` — Complete modular refactor and remove legacy code |
| **Working tree** | Rent |
| **Staged** | Ingen |

## Tests

```text
94 passed in ~1.3s
```

`git diff --check` — ren.

## Runtime-version før bump

| Kilde | Værdi |
|-------|-------|
| `app/core/version.py` | `0.6.6` |
| `/api/version` | `0.6.6` |
| OpenAPI `info.version` | `0.6.6` |
| `.env.example` image | `tickjf/nti-workflow:0.6.6` |

## Route-status (TestClient)

Alle sider og `/health`, `/api/version` — 200.

## Mål

Bump til **0.7.0** uden funktionelle ændringer.
