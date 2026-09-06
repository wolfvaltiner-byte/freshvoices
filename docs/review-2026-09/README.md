# Review 2026-09 — Übersicht & Board

Ergebnis des Design-/Code-Reviews vom 2026-09-06 (Cowork, Fable 5.1). Befunde mit Belegen in
`REVIEW_FINDINGS.md`; je Arbeitspaket eine Karte `WP-0x-*.md` mit Ziel, Scope, Akzeptanzkriterien,
Modellzuordnung und Copy-Paste-Prompt für die Claude-Code-Session.

## Board

| WP | Titel | Prio | Modell | Status | Braucht Wolf-Entscheid |
|---|---|---|---|---|---|
| WP-01 | Mobile-Navigation Hotfix | P0 | Sonnet 5 | ☑ umgesetzt (Branch review-2026-09) | nein |
| WP-02 | Kontaktformular → Cloudflare | P0 | Sonnet 5 (B: Opus 5) | ☐ offen | Entschieden: B (Worker) |
| WP-03 | Mobile Hero neu ordnen | P1 | Opus 5 → Sonnet 5 | ☐ offen | ja: Layout-Variante, Stats |
| WP-04 | Logo- & Markensystem | P1 | Opus 5 → Sonnet 5 → Haiku 4.5 | ☐ offen | Entschieden: B (neue Wortmarke) |
| WP-05 | Bilder & Assets | P1 | Haiku 4.5 | ☑ umgesetzt | nein |
| WP-06 | Templating & CSS-Hygiene | P2 | Opus 5 → Sonnet 5 → Haiku 4.5 | ☑ Eleventy umgesetzt · Token-Batch offen · Cutover offen | Entschieden: 11ty |
| WP-07 | Design-Politur & QA-Matrix | P2 | Opus 5 → Sonnet 5 → Haiku 4.5 | ☐ offen | nein |

Empfohlene Reihenfolge: **WP-01 → WP-02 → WP-05** (sofort, keine Entscheidungen nötig) ·
dann Entscheidungen B7 / Formular / 11ty in **einer** Cowork-Session (Opus 5, ~30 min) ·
dann **WP-06 → WP-03 → WP-04 → WP-07**.

## Regeln für alle WP-Sessions
- Session-Start: `CLAUDE.md` lesen, `/route` prüfen (Modell laut Karte), `git status --short .`.
- Keine `git add .`; Commits mit expliziten Dateinamen; keine Git-Schreiboperationen aus der Cowork-Bridge.
- Jede Karte am Ende: Akzeptanzkriterien abhaken, Status hier im Board setzen, `CLAUDE.md` + `docs/CHANGELOG-2026.md` aktualisieren.
- Nähe zum Session-Limit → sauber committen oder WIP-Commit + Notiz in `next_tasks.md` (Regel vom 2026-09-02).
