import test from 'node:test';
import assert from 'node:assert/strict';
import contactModule from './contact.js';
const { handleContact, _resetRateLimitForTests } = contactModule;

const BASE_ENV = {
  CONTACT_TO: 'wolf.valtiner@freshvoices.at',
  CONTACT_FROM: 'Fresh Voices <kontakt@freshvoices.at>',
  RESEND_API_KEY: 'test-resend-key',
  TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
};

const VALID_FIELDS = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  company: 'Acme',
  projectType: 'commercial',
  message: 'This is a test message about a voice-over project.',
  'cf-turnstile-response': 'good-token',
};

function makeRequest({ body, headers = {}, method = 'POST', json = true } = {}) {
  const finalHeaders = {
    'Content-Type': 'application/json',
    'Accept': json ? 'application/json' : 'text/html',
    'CF-Connecting-IP': '198.51.100.1',
    ...headers,
  };
  return new Request('https://freshvoices.at/api/contact', {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // `cf` is a Cloudflare-specific property; Node's undici Request allows
    // arbitrary extra props to be ignored, so set it after construction.
  });
}

function withCf(request, cf) {
  Object.defineProperty(request, 'cf', { value: cf, configurable: true });
  return request;
}

function mockFetch({ turnstileOk = true, resendOk = true } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (String(url).includes('turnstile')) {
      return new Response(JSON.stringify({ success: turnstileOk }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (String(url).includes('resend.com')) {
      return new Response(JSON.stringify({ id: 'mock-email-id' }), {
        status: resendOk ? 200 : 500,
      });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  };
  return { fetchImpl, calls };
}

test.beforeEach(() => {
  _resetRateLimitForTests();
});

test('happy path: valid submission sends mail and returns 200 ok', async () => {
  const { fetchImpl, calls } = mockFetch();
  const request = withCf(makeRequest({ body: VALID_FIELDS }), { country: 'AT' });
  const res = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, { ok: true });

  const resendCall = calls.find((c) => String(c.url).includes('resend.com'));
  assert.ok(resendCall, 'expected a call to Resend');
  const sentBody = JSON.parse(resendCall.init.body);
  assert.equal(sentBody.to, BASE_ENV.CONTACT_TO);
  assert.equal(sentBody.reply_to, VALID_FIELDS.email);
  assert.match(sentBody.subject, /commercial/);
});

test('honeypot filled: returns 200 ok without calling Resend', async () => {
  const { fetchImpl, calls } = mockFetch();
  const request = makeRequest({ body: { ...VALID_FIELDS, 'bot-field': 'i am a bot' } });
  const res = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, { ok: true });
  assert.equal(calls.length, 0, 'no external calls should be made for a honeypot hit');
});

test('turnstile failure: returns 400 with error "captcha"', async () => {
  const { fetchImpl } = mockFetch({ turnstileOk: false });
  const request = makeRequest({ body: VALID_FIELDS });
  const res = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.equal(data.error, 'captcha');
});

test('missing required fields: returns 400 with error "validation"', async () => {
  const { fetchImpl, calls } = mockFetch();
  const request = makeRequest({ body: { ...VALID_FIELDS, email: '', message: '' } });
  const res = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.equal(data.error, 'validation');
  assert.ok(data.fields.includes('email'));
  assert.ok(data.fields.includes('message'));
  assert.equal(calls.length, 0, 'should fail validation before any network call');
});

test('invalid email format: returns 400 validation', async () => {
  const { fetchImpl } = mockFetch();
  const request = makeRequest({ body: { ...VALID_FIELDS, email: 'not-an-email' } });
  const res = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error, 'validation');
  assert.ok(data.fields.includes('email'));
});

test('GET method: returns 405', async () => {
  const { fetchImpl } = mockFetch();
  const request = makeRequest({ method: 'GET' });
  const res = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 405);
});

test('disallowed origin: returns 403', async () => {
  const { fetchImpl } = mockFetch();
  const request = makeRequest({ body: VALID_FIELDS, headers: { Origin: 'https://evil.example.com' } });
  const res = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 403);
});

test('allowed origin (freshvoices.at) passes', async () => {
  const { fetchImpl } = mockFetch();
  const request = makeRequest({ body: VALID_FIELDS, headers: { Origin: 'https://freshvoices.at' } });
  const res = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 200);
});

test('resend failure: returns 502', async () => {
  const { fetchImpl } = mockFetch({ resendOk: false });
  const request = makeRequest({ body: VALID_FIELDS });
  const res = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 502);
  const data = await res.json();
  assert.equal(data.ok, false);
});

test('rate limit: 6th request within a minute from the same IP is rejected', async () => {
  const { fetchImpl } = mockFetch();
  const ip = '203.0.113.9';
  let lastRes;
  for (let i = 0; i < 6; i++) {
    const request = makeRequest({ body: VALID_FIELDS, headers: { 'CF-Connecting-IP': ip } });
    lastRes = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  }
  assert.equal(lastRes.status, 429);
});

test('missing RESEND_API_KEY: returns 503 not_configured, no Turnstile/Resend call', async () => {
  const { fetchImpl, calls } = mockFetch();
  const env = { ...BASE_ENV, RESEND_API_KEY: undefined };
  const request = makeRequest({ body: VALID_FIELDS });
  const res = await handleContact(request, env, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 503);
  const data = await res.json();
  assert.deepEqual(data, { ok: false, error: 'not_configured' });
  assert.equal(calls.length, 0, 'no external calls should be made when secrets are missing');
});

test('missing TURNSTILE_SECRET_KEY: returns 503 not_configured, no Turnstile/Resend call', async () => {
  const { fetchImpl, calls } = mockFetch();
  const env = { ...BASE_ENV, TURNSTILE_SECRET_KEY: undefined };
  const request = makeRequest({ body: VALID_FIELDS });
  const res = await handleContact(request, env, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 503);
  const data = await res.json();
  assert.deepEqual(data, { ok: false, error: 'not_configured' });
  assert.equal(calls.length, 0, 'no external calls should be made when secrets are missing');
});

test('no-JS fallback (Accept without application/json) returns HTML', async () => {
  const { fetchImpl } = mockFetch();
  const request = makeRequest({ body: VALID_FIELDS, json: false });
  const res = await handleContact(request, BASE_ENV, { fetchImpl, now: () => 1000 });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type'), /text\/html/);
  const text = await res.text();
  assert.match(text, /<html/);
});
