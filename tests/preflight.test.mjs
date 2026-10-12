// Topshirish preflight tekshiruvi xatolarni ushlaydimi: node tests/preflight.test.mjs
// Har bir holat vaqtinchalik git repozitoriyda tekshiriladi. Kalitlar SOXTA va ish vaqtida yig'iladi:
// shu faylning o'zida haqiqiy kalit formatidagi qator yo'q (aks holda preflight uni ham topardi).
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FAKE = {
  anthropic: ['sk', 'ant', 'api03', 'FAKE'.repeat(24)].join('-'),
  google: 'AI' + 'za' + 'FAKE0'.repeat(7),
  telegram: '1234567' + '89:' + 'AA' + 'FAKE'.repeat(8) + 'X'
};
const COPY = ['README.md', 'docs/JARAYON.md', 'docs/TAQDIMOT.md', 'docs/SCREENSHOTS.md', 'docs/VIDEO_DEMO.md', '.gitignore', 'package.json', 'js/real-data.js'];

let passed = 0;
const dirs = [];
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message.split('\n').slice(0, 8).join('\n    ')}`); process.exitCode = 1; }
}
function repo(setup = () => {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'iq-preflight-'));
  dirs.push(dir);
  const g = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
  g('init', '-q', '-b', 'main');
  g('config', 'user.email', 'test@example.com'); g('config', 'user.name', 'Test');
  for (const f of COPY) { mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); cpSync(path.join(ROOT, f), path.join(dir, f)); }
  g('add', '-A'); g('commit', '-q', '-m', 'init');
  const w = (f, s) => { mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); writeFileSync(path.join(dir, f), s); };
  setup({ dir, g, w });
  return dir;
}
function preflight(dir, ...extra) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools/preflight-submission.mjs'), '--repo', dir, '--no-tests', ...extra], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}
const noSecretInOutput = out => Object.values(FAKE).forEach(v => {
  assert.ok(!out.includes(v), 'kalitning o\'zi chiqarildi');
  assert.ok(!out.includes(v.slice(4, 24)), 'kalitning bir qismi chiqarildi');
});

console.log('Topshirish preflight tekshiruvi');

await test("Toza repozitoriy: exit 0; screenshot va video yo'qligi faqat ogohlantirish; branch va HEAD chiqadi", () => {
  const { code, out } = preflight(repo());
  assert.equal(code, 0, out);
  assert.match(out, /Branch: main/);
  assert.match(out, /HEAD: {3}\w{7} init/);
  assert.match(out, /Status: toza/);
  assert.match(out, /⚠️ 5 ta screenshot hali olinmagan/);
  assert.match(out, /⚠️ video hali yozilmagan/);
  assert.match(out, /✅ xato yo'q/);
});

await test("--final: screenshot va video yo'q bo'lsa — exit 1", () => {
  const { code, out } = preflight(repo(), '--final');
  assert.equal(code, 1);
  assert.match(out, /✗ 5 ta screenshot hali olinmagan/);
});

await test(".env git'da kuzatilsa — exit 1 (.env.example esa ruxsat)", () => {
  const { code, out } = preflight(repo(({ g, w }) => { w('.env', 'IQ_AI_DAILY_LIMIT=5\n'); g('add', '-f', '.env'); g('commit', '-q', '-m', 'env'); }));
  assert.equal(code, 1);
  assert.match(out, /✗ \.env — \.env \(kalitlar\) git'da kuzatilmoqda/);
});

await test("data/, qoralama, node_modules va result.json git'da — har biri xato", () => {
  const { code, out } = preflight(repo(({ g, w }) => {
    w('data/bot-salt', 'x'); w('qoralama3.js', '//'); w('node_modules/x/index.js', '//'); w('k1/result.json', '{}');
    g('add', '-f', 'data/bot-salt', 'qoralama3.js', 'node_modules/x/index.js', 'k1/result.json'); g('commit', '-q', '-m', 'bad');
  }));
  assert.equal(code, 1);
  for (const re of [/✗ data\/bot-salt/, /✗ qoralama3\.js/, /✗ node_modules\/x\/index\.js/, /✗ k1\/result\.json/]) assert.match(out, re);
});

await test("Soxta Anthropic kaliti kuzatilayotgan faylda — exit 1, joyi aytiladi, kalitning o'zi chiqmaydi", () => {
  const { code, out } = preflight(repo(({ g, w }) => { w('lib/x.mjs', `const k = '${FAKE.anthropic}';\n`); g('add', '-A'); g('commit', '-q', '-m', 'k'); }));
  assert.equal(code, 1);
  assert.match(out, /✗ kuzatilayotgan fayl: lib\/x\.mjs:1 — Anthropic API kaliti \(sk-a… \(\d+ belgi\)\)/);
  assert.match(out, /git tarixi: commit \w{7}, lib\/x\.mjs — Anthropic API kaliti/);
  noSecretInOutput(out);
});

await test("Soxta Gemini kaliti faqat git tarixida (keyin o'chirilgan) — exit 1", () => {
  const { code, out } = preflight(repo(({ g, w }) => {
    w('notes.md', `kalit: ${FAKE.google}\n`); g('add', '-A'); g('commit', '-q', '-m', 'oops');
    w('notes.md', 'kalit olib tashlandi\n'); g('add', '-A'); g('commit', '-q', '-m', 'fix');
  }));
  assert.equal(code, 1);
  assert.match(out, /git tarixi: commit \w{7}, notes\.md — Google \(Gemini\) API kaliti/);
  assert.doesNotMatch(out, /kuzatilayotgan fayl: notes\.md/);
  noSecretInOutput(out);
});

await test("Soxta Telegram bot tokeni commit qilinmagan yangi faylda — exit 1 (git add . bilan tushib ketardi)", () => {
  const { code, out } = preflight(repo(({ w }) => { w('bot-config.txt', `TOKEN ${FAKE.telegram}\n`); }));
  assert.equal(code, 1);
  assert.match(out, /yangi \(commit qilinmagan\) fayl: bot-config\.txt:1 — Telegram bot tokeni/);
  noSecretInOutput(out);
});

await test("Testlardagi qisqa soxta qiymatlar ('sk-ant-test-…', 'AIzaSy-test-…', '123:test') xato bermaydi", () => {
  const sample = readFileSync(path.join(ROOT, 'tests/server-security.test.mjs'), 'utf8') + readFileSync(path.join(ROOT, 'tests/ai-gemini.test.mjs'), 'utf8');
  const { code, out } = preflight(repo(({ g, w }) => { w('tests/sample.test.mjs', sample + "\nconst t = '123:test-not-real';\n"); g('add', '-A'); g('commit', '-q', '-m', 't'); }));
  assert.equal(code, 0, out);
});

await test(".gitignore da .env, data/, qoralama, __pycache__ bo'lmasa — exit 1", () => {
  const { code, out } = preflight(repo(({ g, w }) => { w('.gitignore', 'node_modules/\n'); g('add', '-A'); g('commit', '-q', '-m', 'gi'); }));
  assert.equal(code, 1);
  for (const re of [/"\.env" e'tiborsiz/, /"data\/bot-stats\.json"/, /"qoralama1\.js"/, /"__pycache__\/x\.pyc"/]) assert.match(out, re);
});

await test("js/real-data.js ga real e'lon yozilsa yoki hujjat o'chirilsa — exit 1", () => {
  const { code, out } = preflight(repo(({ g, w }) => {
    w('js/real-data.js', "window.REAL_VACANCIES = [{ text: 'Sotuvchi kerak', channel: '@k' }];\n");
    g('rm', '-q', 'docs/VIDEO_DEMO.md'); g('add', '-A'); g('commit', '-q', '-m', 'r');
  }));
  assert.equal(code, 1);
  assert.match(out, /js\/real-data\.js da 1 ta real e'lon bor/);
  assert.match(out, /✗ docs\/VIDEO_DEMO\.md yo'q/);
});

dirs.forEach(d => rmSync(d, { recursive: true, force: true }));
console.log(`\n${passed} ta preflight testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
