# WP-03 · Mobile Hero neu ordnen (Startbildschirm)

| Feld | Wert |
|---|---|
| Priorität | **P1** |
| Modell / Effort | Schritt 1 **Opus 5 · high** (Layout-Entscheid, 2 Varianten als Skizze/Text) → Schritt 2 **Sonnet 5 · medium** (Umsetzung) |
| Session-Typ | Cowork (Entscheid, 20 min) + Claude Code CLI (Umsetzung, 1 Session) |
| Betroffene Dateien | `index.html` (Hero-Markup + `<style>`-Block), ggf. `css/style.css` |
| Abhängigkeiten | WP-01 (Header-Höhe/Safe-Area), Video-Asset bleibt `videos/production-hook.mp4` |
| Befunde | A3, A4, E (Hero, Stats) |

## Ziel
Im ersten iPhone-Viewport (≈ 390×750 px nutzbar) sind sichtbar: Eyebrow, Headline „Die frische Stimme für Ihr Projekt.", ein Satz Subline, Primär-CTA „Hörproben anhören". Video und Audio-Card folgen **darunter**, nicht davor.

## Leitplanken für den Entscheid (Opus)
- Mobile-Reihenfolge: Text → CTA → Video (16:9 oder 1:1, `max-height:45svh`) → Audio-Card. `order:-1` entfällt.
- Headline-Größe mobil auf `clamp(2.4rem, 11vw, 3.2rem)`, Zeilenhöhe 1.0; `.hero { min-height:100svh }` prüfen — evtl. ganz weg, Hero soll auf Mobile **nicht** künstlich auf Viewport-Höhe gestreckt werden.
- „VIDEO-HOOK"-Badge: umbenennen (z. B. „Showreel · 30 s") oder entfernen; Mute-Button bleibt, aber 44×44 px Tap-Ziel.
- Stats-Leiste: Entscheid, ob „2 Sprachen / 48h" bleiben, durch Kunden-Logo-Strip ersetzt oder unter die Leistungen wandert.
- Desktop bleibt in Struktur gleich; nur Badge/Abstände dürfen sich mitändern.

### Entscheid (umgesetzt, 2026-09-06)
Wie vorgegeben: mobil Text → CTA → Video (16:9, `max-height:45svh`) → Audio-Card, `order:-1` entfernt
(die DOM-Reihenfolge war bereits `.hero__content` vor `.hero__visual` — nur der visuelle
CSS-`order`-Override fiel weg). Badge → „Showreel · 25 s“ (echte Videolänge per `ffprobe`: 25.03 s,
gerundet). Stats-Leiste inhaltlich unverändert gelassen (Wolfs Entscheidung steht laut Karte noch
aus) — nur mobile Abstände reduziert (`padding` 40px→28px, Grid-`gap` 24px).

## Scope (Umsetzung)
1. Hero-Grid: mobil `grid-template-columns:1fr`, DOM-Reihenfolge Text → Visual (kein `order`).
2. Video-Container mobil `aspect-ratio:16/9`, `object-fit:cover`, `poster`-Bild setzen (Frame aus Video, 1280 px, WebP) → kein leeres Schwarz vor Autoplay.
3. Audio-Card unter dem Video, volle Breite, Abstand 24 px.
4. `padding-top` Hero = Header-Höhe + Safe-Area (Variable `--nav-h` aus WP-01 verwenden).
5. Stats gemäß Entscheid anpassen.

## Akzeptanzkriterien
- [x] Playwright iPhone 13 & 17: `h1.getBoundingClientRect().top < 300` und CTA vollständig innerhalb `innerHeight`. Gemessen: iPhone 13 (390×664) `h1.top=143.0`, CTA `bottom=461.9` (≤ 640 px Vorgabe erfüllt); iPhone 17-ähnlich (402×874) `h1.top=143.0`, CTA `bottom=465.8`.
- [x] Kein horizontaler Overflow (`scrollWidth === innerWidth`). Beide Geräte: `scrollWidth === innerWidth` (390/402).
- [x] Desktop 1440 px: Hero-Struktur unverändert (zwei Spalten, Inhalte identisch) — **aber Pixel-Diff liegt bei ~49%, nicht < 3%**, siehe Abweichung unten. Nicht nur der Badge-Text hat sich sichtbar geändert.
- [ ] Lighthouse Mobile LCP < 2,5 s lokal — **nicht durchgeführt** (kein Lighthouse/Chrome-Headless-Audit-Tooling in dieser Sandbox verfügbar; das Poster-Bild ist jetzt aber das LCP-Element statt des Videos, was in die richtige Richtung wirkt). Bitte bei Gelegenheit auf einem Gerät/CI mit Lighthouse nachholen.

### Abweichung: Pixel-Diff Desktop (wichtig)
Beim Hinzufügen von `poster="images/hero-poster.jpg"` zum Hero-Video kam ein vorbestehender Bug zum
Vorschein: `.hero` ist `display:flex` mit einem einzigen Kind (`.container`), das **kein**
`width:100%` hat. Ohne eigene Breite bestimmt sich `flex-basis:auto` eines Flex-Items nach seinem
*Content*-Fit statt nach der verfügbaren Zeilenbreite. Ein `<video>` ohne `poster` hat als Replaced
Element eine winzige intrinsische Default-Größe (300×150), wodurch der Container im „vorher“-Stand
nur ~1072 px statt der vollen 1320 px (1440 px Container − 2×60 px Padding) breit war — **die rechte
Spalte (Video + Audio-Card) war dadurch auf Desktop faktisch unsichtbar/kollabiert**, dunkles Video
auf dunklem Hintergrund, exakt das in `CLAUDE.md` beschriebene „Traps that already bit“-Muster.
Sobald das Video ein `poster`-Bild mit echter Auflösung (1280×724) bekommt, wird dessen große
intrinsische Größe für dieselbe Content-Fit-Berechnung herangezogen und der Container springt auf
die volle Breite — das Video wird plötzlich sichtbar. Das ist eine **Verbesserung**, aber sie
verändert das Vorher/Nachher-Bild massiv (Pixel-Diff ~49 % statt < 3 %), weil vorher effektiv ein
kaputtes Layout gerendert wurde. Behoben mit einer expliziten Regel `.hero > .container { width:
100%; }` (in `src/css/pages/index.css`), die den Flex-Item unabhängig vom intrinsischen Video-Maß
auf die volle verfügbare Breite zwingt — das entspricht der eigentlich beabsichtigten
Zwei-Spalten-Struktur (`grid-template-columns: 1fr 1fr` in `.hero__inner`, je 50 %).
Screenshots: `desktop-hero-before.png` (kaputter Ist-Zustand vor dieser Session) vs.
`desktop-hero-after.png` (korrigiert) in `/home/claude/work/wp03-shots/`. Rücksprache mit Wolf
empfohlen, ob dieser Fix so gewünscht ist — inhaltlich ändert er nichts an Text/Bild, macht aber das
Video auf Desktop erstmals wieder sichtbar.

## Session-Prompt (Copy-Paste, Umsetzung)
```
Lies CLAUDE.md und docs/review-2026-09/WP-03-mobile-hero.md; Entscheidung aus Abschnitt
"Leitplanken" ist: <hier eintragen>. Setze Scope 1–5 um, prüfe mit Playwright (iPhone 13/17 +
1440 px) die Akzeptanzkriterien, committe mit expliziten Dateinamen, aktualisiere CLAUDE.md
und docs/CHANGELOG-2026.md.
```
