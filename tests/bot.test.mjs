// Telegram bot testlari: node tests/bot.test.mjs
// 1) lib/bot-core.mjs — tarmoqsiz; 2) bot.mjs — soxta Telegram server bilan to'liq oqim.
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBot, splitMessage, splitPosts, escapeHtml, reportLines, DISCLAIMER, TG_LIMIT } from '../lib/bot-core.mjs';
import { createStore, hashUserId } from '../lib/bot-store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(path.join(tmpdir(), 'iq-bot-'));
let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.stack.split('\n').slice(0, 3).join('\n    ')}`); process.exitCode = 1; }
}

// Telegram HTML rejimida ruxsat etilgan teglar; boshqa har qanday "<" escape qilingan bo'lishi kerak
const ALLOWED_TAGS = /<\/?(b|i|code)>/g;
function assertSafeHtml(html) {
  assert.ok(html.length <= TG_LIMIT, `xabar ${html.length} belgi`);
  assert.ok(!/</.test(html.replace(ALLOWED_TAGS, '')), `escape qilinmagan "<": ${html.slice(0, 120)}`);
  for (const tag of ['b', 'i', 'code']) {
    assert.equal((html.match(new RegExp(`<${tag}>`, 'g')) || []).length, (html.match(new RegExp(`</${tag}>`, 'g')) || []).length, `<${tag}> yopilmagan`);
  }
}

function makeBot(dir) {
  const sent = [];
  const store = createStore(dir);
  const handle = createBot({ send: async (chatId, html) => { assertSafeHtml(html); sent.push({ chatId, html }); }, store });
  const say = async (text, userId = 777) => { sent.length = 0; await handle({ chat: { id: 1 }, from: { id: userId }, text }); return sent.map(s => s.html); };
  return { say, store };
}

console.log('Telegram bot testlari');
const SCAM = "KOREYAGA ISH! Viza 100% kafolat. Hujjat uchun to'lov 500$. Shoshiling!";
const OK = "Kassir kerak, Toshkent, «Baraka Market» MChJ. Maosh 4 mln so'm. Ish vaqti 9:00–18:00. +998 90 111 22 33";

try {
  const { say, store } = makeBot(path.join(tmp, 'a'));

  await test('/start va /help: buyruqlar ro\'yxati va disclaimer', async () => {
    for (const cmd of ['/start', '/help', '/help@IshQalqonBot']) {
      const out = (await say(cmd)).join('\n');
      assert.match(out, /\/check/); assert.match(out, /\/stats/);
      assert.ok(out.includes(DISCLAIMER), cmd);
    }
  });

  await test("/check <matn>: xavf darajasi, asosiy sabablar (iqtibos bilan), tavsiya, disclaimer", async () => {
    const out = (await say(`/check ${SCAM}`)).join('\n');
    assert.match(out, /Yuqori xavf/);
    assert.match(out, /Asosiy sabablar/);
    assert.match(out, /Oldindan pul so'ralmoqda — «hujjat uchun to'lov»/i);
    assert.match(out, /Odam savdosi belgisi/);
    assert.match(out, /Tavsiya:/);
    assert.ok(out.trim().endsWith(`<i>${DISCLAIMER}</i>`));
  });

  await test('/check, keyin matn alohida xabarda', async () => {
    assert.match((await say('/check')).join(''), /E'lon matnini yuboring/);
    assert.match((await say(OK)).join(''), /Past xavf/);
  });

  await test("Oddiy yuborilgan / forward qilingan e'lon ham tekshiriladi", async () => {
    assert.match((await say(SCAM)).join(''), /Yuqori xavf/);
  });

  await test('HTML escape: e\'londagi <script>, <b>, & teglari xavfsiz', async () => {
    const out = await say(`/check Ish bor <script>alert(1)</script> <b>katta</b> maosh & bonus, hujjat uchun to'lov 100$ <a href="x">havola</a>`);
    out.forEach(assertSafeHtml);
    assert.doesNotMatch(out.join(''), /<script|<a /);
  });

  await test('HTML escape: sabab va iqtibos ichidagi < > & escape qilinadi', () => {
    const a = globalThis.IshQalqon.analyze(SCAM);
    const fake = { ...a, scam: [{ id: 'x', label: 'Sabab <i>teg</i> & belgi', match: '<script>x</script>', weight: 50, detail: '' }], discrimination: [{ id: 'age', label: 'Yosh', match: '18-25 <yosh>' }] };
    const html = reportLines(fake).join('\n');
    assertSafeHtml(html);
    assert.match(html, /Sabab &lt;i&gt;teg&lt;\/i&gt; &amp; belgi — «&lt;script&gt;x&lt;\/script&gt;»/);
    assert.match(html, /«18-25 &lt;yosh&gt;»/);
  });

  await test("4000+ belgilik matn bo'laklarga bo'linadi; javob bir nechta xabarga, har biri ≤ 4096", async () => {
    const block = "Sotuvchi kerak, Andijon, markaziy bozor. Maosh 4 mln so'm. Ish vaqti 9:00–18:00, dam olish yakshanba.\n".repeat(36);
    const posts = Array.from({ length: 20 }, (_, i) => (i === 7 ? SCAM + '\n' : '') + block);
    const long = posts.join('\n\n');
    assert.ok(long.length > 70000);
    const out = await say(long);
    assert.ok(out.length >= 2, `${out.length} ta xabar`);
    out.forEach(assertSafeHtml);
    assert.match(out[0], /(\d+) ta bo'lakka bo'lib tekshirildi\. Eng xavflisi: 8-bo'lak/);
    assert.ok(out.join('\n').includes('Yuqori xavf'));
    assert.ok(out[out.length - 1].includes(DISCLAIMER));
    assert.ok(!out.slice(0, -1).some(m => m.includes(DISCLAIMER)), 'disclaimer faqat oxirgi bo\'lakda');
  });

  await test("Qisqa matn va bo'sh xabar", async () => {
    assert.match((await say('salom')).join(''), /to'liq matnini/);
    const out = []; const { store: s2 } = { store };
    const h = createBot({ send: async (c, html) => out.push(html), store: s2 });
    await h({ chat: { id: 1 }, from: { id: 5 }, photo: [{}] });
    assert.match(out.join(''), /Faqat matnli/);
  });

  await test('/stats: soni, xavflilar va oxirgi 5 ta natija', async () => {
    const { say: say2 } = makeBot(path.join(tmp, 'b'));
    assert.match((await say2('/stats', 42)).join(''), /hali e'lon tekshirmadingiz/);
    for (let i = 0; i < 4; i++) await say2(SCAM, 42);
    for (let i = 0; i < 3; i++) await say2(OK, 42);
    const out = (await say2('/stats', 42)).join('\n');
    assert.match(out, /Tekshirilgan e'lonlar: <b>7<\/b>/);
    assert.match(out, /Xavfli deb topilgan.*<b>4<\/b>/);
    assert.equal((out.match(/^(🔴|🟡|🟢) \d{4}-/gm) || []).length, 5);
    assert.ok(out.includes(DISCLAIMER));
    assert.match((await say2('/stats', 43)).join(''), /hali e'lon/, "boshqa foydalanuvchi statistikasi alohida");
  });

  await test("Statistika faylida user_id va e'lon matni yo'q, faqat tuzli SHA-256 xesh", () => {
    const dir = path.join(tmp, 'b');
    const raw = readFileSync(path.join(dir, 'bot-stats.json'), 'utf8');
    const keys = Object.keys(JSON.parse(raw));
    assert.equal(keys.length, 1);
    assert.match(keys[0], /^[0-9a-f]{64}$/);
    assert.ok(!/"42"|:\s*42\b/.test(raw), "user_id ochiq saqlangan");
    assert.ok(!raw.includes('KOREYAGA') && !raw.includes('Kassir'), "e'lon matni saqlangan");
    const salt = readFileSync(path.join(dir, 'bot-salt'), 'utf8').trim();
    assert.equal(salt.length, 64);
    assert.equal(keys[0], hashUserId(42, salt));
  });

  await test("splitMessage: qatorlar butun, &amp; o'rtasidan kesilmaydi", () => {
    const html = '<b>Sarlavha</b>\n' + escapeHtml('a&b '.repeat(3000));
    const parts = splitMessage(html);
    parts.forEach(p => { assert.ok(p.length <= TG_LIMIT); assert.ok(!/&(a|am|amp)?$/.test(p), "entity kesilgan"); });
    assert.equal(parts.join('').replace(/\n/g, ''), html.replace(/\n/g, ''));
  });

  await test("splitPosts: qisqa matn bo'linmaydi, uzun matn bo'sh qatorlar bo'yicha bo'linadi", () => {
    assert.equal(splitPosts('qisqa matn').length, 1);
    const parts = splitPosts(('x'.repeat(1500) + '\n\n').repeat(6));
    assert.ok(parts.length >= 3 && parts.every(p => p.length <= 4000));
  });

  // ---------- AI limitlari va guruhlar ----------
  function makeAiBot(opts = {}) {
    const sent = [], aiCalls = [];
    const store = createStore(path.join(tmp, 'ai-' + Math.random().toString(36).slice(2)));
    const handle = createBot({
      send: async (chatId, html) => { assertSafeHtml(html); sent.push({ chatId, html }); },
      store,
      ai: { enabled: true, analyze: async text => { aiCalls.push(text); return { summary: 'AI xulosa', recommended_questions_for_applicant: [], improved_non_discriminatory_version: '' }; } },
      aiLimiter: opts.aiLimiter,
      aiDaily: opts.aiDaily,
      botUsername: 'IshQalqonBot'
    });
    const say = async (text, { userId = 7, chat = { id: 1, type: 'private' }, reply } = {}) => {
      sent.length = 0;
      await handle({ chat, from: { id: userId }, text, reply_to_message: reply ? { text: reply } : undefined });
      return sent.map(x => x.html).join('\n');
    };
    return { say, aiCalls };
  }

  await test('/check AI ni chaqiradi; oddiy matn AI chaqirmaydi (faqat qoidalar + maslahat)', async () => {
    const { say, aiCalls } = makeAiBot();
    const out1 = await say(`/check ${SCAM}`);
    assert.equal(aiCalls.length, 1); assert.match(out1, /AI xulosasi/);
    const out2 = await say(SCAM);
    assert.equal(aiCalls.length, 1, 'oddiy matnda AI chaqirilmasligi kerak');
    assert.match(out2, /Yuqori xavf/); assert.match(out2, /AI chuqur tahlil uchun/);
    await say('/check'); await say(OK);
    assert.equal(aiCalls.length, 2, "/check dan keyingi xabar — /check hisoblanadi");
  });

  await test("Foydalanuvchi AI limiti (soatiga 5): 6-chi /check da AI chaqirilmaydi, limit xabari chiqadi, qoidalar ishlaydi", async () => {
    const { say, aiCalls } = makeAiBot();
    for (let i = 0; i < 5; i++) await say(`/check ${SCAM}`);
    assert.equal(aiCalls.length, 5);
    const out = await say(`/check ${SCAM}`);
    assert.equal(aiCalls.length, 5, 'limitdan keyin AI chaqirilmasligi kerak');
    assert.match(out, /AI tahlil limiti: soatiga 5 ta\. Keyingisi taxminan \d+ daqiqadan keyin/);
    assert.match(out, /Yuqori xavf/, 'qoidalar tahlili limitsiz');
    assert.ok(out.includes(DISCLAIMER));
    await say(`/check ${SCAM}`, { userId: 8 });
    assert.equal(aiCalls.length, 6, 'boshqa foydalanuvchining limiti alohida');
  });

  await test("Kunlik umumiy AI limiti tugasa AI chaqirilmaydi", async () => {
    let left = 1;
    const aiDaily = { limit: 1, remaining: () => left, take: () => (left > 0 ? (left--, true) : false) };
    const { say, aiCalls } = makeAiBot({ aiDaily });
    await say(`/check ${SCAM}`);
    const out = await say(`/check ${SCAM}`, { userId: 9 });
    assert.equal(aiCalls.length, 1);
    assert.match(out, /Bugungi AI tahlil limiti \(1 ta\) tugadi/);
  });

  await test("Guruh: oddiy xabarga javob yo'q va AI chaqirilmaydi; noma'lum buyruq va boshqa botga yozilgan buyruq e'tiborsiz", async () => {
    const { say, aiCalls } = makeAiBot();
    const group = { id: -100, type: 'supergroup' };
    assert.equal(await say(SCAM, { chat: group }), '', 'oddiy xabarga javob berilmasligi kerak');
    assert.equal(await say('/foo', { chat: group }), '');
    assert.equal(await say(`/check@BoshqaBot ${SCAM}`, { chat: group }), '');
    assert.equal(aiCalls.length, 0);
  });

  await test("Guruh: /start, /help, /stats, /check matn va reply qilib /check ishlaydi", async () => {
    const { say, aiCalls } = makeAiBot();
    const group = { id: -100, type: 'group' };
    assert.match(await say('/help@IshQalqonBot', { chat: group }), /\/check/);
    assert.match(await say('/start', { chat: group }), /\/stats/);
    assert.match(await say(`/check ${SCAM}`, { chat: group }), /Yuqori xavf[\s\S]*AI xulosasi/);
    assert.match(await say('/check', { chat: group, reply: OK }), /Past xavf/);
    assert.equal(aiCalls.length, 2);
    assert.match(await say('/stats', { chat: group }), /Tekshirilgan e'lonlar: <b>2<\/b>/);
    assert.match(await say('/check', { chat: group }), /Guruhda: <code>\/check/, "guruhda /check matnsiz — yo'riqnoma, keyingi xabar kutilmaydi");
    assert.equal(await say(OK, { chat: group }), '', 'guruhda /check dan keyingi oddiy xabar tekshirilmaydi');
  });

  await test("AI xatosi: foydalanuvchiga qisqa xabar, logda stack trace va e'lon matni yo'q", async () => {
    const sent = [], logs = [];
    const orig = console.error; console.error = (...a) => logs.push(a.join(' '));
    try {
      const h = createBot({ send: async (c, html) => sent.push(html), store: createStore(path.join(tmp, 'aierr')),
        ai: { enabled: true, analyze: async () => { const e = new Error(`model javobi: ${SCAM} +998 90 123 45 67`); e.code = 'bad_json'; throw e; } } });
      await h({ chat: { id: 1, type: 'private' }, from: { id: 1 }, text: `/check ${SCAM}` });
    } finally { console.error = orig; }
    assert.match(sent.join(''), /AI tahlil hozir bajarilmadi/);
    assert.equal(logs.length, 1);
    assert.match(logs[0], /^\[bot-ai\] bad_json:/);
    assert.ok(!/90 123 45 67/.test(logs[0]), 'telefon logda');
    assert.ok(logs[0].length < 220, "log qisqa bo'lishi kerak");
    assert.ok(!/\n\s+at /.test(logs[0]), 'stack trace');
  });

  // ---------- bot.mjs: ishga tushirish ----------
  await test("Tokensiz: tushunarli xabar, exit 1, stack trace yo'q", () => {
    const r = spawnSync(process.execPath, ['bot.mjs'], { cwd: ROOT, env: { PATH: process.env.PATH, IQ_SKIP_DOTENV: '1' }, encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /TELEGRAM_BOT_TOKEN o'rnatilmagan/);
    assert.doesNotMatch(r.stderr, /at .*\.mjs:\d+/);
  });

  await test("Bekor qilingan token (401): tushunarli xabar, exit 1, stack trace va token yo'q", async () => {
    const server = http.createServer((req, res) => { res.writeHead(401, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: false, error_code: 401, description: 'Unauthorized' })); });
    await new Promise(r => server.listen(0, r));
    const token = '123456:' + 'B'.repeat(35);
    // spawnSync shu jarayondagi soxta serverni bloklab qo'yadi — shuning uchun asinxron spawn
    const child = spawn(process.execPath, ['bot.mjs'], { cwd: ROOT, env: { PATH: process.env.PATH, IQ_SKIP_DOTENV: '1', TELEGRAM_BOT_TOKEN: token, IQ_TELEGRAM_API: `http://127.0.0.1:${server.address().port}`, IQ_BOT_DATA_DIR: path.join(tmp, 'd401') } });
    let stderr = ''; child.stderr.on('data', d => { stderr += d; });
    const status = await new Promise(res => child.on('exit', res));
    server.close();
    const r = { status, stderr };
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Token noto'g'ri yoki bekor qilingan/);
    assert.ok(!r.stderr.includes(token), 'token logda');
    assert.doesNotMatch(r.stderr, /at .*\.mjs:\d+/);
  });

  await test("Soxta Telegram server bilan to'liq oqim: getMe → getUpdates → /check → sendMessage", async () => {
    const sent = [];
    let served = false;
    const server = http.createServer(async (req, res) => {
      let body = ''; for await (const c of req) body += c;
      const method = req.url.split('/').pop();
      const json = r => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, result: r })); };
      if (method === 'getMe') return json({ id: 1, is_bot: true, username: 'sinov_bot' });
      if (method === 'setMyCommands') return json(true);
      if (method === 'sendMessage') { sent.push(JSON.parse(body)); return json({ message_id: sent.length }); }
      if (method === 'getUpdates') {
        if (served) return setTimeout(() => json([]), 200);
        served = true;
        return json([{ update_id: 10, message: { message_id: 1, chat: { id: 99 }, from: { id: 5 }, text: `/check ${SCAM}` } }]);
      }
      json(true);
    });
    await new Promise(r => server.listen(0, r));
    const child = spawn(process.execPath, ['bot.mjs'], {
      cwd: ROOT,
      env: { PATH: process.env.PATH, IQ_SKIP_DOTENV: '1', TELEGRAM_BOT_TOKEN: '123456:' + 'A'.repeat(35), IQ_TELEGRAM_API: `http://127.0.0.1:${server.address().port}`, IQ_BOT_DATA_DIR: path.join(tmp, 'c') }
    });
    let log = ''; child.stdout.on('data', d => { log += d; }); child.stderr.on('data', d => { log += d; });
    const deadline = Date.now() + 8000;
    while (!sent.length && Date.now() < deadline) await new Promise(r => setTimeout(r, 100));
    child.kill('SIGTERM'); server.close();
    assert.ok(sent.length, `javob kelmadi. Log:\n${log}`);
    assert.equal(sent[0].chat_id, 99);
    assert.equal(sent[0].parse_mode, 'HTML');
    assert.match(sent[0].text, /Yuqori xavf/);
    assert.ok(sent[sent.length - 1].text.includes(DISCLAIMER));
    assert.match(log, /@sinov_bot ishga tushdi/);
    assert.ok(existsSync(path.join(tmp, 'c', 'bot-stats.json')));
  });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n${passed} ta bot testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
