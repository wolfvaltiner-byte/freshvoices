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

Professional association: **VOICE** (Verband für Leistungsschutz der SprecherInnen und DarstellerInnen) at `sprecherverband.at`. Previously listed as VSSÖ.

## Video embeds

`samples.html` has one YouTube embed (privacy-enhanced domain `youtube-nocookie.com`) in the "Werbung & Spots" group. Pattern: a `.reveal` wrapper div → `.video-embed-wrap` (padding-bottom 56.25% aspect-ratio trick) → `<iframe>`. Caption uses `data-de`/`data-en` like audio player descriptions, with a `.sample-tag--pink` "VIDEO" badge.

## customers/ logo inventory

Naming convention: lowercase-with-hyphens (e.g. `hermes-apotheke.png`, `wko.svg`).

"Real alpha" column = has genuine transparency (confirmed by pixel sampling or SVG structure). Logos without real alpha will show as white/coloured boxes in the ref-strip under `filter: grayscale(1) brightness(1.6)`.

| File | Status | Real alpha |
| --- | --- | --- |
| `hermes-apotheke.png` | Fetched from hermesapotheke.at (WP) | YES |
| `hilfswerk.svg` | **Fixed** — full-canvas `#fbc707` background `<path>` deleted, viewBox unchanged (`0 0 377.94666 377.94666`); `#231f20`/`#ffffff` artwork paths untouched | YES (was NO) |
| `wko.svg` | Fetched from wko.at | YES |
| `paulaner-apotheke.png` | Fetched from paulaner-apotheke.at (WP) | YES |
| `stern-apotheke.png` | Fetched from stern-apo.at (WP) | YES |
| `bormes-les-mimosas.svg` | Fetched from bormeslesmimosas.com | YES |
| `logo-banner.svg` | Same colour palette as bormes-les-mimosas.svg — a second Bormes les Mimosas variant, NOT Fresh Voices' own logo. Left untouched pending Wolf's decision. | YES |
| `logo_big.svg` | White-only fills, 6:1 aspect ratio — Fresh Voices' own wordmark. **Removed from the clients.html ref-strip** (file kept on disk, unreferenced from any page) | YES (white on transparent) |
| `macjingle-488x254.webp` | **Blocked** — VP8 lossy (no alpha). Logo is JS-rendered inline SVG, can't be downloaded automatically. Wolf must supply manually. Candidate `macjingle-488x254.png` generated (see below) as a stopgap. | **NO** |
| `wincom.png` | Fetched from wincommunication.fr (15 KB, replaces old 1.2 MB file) | YES |
| `radio-klassik.png` | Fetched from radioklassik.at | **NO** — RGB, no alpha channel |
| `LoungeFM.png` | **Blocked** — server returns 403 for automated requests. Keep existing. | YES |
| `oecolution.jpg` | **Blocked** — SSL certificate error on oecolution.at. Keep existing. Candidate `oecolution.png` generated (see below) as a stopgap. | **NO** — JPG format |
| `OVERDUB.png` | **Uncertain** — overdub.at logo appears to be CSS/text-only with no img tag. Keep existing file pending visual check. | **NO** — all pixels opaque |
| `little-lights-logo.png` | Kept as-is (marked SKIP — already good) | **NO** — all pixels opaque |
| `spreadfilms-logo.svg` | Kept as-is (marked SKIP — already good) | YES |
| `Logo_Schutzengel.png` | Same source URL as existing; no replacement needed | YES |

### Flood-fill transparency candidates (2026-07-25, unreviewed)

Automated corner-flood-fill background removal (Python/Pillow, ±14 per-channel tolerance, filled inward from the 4 corners only — never from the interior, so enclosed white/light areas inside letterforms are left untouched) was attempted on the 5 raster logos without real alpha. **None of these are wired into clients.html** — they're first-pass candidates sitting alongside the originals for Wolf to review visually before anything gets swapped in:

