// Vakansiya matni validatsiyasi: node tests/validate.test.mjs
// Mazmunsiz matn bloklanadi; loyihadagi barcha real va namunaviy e'lonlar (eng qisqasi 27 belgi) bloklanmaydi.
import assert from 'node:assert/strict';
import '../js/validate-posting.js';
import '../js/test-set.js';
import '../js/test-set-v3.js';
import '../js/demo-examples.js';

globalThis.window = globalThis;
await import('../js/sample-data.js');
const { check, MIN_CHARS, MESSAGE } = globalThis.IQValidate;

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('Vakansiya matni validatsiyasi');

test("Xabar matni aniq va chegara 20 belgi", () => {
  assert.equal(MESSAGE, "E'lon matni juda qisqa yoki mazmunsiz. Kamida 20 belgi va harfli so'z kiriting.");
  assert.equal(MIN_CHARS, 20);
});

test("Bo'sh, qisqa va faqat raqam/tinish belgilaridan iborat matn bloklanadi", () => {
  const cases = [['', 'empty'], ['   \n\t ', 'empty'], ['abc', 'short'], ['Kassir kerak 4 mln', 'short'],
    ['12345 !!! ???', 'short'], ['+998 90 123 45 67 !!! ??? 2026', 'no_words'], ['1234567890 1234567890 ....', 'no_words'],
    ['ab 12 cd 34 ef 56 gh 78 !!', 'no_words'], ['$$$ 500 $$$ 1000 $$$ 2500 ---', 'no_words']];
  for (const [text, reason] of cases) {
    const r = check(text);
    assert.equal(r.ok, false, `"${text}" bloklanishi kerak`);
    assert.equal(r.reason, reason, `"${text}"`);
    assert.equal(r.message, MESSAGE);
  }
});

test("Qisqa, lekin haqiqiy e'lonlar o'tadi: lotin, kirill, rus, aralash, emoji bilan", () => {
  for (const t of ['Kassir kerak, Toshkent', 'Ish bor. Batafsil lichkada.', 'Сотувчи керак, Тошкент шаҳри', 'Требуется курьер, Ташкент',
    '🇰🇷 Koreyaga ish! Viza 100%', '  Oshpaz kerak, oylik 5 mln  ', 'IT: Python dev, 1500$ / oy']) {
    assert.deepEqual(check(t), { ok: true }, t);
  }
});

test("Chegarada: 19 belgi bloklanadi, 20 belgi o'tadi; chetdagi bo'shliqlar hisoblanmaydi", () => {
  assert.equal(check('Kassir kerak Toshkt').ok, false); // 19
  assert.equal(check('Kassir kerak Toshken').ok, true); // 20
  assert.equal(check('     Kassir kerak Toshkt     ').ok, false);
});

const sets = {
  'v1+v2 (qo\'lda)': globalThis.TEST_SET.map(c => c.text),
  'v3 (real Telegram)': globalThis.TEST_SET_V3.map(c => c.text),
  'demo misollar': globalThis.IQ_DEMO_EXAMPLES.map(e => e.text),
  'sintetik namuna': globalThis.SAMPLE_VACANCIES.map(v => v.text)
};
for (const [name, texts] of Object.entries(sets)) {
  test(`${name}: ${texts.length} ta e'lonning hammasi validatsiyadan o'tadi (noto'g'ri bloklanmaydi)`, () => {
    assert.ok(texts.length > 0);
    const blocked = texts.filter(t => !check(t).ok).map(t => t.slice(0, 40));
    assert.deepEqual(blocked, []);
  });
}

console.log(`\n${passed} ta validatsiya testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
