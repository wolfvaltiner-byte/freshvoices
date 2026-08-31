# Fresh Voices — Verlauf 2026

Ausgelagert aus `CLAUDE.md` am 2026-08-31, wörtlich unverändert. Was hier steht, ist
erledigt: es erklärt, *wie* etwas entstanden ist, nicht wie man heute arbeitet.

---

## Mobile testing (2026-07-27)

Tested every page (index, samples, services, about, clients, contact) at iPhone 13 and Pixel 5 viewports via Playwright device emulation: zero horizontal overflow, zero console errors, hamburger menu opens/closes and locks body scroll correctly, 48×48px tap targets on the audio player controls (meets both iOS HIG and Android Material minimums), `playsinline`+`muted` already set on the autoplaying hero video (required for iOS inline autoplay), and `.hero`'s `min-height: 100vh` (not `height`) avoids the classic iOS Safari dynamic-toolbar clipping issue.

**False-alarm pattern worth knowing about**: full-page mobile screenshots of this site look like they have huge blank gaps where whole sections (service cards, use-case list, CTA banners, logo walls, the contact form) are missing. They aren't — every one of these was checked directly via computed styles/bounding boxes and the content, elements, and layout are all present and correctly sized. The illusion comes from stacking three things: (1) `.reveal`/`.revealed` scroll-triggered fade-in (elements sit at `opacity:0` until their `IntersectionObserver` fires), (2) the dark-on-dark color palette, and (3) viewing a full-page screenshot of a very tall mobile page downscaled 6–8× to fit a preview — at that scale, correctly-rendered muted-gray-on-near-black content becomes visually imperceptible. If something looks missing on mobile, check a targeted element screenshot or computed style before concluding it's a bug — this cost real time twice in this session.

Only one real bug turned up (see the "Nav button contrast bug" note above) — everything else mobile-specific checked out clean.

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

**Not fixed — flagged in `next_tasks.md` as Wolf's call, not a code fix**: Dokumentation and E-Learning & Training are priced on services.html/index.html with zero audio proof anywhere on samples.html. (clients.html's VOICE association card *was* a text-only placeholder at the time of this audit — since replaced with a real logo, see below.)

## VOICE association logo (2026-07-28)

Replaced clients.html's `.assoc-logo-placeholder` (a dashed box literally containing the word "VOICE") with the real VOICE/Sprecherverband logo. Sourced directly from sprecherverband.at rather than the VOICE pricelist PDF, since the live site had a cleaner vector source: their Drupal theme serves a CSS sprite at `/themes/custom/voice/assets/img/sprite_voice.svg` containing several copies of the mark at different sizes; the cleanest instance was isolated, rendered at high resolution via headless Chromium, then color-keyed (global chroma-key on white, same approach as the OVERDUB logo fix — safe here since it's pure black artwork with no intentional white fills, so the "O" counter and the mic icon's highlight lines correctly go transparent too) and trimmed to `images/voice-sprecherverband-logo.png`.

The source logo is black-on-transparent; on the dark card it needs `filter: brightness(0) invert(1)` (scoped to `.assoc-logo img` only, not sitewide) to render as clean white, consistent with how every other single-tone logo on the site (Hermes, Hilfswerk, etc.) is treated. `.assoc-logo-placeholder`'s fixed 80×80 dashed box was replaced with `.assoc-logo` (140px wide, `height:auto`) sized for the logo's actual ~2.15:1 aspect ratio instead of forcing it into a square.

## Favicon (2026-08-01, redesigned 2026-08-03, reverted to literal logo 2026-08-03)

Added a full favicon set to all 8 pages (index, samples, services, about, clients, contact, impressum, datenschutz — `nav.html` is a copy-paste reference snippet, not a real page, so it was left alone).

