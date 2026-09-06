# WP-05 · Bilder & Assets optimieren

| Feld | Wert |
|---|---|
| Priorität | **P1** (Mobile-Performance) |
| Modell / Effort | **Haiku 4.5** (mechanisch, vollständig spezifiziert) — bei `loop-with-subagents`: Session Sonnet 5 plant/verifiziert, Haiku-Executor führt aus |
| Session-Typ | Claude Code CLI, 1 Session, ≤ 30 min |
| Betroffene Dateien | `images/Portrait.jpg`, `images/Motto.jpg`, `about.html`, `docs/ASSETS.md`; Löschkandidaten siehe unten |
| Abhängigkeiten | keine (ffmpeg/sharp oder `cwebp` lokal verfügbar) |
| Befunde | D4 |

## Ziel
Kein Bild größer als nötig; About-Seite lädt auf Mobilfunk unter 1 MB Bildgewicht.

## Scope
1. `images/Portrait.jpg` (3,5 MB) → `portrait-840.webp`, `portrait-420.webp` (+ JPG-Fallback 840 px, Qualität 80). In `about.html` als `<picture>`/`srcset` mit `sizes="(max-width:768px) 100vw, 420px"`, `width/height` beibehalten.
2. `images/Motto.jpg` (4,5 MB, gerendert 96×96) → `motto-192.webp` (2× für Retina) + JPG-Fallback; `loading="lazy"` bleibt.
3. Ungenutzte Dateien: `images/mic and plopp.jpg`, `images/with Mic.jpg`, `images/fresh-demos-cover.jpg`, `videos/seeanoli-image.mp4`, `videos/wolf-alpha-master.mp4` → **nicht löschen**, sondern nach `_unused/` verschieben und in `docs/ASSETS.md` listen; Wolf entscheidet über Löschung (siehe `next_tasks.md`). Dateinamen mit Leerzeichen dabei in kebab-case umbenennen.
4. `customers/`-Logos: PNGs > 20 KB (`OVERDUB*.png` 48 KB) mit `oxipng`/`pngquant` verlustfrei/nahezu verlustfrei verkleinern; keine visuelle Änderung.
5. `docs/ASSETS.md` aktualisieren (Größen vorher/nachher).

## Nicht-Scope
Neue Fotos, Bildzuschnitt-Entscheidungen, Video-Neucodierung (bereits 2026-08 erledigt).

## Akzeptanzkriterien
- [ ] `du -ch images/*.webp images/*.jpg` für referenzierte Dateien < 1 MB gesamt.
- [ ] `about.html` rendert Portrait scharf auf iPhone (2× DPR) und Desktop; kein Layout-Shift (CLS 0 in Lighthouse).
- [ ] Alle in HTML referenzierten Bildpfade existieren (`grep -o 'src="images/[^"]*"' *.html | sort -u` → jede Datei vorhanden).
- [ ] `git status --short .` zeigt nur genannte Dateien.

## Session-Prompt (Copy-Paste)
```
Lies CLAUDE.md und docs/review-2026-09/WP-05-image-optimization.md. Führe Scope 1–5 exakt aus
(Haiku-Executor pro Schritt, Session verifiziert jede Datei mit `identify`/`ls -l`).
Committe mit expliziten Dateinamen; aktualisiere docs/ASSETS.md und docs/CHANGELOG-2026.md.
```
