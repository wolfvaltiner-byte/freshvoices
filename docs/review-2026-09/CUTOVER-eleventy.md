# Cutover: Eleventy build on Cloudflare (WP-06)

The site is now built with Eleventy (`npm run build` → `_site/`) instead of being served as
plain static HTML from the repo root. The Cloudflare Workers static-assets deploy needs its
build settings updated once, before (or right after) this branch is merged to `main`.

## Steps for Wolf

1. **Cloudflare Dashboard → Workers & Pages → freshvoices → Settings → Build**
   - **Build command**: `npx @11ty/eleventy` (optional since `wrangler.jsonc` now carries
     `build.command = "npm run build"` — Wrangler builds before deploying either way)
   - **Deploy command**: `npx wrangler deploy` (a *command*, not a folder — `_site` is read from
     `wrangler.jsonc` → `assets.directory`; entering `_site` here yields "Invalid request body")
   - **Root directory**: `/` (unchanged)
   - Save.
2. **Merge this branch (`review-2026-09`) into `main`.** Cloudflare's Git integration deploys
   automatically on push, same as before — no other dashboard change needed.
3. **Check the deploy log** (Cloudflare Dashboard → your Worker → Deployments → latest). It
   should show an `npx @11ty/eleventy` build step, then a static-assets upload from `_site/`.
   A green/successful deploy confirms Eleventy ran and produced output.
4. **Click through the live site** once deployed: all 8 pages (`/`, `/samples.html`,
   `/services.html`, `/about.html`, `/clients.html`, `/contact.html`, `/impressum.html`,
   `/datenschutz.html`) should look and behave exactly as before — same URLs, same content,
   same nav/footer, same language toggle, same audio players.

## Rollback

If the build fails or the deployed site looks wrong:

1. In the same Cloudflare Build settings screen, **clear the Build command field** (empty) so
   Cloudflare falls back to deploying the repo root as static files again.
2. In this repo, create a revert commit for the Eleventy-migration commit (`git revert
   <commit-sha>`) and push it — this restores the pre-Eleventy root-level HTML files.
3. Re-deploy (push triggers it automatically). The site is back to the pre-WP-06 state.

Do **not** delete this branch or force-push over it while validating the cutover — a plain
revert commit keeps history intact and is trivially undoable if the rollback itself needs undoing.

## What changed, in one paragraph

Nav, footer and `<head>` boilerplate used to be copy-pasted across all 8 HTML files; they now
exist once each, in `src/_includes/`, and Eleventy renders the 8 pages from `src/*.njk`
templates into `_site/*.html` at build time. Page URLs are unchanged (`permalink` is set
explicitly per page to match the old filename). Static assets (`css/`, `js/`, `images/`,
`customers/`, `audio/`, `videos/`, `favicon.ico`) moved under `src/` and are copied through to
`_site/` unchanged. `docs/` and `_unused/` stay at the repo root and are never part of the
Eleventy input or output. Full detail: `CLAUDE.md` → Architecture, and the WP-06 card
(`WP-06-templating-css-hygiene.md`) in this folder.

## Kontaktformular (WP-02)

The contact form (`src/contact.njk`) no longer depends on Netlify Forms. It now posts to
`POST /api/contact`, handled by a dedicated Cloudflare Worker committed in this repo:
`wrangler.jsonc` (config), `worker/index.js` (routes `/api/contact` to the handler, everything
else to the static-assets binding), `worker/contact.js` (validation, Turnstile verification,
Resend mail send — pure function, unit-tested in `worker/contact.test.mjs` via `npm test`).
Mail goes out through Resend's HTTP API (no SMTP, no MailChannels — Cloudflare Workers no longer
gets free MailChannels access). Spam protection is Cloudflare Turnstile plus a honeypot field;
there's also a best-effort, non-durable per-isolate rate limit as a cheap extra layer, documented
as such in `worker/contact.js` — Turnstile is the real defense.

