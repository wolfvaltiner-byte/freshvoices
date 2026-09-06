# WP-04 · Logo- & Markensystem

| Feld | Wert |
|---|---|
| Priorität | **P1** |
| Modell / Effort | Schritt 1 **Opus 5 · high** (Brand-Entscheid + 2 Vorschläge, Cowork mit `design`-Skill) → Schritt 2 **Sonnet 5 · medium** (SVG-Bereinigung, Einbau) → Schritt 3 **Haiku 4.5** (Favicon/OG-Export-Batch) |
| Session-Typ | Cowork (Entscheid) + Claude Code CLI (1 Session) |
| Betroffene Dateien | `images/logo.svg`, `images/logo-white.svg`, neu `images/brand/*`, `images/favicons/*`, `favicon.ico`, Nav-Block + Footer in 8 HTML-Dateien, `css/style.css` (`.nav__logo`, `.footer__brand-name`), `<head>` aller Seiten (`og:image`, `theme-color`), `CLAUDE.md`, `docs/ASSETS.md` |
| Abhängigkeiten | **Wolf-Entscheidung B7 vor Start** |
| Befunde | B1–B7 |

## Ziel
Eine Marke, drei Größen, überall gleich: Header, Footer, Favicon, Share-Bild. Lesbar bei 32 px, sauber bei 400 px.

## Entscheidung (Wolf) — Frage B7
- **Option A — Legacy-Logo behalten und bereinigen:** kursiver pinker Schriftzug + grüne Punktwolke bleibt. Arbeit: SVG neu bauen (Text als Pfad, Filter raus, viewBox korrekt, ≤ 4 KB), Mark-only-Variante (nur Punktwolke) für Favicon/Small. Nachteil: Schriftzug bleibt stilistisch vom Rest der Site (Montserrat, Uppercase) getrennt.
- **Option B — Wortmarke neu setzen (Empfehlung):** „FRESH VOICES" in Montserrat 800, „VOICES" in Pink (wie der Footer es heute schon andeutet), Punktwolke als eigenständige Bildmarke links davon; Farben/Tokens der Site. Ergebnis: Header, Footer, Favicon und OG-Bild aus einem System; Wiedererkennung der Punktwolke bleibt.
- In beiden Fällen: **kein** Text-Fallback „Fresh<span>Voices</span>" mehr im Footer; dort `logo-white`-Variante (Option A) bzw. Wortmarke weiß (Option B).

## Scope
1. Brand-Assets erstellen: `logo-horizontal.svg` (Header, dunkler Grund), `logo-horizontal-white.svg`, `logo-mark.svg` (nur Punktwolke), `logo-on-light.svg` (für Dokumente/Rechnungen). Alle ohne Filter, `preserveAspectRatio="xMidYMid meet"`, optimiert (svgo).
2. Header: `.nav__logo img { height: 36px }` Desktop, `32px` Mobile; `alt="Fresh Voices"` (ohne „logo"); `width/height`-Attribute setzen (CLS).
3. Footer: Bildmarke statt Text; `.footer__brand-name`-CSS entfernen.
4. Favicons aus `logo-mark.svg`: `favicon.svg`, 16/32/180/192/512 PNG, `favicon.ico`, `site.webmanifest` (`theme_color: #1A1A1A`, `background_color`). Alte unlesbare Sets ersetzen.
5. `og:image` (1200×630, dunkel, Wortmarke + Claim „Voice Over Artist · Wien") + `twitter:card`; `<meta name="theme-color" content="#1A1A1A">` in allen 8 Seiten.
6. Doku: `CLAUDE.md`-Fehler korrigieren (`customers/logo_big.svg` ist das **Oecolution**-Logo, nicht die Fresh-Voices-Wortmarke) und prüfen, ob es `oecolution.png` (Flood-Fill-Notlösung) ersetzen kann; `docs/ASSETS.md` um Abschnitt „Brand" ergänzen; `next_tasks.md`-Favicon-Absatz schließen.

## Akzeptanzkriterien
- [ ] Header-Logo auf iPhone-Screenshot lesbar (Schriftzug erkennbar, nicht nur Farbfleck).
- [ ] Footer zeigt dieselbe Marke wie Header (kein reiner Text).
- [ ] Favicon bei 16 px in Safari/Chrome als klare Form erkennbar (Screenshot Tab-Leiste).
- [ ] Share-Vorschau (LinkedIn Post Inspector / opengraph.xyz) zeigt OG-Bild.
- [ ] Alle SVGs < 6 KB, keine `<filter>`, kein `preserveAspectRatio="none"`.
- [ ] `git grep "logo_big"` → nur noch in `docs/ASSETS.md` mit korrekter Zuordnung.

## Session-Prompt (Copy-Paste, Umsetzung)
```
Lies CLAUDE.md, docs/ASSETS.md und docs/review-2026-09/WP-04-logo-brand-system.md.
Entscheidung: Option <A|B>; die freigegebenen Brand-SVGs liegen in images/brand/.
Setze Scope 2–6 um (8 HTML-Dateien, style.css, Favicons, Doku). Prüfe mit Playwright
Header/Footer auf iPhone 13 und 1440 px. Committe mit expliziten Dateinamen; aktualisiere
CLAUDE.md (Brand-Tokens-Abschnitt) und docs/CHANGELOG-2026.md.
```
