// /api/ai xavfsizligi: Content-Type, Origin, HOST, kunlik va IP limitlari, xavfsiz log.
// Soxta Anthropic server bilan haqiqiy server.mjs ishga tushiriladi: node tests/server-security.test.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SECRET_KEY = 'sk-ant-test-SECRETKEY1234567890';
const VALID = {
  summary: 'Xulosa', risk_level: 'high', risk_reasons: [], discrimination_flags: [], human_trafficking_flags: [],
  missing_information: [], improved_non_discriminatory_version: '', recommended_questions_for_applicant: []
};
let anthropicCalls = 0;
const mock = http.createServer(async (req, res) => {
  let raw = ''; for await (const c of req) raw += c;
  anthropicCalls++;
  const body = JSON.parse(raw);
  const userText = body.messages[0].content;
  // "BADJSON" bo'lsa model javobi sifatida e'lon matnining o'zini qaytaramiz — logga tushib qolmasligini tekshirish uchun
  const text = /BADJSON/.test(userText) ? userText : JSON.stringify(VALID);
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: body.model, content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } }));
});
await new Promise(r => mock.listen(0, '127.0.0.1', r));

const servers = [];
// Tasodifiy port band bo'lishi mumkin (boshqa test serveri yoki kompyuterdagi dastur) — OS bo'sh portni beradi
const freePort = () => new Promise((res, rej) => {
  const s = net.createServer().once('error', rej);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
});
async function startServer(extraEnv = {}) {
  const port = await freePort();
  const dataDir = mkdtempSync(path.join(tmpdir(), 'iq-srv-'));
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: ROOT,
    env: { PATH: process.env.PATH, IQ_SKIP_DOTENV: '1', PORT: String(port), ANTHROPIC_API_KEY: SECRET_KEY, ANTHROPIC_BASE_URL: `http://127.0.0.1:${mock.address().port}`, IQ_AI_RETRIES: '0', IQ_DATA_DIR: dataDir, ...extraEnv }
  });
  const srv = { child, port, dataDir, log: '' };
  child.stdout.on('data', d => { srv.log += d; }); child.stderr.on('data', d => { srv.log += d; });
  servers.push(srv);
  for (let i = 0; i < 50; i++) {
    if (/IshQalqon: http/.test(srv.log)) return srv;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`server ishga tushmadi: ${srv.log}`);
}
const POST = "Koreyaga ish! Hujjat uchun to'lov 500$, tel +998 90 123 45 67";
function ai(srv, { headers = {}, body = JSON.stringify({ text: POST }) } = {}) {
  return fetch(`http://127.0.0.1:${srv.port}/api/ai`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body })
    .then(async r => ({ status: r.status, body: await r.json().catch(() => null), headers: r.headers }));
}

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message.split('\n').slice(0, 4).join('\n    ')}`); process.exitCode = 1; }
}

console.log("AI endpoint xavfsizligi");
try {
  const srv = await startServer();

  await test('application/json so\'rov normal ishlaydi (200)', async () => {
    const r = await ai(srv);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.risk_level, 'high');
  });

  await test("Cross-origin text/plain so'rov rad etiladi (403) va AI chaqirilmaydi", async () => {
    const before = anthropicCalls;
    const r = await ai(srv, { headers: { 'content-type': 'text/plain', origin: 'https://evil.example' } });
    assert.ok([403, 415].includes(r.status), String(r.status));
    assert.equal(anthropicCalls, before);
  });

  await test("Origin'siz text/plain, form va boshqa Content-Type → 415", async () => {
    for (const type of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=x', '']) {
      const r = await ai(srv, { headers: { 'content-type': type } });
      assert.equal(r.status, 415, type);
      assert.equal(r.body.code, 'unsupported_media_type');
    }
  });

  await test('application/json; charset=utf-8 qabul qilinadi', async () => {
    assert.equal((await ai(srv, { headers: { 'content-type': 'application/json; charset=utf-8' } })).status, 200);
  });

  await test("Origin Host'ga mos kelmasa 403; mos kelsa 200; 'null' Origin 403", async () => {
    assert.equal((await ai(srv, { headers: { origin: 'https://evil.example' } })).status, 403);
    assert.equal((await ai(srv, { headers: { origin: 'null' } })).status, 403);
    assert.equal((await ai(srv, { headers: { origin: `http://127.0.0.1:${srv.port + 1}` } })).status, 403, 'boshqa port — boshqa origin');
    assert.equal((await ai(srv, { headers: { origin: `http://127.0.0.1:${srv.port}` } })).status, 200);
  });

  await test("Server sukut bo'yicha faqat 127.0.0.1 da tinglaydi", async () => {
    assert.match(srv.log, new RegExp(`http://127\\.0\\.0\\.1:${srv.port}`));
    const external = Object.values(os.networkInterfaces()).flat().find(i => i && i.family === 'IPv4' && !i.internal);
    if (!external) return; // tashqi interfeys yo'q muhit
    const refused = await new Promise(res => {
      const s = net.connect({ host: external.address, port: srv.port }, () => { s.destroy(); res(false); });
      s.on('error', () => res(true));
    });
    assert.ok(refused, `${external.address}:${srv.port} ga ulanish mumkin bo'lmasligi kerak`);
  });

  await test("Xato loglarida API kalit, e'lon matni va telefon raqami yo'q", async () => {
    const r = await ai(srv, { body: JSON.stringify({ text: `${POST} BADJSON` }) });
    assert.equal(r.status, 502);
    await new Promise(res => setTimeout(res, 100));
    assert.ok(!srv.log.includes(SECRET_KEY), 'API kalit logda');
    assert.ok(!srv.log.includes('90 123 45 67'), 'telefon logda');
    assert.ok(!srv.log.includes('Koreyaga ish'), "e'lon matni logda");
    assert.match(srv.log, /\[ai\] javobni o'qishda xato/);
  });

  const limited = await startServer({ IQ_AI_DAILY_LIMIT: '3' });
  await test('Kunlik limit: 3 ta so\'rovdan keyin 429 va tushunarli xabar; AI chaqirilmaydi', async () => {
    for (let i = 0; i < 3; i++) assert.equal((await ai(limited)).status, 200, `${i + 1}-so'rov`);
    const before = anthropicCalls;
    const r = await ai(limited);
    assert.equal(r.status, 429);
    assert.equal(r.body.code, 'daily_limit');
    assert.match(r.body.error, /Bugungi AI tahlil limiti \(3 ta\) tugadi/);
    assert.equal(anthropicCalls, before);
    const health = await fetch(`http://127.0.0.1:${limited.port}/api/health`).then(x => x.json());
    assert.equal(health.ai, false);
    assert.match(health.reason, /limiti \(3 ta\) tugagan/);
  });

  await test("Bo'sh yoki noto'g'ri so'rov kunlik limitni sarflamaydi", async () => {
    const fresh = await startServer({ IQ_AI_DAILY_LIMIT: '1' });
    assert.equal((await ai(fresh, { body: JSON.stringify({ text: '  ' }) })).status, 400);
    assert.equal((await ai(fresh, { body: '{buzilgan' })).status, 400);
    assert.equal((await ai(fresh, { headers: { 'content-type': 'text/plain' } })).status, 415);
    assert.equal((await ai(fresh)).status, 200, 'limit hali sarflanmagan bo\'lishi kerak');
  });

  await test('Kunlik hisob qayta ishga tushirishda saqlanadi', async () => {
    await new Promise(r => { limited.child.once('exit', r); limited.child.kill(); });
    const again = await startServer({ IQ_AI_DAILY_LIMIT: '3', IQ_DATA_DIR: limited.dataDir });
    assert.equal((await ai(again)).status, 429);
  });

  await test("IP limiti: X-Forwarded-For sukut bo'yicha e'tiborsiz (soxtalashtirib chetlab o'tib bo'lmaydi)", async () => {
    const s = await startServer({ IQ_AI_PER_MINUTE: '2' });
    for (let i = 0; i < 2; i++) assert.equal((await ai(s, { headers: { 'x-forwarded-for': `10.0.0.${i}` } })).status, 200);
    const r = await ai(s, { headers: { 'x-forwarded-for': '10.0.0.99' } });
    assert.equal(r.status, 429);
    assert.equal(r.body.code, 'rate_limit');
    assert.equal(r.headers.get('retry-after'), '60');
  });

  await test("IQ_TRUST_PROXY=1: X-Forwarded-For dagi oxirgi manzil bo'yicha hisoblanadi", async () => {
    const s = await startServer({ IQ_AI_PER_MINUTE: '1', IQ_TRUST_PROXY: '1' });
    assert.equal((await ai(s, { headers: { 'x-forwarded-for': '1.1.1.1, 203.0.113.5' } })).status, 200);
    assert.equal((await ai(s, { headers: { 'x-forwarded-for': '9.9.9.9, 203.0.113.5' } })).status, 429, "chapdagi soxta qiymat yordam bermaydi");
    assert.equal((await ai(s, { headers: { 'x-forwarded-for': '203.0.113.6' } })).status, 200, 'boshqa mijoz');
  });

  await test("IQ_AI_DAILY_LIMIT=0 — AI o'chiq, /api/health buni aytadi", async () => {
    const s = await startServer({ IQ_AI_DAILY_LIMIT: '0' });
    assert.equal((await ai(s)).status, 429);
    assert.equal((await fetch(`http://127.0.0.1:${s.port}/api/health`).then(x => x.json())).ai, false);
  });
} finally {
  for (const s of servers) { s.child.kill(); rmSync(s.dataDir, { recursive: true, force: true }); }
  mock.close();
}
console.log(`\n${passed} ta xavfsizlik testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
