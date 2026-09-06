# Fresh Voices — Design- & Code-Review (Stand 2026-09-06)

Review-Team-Perspektive: Senior Brand Designer + Senior Frontend. Grundlage: lokaler Repo-Stand
(HEAD `d2ddae7`), gerendert mit Playwright in iPhone-13- (390×844), iPhone-17- (402×874) und
Desktop-Viewport (1440×900). Screenshots: `mobile-home-top.png`, `mobile-menu-open.png`,
`logo-inventory.png` (in der Cowork-Session geliefert).

Priorität: **P0** = blockiert Nutzung/Go-Live · **P1** = deutlich sichtbarer Qualitätsmangel ·
**P2** = Politur/Hygiene.

---

## A. Mobile (iOS) — Hauptbefunde

| # | Prio | Befund | Beleg | Ursache (Code) |
|---|---|---|---|---|
| A1 | P0 | **Offenes Menü lässt sich nicht schließen.** Overlay deckt Hamburger, Sprach-Button und Logo ab; zweiter Tap auf den Hamburger landet auf dem Overlay. Einziger Ausweg: Link antippen. | `elementFromPoint()` über dem Hamburger liefert `UL.nav__links.open`; `closedAfterSecondTap = false` auf allen 6 Seiten | `css/style.css:566-579` — `.nav__links.open { position:fixed; inset:0; z-index:99 }` liegt **im** Stacking-Context von `.nav` (z-index 100) und übermalt dort alle Geschwister (`.nav__logo`, `.nav__lang`, `.nav__hamburger`), die selbst kein `position/z-index` haben. Kein Close-Icon, kein ESC-Handler, kein Backdrop-Klick (`js/main.js:17-33`). |
| A2 | P0 | **Buttons erscheinen als helle/weiße Kästen** („Overlays" im Header): der EN/DE-Toggle als hellgrauer Block, der Hamburger als weißer Kasten mit weißen Strichen darin (Striche unsichtbar). | `mobile-home-top.png` | Kein Button-Reset in `css/style.css`. `.nav__lang` (Z. 202) und `.nav__hamburger` (Z. 219) setzen weder `background` noch `border`/`appearance` zurück → UA-Default (iOS Safari rendert Buttons hell). Auch `.hero__mute-btn`, `.filter-btn` etc. prüfen. |
| A3 | P1 | **Startbildschirm ohne Botschaft.** Auf dem iPhone sind im ersten Viewport nur Header + Video sichtbar; Headline „Die frische Stimme…" beginnt erst bei y≈850 px, CTA bei ≈1.700 px. | `h1.y = 858` (iPhone 13), `hero.h = 1319` | `index.html:238-245` — `@media (max-width:768px) { .hero__visual { order:-1 } }` stellt das 4:5-Video (350×437 px) vor den Text; `.hero { min-height:100vh; padding-top:80px }`; Audio-Card (`.hero__demo`) hängt zusätzlich zwischen Video und Headline. |
| A4 | P1 | `100vh` auf iOS = Sprung beim Ein-/Ausblenden der Safari-Leiste; kein `env(safe-area-inset-*)` für Notch/Dynamic Island im fixed Header und im Menü-Overlay. | Code | `index.html:35` (`min-height:100vh`), `.nav` ohne Safe-Area-Padding, Overlay `inset:0`. |
| A5 | P2 | Body-Scroll-Lock über `document.body.style.overflow='hidden'` greift auf iOS Safari nicht zuverlässig (Hintergrund scrollt unter dem Menü weiter). | `js/main.js:24` | Kein `position:fixed`-Lock / `overscroll-behavior`. |
| A6 | P2 | Hamburger bleibt beim Öffnen als „≡" stehen (kein „×"-Zustand), `aria-label` bleibt „Open menu". | Code | Kein `.is-open`-State im CSS/JS. |

## B. Logo & Marke

