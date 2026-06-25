# Shared frontend i NTI Workflow

Fase 4 udtrækker kun UI-tokens, generiske styles og små utilities, som bruges af flere moduler.

## Shared CSS

| Fil | Ansvar |
|-----|--------|
| `static/shared/ui/tokens.css` | CSS-variabler, box-sizing, body-base, `.hidden` |
| `static/shared/ui/forms.css` | Topbar, locale-control, version-chip |
| `static/shared/ui/buttons.css` | Primær/sekundær knapstil, back-link, zoom-knapper |
| `static/shared/ui/feedback.css` | Statusbeskeder, dropzone-basis (`.nti-drop-zone`) |

## Shared JavaScript

Alle utilities eksponeres som `window.NTIShared` (ingen ES modules).

| Fil | Namespace | Ansvar |
|-----|-----------|--------|
| `static/shared/utils/html.js` | `NTIShared.html` | `escape(value)` |
| `static/shared/utils/files.js` | `NTIShared.files` | Extension, størrelse, single-file, drag-drop helpers |
| `static/shared/utils/dom.js` | `NTIShared.dom` | Små DOM helpers (`byId`, `show`, `hide`) |

### Eksempler

```javascript
NTIShared.html.escape(userText);

if (NTIShared.files.hasExtension(file, [".xlsx"])) { /* ... */ }

NTIShared.files.bindDropZone({
  element: dropZone,
  dragOverClass: "drag-over",
  clickInput: fileInput,
  onFiles: (files) => handleFiles(files),
});
```

## Indlæsning

Shared filer indlæses **før** modulscripts.

Forside og Workflow:

```html
<link rel="stylesheet" href="/static/shared/ui/tokens.css">
<link rel="stylesheet" href="/static/shared/ui/forms.css">
<link rel="stylesheet" href="/static/shared/ui/buttons.css">
<link rel="stylesheet" href="/static/shared/ui/feedback.css">
```

Workflow og Vault Config:

```html
<script src="/static/shared/utils/html.js"></script>
<script src="/static/shared/utils/files.js"></script>
```

## Modulgrænser

### App shell (`/`)

- Navigation, modulkort, sprogvalg
- Bruger shared CSS

### Workflow Viewer (`/workflow/`)

- Excel-upload, API-kald, diagram, eksport
- Bruger shared escape, filvalidering og dropzone helpers
- Beholder workflow-specifik CSS i `viewer.css`

### Vault Config Viewer (`/vault-config/`)

- Lokal JSON/FileReader, containere/processorer, modaler
- Bruger shared escape og dropzone helpers
- Beholder modulspecifik inline CSS (mørk topbar, WinForms-lignende layout)

## Bevidst ikke shared

- Workflow diagramlogik (`viewer.js`)
- Vault modaler og tabeller (visuelt og strukturelt forskellige)
- Vault `.btn-red`, `.btn-green` m.m.
- i18n-runtime (`static/i18n.js`)
- Backend API-kald

## Naming convention

- CSS-klasser med `nti-` prefix for shared komponenter
- Eksisterende modulklasser (`.back-link`, `.excel-drop-zone`) beholdes som alias/komposition
- Shared kode må ikke referere til domænespecifikke keys, endpoints eller datastrukturer

## Tilføj ny shared helper

Kun hvis:

1. Koden bruges af mindst to moduler, eller
2. Den er tydeligt generisk og allerede duplikeret

Tilføj test i `tests/test_shared_frontend.py` og opdater denne fil.
