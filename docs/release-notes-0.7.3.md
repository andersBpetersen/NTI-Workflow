# Release notes — 0.7.3

## Overblik

Feature-release der tilføjer en dialog-inspireret, **read-only JobQueuer-referencevisning** i **NTI for Vault Client Viewer**, samt en fejlrettelse af modulskift i detaljepanelet.

## Nyt

- JobQueuer-modulet vises nu struktureret efter dialog-mønsteret:
  - Modul-header med titel og hjælpetekst.
  - Read-only værktøjslinje (Tilføj, Fjern, Flyt op/ned, Eksportér/Importér liste) — alle knapper er deaktiverede og ændrer ikke data.
  - Liste over job queuers (Aktiv, Navn, Beskrivelse, read-only Vis).
  - Detalje-panel: Navn, Beskrivelse, Aktiv, Id, Er pulldown, Tilføj til toolbars, Understøttede entities.
  - Sub-tabs: Jobs og User job parameters.
  - Vis/Skjul teknisk info (JSON-nøgle, JSON-sti, Id, DeployAsPulldownMenu, EntityClasses).
  - Rå JSON ligger altid kollapset nederst.
- Nye i18n-keys `vaultClient.jobQueuer.*` i alle 13 locale-filer (da/en oversat, Ja/Nej · Yes/No).

## Rettet

- Modulskift i Vault Client Viewer var i praksis i stykker: `#vc-detail-empty` lå inde i `#vc-detail-body` og blev slettet ved første modul-render, hvorefter en tidlig `return` i `renderDetail` blokerede efterfølgende skift. Tom-tilstanden genskabes nu via `innerHTML`.

## Hvad oversættes IKKE

- JSON-nøgler og data (jobnavne, processor keys, container names, entity-klasser).

## API og parser

- Ingen ændringer i API-kontrakt (kun `info.version` → `0.7.3`).
- Ingen ændringer i JSON-parser eller andre viewere.

## Opgradering fra 0.7.2

```text
NTI_WORKFLOW_IMAGE=tickjf/nti-workflow:0.7.3
```

```powershell
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
curl.exe http://localhost:8000/api/version
```

Forventet: `{"version":"0.7.3"}`

Docker image: `tickjf/nti-workflow:0.7.3`

## Rollback til 0.7.2

```text
NTI_WORKFLOW_IMAGE=tickjf/nti-workflow:0.7.2
```
