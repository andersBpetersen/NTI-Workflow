# NTI Workflow — Programbeskrivelse og teknisk overblik

**Version:** 0.7.1  
**Genereret:** 2026-06-25  
**Branch:** refactor/app-shell-workflow-split  
**Release-tag:** v0.7.1  
**Commit:** 9e48efb

---

## 1. Formål

NTI Workflow er en intern webservice, der erstatter Excel VBA-add-in'et *NTI_Workflow_Ver_1.xlam*. Programmet løser behovet for at **visualisere og analysere Autodesk Vault-konfigurationer** uden at bruge Excel-makroer.

Løsningen består af flere selvstændige moduler, som tilgås via en **webbrowser**. Når løsningen er hostet på en server (Python eller Docker), kræver den **ingen lokal installation hos almindelige brugere** — de åbner blot en URL.

Kernefunktionen er at gøre Vault lifecycle-data og job-konfigurationer læsbare, filtrerbare og delbare i et moderne webinterface.

---

## 2. Moduler

### 2.1 App shell

Forsiden (`/`) er app shell og fungerer som indgang til alle værktøjer.

- Viser modulkort med korte beskrivelser
- Navigation til Workflow Viewer og Vault Config Viewer
- Fælles **sprogvalg** (i18n)
- **Versionsvisning** hentet fra `/api/version`
- Moduler, der endnu ikke er implementeret, vises med deaktiveret knap (*Coming soon*)

### 2.2 Workflow Viewer

Workflow Viewer (`/workflow/`) er det primære analyseværktøj for Vault lifecycle-eksport.

- **Upload** af Excel-eksport fra NTI Vault Dump Config
- Understøttede filtyper: `.xlsx` og `.xlsm`
- Validering af påkrævet ark `LifeCycleDefinitionTransitions`
- Valgfrit ark `LifeCycleDefinitionStates` for state permissions
- Visning af **lifecycle states** og **transitions** i interaktivt diagram
- **Roller og permissions** pr. state
- **Allow** og **Deny** transitions kan vises eller skjules
- **Custom Job Types** som klikbare markeringer på transitions
- Filtre: valgt lifecycle, rolle, visningsindstillinger, zoom
- Detaljepanel ved klik på state, transition eller job
- **HTML-eksport** til offline gennemgang og undervisning

### 2.3 Lifecycle Compare

Lifecycle Compare er **ikke implementeret endnu**.

På forsiden vises modulet som et modulkort med deaktiveret knap (*Coming soon*). Den planlagte funktionalitet er at sammenligne to Vault lifecycle-eksportfiler og fremhæve forskelle. Modulet må **ikke** betragtes som færdigt.

### 2.4 NTI for Vault Config Viewer

Vault Config Viewer (`/vault-config/`) viser NTI for Vault Job JSON-konfigurationer.

- **Lokal indlæsning** af `.json` via filvælger eller træk-og-slip
- Filen læses med `FileReader` i browseren — **ingen upload til backend**
- Visning af **containere**, **processorer**, **jobs**, conditions og relaterede detaljer
- Søgning og detaljevisning i modaler
- Viewer er **skrivebeskyttet** — den ændrer ikke konfigurationsfiler

### 2.5 Vault Config Tools

Vault Config Tools er **endnu kun en placeholder** på forsiden (*Coming soon*).

Der findes ingen separat route eller funktionalitet ud over modulkortet. Beskriv kun denne status — ikke yderligere funktioner.

---

## 3. Understøttede sprog

NTI Workflow bruger et fælles i18n-system (`static/i18n.js` + `static/i18n/*.json`).

- **Canonical source:** `en-GB.json`
- **Fallback:** valgt locale → normaliseret basissprog → `en-GB` → læsevenlig tekst fra key
- **Lagring:** `nti.locale` i `localStorage`
- **Event:** `nti:locale-changed` deles mellem alle moduler
- Sprogvalg på én side gælder på tværs af app shell, Workflow og Vault Config

| Locale | Sprognavn |
|--------|-----------|
| cs-CZ | Čeština |
| da-DK | Dansk |
| de-DE | Deutsch |
| en-GB | English |
| es-ES | Español |
| fi-FI | Suomi |
| fr-FR | Français |
| it-IT | Italiano |
| nl-NL | Nederlands |
| no-NO | Norsk |
| pl-PL | Polski |
| pt-BR | Português (Brasil) |
| sv-SE | Svenska |

Se `docs/i18n.md` for normaliseringsregler (fx `da` → `da-DK`, `nb` → `no-NO`).

---

## 4. Brugerflow

### 4.1 Workflow Viewer

1. Åbn Workflow Viewer fra forsiden eller direkte på `/workflow/`.
2. Vælg eller træk en Excel-fil (`.xlsx`/`.xlsm`) ind i dropzonen.
3. Frontend og backend validerer filtype, størrelse og Vault-format.
4. Backend parser indholdet via parser-service.
5. Diagrammet vises med states, transitions og filtre.
6. Brugeren filtrerer, zoomer og gennemgår detaljer.
7. Resultatet kan eksporteres som standalone HTML via `/api/export/html`.

### 4.2 Vault Config Viewer

1. Åbn Vault Config Viewer fra forsiden eller på `/vault-config/`.
2. Vælg eller træk en JSON-fil ind i dropzonen.
3. Filen læses lokalt i browseren.
4. Containere og processorer vises i træstruktur.
5. Brugeren åbner detaljer og modaler for jobs og indstillinger.