| # | Prio | Befund | Beleg |
|---|---|---|---|
| B1 | P1 | **Logo im Header ist 56×28 px und unlesbar** (Punktwolke + kursiver Schriftzug verschwimmen zu einem pink-grünen Fleck). Desktop identisch klein — steht in keinem Verhältnis zur Nav-Typo. | `logo-inventory.png` (links oben), `.nav__logo img { height:28px }` |
| B2 | P1 | **Inkonsistente Markenführung**: Header = Bildlogo (kursiver Pink-Schriftzug + Punktwolke), Footer = reiner Text „FRESH**VOICES**" in Montserrat Bold (`.footer__brand-name`), Favicon = geschrumpftes Vollogo (unlesbar, laut `next_tasks.md` bewusst so). Drei verschiedene Markenbilder auf einer Seite. | `index.html:477`, `images/favicons/*` |
| B3 | P1 | **Logo-SVG ist ein Wix-Export, nicht produktionsreif**: `width="5000" height="2506.95"`, `preserveAspectRatio="none"`, eingebetteter Drop-Shadow-Filter (`flood-color:#8F8E8E`), kryptische Klassennamen, 20 KB. Wirkt bei Skalierung weich/unscharf. | `images/logo.svg` Kopfzeile |
| B4 | P1 | `images/logo-white.svg` (weißer Schriftzug, graue Punkte) wird **nirgends** verwendet, obwohl er die richtige Variante für Footer/dunkle Flächen wäre. | grep über alle HTML: 0 Treffer |
| B5 | P2 | **Dokumentationsfehler**: `CLAUDE.md` bezeichnet `customers/logo_big.svg` als „Fresh Voices' own wordmark" — die Datei ist tatsächlich das **Oecolution-Logo**. Vor dem Löschen prüfen, ob `oecolution.png` (Flood-Fill-Notlösung) dadurch ersetzt werden kann. | `logo-inventory.png` (rechts Mitte) |
| B6 | P2 | Kein `og:image`, kein `<meta name="theme-color">` — Share-Vorschau und iOS-Statusleiste ohne Marke. | `index.html:1-31` |
| B7 | Entscheidung | Der kursive, pinke Schriftzug (Wix-Ära, 2021) und die aktuelle Site-Typografie (Montserrat, Uppercase, Tracking) sind zwei verschiedene Designsprachen. **Wolf-Entscheidung nötig**: (a) Legacy-Logo bereinigen und konsequent einsetzen, oder (b) typografische Wortmarke „FRESH VOICES" + Punktwolke als eigenständige Bildmarke neu setzen (empfohlen). | — |

## C. Funktional / Go-Live-Blocker

| # | Prio | Befund |
|---|---|---|
| C1 | P0 | **Kontaktformular sendet ins Leere.** `contact.html:201` ist auf Netlify Forms verdrahtet (`data-netlify="true"`), die Site läuft aber auf Cloudflare Workers (siehe `CLAUDE.md`, Abschnitt Domain/Hosting). Submissions gehen verloren, Nutzer sieht evtl. „Erfolg". |
| C2 | P1 | `datenschutz.html` beschreibt Netlify-Hosting/-Forms — nach C1 anpassen (Cloudflare + gewählter Formular-Dienst). |

## D. Code-Qualität / Architektur

| # | Prio | Befund |
|---|---|---|
| D1 | P2 | Nav + Footer sind **8× dupliziert** (6 Seiten + Impressum + Datenschutz); `nav.html` ist bereits veraltet (englische Labels, ohne `data-de/data-en`). Jede Nav-Änderung = 8 Dateien. Optionen: (a) minimaler Build (Eleventy/11ty, ~1 Config) oder (b) Client-Include per `fetch()` — (a) empfohlen, weil SEO-neutral und ohne FOUC. |
| D2 | P2 | Seitenspezifisches CSS in `<style>`-Blöcken (index: 221 Zeilen, clients: 156, about: 134 …) + 45 Inline-`style=""`-Attribute. Nav-CTA-Inline-Style in allen Seiten dupliziert (`style="padding:10px 22px;font-size:0.7rem;"`). |
| D3 | P2 | ~25 `rgba()`-Werte umgehen das Token-System (bekannt aus Audit 3). |
| D4 | P1 | **Bildgewichte**: `images/Motto.jpg` 4,5 MB für ein 96×96-Thumbnail, `images/Portrait.jpg` 3,5 MB für 420×560. Kein `srcset`, kein WebP/AVIF. Auf Mobilfunk spürbar. Ungenutzt im Repo: `mic and plopp.jpg` (3 MB), `with Mic.jpg`, `fresh-demos-cover.jpg`, `logo-white.svg`, `videos/seeanoli-image.mp4`, `videos/wolf-alpha-master.mp4`. |
| D5 | P2 | Sprache nur als Client-Swap (`data-de/data-en`), keine `/en/`-URLs, kein `hreflang` → Englisch ist für Suchmaschinen unsichtbar. Architekturentscheidung, hängt mit D1 zusammen (mit 11ty trivial lösbar). |
| D6 | P2 | Kein Fokus-Trap im Menü, kein `inert` auf `<main>` bei offenem Menü; Skip-Link vorhanden (gut). |