**Attempt 1 (2026-08-01) — reverted:** used the green dot-matrix "burst" mark from `images/logo.svg` as-is (the icon half of the nav lockup, extracted separately from the pink "Fresh Voices" wordmark since text isn't legible at 16–32px). Tested at 16×16 with a fake 8x device-scale-factor render and it looked fine — but that test was misleading: it rendered the SVG at ~128px and displayed the result at 16px CSS size, never actually producing a true 16×16-pixel image. Wolf reported the real favicon was "barely visible" on the site. Recoloring green→dark alone didn't fix it either (tested) — the root cause is the halftone dot texture itself: at genuine 16×16/32×32 pixel resolution, individual dots and gaps between them average into a flat, low-contrast gray smear regardless of color. Fine stippled/halftone textures fundamentally don't survive downsampling to favicon resolution.

**Attempt 2 (2026-08-03) — reverted:** a bold solid silhouette computed from the convex hull of the dot pattern's dense central cluster (circles with radius ≥ 0.95, excluding the sparse peripheral "wave tail" dots), smoothed into one closed shape via Catmull-Rom-to-Bezier conversion, filled solid `#1A1A1A`. Legible at true 16×16/32×32, but Wolf's direct feedback was "this has nothing to do with my logo" — an algorithmically-derived shape can be perfectly crisp and still read as unrelated to the actual brand mark to someone who knows it.

**Attempt 2.5 (2026-08-03) — reverted, never shipped:** a plain hand-drawn rounded diamond, on the reasoning that the dot artwork's overall silhouette is itself roughly diamond-shaped. Discarded before showing Wolf, in favor of the current approach below, since it was still a redrawn shape rather than the actual logo.

**Current version (2026-08-03):** the literal `images/logo.svg` artwork (dot-matrix mark + "Fresh Voices" wordmark, unchanged colors — green `#91C268` dots, pink `#FF63A1` text), per Wolf's explicit instruction to stop redesigning it and just use the real logo. `favicon.svg` is `images/logo.svg`'s exact inner content with only the outer `<svg>` tag's `viewBox`/`width`/`height`/`preserveAspectRatio` changed — from the original's wide `383.5224 × 192.2949` box to a square `383.5224 × 383.5224` box (vertical padding split evenly above/below), `width`/`height` `512×512`, and `preserveAspectRatio="xMidYMid meet"` (was `"none"`) so the square favicon slot can never stretch it. No paths, colors, or coordinates were touched. Raster PNGs/ICO were rendered from this same square SVG at high resolution, trimmed to the opaque bounding box, and resized down with Pillow LANCZOS. **Known tradeoff, accepted deliberately:** at true 16×16/32×32 this is nearly illegible (the halftone texture and the wordmark both collapse into a small colored smear, same underlying limit documented in attempt 1) — but that's the explicit choice here: fidelity to the real logo over small-size legibility. `apple-touch-icon.png` was **not** changed — still the original green dot-matrix mark alone on a solid `--base` background, which reads fine at its native 180×180.

Files (in `images/favicons/`, plus one at site root):

- `favicon.svg` — the actual logo (icon + wordmark), square-cropped, scalable, used by browsers that support SVG favicons
- `favicon-16x16.png`, `favicon-32x32.png`, `favicon-192x192.png` — raster fallbacks, same artwork
- `apple-touch-icon.png` (180×180) — unchanged since 2026-08-01: original green dot-matrix mark on a solid `--base` (#1A1A1A) background (iOS doesn't reliably handle transparency on home-screen icons; iOS applies its own rounded-corner mask on top, so the source is a plain square)
- `/favicon.ico` (site root, not in the favicons folder) — legacy fallback for browsers/crawlers that probe `/favicon.ico` directly regardless of `<link>` tags, same artwork

Each page's `<head>` links all of these plus a `<link rel="shortcut icon" href="favicon.ico">`. No web manifest was added — that's a bigger PWA-icon-set decision (app name, theme-color, etc.) that wasn't asked for; the 192×192 PNG is there if that's revisited later.

**Lessons for next time**:

1. When testing whether a small icon/logo will be legible at a target size, always render at the *actual* target pixel dimensions (`deviceScaleFactor: 1`, no upscaling), not a scaled-up simulation — the two can look completely different for anything with fine detail or texture.
2. Legibility and "is this actually my logo" are separate, and Wolf weighted the second one higher than the first here — don't assume small-size legibility is the dominant constraint without checking.
