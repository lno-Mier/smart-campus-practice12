// Safe manual-style runtime checks (DAST perspective) against the LOCAL instances only.
// 1) XSS probe in the code-based start field.  2) Unauthenticated Node-RED admin API.
'use strict';
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

const CODE_URL = pathToFileURL(path.resolve(__dirname, '..', 'code-based', 'index.html')).href;
const NR = process.env.NODE_RED_URL || 'http://127.0.0.1:1880';
const PAYLOAD = '"><img src=x onerror=alert(1)>';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  let dialogs = 0;
  page.on('dialog', d => { dialogs++; d.dismiss(); });
  await page.goto(CODE_URL);
  await page.evaluate(p => { document.getElementById('start').value = p; }, PAYLOAD);
  const kept = await page.inputValue('#start');
  await page.click('#check');
  const result = await page.innerText('#result strong');
  const injected = await page.locator('img[src="x"]').count();
  console.log(`XSS probe: browser kept value=${JSON.stringify(kept)}, result="${result}", injected elements=${injected}, dialogs=${dialogs}`);
  await browser.close();

  const res = await fetch(`${NR}/flows`);
  const body = await res.json();
  console.log(`Node-RED GET /flows without credentials -> HTTP ${res.status}, nodes exposed: ${(body.flows || body).length}`);
})();
