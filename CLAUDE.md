# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

freshvoices.at — a static portfolio site for Wolf Valtiner, a professional voice-over artist based in Vienna. The site is bilingual (German/English), dark-themed, and built with plain HTML/CSS/JS (no build tools, no framework, no package manager).

## Development

Open any `.html` file directly in a browser, or use a local server:

```bash
npx serve .          # or python -m http.server
```

There is no build step, no linter, no test suite. Changes are visible on reload.

## Architecture

**Pages** — each page is a standalone HTML file with its own `<style>` block for page-specific styles, plus a shared `<link>` to `css/style.css`. Nav and footer markup are duplicated in every page (no templating). When changing the nav or footer, update all pages: `index.html`, `samples.html`, `services.html`, `about.html`, `clients.html`, `contact.html`.

**Styles** — `css/style.css` holds the design system: CSS custom properties (tokens), reset, typography, layout primitives, and all shared components (nav, buttons, audio player, service cards, logo wall, testimonials, contact form, footer, utilities). Page-specific styles live in `<style>` tags within each HTML file.

**JavaScript** — `js/main.js` handles all interactive behavior: nav scroll effect, mobile hamburger menu, active nav link, language toggle, custom audio players, scroll-reveal (IntersectionObserver), and contact form submission. The samples page adds inline filter logic in a `<script>` tag.

## Key patterns

**Bilingual content** — text elements carry `data-de` and `data-en` attributes. The language toggle in `main.js` swaps `textContent` based on the current language. The `about.html` page additionally uses `data-lang-block="de|en"` for full block-level swaps (show/hide entire sections). The nav button label flips between "EN" and "DE" to indicate the *available* language.

**Audio players** — custom `.audio-player` components use `data-src` to lazy-load audio. `main.js` creates `Audio` objects, wires play/pause (with single-active-player behavior), progress bar scrubbing, and time display. Each player instance is stored as `player._audio`.

**Scroll reveal** — elements with class `.reveal` animate in via IntersectionObserver. The `.reveal`/`.revealed` CSS lives in `css/style.css` and is gated behind the `.js` class (added by `main.js` at parse time) so content is visible without JavaScript. Includes `prefers-reduced-motion` guard.

## Brand tokens

| Token          | Value     | Role                                          |
|----------------|-----------|-----------------------------------------------|
| `--green`      | `#91C268` | Accent, waveform, icons                       |
| `--pink`       | `#FF63A1` | Text accent, highlights (on dark backgrounds) |
| `--pink-bg`    | `#C93D75` | Button/badge backgrounds (WCAG AA with white) |
| `--pink-hover` | `#AE3565` | Button hover backgrounds                      |
| `--base`       | `#1A1A1A` | Page background                               |
| `--surface`    | `#252525` | Section backgrounds                           |
| `--card`       | `#2E2E2E` | Card/panel backgrounds                        |

Fonts: Montserrat (display/UI via `--font-display`), Inter (body via `--font-body`), loaded from Google Fonts.

## clients.html structure

The client logo section is split into two subgroups under the "Ausgewählte Kunden" eyebrow:

- **Kunden** (h3): Hermes Apotheke, Hilfswerk, WKO, Oecolution, Paulaner Apotheke, Stern Apotheke, Bormes les Mimosas
- **Studios & Agenturen** (h3): Little Lights, Lounge FM, MacJingle, OVERDUB, Radio Klassik, Spreadfilms, Schutzengel Apotheke, Wincom

Every logo in both the grid and the trust strip (`ref-strip`) is wrapped in a linked `<a target="_blank" rel="noopener">`. Exception: `customers/logo-banner.svg` in the strip is left unlinked — it's a second Bormes les Mimosas logo variant and needs a manual decision (link it or remove the duplicate) before launch. `customers/logo_big.svg` (Fresh Voices' own wordmark) has been removed from the strip entirely — the file is kept on disk but no longer referenced from clients.html.

**Logo rendering treatment (fixed 2026-07-25):** `.logo-wall img` used to have `filter: brightness(0) invert(1)` (in `css/style.css`), a monochrome-white trick that only works if the source image has a genuinely transparent background — any opaque background gets flattened to solid white right along with the artwork, which is why WKO, Oecolution, Stern Apotheke, Little Lights, MacJingle, OVERDUB, Radio Klassik and Wincom were all rendering as blank/placeholder-looking boxes. Changed to `filter: grayscale(1) brightness(1.6)` (same treatment already used on `.ref-strip img`), which preserves luminance contrast instead of collapsing everything to one flat color — this alone fixed WKO, OVERDUB (pre-transparency-fix) and Radio Klassik with zero file changes. `.logo-card:hover img` now also resets to `grayscale(0) brightness(1)` to reveal full brand color on hover, matching the ref-strip's existing hover behavior. Diagnosed by serving the site locally and inspecting real rendered pixels via a throwaway Playwright script (all image requests returned 200 — this was a pure CSS/asset-format issue, not a loading bug).

