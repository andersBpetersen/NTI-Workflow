# NTI Workflow

Intern webservice der erstatter Excel VBA add-in'et `NTI_Workflow_Ver_1.xlam`. Visualiserer lifecycle transitions fra Vault Excel-eksport. Ingen database og ingen login i første version.

## Funktioner

- Forside med flere værktøjer (første: **Workflow Viewer**)
- Upload af Excel-fil (`.xlsx`, `.xlsm`) med validering af Vault-format
- Drag-and-drop upload af Excel-outputfiler fra NTI Vault Dump Config
- Læser arket `LifeCycleDefinitionTransitions`
- Læser valgfrit arket `LifeCycleDefinitionStates` (state permissions)
- Parser transitions til nodes/edges JSON
- Interaktivt diagram i browser (samme visning som VBA add-in)
- Klikbare states og transitions med detaljepanel
- Tydelig visning af import-advarsler efter upload
- Enkel zoom på diagrammet (ind/ud/nulstil)
- Eksportér Workflow Viewer som standalone HTML (offline til undervisning/review)
- Dynamisk layout for store workflows (Auto, Normal, Kompakt, Stor)
- Bedre læsbarhed ved mange transitions og states

**v0.6.0** – Excel-filer fra NTI Vault Dump Config kan nu uploades med træk og slip.

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

Åbn: http://127.0.0.1:8000 — forsiden vises først. Klik **Åbn Workflow Viewer** for at uploade Excel.

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
docker build -t nti-workflow .
docker run --rm -p 8000:8000 --name nti-workflow nti-workflow
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
pytest
```

Testfil: `samples/sample-lifecycle.xlsx`

Tredjepartslicenser: se [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Projektstruktur

```
app/
  main.py          # FastAPI endpoints
  parser.py        # Excel parsing (openpyxl)
  export_html.py   # Standalone HTML export
static/
  index.html       # Upload UI
  viewer.js        # VBA-kompatibel SVG-viewer
  viewer.css
  app.js           # Upload-logik
scripts/
  create_sample_excel.py
tests/
  test_parser.py
Dockerfile
requirements.txt
```
