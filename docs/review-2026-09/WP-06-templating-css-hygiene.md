# WP-06 · Templating & CSS-Hygiene

| Feld | Wert |
|---|---|
| Priorität | **P2** (Wartbarkeit; Voraussetzung für effiziente Folge-WPs) |
| Modell / Effort | Schritt 1 **Opus 5 · high** (Entscheid 11ty ja/nein, 15 min, Cowork) → Schritt 2 **Sonnet 5 · medium** (Migration Nav/Footer/Head in Includes) → Schritt 3 **Haiku 4.5** (Token-Batch: `rgba()` → Tokens, Inline-Styles raus) |
| Session-Typ | Cowork (Entscheid) + Claude Code CLI (2 Sessions, getrennt: Templating / Token-Batch) |
| Betroffene Dateien | alle 8 HTML, `css/style.css`, neu: `src/_includes/*.njk`, `.eleventy.js`, `package.json`; Cloudflare Build-Settings (Dashboard) |
| Abhängigkeiten | WP-01–WP-04 sollten **vorher** gemergt sein (sonst Konflikte in 8 Dateien) — oder WP-06 zuerst und alles andere danach; Reihenfolge in Cowork festlegen |
| Befunde | D1, D2, D3, D5 |

## Ziel
Nav, Footer und `<head>` existieren genau **einmal**. Seitenspezifisches CSS liegt in Dateien statt in `<style>`-Blöcken. Kein `rgba()`-Literal außerhalb der Token-Definition.

## Entscheidung (Wolf)
- **Option A — Eleventy (11ty), empfohlen:** `npm i -D @11ty/eleventy`, Quellen nach `src/`, Ausgabe `_site/`, Cloudflare-Build `npx @11ty/eleventy` + Output-Dir `_site`. Nutzen: Includes, spätere `/en/`-Seiten (D5) per Data-Cascade fast gratis, kein Client-FOUC. Kosten: Ein Build-Schritt, `CLAUDE.md`-Abschnitt „no build step" wird hinfällig.
- **Option B — Client-Includes (`fetch('nav.html')`):** kein Build, aber Nav erscheint verzögert, Crawler sehen ggf. kein Menü, Sprach-Swap muss nachlaufen. Nicht empfohlen.
- **Option C — Status quo, nur Token-Batch (Schritt 3):** minimal, löst D1/D5 nicht.

## Scope (Option A)
1. Projektstruktur: `src/{index,samples,…}.njk`, `src/_includes/{head,nav,footer}.njk`, `src/_data/site.json` (Kontakt, Social, Copyright-Jahr dynamisch), statische Ordner per `addPassthroughCopy`.
2. Nav/Footer/Head einmalig; `data-de/data-en` bleiben; aktiver Link über `page.url` statt JS (JS-Fallback darf bleiben).
3. Page-CSS aus `<style>` → `css/pages/{index,clients,…}.css`, per Include eingebunden; 45 Inline-`style=""` in Klassen überführen.
4. Token-Batch (Haiku): ~25 `rgba()` → neue Tokens (`--border-subtle`, `--green-15`, …) in `:root`; Copyright-Jahr aus `site.json`.
5. Vorbereitung D5: `src/en/` Ordner mit `lang: en` Data-File anlegen, **noch keine** Inhalte duplizieren; `hreflang`-Tags einbauen, sobald erste EN-Seite existiert.
6. Doku: `CLAUDE.md` (Architektur, Dev-Befehle `npx @11ty/eleventy --serve`), `README.md`, `nav.html` löschen.

## Akzeptanzkriterien
- [x] `_site/` enthält alle 8 Seiten; `diff` gegen vorherigen HTML-Output zeigt nur Whitespace/Include-Reihenfolge, keine Inhaltsänderung (Playwright-Screenshots pixelgleich ±1 %). — Pixel-Diff 0.000–0.448 % über alle 8 Seiten × 2 Viewports; Textvergleich (`body.innerText`) exakt identisch auf allen 8 Seiten. Details: `docs/CHANGELOG-2026.md` WP-06-Eintrag.
- [x] `grep -c "<nav" src/_includes/nav.njk` = 1, in `src/*.njk` = 0. — verifiziert.
- [ ] `grep -c 'style="' _site/*.html` = 0. — **nicht 0, aber reduziert von 47 auf 36** (siehe Scope-3-Notiz oben: nur trivial überführbare Fälle wurden umgestellt — `.footer__location`, `.waveform-divider-wrap` —, die restlichen sind Einzelfälle oder die Waveform-Balken, die laut Vorgabe als Daten gelten und bleiben dürfen). Vollständige Nullstellung wäre Teil eines größeren CSS-Aufräum-Batches (Scope 4).
- [ ] `grep -c "rgba(" css/style.css` ≤ Anzahl Token-Definitionen. — **nicht Teil dieser Session** (Scope 4, separates Paket mit Haiku-Executor, siehe oben "NICHT umgesetzt").
- [ ] Cloudflare-Deploy grün; Live-URL identisch. — **noch nicht geprüft**, da nicht gemerged/deployed; Schritt-für-Schritt-Anleitung für Wolf liegt bereit unter `docs/review-2026-09/CUTOVER-eleventy.md`.

## Session-Prompt (Copy-Paste, Schritt 2)
```
Lies CLAUDE.md und docs/review-2026-09/WP-06-templating-css-hygiene.md. Entscheidung: Option A.
Migriere nach Eleventy (Scope 1–3, 6). Vorher: Playwright-Screenshots aller 8 Seiten (1440 px +
iPhone 13) als Referenz; nachher: Vergleich. Committe in kleinen Schritten mit expliziten
Dateinamen. Schritt 4 (Token-Batch) ist eine separate Session mit Haiku-Executor.
```
