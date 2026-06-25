# Release checklist — 0.7.0

Markér kun verificerede punkter.

- [x] Working tree var rent ved start
- [x] Version opdateret (`APP_VERSION = 0.7.0`)
- [x] Changelog opdateret (`CHANGELOG.md`)
- [x] Release notes oprettet (`docs/release-notes-0.7.0.md`)
- [x] README opdateret
- [x] Deploymentdocs opdateret (DEPLOY, PUBLISH, `.env.example`)
- [x] OpenAPI kontrolleret (kun `info.version` ændret)
- [x] Alle tests består (108)
- [x] Lokal smoke-test består (TestClient: routes, version, static)
- [ ] Docker build består — **Docker Desktop ikke kørende** (npipe-fejl)
- [ ] Docker runtime-test består — **ikke kørt** (kræver image)
- [x] Compose config valideret (`docker compose config`; prod default `0.7.0` i YAML)
- [x] Ingen secrets eller kundedata i release-ændringer
- [x] `git diff --check` er ren
- [ ] Klar til commit — afventer manuel `git add` + commit
- [ ] Klar til tag — afventer manuel `git tag v0.7.0`
- [ ] Klar til push — ikke udført

## Manuel browsertest

- [ ] Forside: version 0.7.0, sprogskift, modulkort — **ikke kørt i browser** (API/static bekræftet programmatisk)
- [ ] Workflow: upload, diagram, eksport — **ikke kørt i browser**
- [ ] Vault Config: JSON, modaler — **ikke kørt i browser**

## Anbefalet commit

```text
Release version 0.7.0
```

## Anbefalet tag

```text
v0.7.0
```
