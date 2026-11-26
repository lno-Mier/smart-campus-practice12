// Same 8 UI test cases (T1-T8) for both tracks, driven through the real user interfaces in Chrome.
// Usage:  node tests/ui-tests.js            (Node-RED must run at http://127.0.0.1:1880, see README)
// Output: test-results/ui-results.json and screenshots/<track>/T*.png
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const CODE_URL = pathToFileURL(path.join(ROOT, 'code-based', 'index.html')).href;
const NR = process.env.NODE_RED_URL || 'http://127.0.0.1:1880';
const LOWCODE_URL = `${NR}/dashboard/checker`;
const FLOW_ID = 'a1f0c0de00000001';

const CASES = [
  { id: 'T1', date: '2026-12-01', time: '13:30', duration: '60', blocked: false, expect: 'OK' },
  { id: 'T2', date: '2026-12-01', time: '09:30', duration: '60', blocked: false, expect: 'OVERLAP' },
  { id: 'T3', date: '2026-12-01', time: '13:30', duration: '60', blocked: true, expect: 'ROOM_BLOCKED' },
  { id: 'T4', date: '2026-12-01', time: '13:30', duration: '0', blocked: false, expect: 'INVALID_DURATION' },
  { id: 'T5', date: '2026-12-01', time: '13:30', duration: '121', blocked: false, expect: 'INVALID_DURATION' },
  { id: 'T6', date: '2026-11-20', time: '10:00', duration: '60', blocked: false, expect: 'START_IN_PAST' },
  { id: 'T7', date: '2026-12-01', time: '10:30', duration: '90', blocked: false, expect: 'OK' }
];

const shotDir = track => {
  const dir = path.join(ROOT, 'screenshots', track);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

async function runCodeBased(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  await page.goto(CODE_URL);
  const dir = shotDir('code-based');
  const before = await page.innerText('#bookings');
  const rows = [];
  for (const c of CASES) {
    await page.fill('#start', `${c.date}T${c.time}`);
    await page.fill('#duration', c.duration);
    await page.setChecked('#blocked', c.blocked);
    await page.click('#check');
    const decision = await page.innerText('#result strong');
    const message = await page.innerText('#result span');
    const contract = await page.innerText('#result code');
    const reason = contract.split('reason=')[1];
    await page.screenshot({ path: path.join(dir, `${c.id}.png`) });
    rows.push({ id: c.id, decision, message, contract, expected: c.expect, pass: reason === c.expect });
  }
  const after = await page.innerText('#bookings');
  await page.screenshot({ path: path.join(dir, 'T8.png') });
  rows.push({ id: 'T8', expected: 'bookings unchanged', observed: before === after ? 'unchanged after 7 checks' : 'CHANGED', pass: before === after });
  // Narrow (mobile) screen evidence
  await page.setViewportSize({ width: 390, height: 870 });
  await page.fill('#start', '2026-12-01T13:30');
  await page.fill('#duration', '60');
  await page.setChecked('#blocked', false);
  await page.click('#check');
  await page.screenshot({ path: path.join(dir, 'narrow-390px-T1.png'), fullPage: true });
  await page.close();
  return rows;
}

async function readText(page, label) {
  return page.locator('.nrdb-ui-text', { has: page.locator(`label:text-is("${label}")`) })
    .locator('.nrdb-ui-text-value').innerText();
}

async function flowBookings() {
  const res = await fetch(`${NR}/context/flow/${FLOW_ID}`); // admin API (no auth by default!)
  return JSON.stringify((await res.json()).bookings);
}

async function runLowCode(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
  await page.goto(LOWCODE_URL);
  await page.waitForSelector('input[type=date]');
  const dir = shotDir('low-code');
  const before = await flowBookings();
  const rows = [];
  for (const c of CASES) {
    await page.fill('input[type=date]', c.date);
    await page.fill('input[type=time]', c.time);
    await page.fill('input[type=number]', c.duration);
    await page.locator('input[type=checkbox]').setChecked(c.blocked, { force: true });
    await page.click('button:has-text("Check availability")');
    // T4 and T5 legitimately produce the same text, so wait for the round trip instead of a change.
    await page.waitForTimeout(1500);
    const message = await readText(page, 'Decision');
    const contract = await readText(page, 'Output contract');
    const reason = contract.split('reason=')[1];
    await page.screenshot({ path: path.join(dir, `${c.id}.png`) });
    rows.push({ id: c.id, message, contract, expected: c.expect, pass: reason === c.expect });
  }
  const after = await flowBookings();
  await page.screenshot({ path: path.join(dir, 'T8.png') });
  rows.push({ id: 'T8', expected: 'bookings unchanged',
    observed: before === after ? 'flow.bookings identical before/after 7 checks (admin API /context/flow)' : 'CHANGED',
    pass: before === after });
  await page.setViewportSize({ width: 390, height: 870 });
  await page.fill('input[type=date]', '2026-12-01');
  await page.fill('input[type=time]', '13:30');
  await page.fill('input[type=number]', '60');
  await page.locator('input[type=checkbox]').setChecked(false, { force: true });
  await page.click('button:has-text("Check availability")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(dir, 'narrow-390px-T1.png'), fullPage: true });
  await page.close();
  return rows;
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const results = { runAt: new Date().toISOString(), codeBased: await runCodeBased(browser), lowCode: await runLowCode(browser) };
  await browser.close();
  fs.mkdirSync(path.join(ROOT, 'test-results'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'test-results', 'ui-results.json'), JSON.stringify(results, null, 2));
  for (const track of ['codeBased', 'lowCode']) {
    const passed = results[track].filter(r => r.pass).length;
    console.log(`${track}: ${passed}/8 passed`);
    for (const r of results[track]) console.log(`  ${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.contract || r.observed}  ${r.message || ''}`);
  }
  process.exitCode = results.codeBased.concat(results.lowCode).every(r => r.pass) ? 0 : 1;
})();
