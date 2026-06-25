# Release notes — 0.7.1

**Dato:** 2026-06-25  
**Type:** Patch release (UTF-8 / dansk tekst)

## Fejlbeskrivelse

Enkelte danske UI-tekster viste `?` i stedet for æ/ø/å — fx `?bn`, `Tr?k`, `Indl?s`. Workflow Viewer var ikke påvirket, fordi de korrekte strenge allerede fandtes i `da-DK.json` under `upload`-sektionen.

## Påvirkede sider

- **App shell** (`/`) — `home.vaultConfigViewer.open` (`Åbn Vault Config Viewer`)
- **Vault Config Viewer** (`/vault-config/`) — `vault.*` locale-nøgler (drop zone, knapper, status, fejltekster)

## Rettelser

Alle beskadigede værdier i `static/i18n/da-DK.json` er gendannet med korrekt UTF-8 (æ, ø, å, Å).

Uploadområderne i Workflow Viewer og Vault Config Viewer bruger nu samme shared dropzone-komponent (`static/shared/ui/file-dropzone.css`) med ens visuel stil, keyboard-understøttelse og drag-over-adfærd. Modulerne beholder egne tekster og filtyper (`.xlsx`/`.xlsm` vs. `.json`).

Ingen ændringer i:

- API-kontrakt (paths/schemas)
- Parser, diagram eller Vault Config-logik
- Layout eller routes

## Opgradering fra 0.7.0

```powershell
# Opdatér .env:
NTI_WORKFLOW_IMAGE=tickjf/nti-workflow:0.7.1

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
curl http://localhost:8000/api/version
```

Forventet: `{"version":"0.7.1"}`

## Docker image

```text
tickjf/nti-workflow:0.7.1
```

## Rollback til 0.7.0

```powershell
NTI_WORKFLOW_IMAGE=tickjf/nti-workflow:0.7.0
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Testresultat

Se [release-0.7.1-report.md](release-0.7.1-report.md).
