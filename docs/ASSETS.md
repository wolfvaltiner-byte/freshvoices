# Fresh Voices — Bestandsverzeichnis der Logos und Bilder

Ausgelagert aus `CLAUDE.md` am 2026-08-31, wörtlich unverändert.

---

## customers/ logo inventory

Naming convention: lowercase-with-hyphens (e.g. `hermes-apotheke.png`, `wko.svg`).

"Real alpha" column = has genuine transparency (confirmed by pixel sampling or SVG structure). Logos without real alpha render as a visible rectangular card (their opaque canvas edge) rather than blending seamlessly into the dark background — cosmetic, not broken, under the current `grayscale(1) brightness(1.6)` filter (see Logo rendering treatment above for why an earlier filter made these unreadable).

| File | Status | Real alpha |
| --- | --- | --- |
| `hermes-apotheke.png` | Fetched from hermesapotheke.at (WP) | YES |
| `hilfswerk.svg` | **Fixed** — full-canvas `#fbc707` background `<path>` deleted, viewBox unchanged (`0 0 377.94666 377.94666`); `#231f20`/`#ffffff` artwork paths untouched | YES (was NO) |
| `wko.svg` | Fetched from wko.at. Two-tone (red blocks + white letters) — doesn't need real alpha, just needed the grayscale filter fix above (see Logo rendering treatment) to stay legible | YES |
| `paulaner-apotheke.png` | Fetched from paulaner-apotheke.at (WP) | YES |
| `stern-apotheke.png` | Fetched from stern-apo.at (WP) | YES |
| `bormes-les-mimosas.svg` | Fetched from bormeslesmimosas.com | YES |
| `logo-banner.svg` | Same colour palette as bormes-les-mimosas.svg — a second Bormes les Mimosas variant, NOT Fresh Voices' own logo. Left untouched pending Wolf's decision. | YES |
| `oecolution.svg` (renamed from `logo_big.svg` 2026-09-06, WP-04) | White-only fills, 6:1 aspect ratio (1400.5×232.2) — this is the **Oecolution** wordmark, not a Fresh Voices asset (corrected identification, WP-04/B5; earlier CLAUDE.md/ASSETS.md notes calling it "Fresh Voices' own wordmark" were wrong). Rendered clean under the site's `grayscale(1) brightness(1.6)` logo-wall filter, with no flood-fill halo artifacts — **now used in clients.html** (both the `.logo-wall` grid card and the `.ref-strip`), replacing the `oecolution.png` flood-fill stopgap. | YES (white on transparent) |
| `macjingle-488x254.webp` | **Blocked** — VP8 lossy (no alpha), and JS-rendered inline SVG on the live site so can't be re-fetched automatically. Superseded on the page by `macjingle-488x254.png` (see below); Wolf should still supply a real vector logo when possible. | **NO** |
| `wincom.png` | Fetched from wincommunication.fr (15 KB, replaces old 1.2 MB file). Real alpha, but a detailed mic+waveform icon mark — reads faint at 36px in the logo wall. Not a bug, just a legibility ceiling for this asset at this size. | YES |
| `radio-klassik.png` | Fetched from radioklassik.at. Full-bleed diamond-pattern badge with no separate background — flood-fill transparency doesn't apply (see below), but it reads fine under the corrected grayscale filter, so it's used as-is. | **NO** — RGB, no alpha channel |
| `LoungeFM.png` | **Blocked** — server returns 403 for automated requests. Keep existing. | YES |
| `oecolution.jpg` | **Blocked** — SSL certificate error on oecolution.at. Was superseded on the page by `oecolution.png` (flood-fill stopgap); as of 2026-09-06 (WP-04) the page uses the clean vector `oecolution.svg` instead (see above) — `oecolution.jpg`/`oecolution.png` are now unreferenced but kept on disk. | **NO** — JPG format |
| `OVERDUB.png` | Superseded on the page by `OVERDUB-transparent.png` (see below). | **NO** — all pixels opaque |
| `little-lights-logo.png` | Superseded on the page by `little-lights-logo-transparent.png` (see below). | **NO** — all pixels opaque |
| `spreadfilms-logo.svg` | Kept as-is (marked SKIP — already good) | YES |
| `Logo_Schutzengel.png` | Same source URL as existing; no replacement needed | YES |

### Flood-fill transparency fixes (2026-07-25, wired into clients.html)

Automated background removal (Python/Pillow) on the raster logos that lacked real alpha, reviewed and now live in both the `.logo-wall` grid and `.ref-strip`:

