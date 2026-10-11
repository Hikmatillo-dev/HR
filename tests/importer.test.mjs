// Import modulini tekshirish: node tests/importer.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import '../js/analyzer.js';
import '../js/importer.js';

const { importFiles } = globalThis.IQImporter;
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('Import testlari');

test("Namunaviy Telegram eksporti: firibgar e'lonlar ham olinadi, reklama tashlanadi", () => {
  const content = readFileSync(new URL('../namuna/telegram-export-namuna.json', import.meta.url), 'utf8');
  const { items, stats } = importFiles([{ name: 'result.json', content }]);
  assert.equal(stats.messages, 41);
  assert.equal(stats.notVacancy, 1, 'faqat "obuna bo\'ling" reklamasi tashlanishi kerak');
  assert.equal(stats.vacancyLike, 40);
  assert.equal(stats.unique + stats.duplicates, stats.vacancyLike);
  assert.equal(items.length, stats.unique);
  assert.ok(items.some(i => /KOREYAGA ISH/.test(i.text)), "firibgar Koreya e'loni olinishi kerak");
  assert.ok(items.some(i => /Кореяга иш/.test(i.text)), "kirill e'lon olinishi kerak");
});

test("Bir xil e'lon boshqa telefon raqami bilan — takror deb hisoblanadi", () => {
  const msg = (id, phone) => ({ id, type: 'message', date: '2026-10-01T10:00:00', text: `Kassir kerak, Toshkent. Maosh 4 mln so'm. Tel ${phone}` });
  const content = JSON.stringify({ name: 'k', messages: [msg(1, '+998 90 111 22 33'), msg(2, '+998 91 444 55 66')] });
  const { stats } = importFiles([{ name: 'a.json', content }]);
  assert.equal(stats.unique, 1);
  assert.equal(stats.duplicates, 1);
});

test("Bir nechta fayl o'rtasida ham takrorlar olib tashlanadi", () => {
  const content = JSON.stringify({ name: 'k', messages: [{ id: 1, type: 'message', date: '2026-10-01', text: "Haydovchi kerak, Samarqand. Maosh 6 mln so'm. +998 90 000 00 00" }] });
  const { stats } = importFiles([{ name: 'a.json', content }, { name: 'b.json', content }]);
  assert.equal(stats.files, 2);
  assert.equal(stats.unique, 1);
});

test("Telegram matn bo'laklari (entities) birlashtiriladi, xizmat xabarlari o'tkaziladi", () => {
  const content = JSON.stringify({
    name: 'k', messages: [
      { id: 1, type: 'service', action: 'pin_message', text: '' },
      { id: 2, type: 'message', date: '2026-10-02', text: ['Operator kerak! ', { type: 'bold', text: 'Maosh 5 mln' }, " so'm, Toshkent, ", { type: 'phone', text: '+998 90 123 45 67' }] }
    ]
  });
  const { items, stats } = importFiles([{ name: 'a.json', content }]);
  assert.equal(stats.messages, 1);
  assert.match(items[0].text, /Maosh 5 mln so'm/);
});

test('CSV: matn ustuni, qo\'shtirnoq ichidagi vergul va yangi qator', () => {
  const csv = 'sana,kanal,matn\n2026-10-01,@k,"Sotuvchi kerak, Andijon.\nMaosh 4 mln so\'m, tel +998 90 111 11 11"\n';
  const { items } = importFiles([{ name: 'a.csv', content: csv }]);
  assert.equal(items.length, 1);
  assert.equal(items[0].channel, '@k');
  assert.match(items[0].text, /\nMaosh/);
});

test("Buzilgan JSON — tushunarli xato", () => {
  assert.throws(() => importFiles([{ name: 'x.json', content: '{oops' }]), /JSON fayl buzilgan/);
});

test("Xabarsiz JSON — tushunarli xato", () => {
  assert.throws(() => importFiles([{ name: 'x.json', content: '{"name":"a"}' }]), /xabarlar topilmadi/);
});

test("TXT: e'lonlar bo'sh qator bilan ajratilgan", () => {
  const txt = "Kuryer kerak, Buxoro. Kuniga to'lov, 5 mln so'm atrofida.\n\nPayvandchi kerak, Qarshi. Maosh 8 mln so'm, tajriba 2 yil.";
  assert.equal(importFiles([{ name: 'a.txt', content: txt }]).items.length, 2);
});

console.log(`\n${passed} ta import testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
