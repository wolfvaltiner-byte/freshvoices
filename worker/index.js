// Cloudflare Worker entry point (Modules format).
//
// Everything except POST /api/contact is handed straight to the static
// assets binding (the Eleventy build output in _site/, via the `assets`
// config in wrangler.jsonc). Only the contact-form endpoint gets custom
// logic, factored into worker/contact.js so it stays unit-testable.
import { handleContact } from './contact.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
