# NTI Workflow – Deploy guide

Intern webservice der erstatter Excel VBA add-in'et `NTI_Workflow_Ver_1.xlam`.

Brugere uploader en Vault Excel-eksport og får samme type lifecycle-visualisering som makroen producerer (diagram, rolle-filter, tabeller).

---

## Overblik

| Emne | Værdi |
|------|-------|
| App | FastAPI + Uvicorn |
| Frontend | Statisk HTML/JS (VBA-kompatibel viewer) |
| Database | Ingen |
| Login | Ingen |
| Standard port | **8000** |
| Health endpoint | `GET /health` → `{"status":"ok"}` |

| Compose-fil | Formål |
|-------------|--------|
| `docker-compose.yml` | Lokal udvikling / lokal build (`build: .`) |
| `docker-compose.prod.yml` | Drift fra Docker registry (kun `image`) |

---

## Krav til server

- Docker Engine eller Docker Desktop
- `docker compose` (følger med moderne Docker)
- Netværksadgang til serveren for brugere (typisk internt LAN)
- Port **8000/TCP** åben i firewall, hvis andre maskiner end serveren skal tilgå appen

Ingen SQL Server, ingen eksterne API-nøgler, ingen persistent storage.

---

## Lokal deploy / build (udvikling)

Brug `docker-compose.yml` når image skal bygges fra kildekoden på din maskine.

```powershell
cd "C:\sti\til\NTI Workflow"
docker compose up --build -d
```

Verificér:

```powershell
curl http://localhost:8000/health
```

Stop:

```powershell
docker compose down
```

Åbn i browser: `http://localhost:8000`

### Opdater efter lokale kodeændringer

```powershell
docker compose down
docker compose up --build -d
```

### Logs og status (lokal)

```powershell
docker compose logs -f
docker compose ps
docker compose restart
```

---

## Kør fra Docker registry (drift / production)

Officielt image på Docker Hub: [tickjf/nti-workflow](https://hub.docker.com/r/tickjf/nti-workflow/)

Brug `docker-compose.prod.yml` på servere, hvor image skal hentes fra registry — **uden** lokal build.

```powershell
cd "C:\sti\til\NTI Workflow"
copy .env.example .env
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Verificér:

```powershell
curl http://localhost:8000/health
```

### Logs, status og genstart (production)

```powershell
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml restart
```

### Opdater drift (ny version fra registry)

Opdater `NTI_WORKFLOW_IMAGE` i `.env` til ny version, derefter:

```powershell
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Se **[PUBLISH.md](PUBLISH.md)** for build og push af nye versioner.

### Manuel metode (uden compose)

```powershell
docker pull tickjf/nti-workflow:0.6.4
docker run -d --restart unless-stopped -p 8000:8000 --name nti-workflow tickjf/nti-workflow:0.6.4
```

---

## Deploy uden docker compose (lokal build)

```powershell
cd "C:\sti\til\NTI Workflow"
docker build -t nti-workflow:local .
docker run -d --restart unless-stopped -p 8000:8000 --name nti-workflow nti-workflow:local
```

Stop og fjern:

```powershell
docker stop nti-workflow
docker rm nti-workflow
```

---

## Reverse proxy / HTTPS (valgfrit)

Appen kører selv på HTTP port 8000. HTTPS sættes typisk op foran containeren:

**Eksempel (IIS, nginx, Traefik):**

```
https://workflow.intern.firma.dk  →  http://127.0.0.1:8000
```

Appen kræver ingen særlig konfiguration for dette.

---

## Firewall (Windows Server)

Hvis brugere skal tilgå serveren fra andre maskiner:

```powershell
New-NetFirewallRule -DisplayName "NTI Workflow" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

---

## Brug efter deploy

1. Bruger åbner websiden
2. Klikker **Åbn Workflow Viewer**
3. Uploader Vault-eksport (`.xlsx` / `.xlsm`)
4. Diagram og tabeller vises

### Påkrævet Excel-format

**Ark:** `LifeCycleDefinitionTransitions`

| Kolonne | Påkrævet |
|---------|----------|
| LifeCycleDefinition | Ja |
| From State | Ja |
| To State | Ja |
| Security | Ja |
| Id | Nej |
| Custom JobTypes | Nej |

**Valgfrit ark:** `LifeCycleDefinitionStates`

| Kolonne | Påkrævet |
|---------|----------|
| LifeCycleDefinition | Ja |
| State DisplayName | Ja |
| State Security | Ja |
| Id | Nej |

### Test efter deploy

Upload testfilen `samples/sample-lifecycle.xlsx` (ved lokal build) eller en Vault-eksport.

Forventet: diagram med states og transitions.

---

## API (til evt. integration/test)

### Health

```
GET /health
```

### Upload

```
POST /api/upload
Content-Type: multipart/form-data
Field: file
```

---

## Projektstruktur (deploy-relevant)

```
NTI Workflow/
├── Dockerfile
├── docker-compose.yml          # Lokal build/dev
├── docker-compose.prod.yml     # Drift fra registry
├── .env.example
├── requirements.txt
├── app/
├── static/
└── samples/
```

**Medtag ikke ved zip/deploy:** `.venv/`, `__pycache__/`, `.pytest_cache/`

---

## Fejlfinding

| Problem | Løsning |
|---------|---------|
| `docker: command not found` | Installér Docker Desktop / Docker Engine |
| Port 8000 optaget | Skift `NTI_WORKFLOW_PORT` i `.env`, f.eks. `8080` |
| Siden loades ikke eksternt | Tjek firewall og at container kører |
| Upload fejler med 422 | Excel mangler ark eller kolonner |
| Container stopper med det samme | Kør `docker compose ... logs` og tjek fejlbesked |
| Pull fejler på server | Tjek netværk og image-tag i `.env` |

---

## Kontakt / ansvar

| Rolle | Ansvar |
|-------|--------|
| Udvikler | Funktionalitet, Excel-format, fejl i parsing |
| Drift/IT | Docker, firewall, URL, HTTPS, backup af server |
| Brugere | Uploader korrekt Vault Excel-eksport |

---

## Versionsinfo

- **v0.5** – Forbedret layout og læsbarhed for store workflows
- **v0.4** – Standalone HTML-export og Docker registry publish-flow
- **v0.3** – Klikbart detaljepanel, import warnings og zoom
- **v0.2** – Upload-validering, forside, pile og forbedret diagramvisning
- **v0.1** – Første version uden database og login

Erstatter VBA workflow-knap i Excel. Deployment via Docker anbefales.
