# WP-02 · Kontaktformular auf Cloudflare lauffähig machen

| Feld | Wert |
|---|---|
| Priorität | **P0** (Go-Live-Blocker: Anfragen gehen aktuell verloren) |
| Modell / Effort | **Sonnet 5 · high**. Falls Variante B (eigener Worker + Mail-API): **Opus 5 · high** für Architektur/Secrets-Handling, danach Sonnet 5 für Umsetzung |
| Session-Typ | Claude Code CLI, 1–2 Sessions |
| Betroffene Dateien | `contact.html`, `js/main.js` (Submit-Handler), `datenschutz.html`, neu: `functions/` bzw. `worker/` + `wrangler.toml` (nur Variante B) |
| Abhängigkeiten | Wolf-Entscheidung Variante A/B **vor** Start; Cloudflare-Dashboard-Zugriff (Variante B) |
| Befunde | C1, C2 |

## Ziel
Eine abgeschickte Anfrage landet zuverlässig in Wolfs Zoho-Postfach (`wolf.valtiner@freshvoices.at`), mit Spam-Schutz, DSGVO-konformer Beschreibung und echtem Erfolg/Fehler-Feedback.

## Entscheidung (Wolf)
- **Variante A — Formular-Dienst (schnell, 1 Session):** Web3Forms oder Formspree (EU-Endpunkt prüfen). Kein Server-Code, Access-Key im HTML ist öffentlich (bei beiden Diensten so vorgesehen). Kosten: free-tier reicht.
- **Variante B — Cloudflare Worker/Pages Function + Resend/MailChannels (sauber, 2 Sessions):** Endpoint `POST /api/contact`, Turnstile als Captcha, Secrets in Cloudflare; volle Kontrolle, keine Drittanbieter-Datenverarbeitung außer Mailversand. **Empfehlung**, weil Hosting ohnehin Cloudflare ist und Datenschutz einfacher zu erklären.

## Scope
1. Netlify-Attribute entfernen (`data-netlify`, `netlify-honeypot`, hidden `form-name`).
2. Submit-Handler in `js/main.js` auf gewählten Endpoint umstellen; bestehende Validierung, Honeypot, Double-Submit-Schutz und DE/EN-Meldungen beibehalten.
3. Variante B: Worker mit Rate-Limit (IP, 5/min), Turnstile-Verify, Mailversand (Reply-To = Absender), 200/400/500 sauber; `wrangler.toml` committen, Secrets **nicht**.
4. `datenschutz.html`: Netlify-Absätze ersetzen (Cloudflare Hosting, Formular-Verarbeitung, ggf. Turnstile/Resend), Stand-Datum aktualisieren.
5. Test-Submit End-to-End dokumentieren (Screenshot Zoho-Eingang).

## Nicht-Scope
Formular-Design, neue Felder, Newsletter.

## Akzeptanzkriterien
- [ ] Test-Anfrage von iPhone + Desktop kommt in Zoho an (Absender per Reply-To antwortbar).
- [ ] Leeres/ungültiges Formular → Fehlermeldung inline, kein Request.
- [ ] Honeypot-Füllung → stiller Drop, UI zeigt „gesendet".
- [ ] Netzwerkfehler → sichtbare Fehlermeldung DE/EN, Button wieder aktiv.
- [ ] `datenschutz.html` erwähnt Netlify nicht mehr.
- [ ] Keine Secrets im Repo (`git grep -i "api_key\|secret"` leer).

## Session-Prompt (Copy-Paste)
```
Lies CLAUDE.md und docs/review-2026-09/WP-02-contact-form-cloudflare.md. Entscheidung: Variante <A|B>.
Setze Scope 1–5 um. Lokal mit `npx wrangler dev` (B) bzw. curl gegen den Dienst (A) testen.
Committe mit expliziten Dateinamen, keine Secrets. Aktualisiere CLAUDE.md-Abschnitt
"Incomplete items → Contact form" und docs/CHANGELOG-2026.md; hake die Akzeptanzkriterien hier ab.
```
