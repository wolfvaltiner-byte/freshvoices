# freshvoices.at — Wix to Cloudflare Migration

## Summary

Migrated freshvoices.at from Wix (site hosting) to Cloudflare (DNS + Workers static assets), keeping Zoho Mail untouched throughout. Site is a static HTML site (no build step) deployed via `npx wrangler deploy` from the GitHub repo.

## Background / context

- Wix site plan (Premiumpaket Business) purchased 26 Jan 2026, prepaid 3 years to 14 Feb 2029. No refund available outside the 14-day window (B2B contract, reverse-charge VAT). Plan: request goodwill partial credit from Wix, but let the plan run to expiry rather than cancel early — no financial benefit to cancelling.
- Domain registrar: IONOS (freshvoices.at nameservers were IONOS default before migration).
- Original IONOS DNS had MX records pointing to `mx00/mx01.ionos.de` — this turned out to be legacy/inactive; actual DNS after nameserver switch to Cloudflare showed MX already natively pointed to Zoho (`mx.zoho.eu` etc.), so no mail migration was actually needed.

## Steps completed

1. **DNSSEC check on IONOS** — no DNSSEC section present on the domain; nothing to disable.
2. **Nameservers** — switched from IONOS default to Cloudflare nameservers.
3. **Repo prepared** — static HTML site (`index.html`, `about.html`, `contact.html`, `services.html`, `samples.html`, `clients.html`, plus `css/`, `js/`, `images/`, `audio/`, `videos/`) pushed to GitHub.
4. **Cloudflare deploy attempts:**
   - First attempt failed: no `package.json` (not an Astro/npm project — plain static site). Fixed by clearing build command, using wrangler static asset deploy instead of a framework build.
   - Second attempt failed: `Asset too large` — Cloudflare Workers static assets cap is **25 MiB per file**. Two video files exceeded this:
     - `seeanoli-image.mp4` — 65.6 MB → compressed to 7.8 MB
     - `wolf-alpha-master.mp4` — 81.3 MB → compressed to 3.1 MB
   - Compression command used:
     ```
     ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow -vf "scale=1280:-2" output.mp4
     ```
   - Build succeeded after both files were compressed and renamed back to original filenames, committed, and pushed.
5. **Custom domain attach to Worker** — failed initially: `Hostname 'freshvoices.at' already has externally managed DNS records (A, CNAME, etc). Delete them first.`
   - Cause: three leftover Wix A records on `freshvoices.at` (`185.230.63.171`, `.186`, `.107`), imported during the nameserver switch.
   - Fix: deleted the three Wix A records. Left all MX, TXT, `_dmarc`, and `www` CNAME records untouched.
   - Retried custom domain add — in progress / next step.

## DNS records present at time of writing (Cloudflare)

**Kept — mail (Zoho), do not touch:**
- MX `freshvoices.at` → `mx.zoho.eu` (priority 10)
- MX `freshvoices.at` → `mx2.zoho.eu` (priority 20)
- MX `freshvoices.at` → `mx3.zoho.eu` (priority 30)
- TXT `freshvoices.at` → `v=spf1 include:zoho.eu ~all`
- TXT `freshvoices.at` → `zoho-verification=zb73244103.zmverify.zoho.eu`
- TXT `_dmarc.freshvoices.at` → DMARC policy (quarantine)

**Kept — other:**
- TXT `freshvoices.at` → `google-site-verification=...`

**Deleted — Wix site hosting (blocked Worker custom domain):**
- A `freshvoices.at` → `185.230.63.171`
- A `freshvoices.at` → `185.230.63.186`
- A `freshvoices.at` → `185.230.63.107`

**Still present, not yet actioned:**
- CNAME `www.freshvoices.at` → `cdn1.wixdns.net` — needs to be repointed to the Worker once root domain is confirmed working.
- CNAME `s1._domainkey.freshvoices.at` → SendGrid
- CNAME `s2._domainkey.freshvoices.at` → SendGrid
  - Purpose unconfirmed — likely used by a Wix contact form/newsletter feature to send authenticated mail as `@freshvoices.at`. Safe to delete once confirmed nothing on the new site depends on SendGrid.

## Remaining steps

1. Confirm `freshvoices.at` custom domain attaches successfully to the Worker now that Wix A records are removed.
2. Add `www.freshvoices.at` as a custom domain on the Worker; remove/replace the old `cdn1.wixdns.net` CNAME.
3. Load `https://freshvoices.at` in an incognito window, click through every page (index, about, services, samples, clients, contact, impressum, datenschutz) to confirm content, images, audio, and video all load correctly.
4. Confirm `nav.html` (shared nav snippet) loads correctly if included via client-side fetch — Cloudflare static assets serve files as-is, no server-side includes.
5. Send a test email to `wolf@freshvoices.at` from an external account to confirm Zoho mail delivery still works post-cutover.
6. Decide on SendGrid CNAMEs — keep or delete depending on whether new site uses SendGrid for anything.
7. Submit a goodwill refund request to Wix for the unused portion of the prepaid 3-year plan (see earlier discussion — legally not owed, but worth asking).
8. Once Wix plan approaches its Feb 2029 expiry (or earlier if refunded/settled), turn off auto-renew so it doesn't silently renew.
