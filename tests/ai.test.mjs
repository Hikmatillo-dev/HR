// AI qatlamining xato holatlarini soxta (mock) Anthropic API bilan tekshirish. Internet va haqiqiy kalit kerak emas.
// node tests/ai.test.mjs
import http from 'node:http';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const VALID = {
  summary: 'Test xulosa', risk_level: 'high',
  risk_reasons: [{ reason: "Oldindan to'lov", quote: "to'lov 500$" }],
  discrimination_flags: [], human_trafficking_flags: [],
  missing_information: ['Kompaniya nomi'], improved_non_discriminatory_version: '',
  recommended_questions_for_applicant: ['Kompaniya STIR raqami qanday?']
};

const attempts = {};
let lastBody = null, lastHeaders = null;
const message = (text, stop = 'end_turn') => JSON.stringify({
  id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5',
  content: text === null ? [] : [{ type: 'text', text }], stop_reason: stop, stop_sequence: null,
  usage: { input_tokens: 1, output_tokens: 1 }
});

const mock = http.createServer(async (req, res) => {
  let raw = ''; for await (const c of req) raw += c;
  const body = JSON.parse(raw); lastBody = body; lastHeaders = req.headers;
  const scenario = (JSON.stringify(body.messages).match(/SCENARIO:(\w+)/) || [])[1] || 'ok';
  attempts[scenario] = (attempts[scenario] || 0) + 1;
  const json = (status, payload, extra = {}) => { res.writeHead(status, { 'content-type': 'application/json', 'retry-after-ms': '10', ...extra }); res.end(payload); };
  switch (scenario) {
    case 'bad_json': return json(200, message('bu JSON emas {'));
    case 'wrong_schema': return json(200, message(JSON.stringify({ summary: 'faqat bitta maydon' })));
    case 'refusal': return json(200, message(null, 'refusal'));
    case 'rate': return json(429, JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'slow down' } }));
    case 'auth': return json(401, JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'bad key' } }));
    case 'flaky':
      if (attempts.flaky === 1) return json(500, JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'boom' } }));
      return json(200, message(JSON.stringify(VALID)));
    case 'slow': return setTimeout(() => json(200, message(JSON.stringify(VALID))), 1500);
    default: return json(200, message(JSON.stringify(VALID)));
  }
});
await new Promise(r => mock.listen(0, r));
const base = `http://127.0.0.1:${mock.address().port}`;

process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.ANTHROPIC_BASE_URL = base;
process.env.IQ_AI_TIMEOUT_MS = '500';
process.env.IQ_AI_RETRIES = '1';
const { aiAnalyze, MAX_CHARS } = await import('../lib/ai.mjs');

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}
const post = s => `Koreyaga ish! Hujjat uchun to'lov 500$. SCENARIO:${s}`;
const rejectsWith = (p, code) => assert.rejects(p, e => { assert.equal(e.code, code, `kutilgan ${code}, olingan ${e.code}: ${e.message}`); return true; });

console.log('AI testlari (mock API)');
await test("To'g'ri javob sxema bo'yicha o'qiladi va so'rov parametrlari to'g'ri", async () => {
  const r = await aiAnalyze(post('ok'));
  assert.equal(r.risk_level, 'high');
  assert.equal(r.recommended_questions_for_applicant.length, 1);
  assert.equal(lastBody.model, 'claude-opus-5-5');
  assert.equal(lastBody.fallbacks, 'default');
  assert.equal(lastBody.output_config.format.type, 'json_schema');
  assert.match(lastHeaders['anthropic-beta'], /server-side-fallback-2026-07-01/);
  assert.match(lastBody.messages[0].content, /<posting>/);
});
await test("Bo'sh matn — so'rov yuborilmaydi", () => rejectsWith(aiAnalyze('   '), 'empty'));
await test("Juda uzun matn — so'rov yuborilmaydi, jimgina kesilmaydi", () => rejectsWith(aiAnalyze('a'.repeat(MAX_CHARS + 1)), 'too_long'));
await test('Buzilgan JSON javob', () => rejectsWith(aiAnalyze(post('bad_json')), 'bad_json'));
await test("Sxemaga mos kelmaydigan JSON", () => rejectsWith(aiAnalyze(post('wrong_schema')), 'bad_json'));
await test('Model rad etishi (refusal)', () => rejectsWith(aiAnalyze(post('refusal')), 'refused'));
await test('401 — kalit noto\'g\'ri', () => rejectsWith(aiAnalyze(post('auth')), 'auth'));
await test("429 — qayta urinadi, keyin tushunarli xato", async () => {
  await rejectsWith(aiAnalyze(post('rate')), 'rate_limit');
  assert.equal(attempts.rate, 2, '1 ta qayta urinish kutilgan');
});
await test('500 dan keyin qayta urinish muvaffaqiyatli', async () => {
  const r = await aiAnalyze(post('flaky'));
  assert.equal(r.summary, 'Test xulosa');
  assert.equal(attempts.flaky, 2);
});
await test('Timeout', () => rejectsWith(aiAnalyze(post('slow')), 'timeout'));
await test("Kalit yo'q — AI o'chiq, soxta javob qaytmaydi", () => {
  const out = execFileSync(process.execPath, ['--input-type=module', '-e',
    "const m = await import('./lib/ai.mjs'); try { await m.aiAnalyze('Koreyaga ish, hujjat uchun to\\'lov 500$'); console.log('JAVOB'); } catch (e) { console.log(m.aiEnabled, e.code, e.message); }"],
  { env: { PATH: process.env.PATH }, cwd: new URL('..', import.meta.url).pathname }).toString();
  assert.match(out, /^false disabled AI tahlil faollashtirilmagan: ANTHROPIC_API_KEY sozlanmagan\./);
});

mock.close();
console.log(`\n${passed} ta AI testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
