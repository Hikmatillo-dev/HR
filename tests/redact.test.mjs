// Shaxsiy ma'lumotni yashirish, PII validatori va v3 qoralama testlari: node tests/redact.test.mjs
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { redact, draftFromExport } from '../tools/redact.mjs';
import '../js/evaluate.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = globalThis.IshQalqon, E = globalThis.IQEval, P = globalThis.IQPII;
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}
const noPii = text => assert.deepEqual(P.findPii(text), [], `PII qolgan: ${text}`);
const v3case = text => ({ id: 'v3-001', text, source_channel: '@k', source_type: 'real', expected_risk_level: 'low', expected_flags: [], expected_reason: 'sinov', category: 'legit', reviewer_notes: '' });
const validate = text => E.validateCases([v3case(text)], A, { real: true, idPattern: /^v3-\d{3}$/ });

console.log('Redaction testlari');

test('UZ telefon raqamining turli yozilishi yashiriladi', () => {
  for (const t of ['+998 90 123 45 67', '+998901234567', '998-90-123-45-67', '(90) 123-45-67', '90 123 45 67', '901234567', '+998(90)1234567']) {
    const r = redact(`Tel: ${t}. Ishga marhamat`);
    assert.equal(r.counts.phoneUz, 1, t);
    assert.match(r.text, /\+998 00 000 00 00/);
    noPii(r.text);
  }
});

test('+7 rus telefon raqami to\'liq yashiriladi (raqam qoldig\'i qolmaydi)', () => {
  for (const t of ['+7 (999) 123-45-67', '+7 999 123 45 67', '89991234567', '8 (999) 123-45-67']) {
    const r = redact(`Tel: ${t}, Moskva`);
    assert.equal(r.text, 'Tel: +7 000 000 00 00, Moskva', t);
    assert.equal(r.counts.phoneRu, 1);
  }
});

test('Pasport raqami (AA1234567, AB 1234567) yashiriladi', () => {
  const r = redact('Pasport: AA1234567, ikkinchisi AB 1234567');
  assert.equal(r.text, 'Pasport: [pasport], ikkinchisi [pasport]');
  assert.equal(r.counts.passport, 2);
});

test('JSHSHIR (PINFL, 14 raqam) to\'liq yashiriladi', () => {
  const r = redact('JSHSHIR 31234567890123, PINFL: 41234567890123');
  assert.equal(r.text, 'JSHSHIR [JSHSHIR], PINFL: [JSHSHIR]');
  noPii(r.text);
});

test('t.me havola va @username yashiriladi', () => {
  const r = redact('Telegram: t.me/hr_dilnoza, https://t.me/Ish_Kanal yoki telegram.me/hr_ali, @recruiter_ali ga yozing');
  assert.equal(r.text, 'Telegram: t.me/foydalanuvchi, t.me/foydalanuvchi yoki t.me/foydalanuvchi, @foydalanuvchi ga yozing');
  assert.equal(r.counts.tme, 3); assert.equal(r.counts.username, 1);
});

test('Karta raqami va email yashiriladi', () => {
  const r = redact("To'lovni 8600 1234 5678 9012 kartaga qiling, hr@firma.uz ga yozing");
  assert.equal(r.text, "To'lovni XXXX XXXX XXXX XXXX kartaga qiling, [email] ga yozing");
});

test("STIR / INN (kompaniya raqami) yashirilmaydi: 'STIR: …', 'STIR raqami: …', kirillcha 'ИНН …'", () => {
  for (const t of ['«Audit Pro» MChJ, STIR: 305123456.', 'STIR raqami: 305123456', 'ИНН 305123456', 'СТИР: 305 123 456', 'inn 305123456']) {
    assert.equal(redact(t).text, t, t);
  }
});