| File | Source | Method | Notes |
| --- | --- | --- | --- |
| `little-lights-logo-transparent.png` | `little-lights-logo.png` | Corner flood-fill, ±14 tolerance | Dark navy background removed, white silhouette intact. |
| `oecolution.png` | `oecolution.jpg` | Corner flood-fill, ±14 tolerance | Teal gradient background removed (corner-seeded fill tracked the gradient drift fine), text/dot-mark intact. |
| `macjingle-488x254.png` | `macjingle-488x254.webp` | Corner flood-fill, ±14 tolerance | Background removed cleanly despite the lossy WebP source; still just a stopgap for the real vector logo. |
| `OVERDUB-transparent.png` | `OVERDUB.png` | **Global color-key** (±24 tolerance on white), not corner flood-fill | The corner-only fill left the letter counters (holes in O/D/R/U/B) opaque white, since it's pure black-on-white with no intentional white artwork, a global color-key was safe here and also cleared the interior holes. Confirmed clean under both the resting (grayscale) and hover (full-color) states. |

`radio-klassik.png` has no separate background to remove (the diamond pattern is full-bleed to the edges), so flood-fill was skipped entirely — it's used as-is and looks fine once the grayscale filter fix (above) stopped forcing it to solid white.

---

## Bildoptimierung 2026-09 (WP-05)

Scope 1–5 umgesetzt (Commit 2026-09-06): about.html-Bilder responsive optimiert, ungenutzte Assets in `_unused/` geparkt.

### Scope 1–2: about.html-Bilder (responsive WebP + JPG-Fallback)

| Bild | Vorher (Bytes) | Nachher (Bytes) | Varianten | Ersparnis |
| --- | --- | ---: | --- | ---: |
| `images/Portrait.jpg` | 3,566,976 | 395,798 | `portrait-420.webp` (51,576), `portrait-840.webp` (145,782), `portrait-840.jpg` (197,440) | 3,171,178 (89%) |
| `images/Motto.jpg` | 4,617,088 | 8,375 | `motto-192.webp` (3,272), `motto-192.jpg` (5,103) | 4,608,713 (100%) |
| **Gesamt about-Bilder** | **8,184,064** | **404,173** | — | **7,779,891 (95%)** |

Referenzen in `about.html` auf `<picture>` mit responsive `srcset`/`sizes` und WebP-first `<source>` umgestellt (Fallback JPG mit `width="420" height="560"` / `width="96" height="96"`). Alle ursprünglichen HTML-Attribute (alt, class, fetchpriority, loading) beibehalten.

### Scope 3: Ungenutzte Assets nach `_unused/` verschoben

Dateien mit Leerzeichen in Dateinamen wurden in kebab-case umbenannt:

| Ursprünglicher Pfad | Neuer Pfad | Grund |
| --- | --- | --- |
| `images/mic and plopp.jpg` | `_unused/mic-and-plopp.jpg` | Ungenutzt (grep bestätigt) |
| `images/with Mic.jpg` | `_unused/with-mic.jpg` | Ungenutzt (grep bestätigt) |
| `images/fresh-demos-cover.jpg` | `_unused/fresh-demos-cover.jpg` | Ungenutzt (grep bestätigt) |
| `videos/seeanoli-image.mp4` | `_unused/seeanoli-image.mp4` | Ungenutzt (grep bestätigt) |
| `videos/wolf-alpha-master.mp4` | `_unused/wolf-alpha-master.mp4` | Ungenutzt (grep bestätigt) |

**Hinweis**: Diese Dateien sind noch nicht gelöscht — sie liegen in `_unused/` und Wolf entscheidet über endgültige Löschung (siehe `next_tasks.md`).

### Scope 4: PNG-Optimierung (verlustfrei via Pillow)

Dateigrößen über 20 KB mit `optimize=True` neu gespeichert, nur Dateien mit tatsächlich kleinerer Größe behalten:

| Datei | Vorher | Nachher | Ersparnis | Modus | Größe (px) |
| --- | ---: | ---: | ---: | --- | --- |
| `customers/radio-klassik-transparent.png` | 23,227 | 23,210 | 17 | RGBA | 118×118 |
| `customers/radio-klassik.png` | 21,306 | 21,164 | 142 | RGB | 118×118 |
| `customers/oecolution.png` | 20,523 | 19,867 | 656 | RGBA | 287×86 |
| `customers/OVERDUB-transparent.png` | 48,633 | — | 0 (keine Einsparung) | RGBA | — |
| `customers/OVERDUB.png` | 47,579 | — | 0 (keine Einsparung) | RGB | — |

Insgesamt Scope 4: **815 Bytes eingespart**.

---

