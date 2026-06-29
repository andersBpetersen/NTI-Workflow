# Forside i18n — rettelsesrapport

**Dato:** 2026-06-29  
**Branch:** `refactor/app-shell-workflow-split`  
**Baseline commit:** `a6ed0c8` (working tree havde ucommitted 0.7.2-ændringer ved opstart)

## Hvad fejlen var

**Årsag: B — `pl-PL.json` havde keys, men engelske værdier.**

Forsiden bruger allerede `data-i18n` korrekt (`index.html`), og `app-shell.js` kalder `initI18n()` + `bindLocaleSelect()`. Når brugeren vælger Polski, indlæses `pl-PL.json` og `applyTranslations()` kører — men home-sektionen i `pl-PL.json` var identisk med engelsk, så UI så ud til at «ikke oversætte».

Ikke årsag: manglende keys (A), hardkodet HTML uden i18n (D/E), eller defekt `t()`-logik.

## Keys med engelsk fallback i pl-PL (før)

| Key | Før (pl-PL) |
|-----|-------------|
| `language.label` | Language |
| `home.intro` | Internal tools for… |
| `home.workflowViewer.open` | Open Workflow Viewer |
| `home.lifecycleCompare.comingSoon` | Coming soon |
| `home.vaultConfigViewer.open` | Open Vault Config Viewer |
| (+ øvrige home-beskrivelser) | Engelsk |

## Ændrede filer

| Fil | Ændring |
|-----|---------|
| `static/i18n/pl-PL.json` | Polske oversættelser for `language.*` og `home.*` |
| `static/index.html` | `data-i18n-aria-label` på sprogvælger |
| `tests/test_home_i18n.py` | Ny testsuite for forsiden |
| `docs/i18n-home-page-fix-report.md` | Denne rapport |

## Prioriterede sprog

- **pl-PL** — rettet (primær opgave)
- **da-DK** — havde allerede korrekte home-oversættelser (verificeret)
- **en-GB** — canonical uændret

## Testresultat

Kør: `pytest -q tests/test_home_i18n.py`

## Manuel test

Start: `uvicorn app.main:app` → http://localhost:8000/

Vælg **Polski** og kontrollér:

- `Język` (ikke Language)
- Polsk intro-tekst
- `Otwórz Workflow Viewer`
- `Wkrótce`
- `Otwórz Vault Config Viewer`

Produktnavne (`NTI Workflow`, `Workflow Viewer`, m.fl.) forbliver uændrede.

## Kendte resterende mangler (uden for forsiden)

- Workflow Viewer interne tekster (bevidst uændret)
- Vault Config Viewer interne tabs/formularer (delvist engelsk)
- Andre locales end pl-PL/da-DK kan stadig have engelsk på home, hvis ikke oversat

## Git-status

Se `git status --short` — ingen commit udført.
