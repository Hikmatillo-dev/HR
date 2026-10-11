// Shaxsiy ma'lumotni yashirish va v3 qoralama testlari: node tests/redact.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { redact, draftFromExport } from '../tools/redact.mjs';
import '../js/evaluate.js';

const A = globalThis.IshQalqon, E = globalThis.IQEval;
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}
const noPii = text => E.PII.forEach(([name, re]) => assert.equal(E.findPii(text, re), null, `${name} qolgan: ${text}`));

console.log('Redaction testlari');

test('Telefon raqamining turli yozilishi yashiriladi', () => {
  for (const t of ['+998 90 123 45 67', '+998901234567', '998-90-123-45-67', '(90) 123-45-67', '90 123 45 67', '901234567']) {
    const r = redact(`Tel: ${t}. Ishga marhamat`);
    assert.equal(r.counts.phone, 1, t);
    assert.match(r.text, /\+998 XX XXX XX XX/);
    noPii(r.text);
  }
});

test('Karta raqami, email va @username yashiriladi', () => {
  const r = redact("To'lovni 8600 1234 5678 9012 kartaga qiling, hr@firma.uz ga yozing yoki @recruiter_ali ga");
  assert.deepEqual(r.counts, { phone: 0, card: 1, email: 1, username: 1 });
  assert.doesNotMatch(r.text, /8600|firma|recruiter_ali/);
  noPii(r.text);
});

test("STIR, maosh, sana va narxlar o'zgarmaydi", () => {
  const t = "«Audit Pro» MChJ, STIR: 305123456. Maosh 10 000 000 so'm, 2026-10-11 dan. Hujjat uchun to'lov 500$";
  assert.equal(redact(t).text, t);
});

test("Firibgarlik belgilari yashirishdan keyin ham topiladi", () => {
  const before = A.analyze("Koreyaga ish! Hujjat uchun to'lov 500$. Tel +998 90 123 45 67, karta 8600 1234 5678 9012");
  const after = A.analyze(redact("Koreyaga ish! Hujjat uchun to'lov 500$. Tel +998 90 123 45 67, karta 8600 1234 5678 9012").text);
  assert.deepEqual(after.scam.map(s => s.id).sort(), before.scam.map(s => s.id).sort());
});

test("Telegram eksportidan qoralama: PII yo'q, id'lar ketma-ket, TODO maydonlar tekshiruvdan o'tmaydi", () => {
  const content = readFileSync(new URL('../namuna/telegram-export-namuna.json', import.meta.url), 'utf8');
  const { code, count } = draftFromExport([{ name: 'result.json', content }], { channel: '@namuna', limit: 5, startId: 1 });
  assert.equal(count, 5);
  const entries = Function(`return [${code}]`)();
  assert.deepEqual(entries.map(e => e.id), ['v3-001', 'v3-002', 'v3-003', 'v3-004', 'v3-005']);
  entries.forEach(e => noPii(e.text));
  const errors = E.validateCases(entries, A, { real: true, idPattern: /^v3-\d{3}$/ });
  assert.ok(errors.some(x => /expected_risk_level/.test(x)), "TODO qolgan qoralama tekshiruvdan o'tmasligi kerak");
  assert.ok(!errors.some(x => /yashirilmagan/.test(x)), 'qoralamada PII xatosi bo\'lmasligi kerak');
  assert.ok(!/score|xavf bali/i.test(code), "qoralamada tizim bahosi bo'lmasligi kerak");
});

console.log(`\n${passed} ta redaction testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
