# Release checklist — 0.7.1

- [x] Working tree rent ved start
- [x] Beskadigede tegn fundet og rettet (`static/i18n/da-DK.json`)
- [x] UTF-8 valideret (HTML meta charset, JSON/JS decode)
- [x] Regressionstest tilføjet
- [x] Uploadområder ensrettet (shared dropzone) (`tests/test_utf8_danish.py`)
- [x] Version opdateret til 0.7.1
- [x] OpenAPI kun ændret i `info.version`
- [x] Alle tests består (126)
- [x] Lokal smoke-test (TestClient: charset, da-DK locale, version)
- [x] Docker build består
- [x] Docker runtime-test består (health, version 0.7.1, da-DK.json 200)
- [x] Compose prod default viser `tickjf/nti-workflow:0.7.1`
- [x] Ingen secrets eller kundedata
- [x] `git diff --check` er ren
- [ ] Klar til commit — afventer manuel handling
- [ ] Klar til tag — afventer manuel `git tag v0.7.1`
- [ ] Klar til push — ikke udført

## Manuel browsertest

- [ ] Visuel kontrol i browser — anbefales før produktion (API/locale bekræftet programmatisk)

## Anbefalet commit

```text
Fix Danish UTF-8 text rendering in 0.7.1
```

## Anbefalet tag

```text
v0.7.1
```
