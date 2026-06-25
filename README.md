# NTI Workflow

**Aktuel version: 0.7.1**

Intern webservice der erstatter Excel VBA add-in'et `NTI_Workflow_Ver_1.xlam`. Visualiserer lifecycle transitions fra Vault Excel-eksport. Ingen database og ingen login.

## Moduler

| Modul | Route | Beskrivelse |
|-------|-------|-------------|
| App shell | `/` | Forside, sprogvalg, navigation |
| Workflow Viewer | `/workflow/` | Excel-upload, diagram, HTML-eksport |
| Vault Config Viewer | `/vault-config/` | NTI for Vault Job JSON (lokalt i browseren) |

## Funktioner

- Forside med flere værktøjer (første: **Workflow Viewer**)
- Upload af Excel-output fra NTI Vault Dump Config
- Drag-and-drop af `.xlsx` og `.xlsm`
- Upload-validering af Vault-format (arket `LifeCycleDefinitionTransitions`)
- Læser valgfrit arket `LifeCycleDefinitionStates` (state permissions)
- Klikbare states og transitions med detaljepanel
- State permissions for valgt rolle
- Allow-, Deny- og ikke specificerede transitions kan vises og skjules separat
- Custom JobTypes vises som klikbare jobmarkeringer på transitions
- Toggle på `Vis kun valgt state` (gendan tidligere visning)
- Dynamisk layout: Auto, Normal, Kompakt og Stor
- Automatisk tekstombrydning af state-navne i cirkeldiagrammet
- Tydelig visning af import-advarsler efter upload
- Enkel zoom på diagrammet (ind/ud/nulstil)
- Eksport til standalone HTML (offline til undervisning/review)

**v0.7.1** – Rettet beskadigede danske tegn (æ/ø/å) i app shell og Vault Config locale-tekster.

**v0.7.0** – Modulær arkitektur: app shell, Workflow og Vault Config som separate sider; fælles i18n og shared frontend; backend opdelt i routes/models/services uden API-brud.

**v0.6.4** – Samlet UI-opdatering med drag-and-drop, forenklede state permissions, forbedret kontrollayout og ombrudte state-navne.

**v0.6.6** – Allow-, Deny- og ikke-specificerede pilespidser er gjort dobbelt så store.

## NTI for Vault Config Viewer

- Åbnes fra forsiden via kortet **NTI for Vault Config** (`/vault-config/`).
- Accepterer NTI for Vault Job JSON-filer (`.json`) via filvælger eller træk-og-slip.
- Al JSON-behandling sker lokalt i browseren — ingen data sendes til serveren.
- Viewer er skrivebeskyttet (kun visning af konfiguration).
- Første version viser den tekniske konfiguration (containere, processorer, jobs, conditions m.m.).
- En visuel procesoversigt planlægges som senere udvidelse.

**v0.6.5** – Ens pilespidser, Vis Allow-filter og Custom JobTypes som klikbare markeringer på transitions.

**v0.6.0** – Excel-filer fra NTI Vault Dump Config kan uploades med træk og slip.

**v0.6.1** – Kontrolområdet er opdelt i workflowvalg, roller og visningsindstillinger.

**v0.6.2** – State-cirklerne blev midlertidigt forstørret (tilbageført i v0.6.3/v0.6.4).

**v0.6.3** – State-navne ombrydes automatisk over flere linjer i cirkeldiagrammet.

## Krav

- Python 3.11+ (lokal kørsel)
- Docker (valgfrit)

## Kør lokalt

```powershell
cd "C:\GitHub\NTI Workflow"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts\create_sample_excel.py
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Åbn: http://127.0.0.1:8000 — forsiden vises først. Klik **Åbn Workflow Viewer** for at gå til workflow-siden.

## Routes

- `/` – Forside / app shell
- `/workflow/` – Workflow Viewer
- `/vault-config/` – NTI for Vault Config Viewer

### Upload-validering

Backend og frontend validerer upload:

- Kun `.xlsx` og `.xlsm`
- Filen må ikke være tom (maks. 25 MB)
- Skal være en gyldig Excel-fil med arket `LifeCycleDefinitionTransitions`
- Påkrævede kolonner: `LifeCycleDefinition`, `From State`, `To State`, `Security`

Fejlbeskeder vises på dansk ved forkert filtype, tom fil, for stor fil eller forkert Vault-format.

## Deploy

Se **[DEPLOY.md](DEPLOY.md)** for komplet guide til IT/drift (Docker, firewall, reverse proxy, fejlfinding).

Se **[PUBLISH.md](PUBLISH.md)** for build, tag og push til Docker registry ([tickjf/nti-workflow](https://hub.docker.com/r/tickjf/nti-workflow/)).

Se **[docs/release-notes-0.7.1.md](docs/release-notes-0.7.1.md)** for release 0.7.1.

Se **[docs/release-notes-0.7.0.md](docs/release-notes-0.7.0.md)** for release 0.7.0.

Se **[CHANGELOG.md](CHANGELOG.md)** for versionshistorik.

Se **[docs/i18n.md](docs/i18n.md)** for i18n-registry, fallback, normalisering og locale-validering.

Se **[docs/shared-frontend.md](docs/shared-frontend.md)** for shared CSS/JS utilities og modulgrænser.

Se **[docs/architecture.md](docs/architecture.md)** for samlet arkitektur (moduler, API-flow, grænser).

Se **[docs/backend-architecture.md](docs/backend-architecture.md)** for backend-moduler, routers og services.

Se **[docs/openapi-contract.json](docs/openapi-contract.json)** for canonical API-schema.

Installér [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) og sørg for at Docker kører.

### Lokal udvikling (build fra kildekode)

```powershell
cd "C:\GitHub\NTI Workflow"
docker compose up --build -d
```

### Drift fra Docker registry (production)

```powershell
copy .env.example .env
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Åbn: http://localhost:8000

