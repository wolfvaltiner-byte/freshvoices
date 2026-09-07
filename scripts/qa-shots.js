#!/usr/bin/env node
/**
 * QA screenshot + smoke-check script for freshvoices.at (WP-07).
 *
 * Serves the built _site/ over a plain node:http static server on a free
 * port, then drives Playwright/Chromium across four viewports and eight
 * pages, taking screenshots and running a handful of automated checks.
 *
 * Run with `npm run qa` (which builds first) or directly:
 *   node scripts/qa-shots.js
 *
 * Output:
 *   - a summary table printed to the console
 *   - .qa/report.json (machine-readable results)
 *   - .qa/<viewport>/<page>-{top,menu,full}.png screenshots
 *
 * Exit code is 1 if any check failed, 0 otherwise.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium, devices } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SITE_DIR = path.join(ROOT, '_site');
const QA_DIR = path.join(ROOT, '.qa');

const PAGES = [
  'index.html',
  'samples.html',
  'services.html',
  'about.html',
  'clients.html',
  'contact.html',
  'impressum.html',
  'datenschutz.html',
];

const VIEWPORTS = {
  iphone13: { device: devices['iPhone 13'], mobile: true },
  iphone17: {
    device: {
      viewport: { width: 402, height: 874 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    },
    mobile: true,
  },
  ipad: { device: devices['iPad (gen 7)'], mobile: false },
  desktop: {
    device: { viewport: { width: 1440, height: 900 } },
    mobile: false,
  },
};

// Requests allowed to fail/be external without counting as a QA failure.
const REQUEST_WHITELIST = /googleapis\.com|gstatic\.com|youtube-nocookie\.com|ytimg\.com|\.mp3(\?|$)|\.mp4(\?|$)|challenges\.cloudflare\.com/i;

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.webmanifest': 'application/manifest+json',
      '.woff2': 'font/woff2',
    }[ext] || 'application/octet-stream'
  );
}

function startServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      let filePath = path.join(rootDir, urlPath);
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.stat(filePath, (err, stat) => {
        if (!err && stat.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
        fs.readFile(filePath, (err2, data) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found: ' + urlPath);
            return;
          }
          res.writeHead(200, { 'Content-Type': mimeFor(filePath) });
          res.end(data);
        });
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

function forceRevealCss() {
  // Injected into every page before the full-page screenshot: forces every
  // .reveal element to its .revealed state so full-page shots don't get
  // mistaken for the "empty section" false alarm documented in CLAUDE.md.
  return `
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
  `;
}

async function runChecks(page, { pageName, viewportName, isMobile, baseUrl, failedRequests, consoleErrors }) {
  const checks = [];

  // 1. No horizontal overflow.
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
  });
  checks.push({
    name: 'no-horizontal-overflow',
    pass: overflow.scrollWidth <= overflow.clientWidth + 1,
    detail: `scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
  });

  // 2. h1 top < 60% of viewport height.
  const h1Info = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) return null;
    const rect = h1.getBoundingClientRect();
    return { top: rect.top, innerHeight: window.innerHeight };
  });
  if (h1Info) {
    checks.push({
      name: 'h1-in-viewport',
      pass: h1Info.top < h1Info.innerHeight * 0.6,
      detail: `h1.top=${h1Info.top.toFixed(0)} 60%vh=${(h1Info.innerHeight * 0.6).toFixed(0)}`,
    });
  } else {
    checks.push({ name: 'h1-in-viewport', pass: false, detail: 'no <h1> found on page' });
  }

  // 3. Mobile menu: open/close behaviour.
  if (isMobile) {
    const hamburger = page.locator('.nav__hamburger');
    const hasHamburger = (await hamburger.count()) > 0;
    if (hasHamburger) {
      const box = await hamburger.boundingBox();
      if (box) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;

        await hamburger.click();
        await page.waitForTimeout(150);
        const menuOpen = await page.evaluate(() =>
          document.documentElement.classList.contains('menu-open')
        );
        const elAtHamburger = await page.evaluate(
          ([x, y]) => {
            const el = document.elementFromPoint(x, y);
            return el ? el.closest('.nav__hamburger') !== null : false;
          },
          [cx, cy]
        );
        checks.push({ name: 'menu-open', pass: menuOpen, detail: `menu-open class present: ${menuOpen}` });
        checks.push({
          name: 'hamburger-hit-target-on-top',
          pass: elAtHamburger,
          detail: `elementFromPoint(hamburger center) resolves to hamburger: ${elAtHamburger}`,
        });

        // Second tap closes.
        await hamburger.click();
        await page.waitForTimeout(150);
        const closedAfterSecondTap = await page.evaluate(
          () => !document.documentElement.classList.contains('menu-open')
        );
        checks.push({
          name: 'second-tap-closes-menu',
          pass: closedAfterSecondTap,
          detail: `menu-open class removed: ${closedAfterSecondTap}`,
        });

        // Escape closes.
        await hamburger.click();
        await page.waitForTimeout(150);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(150);
        const closedAfterEscape = await page.evaluate(
          () => !document.documentElement.classList.contains('menu-open')
        );
        checks.push({
          name: 'escape-closes-menu',
          pass: closedAfterEscape,
          detail: `menu-open class removed: ${closedAfterEscape}`,
        });
      } else {
        checks.push({ name: 'menu-open', pass: false, detail: 'hamburger not visible/measurable' });
      }
    } else {
      checks.push({ name: 'menu-open', pass: false, detail: 'no .nav__hamburger found' });
    }
  }

  // 3b. Hero: no element overflows the right edge of the viewport (iOS
  // Safari-specific bug, WP preview feedback 2026-09-07 — Safari counts a
  // <video>'s poster intrinsic width toward the grid track's min-content,
  // pushing .hero__subtitle and the video wider than the viewport). Checked
  // on every page/viewport that has a .hero section, not just index, and
  // against every element inside it, not just the obvious ones.
  const heroOverflow = await page.evaluate(() => {
    const hero = document.querySelector('.hero');
    if (!hero) return null;
    const innerWidth = window.innerWidth;
    let maxRight = -Infinity;
    let worstSelector = null;
    const els = [hero, ...hero.querySelectorAll('*')];
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue; // not rendered
      if (rect.right > maxRight) {
        maxRight = rect.right;
        worstSelector =
          el.tagName.toLowerCase() +
          (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
      }
    }
    return { innerWidth, maxRight, worstSelector };
  });
  if (heroOverflow) {
    checks.push({
      name: 'hero-no-right-overflow',
      pass: heroOverflow.maxRight <= heroOverflow.innerWidth + 1,
      detail: `maxRight=${heroOverflow.maxRight.toFixed(1)} innerWidth=${heroOverflow.innerWidth} worst=${heroOverflow.worstSelector}`,
    });
  }

  // 4. No JS pageerrors.
  checks.push({
    name: 'no-pageerrors',
    pass: consoleErrors.length === 0,
    detail: consoleErrors.length ? consoleErrors.join(' | ') : 'none',
  });

  // 5. No failed requests outside the whitelist.
  const badRequests = failedRequests.filter((u) => !REQUEST_WHITELIST.test(u));
  checks.push({
    name: 'no-failed-requests',
    pass: badRequests.length === 0,
    detail: badRequests.length ? badRequests.join(' | ') : 'none',
  });

  // 6. All <img> naturalWidth > 0 (lazy/offscreen images are scrolled into view first).
  const imgResult = await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const bad = [];
    for (const img of imgs) {
      if (img.naturalWidth > 0) continue;
      img.scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 150));
      if (img.complete && img.naturalWidth > 0) continue;
      await new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, 800);
      });
      if (!(img.naturalWidth > 0)) {
        bad.push(img.currentSrc || img.src || img.getAttribute('src') || '(no src)');
      }
    }
    return bad;
  });
  checks.push({
    name: 'all-images-loaded',
    pass: imgResult.length === 0,
    detail: imgResult.length ? imgResult.join(' | ') : `all images loaded`,
  });

  return checks;
}

async function testPage(browser, viewportName, viewportConfig, pageName) {
  const context = await browser.newContext({ ...viewportConfig.device });
  const page = await context.newPage();

  const failedRequests = [];
  const consoleErrors = [];

  page.on('requestfailed', (req) => failedRequests.push(req.url()));
  page.on('response', (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
  });
  // Only real uncaught JS exceptions count as "pageerror" — a console.error()
  // triggered by a failed network request (e.g. a blocked font/CDN request)
  // is already covered separately by the failed-requests check below.
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const url = `${global.__QA_BASE_URL__}/${pageName}`;
  const shotDir = path.join(QA_DIR, viewportName);
  fs.mkdirSync(shotDir, { recursive: true });
  const baseName = pageName.replace(/\.html$/, '');

  let checks = [];
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(300);

    // Top screenshot (viewport only, natural reveal state).
    await page.screenshot({ path: path.join(shotDir, `${baseName}-top.png`) });

    // Menu-open screenshot on mobile viewports.
    if (viewportConfig.mobile) {
      const hamburger = page.locator('.nav__hamburger');
      if ((await hamburger.count()) > 0) {
        await hamburger.click();
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(shotDir, `${baseName}-menu.png`) });
        await hamburger.click(); // close again before full-page checks
        await page.waitForTimeout(200);
      }
    }

    // Run automated checks (this also drives the menu open/close cycle again on mobile).
    checks = await runChecks(page, {
      pageName,
      viewportName,
      isMobile: viewportConfig.mobile,
      baseUrl: url,
      failedRequests,
      consoleErrors,
    });

    // Full-page screenshot, forcing .reveal -> .revealed first.
    await page.evaluate(forceRevealCss());
    await page.waitForTimeout(350); // let opacity transition settle
    const fullPageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.screenshot({ path: path.join(shotDir, `${baseName}-full.png`), fullPage: true });

    checks.push({ name: 'captured', pass: true, detail: 'screenshots taken' });
    checks.__fullPageHeight = fullPageHeight;
  } catch (err) {
    checks.push({ name: 'page-load', pass: false, detail: err.message });
  } finally {
    await context.close();
  }

  return checks;
}

async function main() {
  fs.rmSync(QA_DIR, { recursive: true, force: true });
  fs.mkdirSync(QA_DIR, { recursive: true });

  if (!fs.existsSync(SITE_DIR)) {
    console.error(`_site/ not found at ${SITE_DIR} — run "npm run build" first.`);
    process.exit(1);
  }

  const { server, port } = await startServer(SITE_DIR);
  global.__QA_BASE_URL__ = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch();
  const results = []; // { page, viewport, checks, fullPageHeight }

  try {
    for (const viewportName of Object.keys(VIEWPORTS)) {
      const viewportConfig = VIEWPORTS[viewportName];
      for (const pageName of PAGES) {
        process.stdout.write(`Testing ${pageName} @ ${viewportName}...\n`);
        const checks = await testPage(browser, viewportName, viewportConfig, pageName);
        results.push({
          page: pageName,
          viewport: viewportName,
          checks,
          fullPageHeight: checks.__fullPageHeight ?? null,
        });
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  // --- Report ---
  let anyFailed = false;
  const tableRows = [];
  for (const r of results) {
    const failed = r.checks.filter((c) => !c.pass);
    if (failed.length) anyFailed = true;
    tableRows.push({
      Page: r.page,
      Viewport: r.viewport,
      'Checks OK': `${r.checks.length - failed.length}/${r.checks.length}`,
      'Full-page h': r.fullPageHeight ?? '-',
      Failures: failed.map((f) => f.name).join(', ') || '-',
    });
  }
  console.table(tableRows);

  if (anyFailed) {
    console.log('\nFailure details:');
    for (const r of results) {
      const failed = r.checks.filter((c) => !c.pass);
      if (!failed.length) continue;
      console.log(`\n${r.page} @ ${r.viewport}:`);
      for (const f of failed) {
        console.log(`  - ${f.name}: ${f.detail}`);
      }
    }
  }

  fs.writeFileSync(
    path.join(QA_DIR, 'report.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)
  );
  console.log(`\nReport written to ${path.join(QA_DIR, 'report.json')}`);
  console.log(`Screenshots written to ${QA_DIR}`);

  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