Professional association: **VOICE** (Verband für Leistungsschutz der SprecherInnen und DarstellerInnen) at `sprecherverband.at`. Previously listed as VSSÖ. `about.html`'s "Mitgliedschaft" quick-fact (in `.about-facts`) was still showing the old "VSSÖ" label — updated 2026-07-25 to a linked `VOICE` pointing at `sprecherverband.at`, matching clients.html.

## Video embeds

`samples.html` has one YouTube embed (privacy-enhanced domain `youtube-nocookie.com`) in the "Werbung & Spots" group. Pattern: a `.reveal` wrapper div → `.video-embed-wrap` (padding-bottom 56.25% aspect-ratio trick) → `<iframe>`. Caption uses `data-de`/`data-en` like audio player descriptions, with a `.sample-tag--pink` "VIDEO" badge.

## samples.html structure

Five `.sample-group` blocks, each with `data-category` matching a `.filter-btn`'s `data-filter` (the inline `<script>` toggles `display` based on this). As of 2026-07-26:

- **Corporate & Industrie** (`corporate`): Fliesenverband (Industrie-Spot, `audio/fliesenverband-fliesenleger.mp3`), Helma (Imagekampagne), Digital Life Garage (Imagekampagne, English)
- **Werbung & Spots** (`commercial`): Hofsteigkarte, Finanzbildung, Schlafstudio, Fliesenverband (Werbespot, `audio/fliesenverband-spot.mp3` — a *different* recording from the corporate one above, deliberately kept as a separate entry rather than replacing the older corporate-tagged file), plus the one video embed
- **Hörbücher** (`audiobook`): Advent im Pustertal, Foxy
- **Anrufbeantworter** (`ivr`): Stern Apotheke

