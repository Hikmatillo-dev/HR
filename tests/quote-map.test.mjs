// Iqtibosni asl e'lon matniga bog'lash (H2): node tests/quote-map.test.mjs
// analyzer.js kirill matnni lotinga o'girib ham tekshiradi, shuning uchun iqtibos lotincha qaytishi mumkin.
// Sahifa uni asl kirill matnda topib belgilashi, topa olmasa — hech narsani belgilamasligi kerak.
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../js/analyzer.js');
await import('../js/quote-map.js').catch(() => {});
await import('../js/ui-common.js');
const A = globalThis.IshQalqon, Q = globalThis.IQQuote, IQ = globalThis.IQ;

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message.split('\n').slice(0, 6).join('\n    ')}`); process.exitCode = 1; }
}
const need = () => assert.ok(Q && typeof Q.locate === 'function' && typeof Q.locateAll === 'function', 'js/quote-map.js (IQQuote.locate / locateAll) yo\'q');
const marks = html => [...html.matchAll(/<mark[^>]*>(.*?)<\/mark>/g)].map(m => m[1]);

const KIRILL = "Кореяга иш! Виза 100% кафолатланган. Ҳужжатлар учун олдиндан 500$ тўлов қиласиз, паспортингизни бизга топширасиз. Тез ёзинг, жойлар чекланган!";

console.log("Iqtibosni asl matnga bog'lash");

test("Kirill matn + lotincha analyzer iqtibosi → asl kirillcha fragment", () => {
  need();
  assert.equal(Q.locate(KIRILL, 'oldindan 500$'), 'олдиндан 500$');
  assert.equal(Q.locate(KIRILL, 'pasportingizni bizga topshir'), 'паспортингизни бизга топшир');
  assert.equal(Q.locate(KIRILL, 'viza 100%'), 'Виза 100%');
  assert.equal(Q.locate(KIRILL, 'joylar cheklangan'), 'жойлар чекланган');
  assert.equal(Q.locate(KIRILL, "to'lov"), 'тўлов'); // ў → o' (bitta harf ikki lotin belgisiga)
  assert.equal(Q.locate(KIRILL, 'корея'), 'Корея'); // iqtibos kirillcha bo'lsa ham
});

test("Analyzer'ning har bir kirill sababi asl matnda topiladi va fragment kirillcha (lotin emas)", () => {
  need();
  const a = A.analyze(KIRILL);
  assert.ok(a.scam.length >= 4, `sabablar: ${a.scam.length}`);
  for (const r of a.scam) {
    const f = Q.locate(KIRILL, r.match);
    assert.ok(f, `${r.id}: "${r.match}" topilmadi`);
    assert.ok(KIRILL.includes(f), `${r.id}: fragment asl matnning bo'lagi emas`);
    assert.match(f, /[а-яёўқғҳ]/i, `${r.id}: "${f}" kirillcha emas`);
    assert.equal(A.transliterate(f.toLowerCase()), A.transliterate(r.match), `${r.id}: fragment iqtibosga mos emas`);
  }
});

test("Topilmasa — null va bo'sh ro'yxat (hisoblangan '31.5 mln so'm', yo'q so'z, bo'sh yoki 1 belgili iqtibos)", () => {
  need();
  for (const q of ["31.5 mln so'm", 'depozit', '', ' ', 'a', null, undefined]) {
    assert.equal(Q.locate(KIRILL, q), null, String(q));
    assert.deepEqual(Q.locateAll(KIRILL, q), [], String(q));
  }
});

test("Harfning yarmiga to'g'ri keladigan moslik belgilanmaydi ('ш' → 'sh': faqat 'h' yoki faqat 's')", () => {
  need();
  assert.equal(Q.locate('Шошилинг!', 'hoshiling'), null);
  assert.equal(Q.locate('Тўлов', "o'lov"), 'ўлов'); // 'ў' to'liq ("o'") — mos
  assert.equal(Q.locate('Тўлов', "'lov"), null); // 'ў' ning yarmi — mos emas
});

test("Lotin: registr, apostrof turlari (‘ ʼ `) va bir nechta bo'shliq/qator — asl fragment o'zgarishsiz qaytadi", () => {
  need();
  assert.equal(Q.locate("Hujjat uchun TO‘LOV  500$", "hujjat uchun to'lov 500$"), 'Hujjat uchun TO‘LOV  500$');
  assert.equal(Q.locate("Joylar\n  cheklangan!", 'joylar cheklangan'), 'Joylar\n  cheklangan');
  assert.equal(Q.locate("🇰🇷 KOREYAGA ISH", 'koreya'), 'KOREYA'); // emoji (surrogat juftlik) indekslarni siljitmaydi
});

test("Bir nechta moslik: locateAll hammasini chapdan o'ngga, locate birinchisini qaytaradi (deterministik)", () => {
  need();
  const t = 'Виза 100% кафолат. Яна виза 100% беринг.';
  assert.deepEqual(Q.locateAll(t, 'viza 100%').map(r => t.slice(r.start, r.end)), ['Виза 100%', 'виза 100%']);
  assert.equal(Q.locate(t, 'viza 100%'), 'Виза 100%');
});

test("IQ.highlight: kirill matnda lotincha iqtibos asl kirill fragmentni belgilaydi, matn escape qilinadi", () => {
  const html = IQ.highlight('<b>' + KIRILL, [{ phrase: 'oldindan 500$', cls: '' }, { phrase: 'pasportingizni bizga topshir', cls: '' }, { phrase: "31.5 mln so'm", cls: '' }]);
  assert.deepEqual(marks(html), ['олдиндан 500$', 'паспортингизни бизга топшир']);
  assert.ok(html.startsWith('&lt;b&gt;'), 'matn escape qilinmagan');
});

test("IQ.highlight: lotin va rus matnida avvalgi natija o'zgarmaydi", () => {
  const lat = "Koreyaga ish! Viza 100% kafolatlangan. Hujjatlar uchun oldindan 500$ to'lov qilasiz.";
  assert.deepEqual(marks(IQ.highlight(lat, A.analyze(lat).scam.map(r => ({ phrase: r.match, cls: '' })))), ['Koreya', 'Viza 100%', 'oldindan 500$']);
  const ru = 'Работа в Корее! Оплата за оформление документов 500$ заранее. Срочно!';
  assert.deepEqual(marks(IQ.highlight(ru, A.analyze(ru).scam.map(r => ({ phrase: r.match, cls: '' })))), ['Оплата за оформлени', 'Срочно']);
});

console.log(`\n${passed} ta iqtibos testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
