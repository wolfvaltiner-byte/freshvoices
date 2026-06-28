# Fresh Voices — freshvoices.at
## VS Code Project — Setup & Handover Notes

---

### File structure

```
freshvoices/
├── index.html          ← Homepage
├── samples.html        ← Voice Samples (most important page)
├── services.html       ← Services & Pricing
├── about.html          ← About Wolf
├── clients.html        ← Clients, testimonials, associations
├── contact.html        ← Contact form
├── impressum.html      ← (create manually, Austrian legal requirement)
├── datenschutz.html    ← (create manually, GDPR / DSG)
├── css/
│   └── style.css       ← All styles, brand tokens, components
├── js/
│   └── main.js         ← Nav, audio players, form, scroll reveal
├── audio/
│   ├── demo-reel.mp3           ← Main demo reel (homepage + about)
│   ├── demo-reel-short.mp3     ← 30s version (about page sidebar)
│   ├── corporate-imagefilm.mp3
│   ├── corporate-messe.mp3
│   ├── documentary-natur.mp3
│   ├── documentary-history-en.mp3
│   ├── elearning-compliance.mp3
│   ├── elearning-softskills-en.mp3
│   ├── commercial-radio.mp3
│   ├── audiobook-sachbuch.mp3
│   └── ivr-banking.mp3
└── images/
    ├── wolf-valtiner.jpg       ← Hero photo (4:5 ratio, min 1000px wide)
    ├── wolf-portrait.jpg       ← About page (3:4 ratio, min 800px wide)
    └── clients/
        ├── client-01.svg       ← Client logos (SVG preferred, PNG ok)
        ├── client-02.svg
        └── ...
```

---

### What to fill in before going live

**Audio files** — most important:
- Record or curate a proper 90-second demo reel covering all genres
- Individual samples per category (approx. 60-90 seconds each)
- Name them exactly as listed above, or update the `data-src` attributes in the HTML

**Photos:**
- `images/wolf-valtiner.jpg` — hero image, vertical, professional or natural studio setting
- `images/wolf-portrait.jpg` — about page portrait, natural light works well here

**Client logos:**
- Add SVG or PNG files to `images/clients/`
- Replace the placeholder grid in `clients.html` with the actual `.logo-wall` div

**Testimonials (`clients.html`):**
- Replace the four placeholder quotes with real client feedback
- Keep each quote under 2-3 sentences, attribution: first name + company/role

**Contact form endpoint:**
- Open `contact.html` and `js/main.js`
- Replace the commented `fetch()` URL with your Formspree, Netlify Forms, or EmailJS endpoint
- Simplest option: [Formspree.io](https://formspree.io) — free tier handles 50 submissions/month
  Add to the form: `action="https://formspree.io/f/YOUR_FORM_ID"` and `method="POST"`

**Prices in services.html:**
- Update the "Ab € X / Y" strings to reflect your actual rates

**Stats on homepage:**
- Check and update: years experience, number of projects

**VSSÖ membership:**
- Confirm whether you're listed on vssoe.at and add your profile link
- If you have a Voice123 or similar profile, add that too

---

### Language toggle

The site supports bilingual content (DE/EN). Elements with `data-de` and `data-en` attributes
will swap when the language button is clicked. The `about.html` page also uses `data-lang-block`
for full block swaps. The toggle is in `js/main.js`.

---

### SEO basics to do after launch

1. Submit `sitemap.xml` to Google Search Console (create one — simple XML listing all 6 pages)
2. Create `robots.txt` in root:
   ```
   User-agent: *
   Allow: /
   Sitemap: https://www.freshvoices.at/sitemap.xml
   ```
3. Set up Google Search Console and Google Analytics (or a privacy-first alternative like Plausible)
4. Register the site on voice-specific directories:
   - voices.com (paid, but high-ROI for German voice talent)
   - voice123.com
   - sprecher.com (DACH-focused)
   - Maplefm / Stimme.de

---

### Hosting recommendation

Move off Wix. Options:
- **Netlify** (free tier, drag-and-drop deploy, form handling built in) — easiest
- **Vercel** (same simplicity, slightly more dev-oriented)
- **Hetzner** (Austrian hosting, GDPR-friendly, cheap)

Netlify + Formspree is the fastest zero-cost path to a live, functional site.

---

### Brand tokens (quick reference)

| Name        | Hex       | Usage                        |
|-------------|-----------|------------------------------|
| Green       | #91C268   | Accent, waveform, icon       |
| Pink        | #FF63A1   | CTA, highlight, text accent  |
| Dark grey   | #4F4F4F   | Cards, surfaces              |
| Base        | #1A1A1A   | Page background              |
| White       | #FFFFFF   | Body text, logo              |

Font: Montserrat (display + UI), Inter (body text)

---

© 2025 Fresh Voices · Wolf Valtiner
