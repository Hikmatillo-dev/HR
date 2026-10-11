// config/currency.js va config/official-sources.js testlari: node tests/config.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Test jarayonining o'z .env o'zgaruvchilari natijaga ta'sir qilmasin
for (const k of Object.keys(process.env)) if (k.startsWith('IQ_RATE')) delete process.env[k];
await import('../config/currency.js');
await import('../config/official-sources.js');
await import('../js/analyzer.js');
const C = globalThis.IQCurrency, A = globalThis.IshQalqon;

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('Config testlari');

await test("Standart kurslar js/analyzer.js dagi qiymatlar bilan bir xil (ulanmaguncha ajralib ketmasin)", () => {
  const src = readFileSync(path.join(ROOT, 'js/analyzer.js'), 'utf8');
  const val = name => Number((src.match(new RegExp(`const ${name} = (\\d+)`)) || [])[1]);
  assert.equal(C.DEFAULTS.USD, val('USD_RATE'));
  assert.equal(C.DEFAULTS.EUR, val('EUR_RATE'));
  assert.equal(C.DEFAULTS.RUB, val('RUB_RATE'));
  assert.equal(A.USD_RATE, C.DEFAULTS.USD);
});

await test('.env bo\'lmasa standart qiymatlar va "taxminiy" belgisi', () => {
  assert.deepEqual({ USD: C.rates.USD, EUR: C.rates.EUR, RUB: C.rates.RUB }, { USD: 12600, EUR: 13700, RUB: 150 });
  assert.equal(C.status().approximate, true);
});

await test(".env orqali almashtirish; noto'g'ri qiymatlar e'tiborsiz qoldiriladi", () => {
  const r = C.fromEnv({ IQ_RATE_USD: '12750', IQ_RATE_EUR: 'abc', IQ_RATE_RUB: '-5', IQ_RATES_UPDATED: '2026-10-10', IQ_RATES_SOURCE: 'CBU' });
  assert.equal(r.USD, 12750); assert.equal(r.EUR, 13700); assert.equal(r.RUB, 150);
  assert.equal(r.source, 'CBU'); assert.equal(r.approximate, false);
  assert.equal(C.fromEnv({ IQ_RATE_USD: '12750' }).approximate, true, "sanasiz berilgan kurs taxminiy");
  assert.equal(C.fromEnv({ IQ_RATES_UPDATED: '10.10.2026' }).updated, C.DEFAULTS.updated, "noto'g'ri sana formati");
});

await test(`${C.MAX_AGE_DAYS} kundan eski kurs "taxminiy" deb belgilanadi`, () => {
  const r = C.fromEnv({ IQ_RATE_USD: '12750', IQ_RATES_UPDATED: '2026-01-01' });
  assert.equal(C.status(r, new Date('2026-01-20T00:00:00Z')).approximate, false);
  const st = C.status(r, new Date('2026-03-01T00:00:00Z'));
  assert.equal(st.approximate, true); assert.equal(st.stale, true);
});

await test("Rasmiy manbalar: nom, https havola, maqsad, tekshirilgan holati va dalil bor", () => {
  const list = globalThis.IQ_OFFICIAL_SOURCES;
  assert.ok(list.length >= 2);
  for (const s of list) {
    assert.ok(s.name && s.purpose && s.checked_at && s.evidence, s.id);
    assert.match(s.url, /^https:\/\//);
    assert.equal(typeof s.verified, 'boolean');
  }
});

await test("server.mjs .env dagi kurslarni brauzerga config/currency.js orqali uzatadi", async () => {
  const port = 3900 + Math.floor(Math.random() * 90);
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: ROOT, env: { PATH: process.env.PATH, PORT: String(port), IQ_RATE_USD: '13000', IQ_RATES_UPDATED: new Date().toISOString().slice(0, 10), IQ_RATES_SOURCE: 'sinov' }
  });
  let log = ''; child.stdout.on('data', d => { log += d; }); child.stderr.on('data', d => { log += d; });
  try {
    let body = null;
    for (let i = 0; i < 40 && body === null; i++) {
      await new Promise(r => setTimeout(r, 100));
      body = await fetch(`http://127.0.0.1:${port}/config/currency.js`).then(r => r.text()).catch(() => null);
    }
    assert.ok(body, `server javob bermadi: ${log}`);
    const sandbox = { window: {} };
    vm.runInNewContext(body, sandbox);
    assert.equal(sandbox.window.IQCurrency.rates.USD, 13000);
    assert.equal(sandbox.window.IQCurrency.rates.EUR, 13700);
    assert.equal(sandbox.window.IQCurrency.status().approximate, false);
    assert.match(log, /analyzer\.js hali config'ga ulanmagan/, "ulanmaganligi haqida ogohlantirish");
  } finally { child.kill(); }
});

console.log(`\n${passed} ta config testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
