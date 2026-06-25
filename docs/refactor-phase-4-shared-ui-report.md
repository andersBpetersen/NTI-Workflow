# Fase 4 – Slutrapport: Shared UI og frontend-utilities

Dato: 2026-06-25  
Opgave: Udtræk af fælles UI-styles og små frontend-utilities med tydelige modulgrænser.

---

## 1. Aktiv branch

`refactor/app-shell-workflow-split`

---

## 2. Filer undersøgt for duplikation

- `static/index.html`
- `static/app-shell.css`
- `static/app-shell.js`
- `static/workflow/index.html`
- `static/workflow/workflow-controller.js`
- `static/vault-config/index.html`
- `static/viewer.css`
- `static/viewer.js`
- `static/app.js`
- `static/i18n.js`

---

## 3. Faktisk fundet duplikation

| Område | Filer | Dubleret indhold |
|--------|-------|------------------|
| CSS tokens | `app-shell.css`, `viewer.css` | `--ink`, `--bg`, `--muted`, body, box-sizing |
| Header/forms | `app-shell.css`, `viewer.css` | `.app-topbar`, `.locale-control`, `.version-chip` |
| Knapper | `app-shell.css`, `viewer.css` | Primær blå knap, back-link, zoom-knap |
| Status | `viewer.css`, workflow-controller | `.status-msg` error/success/loading |
| HTML escape | workflow-controller, `viewer.js`, vault-config | `escapeHtml` / `esc` |
| Filvalidering | workflow-controller, vault-config | Extension-check, størrelse (workflow) |
| Drag-drop | workflow-controller, vault-config | preventDefault + drag-over class + click-to-input |

**Ikke udtrukket:** Vault modaler/tabeller (for forskellige), Vault mørke knapstile, debounce (ikke fundet duplikeret).

---

## 4. Nye shared CSS-filer

- `static/shared/ui/tokens.css`
- `static/shared/ui/forms.css`
- `static/shared/ui/buttons.css`
- `static/shared/ui/feedback.css`

---

## 5. Nye shared JS-filer

- `static/shared/utils/html.js` → `NTIShared.html.escape()`
- `static/shared/utils/files.js` → `NTIShared.files.*`
- `static/shared/utils/dom.js` → `NTIShared.dom.*`

---

## 6. Filer ændret til at bruge shared

| Fil | Ændring |
|-----|---------|
| `static/index.html` | Indlæser shared CSS |
| `static/workflow/index.html` | Indlæser shared CSS + JS |
| `static/vault-config/index.html` | Indlæser shared JS, bruger escape/files helpers |
| `static/app-shell.css` | Kun home-specifik styling tilbage |
| `static/viewer.css` | Fjernet duplikeret header/forms/knapper/status/dropzone-basis |
| `static/workflow/workflow-controller.js` | Shared escape, filvalidering, dropzone |
| `static/viewer.js` | `esc()` via `NTIShared.html.escape` |
| `README.md` | Link til shared-dokumentation |
| `tests/test_shared_frontend.py` | Ny testpakke |

---

## 7. Kode der bevidst forblev modulspecifik

- Vault Config inline CSS (mørk topbar, tabeller, modaler, `.btn-*`)
- Workflow diagram og SVG-styling i `viewer.css`
- Workflow upload til `/api/upload`
- Vault JSON-parsing via `FileReader`
- `static/i18n.js` (uændret i Fase 4)
- `static/app-shell.js` (navigation/version – ingen duplikation med andre moduler)

---

## 8. Inline styles der blev flyttet

Ingen større inline-style oprydning i Vault Config i denne fase.  
Gentagne layout-værdier i app-shell/viewer blev flyttet til shared CSS tokens og klasser.

---

## 9. Testresultat

```text
pytest tests/test_shared_frontend.py tests/test_i18n_locales.py tests/test_routes_split.py tests/test_vault_config.py -q
45 passed
```

---

## 10. Manuel test

Ikke fuldt browser-gennemløb i denne session. Anbefalet kontrol:

- Forside visuelt uændret, sprogvalg og modulkort virker
- Workflow: upload, drag-drop, diagram, eksport
- Vault Config: JSON-indlæsning, containere/processorer, modaler
- Ingen nye JS-fejl i konsollen ved 1280×720 og 1920×1080

---

## 11. Visuelle forskelle

Forventet minimale eller ingen synlige forskelle på forsiden og Workflow Viewer, da shared CSS bruger samme værdier som før. Vault Config beholdt sit eget visuelle udtryk.

---

## 12. Bekræftelse på uændret Workflow-logik

Bekræftet. Ingen ændringer i:

- `app/parser.py`
- Workflow diagramlogik (kun `esc()` delegerer til shared)
- `/api/upload` og `/api/export/html` kontrakter

---

## 13. Bekræftelse på uændret Vault Config-logik

Bekræftet. Ingen ændringer i:

- `readFile()` JSON-normalisering
- Container/processor-rendering
- Modal- og detaljelogik

Kun filtype-check og drag-drop wiring bruger shared helpers.

---

## 14. Bekræftelse på uændrede routes og API-kontrakter

Bekræftet via tests:

- `/`, `/workflow/`, `/vault-config/` returnerer 200
- OpenAPI indeholder `/api/upload`, `/api/export/html`, `/api/version`

---

## 15. Kendte resterende duplikationer

- `static/app.js` (legacy monolit) har stadig lokal `escapeHtml` og upload-logik – ikke aktiv runtime for split-routes, men filen findes i working tree
- `static/vault-config/vault-config.js` (uaktiv) har egen escapeHtml
- Vault og Workflow dropzones har forskellig visuel styling (bevidst)
- Vault modaler/tabeller ikke shared

---

## 16. git status --short

```
 M .gitignore
 M README.md
 M app/main.py
 M static/app.js
 M static/index.html
 M static/viewer.css
 M static/viewer.js
?? app/core/
?? docs/
?? samples/fixture-vault-job-config.json
?? static/app-shell.css
?? static/app-shell.js
?? static/i18n.js
?? static/i18n/
?? static/shared/
?? static/vault-config/
?? static/workflow/
?? tests/test_i18n_locales.py
?? tests/test_routes_split.py
?? tests/test_shared_frontend.py
?? tests/test_vault_config.py
```

Ingen staged ændringer. Ingen commit udført automatisk.