Stop lokal:

```powershell
docker compose down
```

Stop production:

```powershell
docker compose -f docker-compose.prod.yml down
```

Se logs (lokal):

```powershell
docker compose logs -f
```

### Alternativ: docker build + run

```powershell
cd "C:\GitHub\NTI Workflow"
docker build -t tickjf/nti-workflow:0.7.1 .
docker run --rm -p 8000:8000 tickjf/nti-workflow:0.7.1
```

Kør i baggrunden med genstart:

```powershell
docker run -d --restart unless-stopped -p 8000:8000 --name nti-workflow nti-workflow
```

Stop container:

```powershell
docker stop nti-workflow
docker rm nti-workflow
```

### Internt netværk (andre PC'er i firmaet)

Når containeren kører på en server, kan kolleger åbne:

```
http://<server-ip>:8000
```

Eksempel: `http://192.168.1.50:8000`

Sørg for at Windows Firewall tillader indgående trafik på port **8000**, hvis andre maskiner skal tilgå den.

### Opdatere efter kodeændringer

```powershell
cd "C:\GitHub\NTI Workflow"
docker compose up --build -d
```

Eller uden compose:

```powershell
docker build -t nti-workflow .
docker stop nti-workflow
docker rm nti-workflow
docker run -d --restart unless-stopped -p 8000:8000 --name nti-workflow nti-workflow
```

### Health check

```powershell
curl http://localhost:8000/health
```

Forventet svar: `{"status":"ok"}`

## API

### `GET /health`

Returnerer `{"status":"ok"}`.

### `GET /api/version`

Returnerer den centrale applikationsversion:

```json
{"version":"0.7.1"}
```

### `POST /api/upload`

Multipart upload med feltet `file`.

Returnerer JSON med:

- `lifecycleDefinitions` – unikke lifecycle-navne
- `roles` – roller fundet i Security-kolonner
- `nodes` – states som graf-noder
- `edges` – transitions med `security` og `customJob`
- `stateDefinitions` – state permissions (hvis arket findes)
- `meta` – antal, advarsler m.m.

### `POST /api/export/html`

JSON-body med `payload` (samme struktur som upload-svaret), valgfrit `sourceFileName`, `selectedLifeCycle`, `title` og `viewerContext`.

Returnerer en selvstændig `.html`-fil som download. Filen kan åbnes offline i browseren uden server.

## Modulgrænser

- Forsiden (`/`) ejer navigation og sprogvælger.
- Workflow Viewer har egen side på `/workflow/`.
- Vault Config Viewer har egen side på `/vault-config/`.
- Moduler deler fortsat i18n via samme locale-storage.
- Workflow Viewer bruger backend-API (`/api/upload`, `/api/export/html`).
- Vault Config Viewer behandler JSON lokalt i browseren.

## Excel-format (matcher VBA add-in)

### Ark: `LifeCycleDefinitionTransitions`

| Kolonne | Påkrævet |
|---------|----------|
| LifeCycleDefinition | Ja |
| From State | Ja |
| To State | Ja |
| Security | Ja |
| Id | Nej |
| Custom JobTypes | Nej |

### Ark: `LifeCycleDefinitionStates` (valgfrit)

| Kolonne | Påkrævet |
|---------|----------|
| LifeCycleDefinition | Ja |
| State DisplayName | Ja |
| State Security | Ja |
| Id | Nej |

## Test

```powershell
pip install -r requirements-dev.txt
python scripts\create_sample_excel.py
pytest -q
```

Testfil: `samples/sample-lifecycle.xlsx`

Tredjepartslicenser: se [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Projektstruktur

```
app/
  main.py                    # FastAPI app, routers, static mount
  core/                      # version, settings
  routes/                    # pages, system, workflow_api
  models/                    # Pydantic API-modeller
  services/workflow/         # parser, export, upload
static/
  index.html                 # App shell (forside)
  app-shell.js / .css
  workflow/                  # Workflow Viewer
  vault-config/              # Vault Config Viewer
  shared/                    # Delt UI + utilities
  i18n.js + i18n/*.json      # Oversættelser
  viewer.js / viewer.css     # Workflow-diagram
samples/
  sample-lifecycle.xlsx      # Test/workflow fixture
scripts/
  create_sample_excel.py
tests/
docs/
  architecture.md            # Samlet arkitektur
Dockerfile
requirements.txt
```

Se [docs/architecture.md](docs/architecture.md) og [docs/final-project-structure.txt](docs/final-project-structure.txt) for detaljer.