test("Maosh, sana, vaqt, narx va IELTS o'zgarmaydi", () => {
  const t = "Maosh 1 500 000 so'm, 2 500 000 gacha. 2026-10-11 dan, 10:00–18:00. IELTS 7.0. Hujjat uchun to'lov 500$";
  assert.equal(redact(t).text, t);
});

test('Ikki marta yashirish natijani o\'zgartirmaydi va qayta sanamaydi', () => {
  const once = redact('Tel +998 90 123 45 67, +7 999 123 45 67, AA1234567');
  const twice = redact(once.text);
  assert.equal(twice.text, once.text);
  assert.equal(Object.values(twice.counts).reduce((a, b) => a + b, 0), 0);
});

test('Ism + opa/aka: avtomatik yashirilmaydi, lekin ogohlantirish beriladi', () => {
  const r = redact('Murojaat: Dilnoza opa yoki Aziz aka, Нодира опа');
  assert.match(r.text, /Dilnoza opa/);
  assert.deepEqual(r.names, ['Dilnoza opa', 'Aziz aka', 'Нодира опа']);
  const w = E.validationWarnings([v3case('Kassir kerak. Murojaat: Dilnoza opa. Maosh 4 mln')]);
  assert.match(w.join(), /ism bo'lishi mumkin \(Dilnoza opa\)/);
});

test("Validator: pasport, JSHSHIR, telefon, karta qolsa — xato; niqob va STIR — xato emas", () => {
  assert.match(validate('Kassir kerak. Pasport AA1234567 bilan keling').join(), /pasport raqami/);
  assert.match(validate('Kassir kerak. JSHSHIR 31234567890123 kerak').join(), /JSHSHIR/);
  assert.match(validate('Kassir kerak, tel +7 999 123 45 67').join(), /rus telefon/);
  assert.match(validate('Kassir kerak, karta 8600 1234 5678 9012').join(), /karta/);
  assert.deepEqual(validate("Kassir kerak, STIR: 305123456, tel +998 00 000 00 00, [pasport], [JSHSHIR], +7 000 000 00 00"), []);
});

test("Yashirish analyzer natijasini o'zgartirmaydi (xavf, belgilar, shaffoflik)", () => {
  const t = "Koreyaga ish! Hujjat uchun to'lov 500$. «Tez» MChJ, STIR: 305123456. Tel +998 90 123 45 67, karta 8600 1234 5678 9012";
  const before = A.analyze(t), after = A.analyze(redact(t).text);
  assert.deepEqual(after.scam.map(s => s.id).sort(), before.scam.map(s => s.id).sort());
  assert.equal(after.score, before.score);
  assert.equal(after.transparency.score, before.transparency.score);
});

test("Import yoki REPL'dan foydalanish yiqilmaydi (process.argv[1] yo'q holat)", () => {
  for (const args of [
    ['--input-type=module', '-e', "const m = await import('./tools/redact.mjs'); console.log(m.redact('tel +998 90 123 45 67').text)"],
    ['-e', "import('./tools/redact.mjs').then(m => console.log(m.redact('AA1234567').text))"]
  ]) {
    const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /\+998 00 000 00 00|\[pasport\]/);
  }
  const repl = spawnSync(process.execPath, ['-i'], { cwd: ROOT, encoding: 'utf8', input: "import('./tools/redact.mjs').then(m => { console.log('REPL:', m.redact('JSHSHIR 31234567890123').text); process.exit(0) }, e => { console.log('XATO', e.message); process.exit(1) })\n" });
  assert.equal(repl.status, 0, repl.stdout + repl.stderr);
  assert.match(repl.stdout, /REPL: JSHSHIR \[JSHSHIR\]/, repl.stderr);
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
  assert.ok(!errors.some(x => /yashirilmagan/.test(x)), "qoralamada PII xatosi bo'lmasligi kerak");
  assert.ok(!/score|xavf bali/i.test(code), "qoralamada tizim bahosi bo'lmasligi kerak");
});

console.log(`\n${passed} ta redaction testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
