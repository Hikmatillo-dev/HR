// Lokal oflayn demo (npm run demo:local): kalitsiz ishlaydi, AI aniq o'chiq. node tests/demo-local.test.mjs
// Muhitda (soxta) AI kalitlari bo'lsa ham demo ularni serverga bermasligi tekshiriladi.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FAKE = { ANTHROPIC_API_KEY: 'sk-ant-test-DEMO-NOT-REAL', GEMINI_API_KEY: 'AIza-test-DEMO-NOT-REAL', TELEGRAM_BOT_TOKEN: '123:test-not-real', IQ_AI_PROVIDER: 'gemini' };

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}
const freePort = () => new Promise((res, rej) => {
  const s = net.createServer().once('error', rej);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
});

console.log('Lokal oflayn demo (npm run demo:local)');

const port = await freePort();
const child = spawn(process.execPath, ['tools/demo-local.mjs'], { cwd: ROOT, env: { PATH: process.env.PATH, PORT: String(port), ...FAKE } });
let log = '';
child.stdout.on('data', d => { log += d; }); child.stderr.on('data', d => { log += d; });
const started = await new Promise(res => {
  const t = setTimeout(() => res(false), 8000);
  const poll = setInterval(() => { if (/IshQalqon: http:\/\//.test(log)) { clearTimeout(t); clearInterval(poll); res(true); } }, 50);
});
const base = `http://127.0.0.1:${port}`;

await test('Server 127.0.0.1 da ishga tushadi, banner sintetik eksport va AI o\'chiqligini aytadi', () => {
  assert.ok(started, `server ishga tushmadi:\n${log}`);
  assert.match(log, new RegExp(`IshQalqon: http://127\\.0\\.0\\.1:${port}`));
  assert.match(log, /SINTETIK fayl, real kanal emas/);
  assert.match(log, /AI: AI tahlil faollashtirilmagan/);
});

await test("Muhitdagi AI kalitlari serverga berilmaydi: /api/health — ai: false va tushunarli sabab", async () => {
  const h = await (await fetch(`${base}/api/health`)).json();
  assert.equal(h.ai, false);
  assert.equal(h.reason, 'AI tahlil faollashtirilmagan: ANTHROPIC_API_KEY yoki GEMINI_API_KEY sozlanmagan.');
});

await test("/api/ai 503 (disabled) qaytaradi — tashqi AI'ga hech qanday so'rov ketmaydi", async () => {
  const r = await fetch(`${base}/api/ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: "Koreyaga ish! Hujjat uchun oldindan 500$ to'lov." }) });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).code, 'disabled');
});

await test("Sayt va sintetik namuna ochiladi; .env va server fayllari berilmaydi", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.match(html, /Zamonaviy kasblar/);
  assert.equal((await fetch(`${base}/namuna/telegram-export-namuna.json`)).status, 200);
  for (const p of ['/.env', '/server.mjs', '/package.json', '/data/ai-usage-server.json']) assert.equal((await fetch(base + p)).status, 404, p);
});

await test("Loglarda soxta kalitlar ham chiqmaydi; Ctrl+C (SIGINT) bilan to'xtaydi", async () => {
  for (const v of Object.values(FAKE)) assert.ok(!log.includes(v), 'kalit logda');
  child.kill('SIGINT');
  const code = await new Promise(res => child.on('exit', c => res(c)));
  assert.equal(code, 0);
});

if (child.exitCode === null) child.kill();
console.log(`\n${passed} ta lokal demo testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
