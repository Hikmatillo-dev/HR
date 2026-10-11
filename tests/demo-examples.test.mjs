// Bosh sahifadagi demo misollar halolmi: node tests/demo-examples.test.mjs
// Demo natijasi oldindan yozilgan (sahifa analyzer'ni chaqirmaydi), shuning uchun u analyzer'ning
// haqiqiy javobidan farq qilib qolmasligi shu yerda tekshiriladi.
import assert from 'node:assert/strict';
import '../js/analyzer.js';
import '../js/demo-examples.js';

const { analyze } = globalThis.IshQalqon;
const EXAMPLES = globalThis.IQ_DEMO_EXAMPLES;

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('Demo misollar (bosh sahifa)');

test("3 ta misol: oldindan to'lov, pasport olib qolish, kamsitish", () => {
  assert.deepEqual(EXAMPLES.map(e => e.id), ['prepay', 'passport', 'disc']);
});

for (const ex of EXAMPLES) {
  test(`${ex.id}: ko'rsatilgan daraja, odam savdosi belgisi va sabablar analyzer javobiga mos`, () => {
    const r = analyze(ex.text);
    assert.equal(r.level, ex.level);
    assert.equal(Boolean(r.trafficking), ex.trafficking);
    const got = new Set([...r.scam.map(s => s.id), ...r.discrimination.map(d => 'disc:' + d.id)]);
    for (const reason of ex.reasons) assert.ok(got.has(reason.flag), `${reason.flag} analyzer natijasida yo'q`);
  });
  test(`${ex.id}: har bir iqtibos e'lon matnida aynan bor`, () => {
    for (const reason of ex.reasons) assert.ok(ex.text.includes(reason.quote), `"${reason.quote}" matnda yo'q`);
  });
}

console.log(`\n${passed} ta demo testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
