# QA-Checkliste — Realgeräte (WP-07)

Kurze Checkliste für den manuellen Testlauf auf echten Geräten vor Go-Live oder nach größeren
Änderungen. Ergänzt `npm run qa` (automatisierte Checks, siehe `scripts/qa-shots.js`) — deckt ab,
was ein Skript nicht zuverlässig prüfen kann (echtes Safari-Rendering, echte Netzwerkbedingungen,
Turnstile, Audio-Autoplay-Policies).

## iPhone Safari

- [ ] Menü öffnen/schließen (Hamburger, zweiter Tap, Wischen nach unten, Zurück-Geste)
- [ ] Sprachumschalter (EN/DE) auf allen 8 Seiten — kein Layout-Sprung, kein Flackern
- [ ] Mindestens eine Hörprobe abspielen (Play/Pause, Fortschrittsbalken scrubben, Zeit korrekt)
- [ ] Kontaktformular ausfüllen und absenden — inkl. Turnstile-Checkbox
- [ ] Video (samples.html, "Werbung & Spots") — Autoplay-Verhalten, Mute-Button
- [ ] Alle Tap-Ziele (Filter-Buttons, Audio-Play, Footer-Social-Icons) leicht treffbar ohne Zoom

## Android Chrome

- [ ] Menü öffnen/schließen
- [ ] Sprachumschalter
- [ ] Hörprobe abspielen
- [ ] Kontaktformular absenden
- [ ] Video-Wiedergabe

## Desktop

- [ ] Safari — vollständiger Klick-Durchlauf aller 8 Seiten
- [ ] Chrome — vollständiger Klick-Durchlauf aller 8 Seiten
- [ ] Firefox — vollständiger Klick-Durchlauf aller 8 Seiten

## Lighthouse (Mobile)

- [ ] `index.html` — Performance ≥ 90, Accessibility ≥ 95
- [ ] `samples.html` — Performance ≥ 90, Accessibility ≥ 95
- [ ] `contact.html` — Performance ≥ 90, Accessibility ≥ 95

## Share-Preview

- [ ] `index.html` via [opengraph.xyz](https://www.opengraph.xyz/) prüfen — og:image, Titel,
      Beschreibung korrekt auf einer echten (deployten) URL
