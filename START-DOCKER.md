# NTI Workflow – start med Docker Desktop

## Krav

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) installeret og kørende

## Hurtig start (drift fra Docker Hub)

Image-tag i `.env.example`: `tickjf/nti-workflow:0.7.3`

1. Udpak denne zip til en mappe, fx `C:\NTI Workflow`
2. Åbn PowerShell i mappen
3. Kør:

```powershell
copy .env.example .env
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

4. Åbn i browser: **http://localhost:8000**
5. Klik **Åbn Workflow Viewer** og upload Vault Excel-eksport (`.xlsx` / `.xlsm`)

Testfil: `samples\sample-lifecycle.xlsx`

## Lokal build (hvis pull fejler)

```powershell
docker compose up --build -d
```

## Verificér

```powershell
curl http://localhost:8000/health
```

## Stop

```powershell
docker compose -f docker-compose.prod.yml down
```

Se `DEPLOY.md` for flere detaljer.
