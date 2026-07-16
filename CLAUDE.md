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

Every logo in both the grid and the trust strip (`ref-strip`) is wrapped in a linked `<a target="_blank" rel="noopener">`. Exception: `customers/logo_big.svg` and `customers/logo-banner.svg` in the strip are left unlinked — they appear to be Fresh Voices' own logo mixed in by mistake and need manual review before linking or removal.

Professional association: **VOICE** (Verband für Leistungsschutz der SprecherInnen und DarstellerInnen) at `sprecherverband.at`. Previously listed as VSSÖ.

## Video embeds

`samples.html` has one YouTube embed (privacy-enhanced domain `youtube-nocookie.com`) in the "Werbung & Spots" group. Pattern: a `.reveal` wrapper div → `.video-embed-wrap` (padding-bottom 56.25% aspect-ratio trick) → `<iframe>`. Caption uses `data-de`/`data-en` like audio player descriptions, with a `.sample-tag--pink` "VIDEO" badge.

## Incomplete items

- **Contact form**: wired to Netlify Forms (`data-netlify="true"`, POST to `/` with URL-encoded data). Includes per-field validation, bilingual error messages, honeypot spam protection (`netlify-honeypot="bot-field"`), and double-submit prevention. Will only work when deployed on Netlify.
- **Legal pages**: `impressum.html` and `datenschutz.html` are linked but not yet created.
- **logo_big.svg / logo-banner.svg**: appear in the ref-strip on clients.html but may be Fresh Voices' own logo files mixed in by mistake. Review and remove or replace before launch.
- **videos/seeanoli-image.mp4** (65 MB): unused — no HTML reference. Safe to delete to reduce repo size. The content is now served via YouTube embed on samples.html.
- **videos/wolf-alpha-master.mp4** (81 MB): unused — no HTML reference. Review whether it should be embedded or deleted.
