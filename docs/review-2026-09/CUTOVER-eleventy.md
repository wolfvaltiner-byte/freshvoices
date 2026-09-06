# Cutover: Eleventy build on Cloudflare (WP-06)

The site is now built with Eleventy (`npm run build` → `_site/`) instead of being served as
plain static HTML from the repo root. The Cloudflare Workers static-assets deploy needs its
build settings updated once, before (or right after) this branch is merged to `main`.

## Steps for Wolf

1. **Cloudflare Dashboard → Workers & Pages → freshvoices → Settings → Build**
   - **Build command**: `npx @11ty/eleventy`
   - **Deploy command / output directory**: `_site`
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
