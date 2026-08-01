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

Fonts: Montserrat (display/UI via `--font-display`), Inter (body via `--font-body`), loaded from Google Fonts.

**Layout width** — `--max-width` (used by `.container`, the shared centering/padding wrapper on every page) widened from `1100px` to `1440px` 2026-07-27, per Wolf's feedback that the site felt too narrow with large empty margins on wide screens. `.container` still uses `padding: 0 clamp(20px, 5vw, 60px)` so side breathing room scales the same way, just with a wider ceiling.

**Nav button contrast bug (fixed 2026-07-27)**: `.nav__links a` (specificity 0,1,1) was beating `.btn--primary`'s `color: var(--white)` (specificity 0,1,0), so the "Get in touch" nav button — an `<a class="btn btn--primary">` nested inside `.nav__links` — rendered with muted gray text (`--muted`, barely readable against the pink background) instead of white, on **both** desktop and the mobile hamburger menu. Found while testing the mobile menu, but it wasn't mobile-specific — it affected every page, every viewport. Fixed with a more specific `.nav__links a.btn--primary { color: var(--white); }` override in `css/style.css`.

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

## Mobile testing (2026-07-27)

Tested every page (index, samples, services, about, clients, contact) at iPhone 13 and Pixel 5 viewports via Playwright device emulation: zero horizontal overflow, zero console errors, hamburger menu opens/closes and locks body scroll correctly, 48×48px tap targets on the audio player controls (meets both iOS HIG and Android Material minimums), `playsinline`+`muted` already set on the autoplaying hero video (required for iOS inline autoplay), and `.hero`'s `min-height: 100vh` (not `height`) avoids the classic iOS Safari dynamic-toolbar clipping issue.

**False-alarm pattern worth knowing about**: full-page mobile screenshots of this site look like they have huge blank gaps where whole sections (service cards, use-case list, CTA banners, logo walls, the contact form) are missing. They aren't — every one of these was checked directly via computed styles/bounding boxes and the content, elements, and layout are all present and correctly sized. The illusion comes from stacking three things: (1) `.reveal`/`.revealed` scroll-triggered fade-in (elements sit at `opacity:0` until their `IntersectionObserver` fires), (2) the dark-on-dark color palette, and (3) viewing a full-page screenshot of a very tall mobile page downscaled 6–8× to fit a preview — at that scale, correctly-rendered muted-gray-on-near-black content becomes visually imperceptible. If something looks missing on mobile, check a targeted element screenshot or computed style before concluding it's a bug — this cost real time twice in this session.

Only one real bug turned up (see the "Nav button contrast bug" note above) — everything else mobile-specific checked out clean.

## Domain / hosting (Wix → Cloudflare migration, in progress as of 2026-08-01)

**Plan changed since the 2026-07-27 note below (kept for history): the site is no longer heading to Netlify. It's being migrated off Wix hosting directly onto Cloudflare** (DNS + Workers static assets, deployed via `npx wrangler deploy` from this GitHub repo). Full log in `domain_move.md`.

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

**⚠️ Contact form breaks under this plan.** The "Incomplete items" section below still describes the contact form as wired to **Netlify Forms** (`data-netlify="true"`) — that only works when the site is actually served from Netlify. Since the real deploy target is now Cloudflare Workers static assets, not Netlify, submissions will silently fail once DNS cuts over unless the form is rewired to something Cloudflare-compatible (e.g. a Cloudflare Worker/Pages Function endpoint, or a third-party form backend like Formspree). Not yet fixed — flag to Wolf before go-live.

## Audit + critique fixes (2026-07-28)

Ran a full technical audit and a dual-agent design critique (`/impeccable audit` + `/impeccable critique`), then fixed everything that was a code-level bug rather than a business/asset decision:

