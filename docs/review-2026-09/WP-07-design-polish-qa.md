# WP-07 · Design-Politur & QA-Matrix

| Feld | Wert |
|---|---|
| Priorität | **P2** (nach WP-01–06) |
| Modell / Effort | Schritt 1 **Opus 5 · high** (Design-Critique auf Basis frischer Screenshots, Cowork) → Schritt 2 **Sonnet 5 · medium** (Fixes) → Schritt 3 **Haiku 4.5** (Playwright-QA-Skript ins Repo, `scripts/qa-shots.js`) |
| Session-Typ | Cowork (Critique) + Claude Code CLI (1–2 Sessions) |
| Betroffene Dateien | `css/style.css` (Tokens `--muted`, Reveal), `index.html`/Includes, neu `scripts/qa-shots.js`, `docs/QA-CHECKLIST.md` |
| Abhängigkeiten | WP-06 (sonst 8 Dateien pro Fix) |
| Befunde | E (alle), A5-Restrisiko, „False-Alarm"-Trap aus `CLAUDE.md` |

## Ziel
Site fühlt sich auf iPhone wie auf Desktop bewusst gestaltet an; Regressionen werden per Skript sichtbar, nicht per Zufall.

## Scope
1. **Kontrast**: `--muted` von `#9A9A9A` auf ≥ `#B3B3B3` für Fließtext (Kontrast ≥ 7:1 auf `#1A1A1A`); Eyebrow/Labels dürfen `--muted-soft` behalten.
2. **Reveal**: `rootMargin: '0px 0px -10% 0px'` → `'0px 0px 15% 0px'`, `threshold 0.05`; auf `(max-width:768px)` Reveal ohne Translate (nur Opacity 0.3 s) — behebt „leere Sektionen" beim schnellen Scrollen.
3. **Hero-Badge/Stats** gemäß WP-03-Entscheid finalisieren; Kunden-Logo-Strip ggf. auf die Startseite.
4. **Nav-Hierarchie**: Sprach-Toggle als Ghost-Text („EN") ohne Rahmen, CTA bleibt einziger gefüllter Button; Desktop-Logo 36–40 px (aus WP-04).
5. **Tap-Ziele** ≥ 44 px: Filter-Buttons (`samples.html`), Audio-Play, Footer-Social.
6. **QA-Skript** `scripts/qa-shots.js`: Viewports iPhone 13 / iPhone 17 / iPad / 1440; pro Seite Top-, Menü-offen- und Full-Screenshot; Checks: horizontaler Overflow, `h1` im Viewport, Menü schließbar, keine 404-Requests (Audio/Video ausgenommen). Ausgabe nach `.qa/` (gitignored).
7. **Realgeräte-Checkliste** `docs/QA-CHECKLIST.md`: iPhone Safari (Menü, Sprache, Audio-Play, Formular), Android Chrome, Desktop Safari/Chrome/Firefox; Lighthouse Mobile ≥ 90 Performance/A11y.

## Akzeptanzkriterien
- [x] `node scripts/qa-shots.js` läuft grün (alle Checks) — verifiziert auf Branch `review-2026-09` (32/32 Seite×Viewport-Kombinationen, Exit-Code 0). Noch nicht auf `main` gegen den echten Deploy erneut gelaufen.
- [ ] Lighthouse Mobile (index, samples, contact): Performance ≥ 90, Accessibility ≥ 95. — nicht ausführbar in dieser Sandbox (braucht eine live/deployte URL); Checkbox in `docs/QA-CHECKLIST.md`.
- [ ] Wolf-Abnahme auf iPhone: Menü, Hero, Hörprobe abspielen, Formular senden — ohne Kommentar „sieht komisch aus". — noch offen, Realgerät-Test.

**Umsetzungsstatus (2026-09-06, Sonnet 5 · medium):** Scope 1, 2, 4, 5, 6, 7 umgesetzt. **Scope 3 (Hero-Badge/Stats, Kunden-Logo-Strip auf der Startseite) bewusst NICHT umgesetzt** — Inhaltsentscheidung von Wolf noch offen. Details, Kontrastwerte, Tap-Ziel-Maße und Vorher/Nachher-Höhen: `docs/CHANGELOG-2026.md` → „WP-07 — Contrast, reveal timing, nav hierarchy, tap targets, QA script".

## Session-Prompt (Copy-Paste, Schritt 2+3)
```
Lies CLAUDE.md und docs/review-2026-09/WP-07-design-polish-qa.md sowie die Critique-Notizen
aus Cowork (<Datei/Link>). Setze Scope 1–2, 4–7 um; Scope 3 nur, wenn WP-03-Entscheid vorliegt.
Lege scripts/qa-shots.js an (Haiku-Executor), lass es laufen und hänge die Ergebnis-Tabelle
an docs/CHANGELOG-2026.md. Committe mit expliziten Dateinamen.
```
