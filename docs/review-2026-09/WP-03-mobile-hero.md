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

## Scope (Umsetzung)
1. Hero-Grid: mobil `grid-template-columns:1fr`, DOM-Reihenfolge Text → Visual (kein `order`).
2. Video-Container mobil `aspect-ratio:16/9`, `object-fit:cover`, `poster`-Bild setzen (Frame aus Video, 1280 px, WebP) → kein leeres Schwarz vor Autoplay.
3. Audio-Card unter dem Video, volle Breite, Abstand 24 px.
4. `padding-top` Hero = Header-Höhe + Safe-Area (Variable `--nav-h` aus WP-01 verwenden).
5. Stats gemäß Entscheid anpassen.

## Akzeptanzkriterien
- [ ] Playwright iPhone 13 & 17: `h1.getBoundingClientRect().top < 300` und CTA vollständig innerhalb `innerHeight`.
- [ ] Kein horizontaler Overflow (`scrollWidth === innerWidth`).
- [ ] Desktop 1440 px: Hero optisch unverändert bis auf beschlossene Badge-Änderung.
- [ ] Lighthouse Mobile LCP < 2,5 s lokal (Poster statt Video als LCP-Element).

## Session-Prompt (Copy-Paste, Umsetzung)
```
Lies CLAUDE.md und docs/review-2026-09/WP-03-mobile-hero.md; Entscheidung aus Abschnitt
"Leitplanken" ist: <hier eintragen>. Setze Scope 1–5 um, prüfe mit Playwright (iPhone 13/17 +
1440 px) die Akzeptanzkriterien, committe mit expliziten Dateinamen, aktualisiere CLAUDE.md
und docs/CHANGELOG-2026.md.
```
