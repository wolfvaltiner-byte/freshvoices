# WP-01 · Mobile-Navigation Hotfix

| Feld | Wert |
|---|---|
| Priorität | **P0** |
| Modell / Effort | **Sonnet 5 · medium** (vollständig spezifiziert, keine Designentscheidung) |
| Session-Typ | Claude Code CLI, 1 Session, ≤ 45 min |
| Betroffene Dateien | `css/style.css`, `js/main.js`, Nav-Block in allen 8 HTML-Dateien (`index`, `samples`, `services`, `about`, `clients`, `contact`, `impressum`, `datenschutz`), `nav.html` |
| Abhängigkeiten | keine |
| Befunde | A1, A2, A4, A5, A6, D6 aus `REVIEW_FINDINGS.md` |

## Ziel
Auf iPhone (iOS 26, Safari) lässt sich das Menü öffnen **und schließen**, Header-Buttons sehen wie designte Buttons aus (keine UA-Kästen), Header und Menü respektieren Notch/Dynamic Island.

## Scope
1. **Button-Reset** in `css/style.css` (Abschnitt Reset): `button { appearance:none; -webkit-appearance:none; background:none; border:0; color:inherit; font:inherit; }` — danach `.nav__lang` bewusst `background:transparent` + bestehender Border, `.nav__hamburger` transparent.
2. **Stacking-Fix**: `.nav__inner { position:relative; z-index:101 }` (Logo, Sprach-Button, Hamburger bleiben über dem Overlay) **oder** Overlay unterhalb der Headerleiste beginnen lassen (`top: var(--nav-h)`). Empfehlung: Variante 1 + Overlay bleibt Fullscreen.
3. **Schließen-Wege**: (a) Hamburger → „×"-Zustand (`.nav__hamburger.is-open span` Transform), `aria-label` DE/EN toggeln („Menü schließen"/„Close menu"), `aria-expanded` bleibt; (b) `Escape`; (c) Klick auf Overlay-Hintergrund außerhalb der `<li>`; (d) `resize` > 768 px räumt `.open` ab.
4. **iOS-Scroll-Lock**: statt `body.style.overflow` → Klasse `.menu-open` auf `<html>` mit `overflow:hidden; height:100%` + `overscroll-behavior:none` auf dem Overlay; Scroll-Position bei Schließen wiederherstellen.
5. **Safe Area**: `.nav { padding-top: calc(20px + env(safe-area-inset-top)) }`, `.nav.scrolled` analog; Overlay `padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom)`. `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` in allen 8 Dateien.
6. **`100vh` → `100svh`** mit Fallback (`min-height:100vh; min-height:100svh;`) in `index.html` Hero; Overlay `height:100dvh`.
7. **A11y**: bei offenem Menü `<main>` und `<footer>` `inert`; Fokus beim Öffnen auf ersten Link, beim Schließen zurück auf Hamburger.
8. `nav.html` auf den aktuellen Stand bringen (deutsche Labels + `data-de/data-en`, ohne Inline-Style) **oder** löschen, wenn WP-06 Templating einführt — Kommentar im File hinterlassen.

## Nicht-Scope
Hero-Umbau (WP-03), Logo-Größe (WP-04), Menü-Design (Typo/Abstände bleiben).

## Akzeptanzkriterien
- [x] Playwright, iPhone-13-Profil, alle 8 Seiten: Menü öffnen → `elementFromPoint(hamburger)` liefert `.nav__hamburger`; zweiter Tap schließt (`.open` entfernt).
- [x] `Escape` und Backdrop-Tap schließen; `aria-expanded` korrekt.
- [x] Screenshot Header: keine hellen Rechtecke hinter „EN" oder Hamburger.
- [x] Bei offenem Menü scrollt der Hintergrund nicht (`html.menu-open{overflow:hidden;height:100%}`, verifiziert per Playwright-Klassencheck auf allen 8 Seiten; manueller iPhone-Test durch Wolf steht noch aus, siehe unten).
- [x] Desktop 1440 px: keine Regression (Nav-Links, CTA, Sprach-Toggle) — per Playwright verifiziert (`.nav__hamburger` `display:none`, `.nav__links` sichtbar, CTA-Textfarbe `rgb(255,255,255)`).
- [x] `git status --short .` zeigt nur die genannten Dateien; kein `git add .`.

## Session-Prompt (Copy-Paste)
```
Lies CLAUDE.md und docs/review-2026-09/WP-01-mobile-nav-hotfix.md. Setze WP-01 vollständig um
(Scope 1–8). Verifiziere mit einem Playwright-Skript (iPhone 13 Profil, alle 8 HTML-Seiten):
Menü öffnen, elementFromPoint über dem Hamburger, zweiter Tap schließt, Escape schließt.
Committe mit expliziten Dateinamen. Trage das Ergebnis in CLAUDE.md (Kurzform) und
docs/CHANGELOG-2026.md ein und hake die Akzeptanzkriterien in dieser Karte ab.
```

## Verifikation durch Wolf
iPhone, Safari, `freshvoices.at` nach Auto-Deploy: Menü auf/zu, Sprache umschalten, Seite wechseln, Menü erneut auf/zu.
