# Next Tasks

Pending decisions and follow-ups that need Wolf's input — not things Claude should just decide and change unilaterally. See `CLAUDE.md` for the technical detail behind each item.

## From 2026-08-01 session — favicon

- **Favicon added — nothing pending, informational only.** All 8 pages now reference a favicon set derived from the green dot-matrix mark in `images/logo.svg` (the icon half of the nav wordmark, extracted separately from the pink "Fresh Voices" text since that wouldn't read at favicon sizes). See `CLAUDE.md` for the full file list.

## From 2026-07-28 session — audit + critique findings that need Wolf, not code

- **Impressum & Datenschutzerklärung — done.** Both pages now exist (`impressum.html`, `datenschutz.html`), built from the GISA Gewerbeschein Wolf supplied (Mag. Wolf Valtiner, Einzelunternehmen, freies Gewerbe "Sprachdienstleistungen", GISA-Zahl 37713935, Magistrat der Stadt Wien, Karolinengasse 5/15, 1040 Wien, UID ATU73347318) plus a Datenschutzerklärung covering Netlify hosting/forms, Google Fonts, and the youtube-nocookie embed — the site currently has no analytics/tracking, confirmed by Wolf. **Worth a quick read-through by Wolf** (or ideally a lawyer) before relying on it, since Claude drafted the legal language from the GISA extract and standard Austrian Impressum/DSGVO boilerplate, not a substitute for legal review.
- **Two of the six priced services have zero audio proof.** Dokumentation (services.html, "Ab € 150 / Projekt") and E-Learning & Training (services.html, "Ab € 350 / Modul") are both sold on the homepage and services.html, but samples.html has no filter category or sample group for either — a prospect evaluating either service line finds nothing to listen to. (The E-Learning half of this was already flagged below under the 2026-07-26 session; this broadens it to include Dokumentation and ties it to the priced service cards specifically.) Either supply real samples for both, or soften/remove the promise until proof exists — Wolf's call, not a code fix.
- **clients.html's VOICE association card — done.** The placeholder dashed box is replaced with the real VOICE/Sprecherverband logo (`images/voice-sprecherverband-logo.png`), extracted from sprecherverband.at's own site assets. See `CLAUDE.md`.

## From 2026-07-27 session — connecting freshvoices.at

- **freshvoices.at is live on Wix today, not just parked.** DNS is fully delegated to Wix (`ns6/ns7.wixdns.net`), and the A records point at Wix's hosting IPs — meaning there's a currently-published Wix site actually serving visitors at this domain right now. Before repointing anything, decide what happens to that existing Wix site (archive it, keep it as a fallback, or just cut over).
- **Email (Zoho) must survive any DNS change.** MX (`mx.zoho.eu` + 2 backups), SPF, and a Zoho verification TXT record are all live on the domain today, separate from the Wix hosting. Whatever approach connects the domain to this Netlify site, those exact records need to be recreated/preserved or Wolf's `@freshvoices.at` email stops working. A Google site-verification TXT record is also present and should carry over too.
- **Two ways to connect the domain**, both requiring registrar/DNS-panel access (not something doable from this repo): (1) keep nameservers at Wix, edit just the A/CNAME records to point at Netlify, or (2) move nameservers off Wix entirely to Netlify DNS and rebuild every other record there. Recommend confirming with Netlify's own "add a custom domain" instructions once ready, and doing it during low-traffic hours in case of propagation delays.

## From 2026-07-27 session — home page / mobile fixes

- **Verify the widened layout (1440px, up from 1100px) reads well to you on your own monitor(s).** It's a subjective call — checked for zero overflow/breakage across every page at 1728px, but "does it feel right" is yours to judge.
- **Hero video has a baked-in German-only moment.** `videos/production-hook.mp4` (the autoplaying hero clip) includes a frame with burned-in German text ("Scannt diesen QR-Code:"). Since it's burned into the video pixels, the language toggle can't translate it — an English visitor will briefly see German text mid-video. Fixable only with a new/dubbed video asset from Wolf, not a code change.

## From 2026-07-26 session

- **Review new pricing floors on services.html.** Six service card prices were raised to match VOICE's recommended minimums (e.g. Corporate & Industrie €150 → €350/Projekt, Werbung & Spots €200 → €450/Spot — full table in `CLAUDE.md`). These are defensible floors based on the VOICE pricelist, but they're a real business decision — confirm they're what you actually want to charge before this goes live.
- **Decide on expanding the service offering.** VOICE's pricelist covers Podcasts, Audioguide, and Synchronisation (Film/Games) — none of these are service cards on services.html today. Add them only if you actually offer (or want to start offering) these services.
- **fliesenverband-spot.mp3 vs. fliesenverband-fliesenleger.mp3.** Two different Fliesenverband recordings now both live on samples.html — one under Corporate (existing), one under Werbung & Spots (new, added this session). Confirm that's intentional and not a duplicate that should be consolidated.
- **images/fresh-demos-cover.jpg** — a demo-reel cover image moved in with the new audio batch. Not used anywhere yet. Decide where (if anywhere) it should appear, e.g. as an Open Graph share image or a samples.html graphic.
- **E-Learning sample gap** — samples.html's meta description mentions an "E-Learning" category, but there's no such sample/group on the page. Either supply an E-Learning sample or adjust the meta description.
- **Verify the docs/Voice_Preisliste_260324.md conversion is only used as a rough reference.** The markitdown conversion mangles some tables and the rotated cover-page text — don't rely on it for exact figures without checking the original PDF.

## Carried over from earlier sessions (still open)

- **logo-banner.svg** in the clients.html trust strip — confirmed second Bormes les Mimosas logo variant. Decide: link it to bormeslesmimosas.com, or remove the duplicate.
- **MacJingle logo** — real vector/SVG logo still needed from Wolf; current site uses a flood-fill transparency stopgap.
- **Lounge FM logo** — site blocks automated fetches (403); re-fetch manually if the current file looks stale.
- **Oecolution logo** — oecolution.at had an SSL cert issue at audit time; re-fetch manually if a cleaner source becomes available.
- **Wincom logo** — legible but faint at the logo wall's small size; consider a bolder/simplified mark if it needs to stand out more.
- **Unused video files** — `videos/seeanoli-image.mp4` (65 MB, safe to delete) and `videos/wolf-alpha-master.mp4` (81 MB, decide: embed or delete).
- **logo_big.svg** — removed from the clients.html trust strip; file still on disk in `customers/`, delete outright once confirmed unused elsewhere.
