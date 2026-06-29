# UI visuel ensretning — Workflow & Vault Config upload

**Dato:** 2026-06-29  
**Branch:** `refactor/app-shell-workflow-split`  
**Baseline commit:** `a9d3ba3`

## 1. Visuelle forskelle før

| Område | Workflow Viewer | Vault Config upload |
|--------|-----------------|---------------------|
| Topbar | Lys hvid (`forms.css`) | Mørk charcoal inline (`#3c3c3c`) |
| Font | Segoe via tokens (Arial fallback) | Segoe 12px inline |
| Knapper | Blå primær i upload-bar | Lille blå `btn-load` i topbar |
| Layout | Topbar + upload-bar + dropzone | Alt i én kompakt topbar + dropzone |
| Spacing | 32px padding | 5–10px padding |
| Dropzone | Shared `file-dropzone.css` | Samme klasse, men omgivet af andet layout |
| Version | API-badge i topbar | Config-version i topbar (efter load) |

## 2. Designprincipper

- Fælles **NTI-inspireret** web-stil: lysegrå baggrund, mørk charcoal topbar, rolig blå accent
- Ét **design token**-lag i `tokens.css`
- Ét **upload-shell**-layout for modulsider (`body.nti-upload-shell`)
- Genbrug af eksisterende komponentklasser: `app-topbar`, `upload-bar`, `upload-button`, `nti-file-dropzone`
- Ingen 1:1 desktop-klon — kompakt web-topbar med samme visuelle DNA

## 3. Ændrede filer

| Fil | Ændring |
|-----|---------|
| `static/shared/ui/tokens.css` | Udvidede tokens (topbar, typografi, NTI-blå) |
| `static/shared/ui/upload-shell.css` | **Ny** — fælles upload/topbar-layout |
| `static/shared/ui/file-dropzone.css` | Token-baserede farver/typografi |
| `static/workflow/index.html` | `nti-upload-shell` + upload-shell CSS |
| `static/vault-config/index.html` | Samme shell-struktur som Workflow; load-knap flyttet til upload-bar |
| `static/viewer.css` | Upload-bar styles flyttet til upload-shell |
| `tests/test_shared_frontend.py` | Tjek for upload-shell på begge sider |
| `tests/test_upload_page_i18n.py` | Tjek for fælles `app-topbar` / `upload-bar` |

## 4. Tokens og shared styles

Nye/udvidede CSS custom properties:

- `--nti-topbar-bg`, `--nti-topbar-text`, `--nti-topbar-btn-*`
- `--nti-font-size-sm/md/lg/xl`, `--nti-line-height`
- Opdateret `--nti-color-primary` (#2980b9) og baggrund (#ececec)

Nye komponentklasser (via upload-shell):

- `body.nti-upload-shell`
- Scoped overrides for `.app-topbar`, `.upload-bar`, `.back-link`, `.locale-control`, `.version-chip`

## 5. Inspiration fra referenceprodukt

- Mørk samlet topbar/header
- Lysegrå arbejdsflade
- Diskrete panelgrænser
- Kompakt men læsbar typografi (12–18px skala)
- Rolig blå primærknap til filhandlinger

## 6. Bevidst ikke ændret

- i18n-keys og teksters betydning
- Upload-logik (Excel API / JSON FileReader)
- Intern Vault-viewer efter JSON-load (inline `#app`-styles)
- Workflow diagram, kontroller, tabeller (`#viewer-root`)
- Backend, routes, parser
- Forsidens layout (bruger ikke `nti-upload-shell`)

## 7. Testresultat

```
279 passed, 1 warning
git diff --check: ren (CRLF-advarsel på vault-config)
```

## 8. Manuel visuel test

Anbefalet:

```powershell
.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8001
```

- http://127.0.0.1:8001/workflow/?lang=da-DK
- http://127.0.0.1:8001/vault-config/?lang=da-DK
- http://127.0.0.1:8001/workflow/?lang=it-IT
- http://127.0.0.1:8001/vault-config/?lang=it-IT

## 9. Kendte resterende UI-forskelle

- Vault **intern viewer** (tabs, toolbars, tabeller) beholder desktop-inspireret 12px UI
- Workflow **viewer-root** (diagram) uændret
- Forside har fortsat lys topbar (ikke `nti-upload-shell`)
- Vault version-chip vises først efter JSON-load (funktionelt uændret)

## 10. Git-status

Se `git status --short` efter ændringerne.

## Follow-up: dropzone text color and Vault intro alignment

- Ensrettet dropzone tekstfarver mellem Workflow og Vault Config via `static/shared/ui/file-dropzone.css` (titel: `--nti-color-text`; hjælp/meta: `--nti-color-muted`).
- Fjernet arv af `#empty-state { color: muted }` som gjorde Workflow dropzone dæmpet og Vault mørk.
- Tilføjet Vault Config upload-intro under sidetitlen med `vault.uploadIntro` og `upload-bar-intro`.
- Ens upload-bar-struktur med `upload-bar-heading` på begge sider.
- Intro-tekst er i18n-styret for alle 13 locales.
- Ingen ændring af uploadlogik, parser, backend eller intern viewer.

## Follow-up 2: fixed visible upload intro and muted dropzone title

- Rettet at Vault Config viste `Upload Intro` i browseren.
- `vault.uploadIntro` bruges nu korrekt via i18n.
- Dansk Vault Config intro viser nu korrekt tekst.
- Dropzone-title bruger nu fælles muted color-token på begge upload-sider.
- Manuel test udført på da-DK og it-IT.
