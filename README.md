# NTI Workflow

Internal web service for visualizing Vault lifecycle transitions from Excel export. NTI Workflow accepts Excel output files in `.xlsx` format.

Intern webservice der erstatter Excel VBA add-in'et `NTI_Workflow_Ver_1.xlam`. NTI Workflow accepterer Excel-outputfiler i formatet `.xlsx`. Ingen database og ingen login i første version.

## Funktioner

- Forside med flere værktøjer (første: **Workflow Viewer**)
- Upload af Excel-output fra NTI Vault Dump Config
- Drag-and-drop af `.xlsx`
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
- International brugerflade med 13 lande/locales og engelsk fallback

**v0.7.1** – Upload er begrænset til `.xlsx`-filer.

**v0.7.0** – Internationalisering af brugerfladen med landvælger, sprogpakker og offline HTML-export med indlejrede oversættelser.

**v0.6.6** – Allow-, Deny- og ikke-specificerede pilespidser er gjort dobbelt så store.

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

Åbn: http://127.0.0.1:8000 — forsiden vises først. Klik **Åbn Workflow Viewer** for at uploade Excel.

### Upload-validering

Backend og frontend validerer upload:

- Kun `.xlsx`
- Filen må ikke være tom (maks. 25 MB)
- Skal være en gyldig Excel-fil med arket `LifeCycleDefinitionTransitions`
- Påkrævede kolonner: `LifeCycleDefinition`, `From State`, `To State`, `Security`

Fejlbeskeder vises på dansk ved forkert filtype, tom fil, for stor fil eller forkert Vault-format.

## Internationalization

The user interface supports multiple countries/locales. English (`en-GB`) is always the fallback language.

| Country | Locale |
|---------|--------|
| Danmark | `da-DK` |
| Brasil | `pt-BR` |
| Deutschland | `de-DE` |
| France | `fr-FR` |
| España | `es-ES` |
| Ireland | `en-IE` |
| Ísland | `is-IS` |
| Italia | `it-IT` |
| Nederland | `nl-NL` |
| Norge | `nb-NO` |
| Suomi | `fi-FI` |
| Sverige | `sv-SE` |
| UK | `en-GB` |

Translation files live in `static/i18n/` (`en.json` is the master file). The language selector stores the chosen locale in `localStorage` under `ntiWorkflow.locale`.

To add a new language:

1. Copy `static/i18n/en.json` to `static/i18n/<language>.json`
2. Translate all values (keep the same keys)
3. Add the locale to `supportedLocales` in `static/i18n.js` and `app/i18n_config.py`
4. Add an `<option>` to the `#localeSelect` dropdown in `static/index.html` and `app/export_html.py`

Vault data is never translated: lifecycle names, state names, role names, Custom JobTypes, Excel sheet names, and raw Excel values remain unchanged.

Standalone HTML export embeds all translation files as `window.NTI_TRANSLATIONS` so offline export works without a server.

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
