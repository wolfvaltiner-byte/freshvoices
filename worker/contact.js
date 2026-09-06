// Pure(ish) contact-form handler, factored out of the Worker's fetch()
// so it can be unit-tested (worker/contact.test.mjs) without spinning up
// a real Worker runtime or hitting real network services.
//
// Rate limiting: best-effort only, using an in-memory Map that lives for
// the lifetime of one Worker isolate. This is NOT a durable/global rate
// limit — Cloudflare can and will spin up multiple isolates (different
// colos, isolate recycling), each with its own empty Map, so a determined
// abuser can exceed the nominal limit by hitting different isolates.
// Turnstile is the real anti-abuse layer here; this is just a cheap extra
// speed bump against a single client hammering a single isolate. No KV
// binding is used on purpose (see WP-02 card / session prompt).
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map();

const ALLOWED_ORIGINS = [
  'https://freshvoices.at',
  'https://www.freshvoices.at',
];

function isAllowedOrigin(origin) {
  if (!origin) return true; // no Origin header (e.g. curl, same-origin no-JS form POST in some browsers)
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1') return false;
    if (hostname.endsWith('.workers.dev')) return true;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    return false;
  } catch {
    return false;
  }
}

function checkRateLimit(ip, now) {
  const key = ip || 'unknown';
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { windowStart: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 5000;

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function htmlResponse(body, status) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function wantsJson(request) {
  const accept = request.headers.get('Accept') || '';
  return accept.includes('application/json');
}

async function parseBody(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return await request.json();
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const out = {};
    for (const [key, value] of formData.entries()) {
      out[key] = typeof value === 'string' ? value : '';
    }
    return out;
  }
  // Fall back to attempting JSON — some clients omit/mis-set Content-Type.
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function noJsFallbackPage({ ok, error, isDE }) {
  const title = ok
    ? (isDE ? 'Nachricht gesendet' : 'Message sent')
    : (isDE ? 'Fehler' : 'Error');
  const message = ok
    ? (isDE
        ? 'Danke! Ich melde mich innerhalb von 24 Stunden.'
        : "Thanks! I'll get back to you within 24 hours.")
    : (isDE
        ? `Senden fehlgeschlagen (${error}). Bitte versuchen Sie es erneut oder schreiben Sie an wolf.valtiner@freshvoices.at.`
        : `Failed to send (${error}). Please try again or email wolf.valtiner@freshvoices.at.`);
  return `<!doctype html><html lang="${isDE ? 'de' : 'en'}"><head><meta charset="utf-8"><title>${title} — Fresh Voices</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;background:#1A1A1A;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}
a{color:#FF63A1}</style></head><body><div><h1>${title}</h1><p>${message}</p><p><a href="/contact.html">${isDE ? 'Zurück zum Kontaktformular' : 'Back to the contact form'}</a></p></div></body></html>`;
}

async function verifyTurnstile({ token, secret, ip, fetchImpl }) {
  if (!secret) {
    // Misconfiguration guard: without a secret configured we cannot verify
    // anything, so fail closed rather than silently accepting all submissions.
    return false;
  }
  if (!token) return false;
  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

function validateFields(fields) {
  const errors = [];
  const required = ['firstName', 'lastName', 'email', 'message'];
  for (const name of required) {
    if (!fields[name] || String(fields[name]).trim().length === 0) {
      errors.push(name);
    }
  }
  if (fields.email && !EMAIL_RE.test(String(fields.email).trim())) {
    errors.push('email');
  }
  for (const name of ['firstName', 'lastName', 'email', 'company', 'projectType', 'message']) {
    if (fields[name] && String(fields[name]).length > MAX_FIELD_LENGTH) {
      errors.push(name);
    }
  }
  return [...new Set(errors)];
}

async function sendMail({ fields, env, fetchImpl, now, country }) {
  const subjectLabel = fields.projectType || fields.subject || (fields.company ? fields.company : 'Anfrage');
  const timestamp = new Date(now).toISOString();
  const textBody = [
    `Neue Anfrage über freshvoices.at`,
    ``,
    `Name: ${fields.firstName} ${fields.lastName}`,
    `E-Mail: ${fields.email}`,
    `Unternehmen/Agentur: ${fields.company || '-'}`,
    `Projektart: ${fields.projectType || '-'}`,
    ``,
    `Nachricht:`,
    fields.message,
    ``,
    `---`,
    `Zeitstempel: ${timestamp}`,
    `IP-Land: ${country || 'unbekannt'}`,
  ].join('\n');

  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: env.CONTACT_TO,
      from: env.CONTACT_FROM,
      reply_to: fields.email,
      subject: `Anfrage über freshvoices.at: ${subjectLabel}`,
      text: textBody,
    }),
  });
  return res;
}

