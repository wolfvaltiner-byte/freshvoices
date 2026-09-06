# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

freshvoices.at — a static portfolio site for Wolf Valtiner, a professional voice-over artist based in Vienna. The site is bilingual (German/English) and dark-themed. **Since WP-06 (2026-09), it is built with [Eleventy](https://www.11ty.dev/) (11ty 3.x)** — sources live under `src/`, HTML/CSS/JS output is generated into `_site/` (gitignored). There is no other framework, no bundler, no CSS preprocessor.

## Development

```bash
npm install        # once
npm run dev         # eleventy --serve — build + local server with live reload
npm run build        # eleventy — one-off build into _site/
npm run qa           # npm run build && node scripts/qa-shots.js — Playwright QA (see below)
```

Never edit files under `_site/` — it's generated and gitignored. Edit the sources under `src/` instead; `npm run dev` rebuilds on save. There is still no linter and no unit test suite beyond `npm test` (the contact-form Worker, see Architecture below) and the Playwright QA script.

**`npm run qa`** (added WP-07, 2026-09): builds the site, then runs `scripts/qa-shots.js`, which serves `_site/` over a throwaway `node:http` static server (no Python needed) and drives Playwright/Chromium across four viewports (`iphone13`, `iphone17` — 402×874, no built-in Playwright device for it yet — `ipad`, `desktop` 1440×900) and all 8 pages. Per page/viewport it takes a top screenshot, a menu-open screenshot (mobile only), and a full-page screenshot (with every `.reveal` forced to `.revealed` first, so it doesn't get mistaken for the "empty section" false alarm in Traps that already bit below), and checks: no horizontal overflow, `h1` inside the top 60% of the viewport, mobile-menu open/close/Escape behavior, no uncaught JS errors, no failed requests outside a small CDN/media whitelist, and every `<img>` fully loaded. Needs Playwright installed (`NODE_PATH` pointed at a global install works, or a local `devDependency`) — not currently a committed `devDependency`, since this sandbox only had a global install available. Output: a console table, `.qa/report.json`, screenshots under `.qa/<viewport>/` (all gitignored). `scripts/` lives outside `src/`, so Eleventy never copies it into `_site/`. See `docs/QA-CHECKLIST.md` for the complementary real-device/Lighthouse checklist this script can't replace.

## Architecture

**Pages** — each of the 8 pages is a single Nunjucks template directly under `src/` (`src/index.njk`, `src/samples.njk`, `src/services.njk`, `src/about.njk`, `src/clients.njk`, `src/contact.njk`, `src/impressum.njk`, `src/datenschutz.njk`). Each sets an explicit `permalink` in its front matter (e.g. `permalink: "/samples.html"`) so the output URL is byte-identical to the pre-Eleventy site — no trailing-slash change, no `index.html` folder redirects. A page's front matter also carries its `<head>` data (`title`, `description`, `canonical`, optionally `keywords`/`ogTitle`/`ogDescription`/`robots`) and, where needed, `pageCss` / `pageJs` pointers to its page-specific stylesheet/script.

**Nav and footer exist exactly once** — `src/_includes/nav.njk` and `src/_includes/footer.njk` — pulled into every page via `src/_includes/layouts/base.njk`, the shared `<html>`/`<head>`/`<body>` skeleton every page template uses as its `layout`. **To change the nav or footer, edit only these two include files** — never a rendered page. `data-de`/`data-en` attributes and ARIA attributes are preserved verbatim from the pre-Eleventy markup. The active nav-link class is now set server-side in `nav.njk` (comparing `page.url` to each link's target) instead of purely by client JS; the corresponding logic in `main.js` still runs too (idempotent — it just re-adds the same class) as a no-JS-build-step fallback pattern, kept intentionally rather than removed.

**Styles** — `src/css/style.css` (passed through unchanged to `_site/css/style.css`) holds the design system: CSS custom properties (tokens), reset, typography, layout primitives, and all shared components (nav, buttons, audio player, service cards, logo wall, testimonials, contact form, footer, utilities). Page-specific styles that used to live in inline `<style>` blocks now live in `src/css/pages/<page>.css` (e.g. `src/css/pages/index.css`), one file per page, referenced via each template's `pageCss` front-matter key. `.footer__location` and `.waveform-divider-wrap` were added as small new shared classes to remove a handful of duplicated inline `style="..."` attributes (the footer's "Wien, Österreich" `<li>`, and the three identical waveform-divider wrapper `<div>`s on index/services/clients) — this was the only inline-style cleanup done as part of WP-06; the larger `rgba()` → token batch is a separate, not-yet-done piece of work (see WP-06 scope 4 in `docs/review-2026-09/`).

**JavaScript** — `src/js/main.js` (passed through unchanged) handles all interactive behavior: nav scroll effect, mobile hamburger menu, active nav link (client-side fallback), language toggle, custom audio players, scroll-reveal (IntersectionObserver), and contact form submission. The samples page's filter logic, previously an inline `<script>` tag, now lives in `src/js/pages/samples.js` and is included via the `pageJs` front-matter key.

**Contact-form Worker (added WP-02, 2026-09)** — `worker/index.js` and `worker/contact.js`, at the repo root (outside `src/`, so Eleventy never touches them and they never end up in `_site/`). `wrangler.jsonc` configures a single Cloudflare Worker that serves the Eleventy build (`assets.directory: "./_site"`) for everything except `POST /api/contact`, which `worker/index.js` routes to `handleContact()` in `worker/contact.js`. That handler validates the form fields, verifies a Cloudflare Turnstile token, sends the mail via the Resend HTTP API, and applies a best-effort per-isolate in-memory rate limit (documented in-file as non-durable — Turnstile is the real anti-abuse layer). `worker/contact.test.mjs` (`npm test`, plain `node --test`) unit-tests `handleContact` in isolation with a mocked `fetch`. Secrets (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`) are never committed — see Incomplete items → Contact form, and `docs/review-2026-09/CUTOVER-eleventy.md`.

**Data** — `src/_data/site.json` holds contact details (phone, email, address, social links) used by `footer.njk`; `src/_data/year.js` computes the copyright year at build time (`new Date().getFullYear()`) instead of a hardcoded string.

**Prepared for `/en/` (not yet built)** — Eleventy's data cascade makes a future English URL structure comparatively cheap: when a first English page is actually needed, create `src/en/` with its own data file setting `lang: en` (Eleventy's directory data files apply automatically to everything under that directory) and add `hreflang` alternate `<link>` tags in `base.njk` once at least one such page exists. Nothing under `src/en/` exists yet — this is a note for future work, not a live feature. The language toggle described below remains the only bilingual mechanism on the site today.

## Key patterns

**Bilingual content** — text elements carry `data-de` and `data-en` attributes. The language toggle in `main.js` swaps content based on the current language: `textContent` for plain strings, but `innerHTML` for any value containing `<` (e.g. index.html's hero title, which embeds `<br>`/`<em>` for the line breaks and pink emphasis word — fixed 2026-07-27, previously these tags rendered as literal visible text after switching to English because the swap always used `textContent`). The `about.html` page additionally uses `data-lang-block="de|en"` for full block-level swaps (show/hide entire sections). The nav button label flips between "EN" and "DE" to indicate the *available* language.

**Language choice persists across pages** (fixed 2026-07-27) — the toggle stores the current language in `localStorage` (`fv-lang`) and every page applies the stored value on load, so navigating to a different page (or reloading) keeps whatever the visitor last picked instead of silently resetting to German. There's still no separate `/en/` URL anywhere on the site — English is always this same client-side swap, never a distinct crawlable page. A returning EN visitor will see a brief flash of German text before `main.js` runs and reapplies English on each new page load (the swap still only happens at `DOMContentLoaded`, same timing as before) — acceptable given the site's architecture, but worth knowing about if it's ever revisited.

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
| `--muted`      | `#B3B3B3` | Secondary/body text on dark backgrounds (raised from `#9A9A9A` in WP-07, 2026-09, for contrast: 8.30:1 on `--base`, 6.48:1 on `--card`) |
| `--muted-soft` | `#9A9A9A` | The old `--muted` value, kept for uppercase/letter-spaced "label" typography only — eyebrows-adjacent small caps like `.footer__heading`, `.form-group label`, `.stat__label`, `.filter-sidebar__heading`, `.spec__label`, `.fact__label`, `.client-group__heading`, `.contact-info__label`. Body text, captions, links, and disclaimers stay on `--muted`. |

Fonts: Montserrat (display/UI via `--font-display`), Inter (body via `--font-body`), loaded from Google Fonts.

**Brand assets (WP-04, 2026-09-06; crop fixed same day)** — Wolf's decision was to keep and clean up the legacy logo (Option A: italic pink "Fresh Voices" script over the green dot cloud), not draw a new Montserrat wordmark. Cleaned, filter-free SVGs live in `src/images/brand/`: `logo.svg` (header, dark bg, pink `#FF63A1` script / green `#91C268` dots), `logo-white.svg` (footer, dark bg, white script / green dots — grey dots were rendered and compared but green won on brand recognition), `logo-on-light.svg` (documents/light backgrounds, `#C93D75` script for AA contrast / green dots). All three: `viewBox="0 0 383.5 192.3"` (~2:1, the Wix export's own original outer crop — **not** a from-scratch tight bounding box of every element in the source), `preserveAspectRatio="xMidYMid meet"`, `<title>Fresh Voices</title>`, `role="img"`, ~10.4 KB each. **First pass mistake, corrected same day**: computing the viewBox as the tight bounding box of *all* circle + path elements pulled in 18 tiny decorative dot-paths that sit well outside the Wix export's nested text-group's own local viewBox (`1.16 -31.48 261.32 31.8`) — invisible in the real original because that nested `<svg>` clips them, but they surfaced as stray pink specks below-left of the wordmark once the outer viewBox was widened. Fix: use the original outer crop (`381.2388 201.8525 383.5224 192.2949`, transformed into the cleaned coordinate system) as the viewBox, and drop every path whose *local* (pre-transform) bounding box falls entirely outside that nested text group's own viewBox — leaves exactly one merged letterform path plus the 223 dot-cloud circles, matching the original pixel-for-pixel. The old Wix-export originals (`logo.svg`, `logo-white.svg`, `preserveAspectRatio="none"`, baked-in `<filter>`, 20 KB+) moved to `_unused/`. **Rule: no text fallback for the brand name anywhere (header or footer) — always one of the `brand/` SVGs.** Logo height: 40px header (34px mobile), 56px footer (48px mobile) — minimum 30px anywhere the script wordmark is used; below 24px use only the favicon dot-distillate, never a shrunk wordmark. Favicon (`src/images/favicons/favicon.svg`, 64×64) is a 4-dot diamond distillate of the dot cloud on a rounded `#1A1A1A` square — see clients.html section below and `docs/ASSETS.md` → "Brand" for the full favicon-dot-count rationale and the `oecolution.svg` swap.

**Layout width** — `--max-width` (used by `.container`, the shared centering/padding wrapper on every page) widened from `1100px` to `1440px` 2026-07-27, per Wolf's feedback that the site felt too narrow with large empty margins on wide screens. `.container` still uses `padding: 0 clamp(20px, 5vw, 60px)` so side breathing room scales the same way, just with a wider ceiling.

**Nav button contrast bug (fixed 2026-07-27)**: `.nav__links a` (specificity 0,1,1) was beating `.btn--primary`'s `color: var(--white)` (specificity 0,1,0), so the "Get in touch" nav button — an `<a class="btn btn--primary">` nested inside `.nav__links` — rendered with muted gray text (`--muted`, barely readable against the pink background) instead of white, on **both** desktop and the mobile hamburger menu. Found while testing the mobile menu, but it wasn't mobile-specific — it affected every page, every viewport. Fixed with a more specific `.nav__links a.btn--primary { color: var(--white); }` override in `css/style.css`.

## clients.html structure

The client logo section is split into two subgroups under the "Ausgewählte Kunden" eyebrow:

- **Kunden** (h3): Hermes Apotheke, Hilfswerk, WKO, Oecolution, Paulaner Apotheke, Stern Apotheke, Bormes les Mimosas
- **Studios & Agenturen** (h3): Little Lights, Lounge FM, MacJingle, OVERDUB, Radio Klassik, Spreadfilms, Schutzengel Apotheke, Wincom

Every logo in both the grid and the trust strip (`ref-strip`) is wrapped in a linked `<a target="_blank" rel="noopener">`. Exception: `customers/logo-banner.svg` in the strip is left unlinked — it's a second Bormes les Mimosas logo variant and needs a manual decision (link it or remove the duplicate) before launch. `customers/logo_big.svg` — this file is the **Oecolution** logo, not a Fresh Voices wordmark (an earlier note here was wrong) — was renamed to `src/customers/oecolution.svg` (WP-04, 2026-09-06) and **now replaces `oecolution.png`** in both the `.logo-wall` grid and the `.ref-strip`: rendered side by side under the site's logo-wall filter, the clean vector has no flood-fill halo artifacts that the PNG stopgap had. `oecolution.jpg`/`oecolution.png` stay on disk but are unreferenced.

**Logo rendering treatment (fixed 2026-07-25):** `.logo-wall img` used to have `filter: brightness(0) invert(1)` (in `css/style.css`), a monochrome-white trick that only works if the source image has a genuinely transparent background — any opaque background gets flattened to solid white right along with the artwork, which is why WKO, Oecolution, Stern Apotheke, Little Lights, MacJingle, OVERDUB, Radio Klassik and Wincom were all rendering as blank/placeholder-looking boxes. Changed to `filter: grayscale(1) brightness(1.6)` (same treatment already used on `.ref-strip img`), which preserves luminance contrast instead of collapsing everything to one flat color — this alone fixed WKO, OVERDUB (pre-transparency-fix) and Radio Klassik with zero file changes. `.logo-card:hover img` now also resets to `grayscale(0) brightness(1)` to reveal full brand color on hover, matching the ref-strip's existing hover behavior. Diagnosed by serving the site locally and inspecting real rendered pixels via a throwaway Playwright script (all image requests returned 200 — this was a pure CSS/asset-format issue, not a loading bug).

Professional association: **VOICE** (Verband für Leistungsschutz der SprecherInnen und DarstellerInnen) at `sprecherverband.at`. Previously listed as VSSÖ. `about.html`'s "Mitgliedschaft" quick-fact (in `.about-facts`) was still showing the old "VSSÖ" label — updated 2026-07-25 to a linked `VOICE` pointing at `sprecherverband.at`, matching clients.html.

## index.html hero (mobile layout, WP-03, 2026-09-06)

Mobile (≤768px) hero order is now Eyebrow → H1 → Subline → CTAs → Video → Audio-Card — the earlier CSS `order:-1` on `.hero__visual` (which visually moved video/audio ahead of the text) was removed; the underlying DOM order in `src/index.njk` was already text-first. The hero no longer stretches to `100vh`/`100svh` on mobile (`min-height:auto`, `padding-top: calc(var(--nav-h) + env(safe-area-inset-top) + 24px)`); that min-height pairing is now scoped to `@media (min-width:769px)` only. The hero video has a `poster="images/hero-poster.jpg"` (plus a `.webp` sibling, both 1280×724, extracted from `videos/production-hook.mp4` via `ffmpeg`) so there's no black flash before autoplay starts — `index.njk` sets `preloadHero: true` in its front matter, which makes `base.njk` emit a `<link rel="preload" as="image" fetchpriority="high">` for the poster. The badge reads "Showreel · 25 s" (was "Video-Hook") — the number is the video's real duration via `ffprobe`, update it if the video file ever changes.

**`.hero > .container { width: 100%; }` matters more than it looks** — `.hero` is `display:flex` with a single child (`.container`); without an explicit width that child sizes to shrink-to-fit its content (flex `flex-basis:auto`) rather than filling the line. A `<video>` with no `poster` has a tiny default intrinsic size (300×150) that barely affects this calculation, but a `poster` image with real dimensions does — before this rule was added, giving the video a poster made the flex-item container jump width, and *without* it the right-hand column (video + audio-card) was rendering at roughly 3/4 the width it should have — invisible on desktop (dark video on dark background, the exact "traps that already bit" pattern below). Don't remove this rule when touching the hero.

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

Vollständige Herkunft, Format und Bearbeitungsstand jeder Datei unter `customers/`:
siehe **`docs/ASSETS.md`**. Dort steht auch, welche Logos noch Behelfslösungen sind.

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

## Domain / hosting (Wix → Cloudflare migration, in progress as of 2026-08-01)

**Plan changed since the 2026-07-27 note below (kept for history): the site is no longer heading to Netlify. It's being migrated off Wix hosting directly onto Cloudflare** (DNS + Workers static assets). Full log in `domain_move.md`.

**Deploys are automatic (confirmed 2026-08-03)**: Cloudflare's native Git integration is connected to this GitHub repo — every push to `main` triggers a Workers static-assets deploy on its own, no GitHub Actions workflow file needed (there isn't one in this repo) and no manual `npx wrangler deploy` required. Verified by pushing a favicon change and diffing the live `https://freshvoices.at/favicon.ico` bytes against the local repo file — identical, deployed automatically without any manual step.

**`wrangler.jsonc` is now committed to the repo (added WP-02, 2026-09-06)** — previously the Worker's config lived entirely in the Cloudflare dashboard's Git-connected build settings, with no `wrangler.toml`/`wrangler.jsonc` in-repo at all. That changed because WP-02 needed an actual Worker script (`worker/index.js`) in front of the static assets to handle `POST /api/contact`, which requires an in-repo config naming that entry point and the `assets` binding. Wolf: confirm `wrangler.jsonc`'s `name` field ("freshvoices") matches the Worker's existing name in the dashboard before the next deploy — see `docs/review-2026-09/CUTOVER-eleventy.md`.

**⚠️ Build settings must change for WP-06 (Eleventy migration, see below)**: before WP-06, the deploy served the repo root directly (a pure static site, no build step). Since the site now builds with Eleventy into `_site/`, the Cloudflare dashboard's Git-connected build settings (Workers & Pages → freshvoices → Settings → Build) must be updated to **Build command: `npx @11ty/eleventy`**, **Deploy/output directory: `_site`** — otherwise Cloudflare will keep deploying the old root-level HTML files (which no longer exist post-migration) or fail outright. Step-by-step cutover instructions for Wolf: `docs/review-2026-09/CUTOVER-eleventy.md`.

- **Wix hosting plan**: Premiumpaket Business, purchased 26 Jan 2026, prepaid 3 years to 14 Feb 2029. No refund available outside the original 14-day window (B2B contract, reverse-charge VAT) — plan is to request a goodwill partial credit from Wix but let the plan run to expiry rather than cancel early, since there's no financial benefit to cancelling. Remember to turn off auto-renew before Feb 2029 regardless.
- **Registrar**: IONOS. Nameservers switched from IONOS's default to **Cloudflare's**. No DNSSEC was configured on the domain, so nothing needed disabling before the switch.
- **Email (Zoho) needed no migration** — the original IONOS DNS had legacy/inactive `mx00/mx01.ionos.de` records, but once nameservers moved to Cloudflare, MX was already natively pointed at Zoho (`mx.zoho.eu`/`mx2`/`mx3`, SPF `v=spf1 include:zoho.eu ~all`, plus a Zoho verification TXT and a Google site-verification TXT). All of these were imported into Cloudflare's zone untouched.
- **Wix's three apex `A` records** (`185.230.63.107/.186/.171`) were imported into Cloudflare too and initially **blocked** attaching `freshvoices.at` as a custom domain to the Worker (`Hostname already has externally managed DNS records`). Fixed by deleting those three A records; all MX/TXT/`_dmarc`/`www` CNAME records were left alone.
- **Workers static assets have a 25 MiB per-file cap**, which the deploy hit on two video files — `videos/seeanoli-image.mp4` (65.6 MB → compressed to 7.8 MB) and `videos/wolf-alpha-master.mp4` (81.3 MB → compressed to 3.1 MB), via `ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow -vf "scale=1280:-2" output.mp4`, then committed back under their original filenames (see the two most recent commits). Deploy succeeded after that.

**Still open (from `domain_move.md`'s remaining-steps list)**:

1. Confirm the `freshvoices.at` custom domain attaches to the Worker now that the Wix A records are gone.
2. Add `www.freshvoices.at` as a second custom domain on the Worker; its CNAME still points at Wix's `cdn1.wixdns.net` and needs repointing.
3. Full click-through of every page (index, about, services, samples, clients, contact, impressum, datenschutz) on the live `https://freshvoices.at` once cut over — content, images, audio, video.
4. Two `s1/s2._domainkey.freshvoices.at` CNAMEs point at SendGrid, purpose unconfirmed — likely a Wix contact-form/newsletter feature signing mail as `@freshvoices.at`. Safe to delete once confirmed nothing on the new site depends on it.
5. Send a test email to `wolf@freshvoices.at` from an external account post-cutover to confirm Zoho delivery still works.
6. Submit the goodwill refund request to Wix for the unused prepaid balance.

**Contact form: fixed on the code side (WP-02, 2026-09-06), config still open.** The form now posts to `POST /api/contact`, handled by a dedicated Cloudflare Worker (`worker/`, see Architecture above) instead of Netlify Forms — no more silent-failure risk once DNS points at Cloudflare. What's still needed before it actually delivers mail is a Cloudflare-dashboard/DNS job, not a code job: see Incomplete items → Contact form and `docs/review-2026-09/CUTOVER-eleventy.md` → "Kontaktformular (WP-02)".

## Traps that already bit

**False-alarm pattern worth knowing about**: full-page mobile screenshots of this site look like they have huge blank gaps where whole sections (service cards, use-case list, CTA banners, logo walls, the contact form) are missing. They aren't — every one of these was checked directly via computed styles/bounding boxes and the content, elements, and layout are all present and correctly sized. The illusion comes from stacking three things: (1) `.reveal`/`.revealed` scroll-triggered fade-in (elements sit at `opacity:0` until their `IntersectionObserver` fires), (2) the dark-on-dark color palette, and (3) viewing a full-page screenshot of a very tall mobile page downscaled 6–8× to fit a preview — at that scale, correctly-rendered muted-gray-on-near-black content becomes visually imperceptible. If something looks missing on mobile, check a targeted element screenshot or computed style before concluding it's a bug — this cost real time twice in this session.

## Project history

Wie Logos, Favicon, Audit-Fixes und der Mobil-Testlauf zustande kamen, steht in
**`docs/CHANGELOG-2026.md`** — dort auch die drei verworfenen Favicon-Entwürfe und
warum sie verworfen wurden. Diese Datei bleibt eine Anleitung; Verlauf gehört ins Changelog.

## Incomplete items

- **Contact form (WP-02, 2026-09-06)**: rewired from Netlify Forms to a dedicated Cloudflare Worker (`POST /api/contact`, `worker/index.js` + `worker/contact.js`, config in `wrangler.jsonc`) with Cloudflare Turnstile as captcha and Resend for mail delivery. Per-field validation (live on `blur`/`input`), bilingual error messages, honeypot spam protection (`bot-field`), and double-submit prevention are all preserved from the Netlify-era implementation. Code and local tests (`npm test`, 11/11 passing) are done; what's still open is entirely Cloudflare-dashboard/DNS work, not code — see `docs/review-2026-09/CUTOVER-eleventy.md` → "Kontaktformular (WP-02)" for the exact steps: (1) verify the `freshvoices.at` sending domain with Resend and add its DKIM/Return-Path DNS records in Cloudflare (Zoho's existing MX/SPF stay untouched, just add Resend's SPF include), (2) create the real Turnstile widget in the dashboard and put its site key into `src/_data/site.json` (`turnstileSiteKey`, currently Turnstile's public "always passes" test key), (3) set the `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` Worker secrets via the dashboard or `wrangler secret put`, (4) confirm `wrangler.jsonc`'s Worker `name` matches the existing dashboard Worker, (5) a real end-to-end test submission landing in Wolf's Zoho inbox.
- **Legal pages (done 2026-07-28)**: `impressum.html` and `datenschutz.html` now exist, built from the GISA Gewerbeschein Wolf supplied. Worth a read-through by Wolf (or a lawyer) before relying on them — Claude drafted the legal text, that's not a substitute for legal review.
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

## Review 2026-09 (Cowork)

Design-/Code-Review vom 2026-09-06: Befunde und sieben Arbeitspakete mit Modellzuordnung liegen in
**`docs/review-2026-09/`** (Board: `README.md`). Jede WP-Session liest zuerst die jeweilige Karte.
Stand: WP-01, WP-02, WP-05, WP-06 umgesetzt auf Branch `review-2026-09`; Cutover-Anleitung für den
Eleventy-Build und das Kontaktformular in `docs/review-2026-09/CUTOVER-eleventy.md`.