| New file | Source | Verdict |
| --- | --- | --- |
| `little-lights-logo-transparent.png` | `little-lights-logo.png` | **Clean.** Dark navy background fully removed, white silhouette edges intact, no visible artifacts. Usable as-is. |
| `oecolution.png` | `oecolution.jpg` | **Clean.** Teal gradient background fully removed (corner-seeded fill tracked the gradient drift fine), text/dot-mark fill preserved. Usable as-is. |
| `macjingle-488x254.png` | `macjingle-488x254.webp` | **Clean**, despite the lossy WebP source — background fully transparent, bars and wordmark intact, no visible compression halo at this size. Usable as a stopgap, but still not a substitute for the real vector/SVG logo Wolf needs to supply. |
| `OVERDUB-transparent.png` | `OVERDUB.png` | **Partial problem.** Background is fully removed, but the enclosed counters (the holes inside O, D, R, U, B) remain opaque white, by design of the corner-only fill. On the site's dark background these will show as visible white patches inside the letters. Needs either a manual interior-hole fill pass or a source file with real transparency. |
| `radio-klassik-transparent.png` | `radio-klassik.png` | **Unusable.** Only ~13% of pixels went transparent — the logo is a full-bleed diamond-pattern square badge with no separate background to remove; the "background" IS the artwork. Flood-fill doesn't apply here. Leave `radio-klassik.png` as-is, or ask the source for a version with a real transparent/isolated mark. |

## Incomplete items

- **Contact form**: wired to Netlify Forms (`data-netlify="true"`, POST to `/` with URL-encoded data). Includes per-field validation, bilingual error messages, honeypot spam protection (`netlify-honeypot="bot-field"`), and double-submit prevention. Will only work when deployed on Netlify.
- **Legal pages**: `impressum.html` and `datenschutz.html` are linked but not yet created.
- **logo_big.svg**: removed from the clients.html ref-strip (2026-07-25). File still exists in `customers/` in case it's needed elsewhere — delete it outright once confirmed unused.
- **logo-banner.svg**: same colour palette as bormes-les-mimosas.svg — confirmed to be a second Bormes les Mimosas logo variant. Left untouched in the ref-strip pending Wolf's decision: either link it to bormeslesmimosas.com or remove the duplicate.
- **MacJingle logo**: `macjingle-488x254.webp` is corrupt (2 KB). Logo on macjingle.at is JS-rendered and can't be downloaded automatically. Wolf needs to supply the logo file manually. A flood-fill transparent stopgap `macjingle-488x254.png` was generated 2026-07-25 (looked clean) but is not wired into clients.html yet.
- **Lounge FM logo**: `LoungeFM.png` was kept unchanged — lounge.fm blocks automated requests (403). If the current file looks wrong, fetch manually in a browser.
- **Oecolution logo**: `oecolution.jpg` was kept unchanged — oecolution.at has an SSL cert error. A flood-fill transparent stopgap `oecolution.png` was generated 2026-07-25 (looked clean) but is not wired into clients.html yet. Fetch manually or wait for cert fix if a better source becomes available.
- **Transparency review pending (2026-07-25)**: 5 candidate transparent PNGs sit in `customers/` alongside their originals — `little-lights-logo-transparent.png`, `oecolution.png`, `macjingle-488x254.png` (clean), `OVERDUB-transparent.png` (background clean but letter counters/holes still opaque white — needs manual fix), `radio-klassik-transparent.png` (flood-fill failed — logo has no separate background, leave original in place). None are referenced from any HTML page yet; clients.html should only be updated once Wolf approves specific files.
- **videos/seeanoli-image.mp4** (65 MB): unused — no HTML reference. Safe to delete to reduce repo size. The content is now served via YouTube embed on samples.html.
- **videos/wolf-alpha-master.mp4** (81 MB): unused — no HTML reference. Review whether it should be embedded or deleted.
