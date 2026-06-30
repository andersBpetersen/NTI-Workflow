# NTI Workflow – Publish til Docker registry

Guide til build, tag og push af Docker image.

## Officielt image (Docker Hub)

Repository: [tickjf/nti-workflow](https://hub.docker.com/r/tickjf/nti-workflow/)

| Felt | Værdi |
|------|-------|
| Registry | Docker Hub (`docker.io`) |
| Namespace | `tickjf` |
| Image | `nti-workflow` |
| Version | `0.7.3` |

Fuld image-reference:

```text
tickjf/nti-workflow:0.7.3
```

Valgfrit seneste-tag:

```text
tickjf/nti-workflow:latest
```

---

## 1. Forudsætninger

- Docker er installeret og kører
- Du har push-adgang til `tickjf/nti-workflow` på Docker Hub
- Du er logget ind med `docker login`
- Projektet er hentet lokalt

---

## 2. Login (Docker Hub)

```powershell
docker login
```

Brug Docker Hub-brugernavn og password/access token. Gem **ikke** credentials i git.

---

## 3. Manuel build, tag og push (uden script)

```powershell
cd "C:\sti\til\NTI Workflow"

docker build -t tickjf/nti-workflow:0.7.3 .

docker push tickjf/nti-workflow:0.7.3
```

Valgfrit — push også `latest`:

```powershell
docker tag tickjf/nti-workflow:0.7.3 tickjf/nti-workflow:latest
docker push tickjf/nti-workflow:latest
```

---

## 4. Brug af publish-script

```powershell
cd "C:\sti\til\NTI Workflow"

.\scripts\publish-docker.ps1 `
  -Namespace "tickjf" `
  -ImageName "nti-workflow" `
  -Version "0.7.3" `
  -AlsoLatest
```

Udelad `-RegistryHost` for Docker Hub. Scriptet kører **ikke** `docker login` automatisk.

### Andet registry (privat)

```powershell
.\scripts\publish-docker.ps1 `
  -RegistryHost "registry.example.com" `
  -Namespace "nti" `
  -ImageName "nti-workflow" `
  -Version "0.7.3" `
  -AlsoLatest
```

Giver: `registry.example.com/nti/nti-workflow:0.7.3`

---

## 5. Pull og kør på server

Brug `docker-compose.prod.yml` på servere, hvor image skal hentes fra registry.
Brug `docker-compose.yml` lokalt, når image skal bygges fra kildekoden.

### Anbefalet (docker compose – production)

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

### Manuel metode (docker run)

```powershell
docker pull tickjf/nti-workflow:0.7.3
docker run -d --restart unless-stopped -p 8000:8000 --name nti-workflow tickjf/nti-workflow:0.7.3
```

---

## 6. Opdater drift (ny version)

Opdater `NTI_WORKFLOW_IMAGE` i `.env` til ny version, derefter:

```powershell
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Erstat `0.7.3` med den nye version ved næste release.

Se **[DEPLOY.md](DEPLOY.md)** for firewall, logs og fejlfinding.

---

## 7. Sikkerhed

- Ingen tokens eller passwords i git
- Brug `docker login` og credential helper lokalt
- Brug versions-tags (`0.7.3`) som primær reference i drift
- `latest` kan bruges som supplement
- Rotér Docker Hub access tokens efter IT-politik

---

## 8. Valgfri CI/CD (GitHub Actions)

Eksempel: `.github/workflows/docker-publish.yml.example` (ikke aktiv).

Secrets til Docker Hub:

| Secret | Eksempel |
|--------|----------|
| `REGISTRY_HOST` | `docker.io` (eller tom for Hub-action) |
| `REGISTRY_USERNAME` | `tickjf` |
| `REGISTRY_PASSWORD` | Access token fra Docker Hub |
| `IMAGE_NAMESPACE` | `tickjf` |

Ingen secrets må committes til repo.