/**
 * Handles POST /api/contact.
 * @param {Request} request
 * @param {object} env - Worker environment (vars + secrets: CONTACT_TO,
 *   CONTACT_FROM, RESEND_API_KEY, TURNSTILE_SECRET_KEY).
 * @param {object} [opts]
 * @param {typeof fetch} [opts.fetchImpl] - injectable fetch, for tests.
 * @param {() => number} [opts.now] - injectable clock, for tests.
 */
async function handleContact(request, env, opts = {}) {
  const fetchImpl = opts.fetchImpl || fetch;
  const now = typeof opts.now === 'function' ? opts.now() : Date.now();

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
  }

  const origin = request.headers.get('Origin');
  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ ok: false, error: 'origin' }, 403);
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const country = request.cf && request.cf.country;
  const asJson = wantsJson(request);

  let fields;
  try {
    fields = await parseBody(request);
  } catch {
    return asJson
      ? jsonResponse({ ok: false, error: 'invalid_body' }, 400)
      : htmlResponse(noJsFallbackPage({ ok: false, error: 'invalid_body', isDE: true }), 400);
  }

  // Honeypot: silently accept (as success) without sending mail or doing
  // anything else expensive, so bots get no signal that they were caught.
  if (fields['bot-field']) {
    return asJson
      ? jsonResponse({ ok: true }, 200)
      : htmlResponse(noJsFallbackPage({ ok: true, isDE: true }), 200);
  }

  if (!checkRateLimit(ip, now)) {
    return asJson
      ? jsonResponse({ ok: false, error: 'rate_limited' }, 429)
      : htmlResponse(noJsFallbackPage({ ok: false, error: 'rate_limited', isDE: true }), 429);
  }

  const validationErrors = validateFields(fields);
  if (validationErrors.length > 0) {
    return asJson
      ? jsonResponse({ ok: false, error: 'validation', fields: validationErrors }, 400)
      : htmlResponse(noJsFallbackPage({ ok: false, error: 'validation', isDE: true }), 400);
  }

  const turnstileToken = fields['cf-turnstile-response'];
  const turnstileOk = await verifyTurnstile({
    token: turnstileToken,
    secret: env.TURNSTILE_SECRET_KEY,
    ip,
    fetchImpl,
  });
  if (!turnstileOk) {
    return asJson
      ? jsonResponse({ ok: false, error: 'captcha' }, 400)
      : htmlResponse(noJsFallbackPage({ ok: false, error: 'captcha', isDE: true }), 400);
  }

  try {
    const mailRes = await sendMail({ fields, env, fetchImpl, now, country });
    if (!mailRes.ok) {
      return asJson
        ? jsonResponse({ ok: false, error: 'mail_send_failed' }, 502)
        : htmlResponse(noJsFallbackPage({ ok: false, error: 'mail_send_failed', isDE: true }), 502);
    }
  } catch {
    return asJson
      ? jsonResponse({ ok: false, error: 'mail_send_failed' }, 502)
      : htmlResponse(noJsFallbackPage({ ok: false, error: 'mail_send_failed', isDE: true }), 502);
  }

  return asJson
    ? jsonResponse({ ok: true }, 200)
    : htmlResponse(noJsFallbackPage({ ok: true, isDE: true }), 200);
}

module.exports = {
  handleContact,
  isAllowedOrigin,
  validateFields,
  _resetRateLimitForTests: () => rateLimitMap.clear(),
};
