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
| Login | Ingen (første version) |
| Standard port | **8000** |
| Health endpoint | `GET /health` → `{"status":"ok"}` |

---

## Krav til server

- Docker Engine eller Docker Desktop
- `docker compose` (følger med moderne Docker)
- Netværksadgang til serveren for brugere (typisk internt LAN)
- Port **8000/TCP** åben i firewall, hvis andre maskiner end serveren skal tilgå appen

Ingen SQL Server, ingen eksterne API-nøgler, ingen persistent storage.

---

## Hurtig deploy (anbefalet)

```powershell
cd "C:\sti\til\NTI Workflow"
docker compose up --build -d
```

Verificér:

```powershell
curl http://localhost:8000/health
```

Forventet svar:

```json
{"status":"ok"}
```

Åbn i browser:

```
http://localhost:8000
```

Eller fra andre PC'er på netværket:

```
http://<server-ip>:8000
```

---

## Deploy uden docker compose

```powershell
cd "C:\sti\til\NTI Workflow"
docker build -t nti-workflow .
docker run -d --restart unless-stopped -p 8000:8000 --name nti-workflow nti-workflow
```

Stop og fjern:

```powershell
docker stop nti-workflow
docker rm nti-workflow
```

---

## Drift

### Se logs

```powershell
docker compose logs -f
```

Eller uden compose:

```powershell
docker logs -f nti-workflow
```

### Genstart

```powershell
docker compose restart
```

### Opdater efter ny kode

```powershell
docker compose down
docker compose up --build -d
```

### Status

```powershell
docker compose ps
```

---

## Reverse proxy / HTTPS (valgfrit)

Appen kører selv på HTTP port 8000. HTTPS sættes typisk op foran containeren:

**Eksempel (IIS, nginx, Traefik):**

```
https://workflow.intern.firma.dk  →  http://127.0.0.1:8000
```

Appen kræver ingen særlig konfiguration for dette i v0.1.

---

## Firewall (Windows Server)

Hvis brugere skal tilgå serveren fra andre maskiner:

```powershell
New-NetFirewallRule -DisplayName "NTI Workflow" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

---

## Brug efter deploy

1. Bruger åbner websiden
2. Klikker **Vælg Excel-fil**
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

Upload testfilen:

```
samples/sample-lifecycle.xlsx
```

Forventet: diagram med 4 states og 5 transitions.

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

Eksempel:

```powershell
curl.exe -X POST "http://localhost:8000/api/upload" -F "file=@samples\sample-lifecycle.xlsx"
```

---

## Projektstruktur (deploy-relevant)

```
NTI Workflow/
├── Dockerfile              # Container build
├── docker-compose.yml      # Start/stop + healthcheck
├── requirements.txt        # Python dependencies
├── app/
│   ├── main.py             # FastAPI endpoints
│   └── parser.py           # Excel parsing (openpyxl)
├── static/
│   ├── index.html          # Upload UI
│   ├── app.js              # Upload logik
│   ├── viewer.js           # VBA-kompatibel SVG viewer
│   └── viewer.css
└── samples/
    └── sample-lifecycle.xlsx
```

**Medtag ikke ved zip/deploy:** `.venv/`, `__pycache__/`, `.pytest_cache/`

---

## Fejlfinding

| Problem | Løsning |
|---------|---------|
| `docker: command not found` | Installér Docker Desktop / Docker Engine |
| Port 8000 optaget | Skift port i `docker-compose.yml`, f.eks. `"8080:8000"` |
| Siden loades ikke eksternt | Tjek firewall og at container kører (`docker compose ps`) |
| Upload fejler med 422 | Excel mangler ark eller kolonner — se Excel-format ovenfor |
| Container stopper med det samme | Kør `docker compose logs` og tjek fejlbesked |

---

## Kontakt / ansvar

| Rolle | Ansvar |
|-------|--------|
| Udvikler | Funktionalitet, Excel-format, fejl i parsing |
| Drift/IT | Docker, firewall, URL, HTTPS, backup af server |
| Brugere | Uploader korrekt Vault Excel-eksport |

---

## Versionsinfo

- **v0.1** – Første version uden database og login
- Erstatter VBA workflow-knap i Excel
- Deployment via Docker anbefales