- **Bilingual system now actually covers the whole site.** Nav links (`Home`/`Voice Samples`/`Services`/`About`/`Clients`/CTA button) and every footer on samples/services/about/clients/contact.html were hardcoded English or German-only with no `data-de`/`data-en` — only index.html's footer had it. All 6 pages now match index.html's footer exactly (including the social icons + address line it previously had and the others didn't) and all nav links are bilingual.
- **about.html's biography no longer desyncs from the rest of the page on language toggle.** A duplicate inline `<script>` at the bottom of about.html toggled `[data-lang-block]` on click only, registered *before* `main.js`'s listener, so it always read the button's stale pre-toggle text — the bio text was reliably one click behind the nav/facts/buttons, and never synced at all on page load (so a returning EN-preferring visitor, via the `fv-lang` localStorage persistence, saw the whole biography still in German). Fixed by moving `[data-lang-block]` handling into `main.js`'s single `applyLang()` and deleting the duplicate script.
- **Contact form validation actually runs now.** The `<form>` had `required`/`minlength`/`type="email"` but no `novalidate`, so the browser's native (monolingual) validation intercepted `submit` before the custom bilingual `validateForm()` ever ran — that whole code path was dead. Added `novalidate`, plus live `blur`/`input` feedback per field (was submit-only before).
- **Form error text now passes WCAG AA contrast.** `.form-error`/`.form-feedback.is-error` used `#e85454` on `--card` (#2E2E2E) — measured 3.77:1, below the 4.5:1 minimum. Replaced with a new `--error: #F27E7E` token (5.21:1). Also tokenized the footer's hardcoded `#111111` as `--footer-bg`.
- **Audio play/pause buttons now update their accessible name.** All ~13 `.audio-player__play` buttons kept a static `aria-label` ("Play"/"Play video demo") forever, even while playing — a WCAG 4.1.2 violation. Now toggles Play↔Pause in the label alongside the icon swap, matching the hero mute button's already-correct pattern.
- **clients.html heading hierarchy fixed.** "Kunden" and "Studios & Agenturen" were `<h3>`s appearing before the page's first `<h2>` — promoted both to `<h2>` so heading levels no longer skip.
- **Hamburger menu touch target widened** from ~32×24px to a full 44×44px hit area (icon itself unchanged, just centered via flex in the larger button box).
- **Hero "Video-Demo" label renamed to "Hörprobe"/"Audio demo"** — it was labeled as video content but is actually an `.audio-player` playing an mp3; carried over unfixed from the 2026-06-28 critique until now.
- **`nav__lang` button's `aria-label="Switch language"`** was only on index.html; now on all 6 pages.
- **Dead code removed**: the `.testimonial` CSS component (unused by any page, and its `border-left` accent was exactly the side-stripe anti-pattern the design system should avoid) is deleted outright.
- **Two layout-thrash CSS transitions fixed**: `.nav.scrolled` no longer animates `padding` (snaps instantly now, background/blur still animates smoothly); `.audio-player__bar`'s progress fill now animates `transform: scaleX()` instead of `width`, updated on every `timeupdate` tick.
- **clients.html's 15 `.logo-wall` images** now have real `width`/`height` (extracted from each file's actual PNG/SVG dimensions) and `loading="lazy"`, matching the `.ref-strip` images on the same page that already had both.
- **about.html's portrait** (`Portrait.jpg`) switched from `loading="lazy"` to `fetchpriority="high"` — it's above the fold on desktop, lazy-loading it was working against itself.

**Not fixed — flagged in `next_tasks.md` as Wolf's call, not a code fix**: Dokumentation and E-Learning & Training are priced on services.html/index.html with zero audio proof anywhere on samples.html; clients.html's VOICE association card is a text-only placeholder box, not a real logo.

## Incomplete items

- **Contact form**: wired to Netlify Forms (`data-netlify="true"`, POST to `/` with URL-encoded data). Includes per-field validation (now live on `blur`/`input`, not just submit — see 2026-07-28 fixes below), bilingual error messages, honeypot spam protection (`netlify-honeypot="bot-field"`), and double-submit prevention. Will only work when deployed on Netlify.
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