## E. Design-Kritik (Desktop + Mobile)

- Hero Desktop: Headline/Copy links stark, rechte Hälfte (Video + Audio-Card + „VIDEO-HOOK"-Badge + Mute-Button) wirkt überladen und konkurriert mit dem CTA; Badge-Text „VIDEO-HOOK" ist internes Vokabular, kein Nutzen für Besucher.
- Stats-Leiste „5+ Jahre Erfahrung / 100+ Projekte / 2 Sprachen / 48h" — „2 Sprachen" ist keine Kennzahl, die Leiste wirkt Template-artig. Entweder echte, überprüfbare Zahlen oder ersetzen durch Kunden-Logo-Strip direkt unter dem Hero (Vertrauen früher).
- Dunkel-auf-dunkel (`--muted #9A9A9A` auf `#1A1A1A`) trägt viel Fließtext; auf OLED-iPhones im Freien grenzwertig. Body-Text-Kontrast anheben (`#B5B5B5`+).
- Reveal-Animationen (`.reveal`) lassen bei schnellem Scrollen auf Mobile ganze Sektionen leer erscheinen; Schwelle/Root-Margin lockern oder Reveal nur oberhalb 768 px.
- Nav-CTA („Jetzt anfragen") als einziger farbiger Button im Header ist richtig; Sprach-Toggle sollte visuell leiser sein als der CTA (aktuell durch UA-Style lauter, siehe A2).
- Desktop-Header: Logo 28 px neben 0,75-rem-Nav-Links — Logo mind. 36–40 px, sonst wirkt die Marke wie ein Icon.

---

## Arbeitspakete (Reihenfolge = Empfehlung)

| WP | Titel | Prio | Modell | Effort | Karte |
|---|---|---|---|---|---|
| WP-01 | Mobile-Navigation Hotfix (A1, A2, A4–A6, D6) | P0 | Sonnet 5 | medium | `WP-01-mobile-nav-hotfix.md` |
| WP-02 | Kontaktformular → Cloudflare (C1, C2) | P0 | Sonnet 5 (Worker-Variante: Opus 5 für Architektur-Entscheid) | high | `WP-02-contact-form-cloudflare.md` |
| WP-03 | Mobile Hero neu ordnen (A3, E) | P1 | Opus 5 (Layout-Entscheid) → Sonnet 5 (Umsetzung) | high / medium | `WP-03-mobile-hero.md` |
| WP-04 | Logo- & Markensystem (B1–B7) | P1 | Opus 5 (Brand-Entscheid + Vorschlag) → Sonnet 5 (Assets/Einbau) | high / medium | `WP-04-logo-brand-system.md` |
| WP-05 | Bilder & Assets (D4) | P1 | Haiku 4.5 | — | `WP-05-image-optimization.md` |
| WP-06 | Templating & CSS-Hygiene (D1–D3, D5) | P2 | Opus 5 (Entscheid 11ty ja/nein, 15 min) → Sonnet 5 (Migration) → Haiku 4.5 (Token-Batch) | high / medium / — | `WP-06-templating-css-hygiene.md` |
| WP-07 | Design-Politur & QA-Matrix (E, Regression) | P2 | Opus 5 (Critique) → Sonnet 5 (Fixes) → Haiku 4.5 (Playwright-Skript pflegen) | high / medium / — | `WP-07-design-polish-qa.md` |

Abhängigkeiten: WP-01 und WP-02 unabhängig, sofort. WP-03 nach WP-01 (gleicher Header-Code).
WP-04 braucht Wolfs Entscheidung B7 **vor** Start. WP-06 vor WP-07, weil WP-07 sonst 8 Dateien anfasst.

## Nicht behandelt / offen bleibt

- Live-Site `freshvoices.at` war aus der Cowork-Sandbox nicht erreichbar (Egress-Policy) — Befunde stammen aus dem lokalen Repo-Stand, der laut `CLAUDE.md` per Git-Integration automatisch deployt wird. Realgeräte-Check (iPhone, iOS 26) ist Teil von WP-07.
- Google Fonts waren lokal blockiert → Screenshots zeigen Fallback-Schrift; Layout-Maße sind davon unabhängig.
