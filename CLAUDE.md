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

**Scroll reveal** — elements with class `.reveal` animate in via IntersectionObserver. The `.reveal`/`.revealed` CSS is defined in an inline `<style>` at the bottom of each page.

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

## Incomplete items

- **Contact form**: wired to Netlify Forms (`data-netlify="true"`, POST to `/` with URL-encoded data). Includes per-field validation, bilingual error messages, honeypot spam protection (`netlify-honeypot="bot-field"`), and double-submit prevention. Will only work when deployed on Netlify.
- **Legal pages**: `impressum.html` and `datenschutz.html` are linked but not yet created.