**No "Dokumentation" group anymore** — Hofsteigkarte and Finanzbildung moved into Werbung & Spots 2026-07-26 (both the `documentary` filter button and the now-empty group were removed; the page's `<meta name="description">` was also updated to drop "Dokumentation" from its category list). If a genuinely documentary-style sample gets added later, the group and filter button would need to be recreated.

**Language toggle verified on this page** (2026-07-26, after the reorg): `.nav__lang` in the top nav does the DE↔EN swap for the whole site (see Key patterns above — no separate `/en/` URL exists anywhere on the site, English is a client-side `data-de`/`data-en` swap on the same page). Checked via Playwright that every `[data-de][data-en]` element on samples.html matches its `data-en` value after clicking the toggle — zero mismatches, including the newly moved/reorganized sample entries.

The page's `<meta name="description">` already referenced "Hörbücher, IVR" before either group existed on the page — this update makes the meta description accurate. No `e-learning` category/group exists yet despite also being named in that meta description; add one if/when an E-Learning sample becomes available.

Audio file naming convention: lowercase-with-hyphens, no "Wolf Valtiner -" prefix or track numbers (source files dropped into a `new audiofiles/` staging folder get renamed on the way into `audio/`; that staging folder is deleted once its contents are moved in). `images/fresh-demos-cover.jpg` (a demo-reel cover image) was moved in from the same staging drop 2026-07-26 but is not referenced from any page yet.

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
| `logo_big.svg` | White-only fills, 6:1 aspect ratio — Fresh Voices' own wordmark. **Removed from the clients.html ref-strip** (file kept on disk, unreferenced from any page) | YES (white on transparent) |
| `macjingle-488x254.webp` | **Blocked** — VP8 lossy (no alpha), and JS-rendered inline SVG on the live site so can't be re-fetched automatically. Superseded on the page by `macjingle-488x254.png` (see below); Wolf should still supply a real vector logo when possible. | **NO** |
| `wincom.png` | Fetched from wincommunication.fr (15 KB, replaces old 1.2 MB file). Real alpha, but a detailed mic+waveform icon mark — reads faint at 36px in the logo wall. Not a bug, just a legibility ceiling for this asset at this size. | YES |
| `radio-klassik.png` | Fetched from radioklassik.at. Full-bleed diamond-pattern badge with no separate background — flood-fill transparency doesn't apply (see below), but it reads fine under the corrected grayscale filter, so it's used as-is. | **NO** — RGB, no alpha channel |
| `LoungeFM.png` | **Blocked** — server returns 403 for automated requests. Keep existing. | YES |
| `oecolution.jpg` | **Blocked** — SSL certificate error on oecolution.at. Superseded on the page by `oecolution.png` (see below). | **NO** — JPG format |
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

## services.html — studio specs & pricing

**Studio specs** (`.studio-specs` grid, "Mein Studio" section): Interface and DAW updated 2026-07-26 to match Wolf's actual gear — `Universal Audio Apollo` → **Steinberg URC**, `Reaper / Adobe Audition` → **Pro Tools**. Microphone (Neumann TLM 103) and remote-direction tooling (Source-Connect / Zoom) unchanged.

**Service card starting prices** — reviewed 2026-07-26 against the VOICE (Sprecherverband Österreich) recommended-fee pricelist (`docs/Voice_Preisliste_260324.md`, converted from the PDF Wolf supplied; see below). The previous "Ab €" floors were below VOICE's recommended minimums for the closest matching category, so they've been raised to align:

| Service card | Old floor | New floor | VOICE reference |
| --- | --- | --- | --- |
| Corporate & Industrie | €150/Projekt | €350/Projekt | Unpaid Media mit Bild → Imagefilm "Basic", bis 2 Minuten |
| Dokumentation | €180/Projekt | €150/Projekt | Dokumentation → Mindestgage pro Buchung |
| E-Learning & Training | €120/Stunde fertige Audiodatei | €350/Modul (bis 5 Min.) | Unpaid Media mit Bild → E-Learning, bis 5 Minuten (VOICE prices this per short module, not per finished hour — the unit was changed to match) |
| Werbung & Spots | €200/Spot | €450/Spot | Werbung mit Bild → Kino Spot / Sponsored Content Einzelspot (the lowest standalone "Spot" rate in the whole VOICE list) |
| Hörbücher | €250/fertige Stunde | €350/fertige Stunde | Unpaid Media ohne Bild → Hörbuch Belletristik, €350–700/fertige Audiostunde |
| IVR & On-Hold | €80/Ansage | €350/Paket (bis 3 Module) | Sonstiges → Telefonansage bis zu 3 Module (the €80 was VOICE's *incremental* per-module add-on rate, not a standalone entry price — using it as the card's floor understated the real minimum) |

The `.price-note` disclaimer now also states the prices follow VOICE's fee recommendations (previously it only said prices were indicative/negotiable).

**Not changed:** the six service categories themselves weren't altered or expanded. VOICE's pricelist covers several offerings Fresh Voices doesn't currently list as cards — Podcasts, Audioguide, and Synchronisation (Film/Games) — left out deliberately since adding a new service line is a business decision for Wolf, not a pricing-alignment task. See `next_tasks.md`.

**`docs/Voice_Preisliste_260324.md`** — the VOICE pricelist PDF (`docs/Voice_Preisliste_260324.pdf`, gültig ab 1.8.2025) converted via `markitdown`. The conversion is messy in two spots: the rotated cover-page sidebar text extracts as reversed character soup (e.g. "gültig ab 1.8.2025" → "5202.8.1 ba gitlüg"), and many tables collapse into fragmented single-column markdown tables interleaved with plain text. Usable as a reference/grep target, but don't trust it for exact figures without cross-checking the PDF — the pricing decisions above were made against the original PDF content, not the markitdown output.

## Incomplete items

- **Contact form**: wired to Netlify Forms (`data-netlify="true"`, POST to `/` with URL-encoded data). Includes per-field validation, bilingual error messages, honeypot spam protection (`netlify-honeypot="bot-field"`), and double-submit prevention. Will only work when deployed on Netlify.
- **Legal pages**: `impressum.html` and `datenschutz.html` are linked but not yet created.
- **logo_big.svg**: removed from the clients.html ref-strip (2026-07-25). File still exists in `customers/` in case it's needed elsewhere — delete it outright once confirmed unused.
- **logo-banner.svg**: same colour palette as bormes-les-mimosas.svg — confirmed to be a second Bormes les Mimosas logo variant. Left untouched in the ref-strip pending Wolf's decision: either link it to bormeslesmimosas.com or remove the duplicate.
- **MacJingle logo**: `macjingle-488x254.webp` is corrupt (2 KB) and JS-rendered on the live site, so it can't be re-fetched automatically. The page now uses the flood-fill stopgap `macjingle-488x254.png`, but Wolf should still supply a real vector/SVG logo when possible.
- **Lounge FM logo**: `LoungeFM.png` was kept unchanged — lounge.fm blocks automated requests (403). If the current file looks wrong, fetch manually in a browser.
- **Oecolution logo**: `oecolution.jpg` was kept unchanged, but the page now uses the flood-fill stopgap `oecolution.png`. Re-fetch the source manually if a cleaner original becomes available (oecolution.at had an SSL cert error at audit time).
- **Wincom logo**: real alpha, correctly wired in, but the mic+waveform mark reads faint at the logo wall's 36px height — a legibility ceiling for this specific asset, not a bug. Consider asking for a bolder/simplified mark if it needs to stand out more.
- **videos/seeanoli-image.mp4** (65 MB): unused — no HTML reference. Safe to delete to reduce repo size. The content is now served via YouTube embed on samples.html.
- **videos/wolf-alpha-master.mp4** (81 MB): unused — no HTML reference. Review whether it should be embedded or deleted.
- **images/fresh-demos-cover.jpg**: a demo-reel cover image dropped alongside the 2026-07-26 audio batch, moved into `images/` but not referenced from any page. Decide if/where it should be used (e.g. an og:image, a samples.html hero graphic) or delete it.
- **services.html vs. VOICE offering**: VOICE's pricelist includes Podcasts, Audioguide, and Synchronisation (Film/Games) — none of which are currently service cards on services.html. Only pricing floors were aligned 2026-07-26 (see `services.html` section above); adding new service categories is a separate decision for Wolf. Tracked in `next_tasks.md`.
- **E-Learning sample gap**: samples.html's meta description promises an "E-Learning" category but no such group/sample exists yet on the page.