**Everything below is Cloudflare-dashboard/DNS work that could not be done from the coding
session (no Cloudflare login, no real network egress to Resend/Turnstile from that sandbox).**
Do these before the contact form can actually deliver mail:

1. **Resend**: create/log into a Resend account, add `freshvoices.at` as a sending domain, and
   add the DKIM and Return-Path DNS records Resend gives you to the Cloudflare DNS zone for
   `freshvoices.at`. **Leave the existing Zoho MX records alone** — inbound mail is unaffected.
   Add Resend's suggested SPF `include:` to the existing SPF TXT record (it currently only
   includes `zoho.eu`; SPF allows multiple includes in one record — don't create a second SPF
   TXT record, DNS only allows one). Generate an API key in the Resend dashboard.
2. **Turnstile**: Cloudflare Dashboard → Turnstile → Add widget. Domains: `freshvoices.at` and
   the Worker's `*.workers.dev` preview subdomain (so testing on the preview URL also works).
   Widget mode: Managed (the default) is fine. Copy the **site key** into
   `src/_data/site.json` → `turnstileSiteKey`, replacing the placeholder
   `1x00000000000000000000AA` (Turnstile's published "always passes" test key — fine for local
   dev and the automated tests, but must not ship to production as-is). Copy the **secret key**
   for the next step. Note: the test key always renders a visible "For testing only" banner in
   the widget — that's a property of the test key itself, not of the site's markup (the widget
   div already carries `data-appearance="interaction-only"`, which keeps it hidden unless a
   challenge is actually needed). The banner disappears on its own once the real site key from
   this step is in place.
3. **Worker secrets** (never committed to the repo): set both of
   - `RESEND_API_KEY` — the Resend API key from step 1
   - `TURNSTILE_SECRET_KEY` — the Turnstile secret key from step 2

   either via **Cloudflare Dashboard → Workers & Pages → freshvoices → Settings → Variables**
   (mark both as "Encrypt"), or from a machine with `wrangler` logged in:
   ```bash
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
4. **Confirm the Worker name**: `wrangler.jsonc`'s `name` field is `"freshvoices"` — check this
   matches the Worker's actual name in the dashboard before the first deploy that includes it.
   A mismatch creates a *second*, separate Worker instead of updating the one already attached
   to `freshvoices.at`.
5. **Deploy**: the build command stays `npx @11ty/eleventy` (unchanged from the Eleventy
   cutover above). Because `wrangler.jsonc` now exists in the repo, Cloudflare's Git integration
   reads it for the Worker/assets config; the deploy command is `npx wrangler deploy` (or
   whatever the dashboard's Git-integration build pipeline runs — check the dashboard's build
   settings still show a deploy step, since adding a Worker script is a bigger change than the
   static-assets-only setup from WP-06). As a pre-flight sanity check from a machine with
   `wrangler` and Cloudflare credentials, `npx wrangler deploy --dry-run` validates the config
   and bundle without actually deploying — worth running once before the first real deploy of
   this change.
6. **Test submit**: after deploy, submit the live contact form (desktop and mobile) and confirm
   the message arrives in Wolf's Zoho inbox (`wolf.valtiner@freshvoices.at`) with the `Reply-To`
   set to the submitter's address. Also verify: an empty/invalid submission shows inline errors
   and sends no request; the honeypot field (if scripted/tested) returns a silent success with no
   mail sent; a network error while offline shows the existing DE/EN failure message.

**Rollback for this piece specifically**: if the Worker causes problems post-deploy, the
static-assets deploy still works standalone — removing `worker/index.js`'s custom routing (or
reverting `wrangler.jsonc` to drop the `main`/Worker script entirely, keeping only `assets`)
falls back to the pre-WP-02 pure-static-assets deploy. The contact form itself would then need
re-pointing at some other backend again (it no longer has a Netlify fallback).