**Verifikation durchgeführt:**
- (a) grep-Check: Keine Referenzen zu `mic and plopp`, `with Mic`, `fresh-demos-cover`, `seeanoli-image`, `wolf-alpha-master` in HTML/CSS/JS
- (b) about-Bilder: 404,173 Bytes gesamt (< 1 MB ✓)
- (c) Alle neu generierten Bilder vorhanden: `identify` auf alle `.webp`/`.jpg` bestätigt

---

## Brand (WP-04, 2026-09-06)

Wolfs Entscheidung: Legacy-Logo behalten und bereinigen (Option A) — kursiver pinker Schriftzug „Fresh Voices" auf grüner Punktwolke bleibt, keine neue Wortmarke. Quelle war `src/images/logo.svg` (Wix-Export, 5000×2506.97, `preserveAspectRatio="none"`, `<filter>`-Drop-Shadow, 223 `<circle>` + 19 `<path>` mit CSS-Klassen). Beide Elementgruppen wurden aus ihren verschachtelten Wix-`<svg>`/viewBox-Transforms in ein gemeinsames Koordinatensystem gerechnet (Python, `svgpathtools` für Pfad-Bounding-Boxes), Filter/Defs/Klassen entfernt, Farben als `fill`-Attribute gesetzt, dann mit `svgo` (aggressive Precision, Pfade zusammengeführt) auf Zielgröße optimiert.

| Datei | Zweck | Schriftzug | Punkte | Größe |
| --- | --- | --- | --- | --- |
| `src/images/brand/logo.svg` | Header (dunkler Grund), Standardfarben | `#FF63A1` | `#91C268` @ 0.85 | 11.2 KB |
| `src/images/brand/logo-white.svg` | Footer (dunkler Grund) | `#FFFFFF` | `#91C268` @ 0.85 (siehe Entscheidung unten) | 11.2 KB |
| `src/images/brand/logo-on-light.svg` | Für helle/Dokument-Hintergründe | `#C93D75` (AA-Kontrast auf Weiß) | `#91C268` @ 1 | 11.2 KB |

Alle drei: `preserveAspectRatio="xMidYMid meet"`, `viewBox="0 0 383.5 232.3"` (enge Bounding-Box aus Schriftzug + Punktwolke), `<title>Fresh Voices</title>`, `role="img"`, keine `<filter>`/`<defs>`/CSS-Klassen. Alte `src/images/logo.svg` und `logo-white.svg` (Wix-Rohformat, ~20 KB, `preserveAspectRatio="none"`) liegen jetzt unter `_unused/`.

**Entscheidung Footer-Punktfarbe**: grüne Punkte (`#91C268`) statt Grau beibehalten — Sichtprüfung im Footer-Kontext (weißer Schriftzug auf `--base` #1A1A1A) zeigte ausreichenden Kontrast und mehr Markenwiedererkennung als eine Graustufen-Variante; Grau probeweise gerendert, aber verworfen (siehe Session-Screenshots).

**Favicon-Destillat**: statt der in der Aufgabenkarte vorgeschlagenen 9-Punkte-Raute (1-2-3-2-1) wird eine **4-Punkte-Rautenanordnung** verwendet (`src/images/favicons/favicon.svg`, 64×64, abgerundetes `#1A1A1A`-Quadrat, `r`≈18%). Grund: bei echtem 16-px-Pixelraster verschmelzen sowohl die 9-Punkte- als auch die vorgeschlagene 5-Punkte-Kreuz-Variante zu einem einzigen Klecks bzw. einem Plus-Zeichen, das nicht mehr als Raute erkennbar ist; 4 Eckpunkte ohne Mittelpunkt behalten sichtbare Lücken und bilden bei 16 px wie bei 32 px eine klar erkennbare Raute aus vier einzelnen Punkten. Dokumentiert wie in der Aufgabenkarte gefordert („wenn N Punkte verschwimmen, dokumentieren").

**`oecolution.svg`** (siehe customers/ logo inventory oben): ersetzt `oecolution.png` im Logo-Wall — sauberer Vektor ohne Flood-Fill-Halo-Artefakte, im direkten Rendering-Vergleich unter dem Site-Filter (`grayscale(1) brightness(1.6)`) eindeutig überlegen.

**Regel für neue Nutzung**: kein Text-Fallback für den Markennamen mehr (weder Header noch Footer) — immer eines der drei `brand/`-SVGs. Logo-Mindesthöhe 30 px (darunter verliert der Schriftzug Lesbarkeit); unterhalb von 24 px nur das Favicon-Punkt-Destillat verwenden, nicht das Logo mit Schriftzug verkleinern.