---

## 5. Arkitektur

NTI Workflow er bygget som **FastAPI backend** med **statisk frontend**. Der er **ingen database** og **ingen login** i selve applikationen.

### 5.1 Backend

| Komponent | Placering | Ansvar |
|-----------|-----------|--------|
| App entry | `app/main.py` | FastAPI-app, routere, static mount |
| Page routes | `app/routes/pages.py` | HTML-sider |
| System routes | `app/routes/system.py` | `/health`, `/api/version` |
| Workflow API | `app/routes/workflow_api.py` | Upload og HTML-eksport |
| Models | `app/models/workflow.py` | Pydantic request-modeller |
| Parser service | `app/services/workflow/parser.py` | Excel-parsing |
| Export service | `app/services/workflow/export_html.py` | HTML-generering |
| Upload service | `app/services/workflow/upload.py` | Validering og orkestrering |

### 5.2 Frontend

| Komponent | Placering |
|-----------|-----------|
| App shell | `static/index.html`, `app-shell.js` |
| Workflow Viewer | `static/workflow/` |
| Vault Config Viewer | `static/vault-config/` |
| Shared UI/utilities | `static/shared/` |
| i18n | `static/i18n.js`, `static/i18n/*.json` |
| Workflow-diagram | `static/viewer.js`, `viewer.css` |

Statiske filer serveres via mount på `/static`.

### 5.3 Arkitekturdiagram

<!-- ARCHITECTURE_DIAGRAM -->

---

## 6. API

Faktiske endpoints (se også `docs/openapi-contract.json`):

| Endpoint | Metode | Formål |
|----------|--------|--------|
| `/` | GET | App shell / forside |
| `/workflow/` | GET | Workflow Viewer HTML |
| `/vault-config/` | GET | Vault Config Viewer HTML |
| `/health` | GET | Healthcheck (`{"status":"ok"}`) |
| `/api/version` | GET | Applikationsversion |
| `/api/upload` | POST | Upload og parsing af Excel |
| `/api/export/html` | POST | Generér standalone HTML fra payload |

OpenAPI-kontrakten er canonical i `docs/openapi-contract.json`. Hele skemaet gengives ikke her.

---

## 7. Filbehandling og datasikkerhed

### Workflow Excel

- Filen sendes til backend via `POST /api/upload` som multipart upload
- Indholdet parses i hukommelsen og returneres som JSON
- Uploadede filer **gemmes ikke permanent** på serveren (ingen database, ingen fil-lagring efter parsing)

### Vault Config JSON

- Filen behandles **kun lokalt i browseren**
- Ingen data sendes til backend for Vault Config

### Generelt

- Ingen login i applikationen
- Ingen permanent database
- Adgangskontrol i produktion (netværk, firewall, reverse proxy) håndteres **uden for** selve programmet
- Følsomme Vault-konfigurationer bør kun deles på betroede netværk
- HTML-eksport indeholder data fra den aktuelle session — håndter eksportfiler som følsomme, hvis kildedata er det

> **Advarsel:** Påstå ikke sikkerhedsfunktioner, som ikke findes. Applikationen har ingen brugerautentificering og ingen kryptering af uploadede filer ud over HTTPS, hvis det konfigureres eksternt.

---

## 8. Installation og drift

### Lokal Python-kørsel

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Docker

- Produktionsimage: `tickjf/nti-workflow:0.7.1` (Docker Hub)
- Healthcheck i compose: `GET /health`
- Standardport: **8000**
- Versionsendpoint: `GET /api/version`

```powershell
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Se også: `README.md`, `DEPLOY.md`, `PUBLISH.md`, `START-DOCKER.md`.

---

## 9. Test og kvalitet

Tests køres med **pytest** (`requirements-dev.txt`).

| Testtype | Eksempler |
|----------|-----------|
| Parser | `tests/test_parser.py` |
| API | `tests/test_api.py` |
| Routes | `tests/test_routes_split.py` |
| i18n | `tests/test_i18n_locales.py` |
| Frontend-struktur | `tests/test_shared_frontend.py`, `tests/test_file_dropzone.py` |
| Vault Config | `tests/test_vault_config.py` |
| HTML-eksport | `tests/test_export_html.py` |
| OpenAPI/release | `tests/test_release_071.py` |
| UTF-8 regression | `tests/test_utf8_danish.py` |
| Backend-struktur | `tests/test_backend_structure.py` |

**Seneste testresultat (2026-06-25):** `136 passed` på branch `refactor/app-shell-workflow-split`.

---

## 10. Begrænsninger

- Ingen database — data lever kun i browser-session eller upload-svar
- Ingen login i selve applikationen
- **Lifecycle Compare** er ikke færdigt (kun placeholder)
- **Vault Config Tools** er ikke færdigt (kun placeholder)
- Vault Config Viewer **ændrer ikke** filer
- Workflow kræver bestemt Excel-struktur fra NTI Vault Dump Config
- Vault Config kræver gyldig NTI for Vault Job JSON
- HTML-eksport bruger statiske assets fra projektet og indeholder sessionens data

---

## 11. Versionsoplysninger

| Felt | Værdi |
|------|-------|
| Aktuel version | 0.7.1 |
| Git branch | refactor/app-shell-workflow-split |
| Seneste release-tag | v0.7.1 |
| Seneste commit | 9e48efb |
| Dokument genereret | 2026-06-25 |
