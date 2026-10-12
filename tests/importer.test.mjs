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

test("Sintetik belgisi: namuna faylidagi \"synthetic\": true hisobotga o'tadi; oddiy eksport — sintetik emas", () => {
  const content = readFileSync(new URL('../namuna/telegram-export-namuna.json', import.meta.url), 'utf8');
  assert.deepEqual(importFiles([{ name: 'telegram-export-namuna.json', content }]).stats.syntheticFiles, ['telegram-export-namuna.json']);
  const plain = JSON.stringify({ name: 'k', messages: [{ id: 1, type: 'message', date: '2026-10-01', text: "Sotuvchi kerak, Toshkent. Oylik 4 mln so'm." }] });
  assert.deepEqual(importFiles([{ name: 'result.json', content: plain }]).stats.syntheticFiles, []);
});

// M3 (bug-hunt): "kerak/ish/maosh" so'zi bo'lmagan firibgar e'lonlar import filtrida tashlab yuborilardi
test("Vakansiya so'zi yo'q, lekin firibgarlik belgisi bor xabarlar olinadi; oddiy reklama va salomlashish — yo'q", () => {
  const msgs = ["Kartangiz raqami va SMS kodni yuboring, 1 soatda 500 000 so'm topasiz! Batafsil lichkada.",
    "Layk bosib pul toping: har bir layk 5000 so'm, avval 100 000 so'm depozit qo'yasiz.",
    "Dubayga chiroyli qizlar taklif qilinadi, yo'l bepul, 3000$ va'da qilamiz.",
    "Koreya E-9 vizasi 100% kafolat bilan, narxi 2000$. Yozing!",
    "Kanalimizga obuna bo'ling va do'stlaringizni taklif qiling, yangiliklar har kuni!",
    "Assalomu alaykum, aziz obunachilar! Xayrli tong va omadli kun tilaymiz."];
  const content = JSON.stringify({ name: 'k', messages: msgs.map((text, i) => ({ id: i + 1, type: 'message', date: '2026-10-01T10:00:00', text })) });
  const { items, stats } = importFiles([{ name: 'result.json', content }]);
  assert.deepEqual(items.map(i => i.text), msgs.slice(0, 4));
  assert.equal(stats.notVacancy, 2);
});

// M6 (bug-hunt): boshqa kanalda qayta joylangan e'lon takror sifatida olib tashlanadi, lekin o'sha kanal ham yoziladi
test("Fayllararo takror: e'lon bitta qoladi, lekin u chiqqan barcha kanallar ro'yxati saqlanadi (bir kanal ichidagi takror — bir marta)", () => {
  const exp = (name, texts) => ({ name: name + '.json', content: JSON.stringify({ name, messages: texts.map((text, i) => ({ id: i + 1, type: 'message', date: '2026-10-01T10:00:00', text })) }) });
  const scam = "Koreyaga ish! Hujjat uchun to'lov 500$. Viza 100% kafolat.";
  const { items, stats } = importFiles([exp('Kanal A', [scam, scam]), exp('Kanal B', ["Sotuvchi kerak, Toshkent. Oylik 4 mln so'm.", scam])]);
  assert.equal(items.length, 2);
  assert.equal(stats.duplicates, 2);
  assert.deepEqual(items.find(i => i.text === scam).channels, ['Kanal A', 'Kanal B']);
  assert.deepEqual(items.find(i => i.text !== scam).channels, ['Kanal B']);
});

// M1 (bug-hunt): bitta juda uzun xabar importni soniyalab qotirardi; Telegram xabari 4096 belgidan oshmaydi
test("6000 belgidan uzun xabar tahlilsiz o'tkazib yuboriladi (stats.tooLong), import tez qoladi", () => {
  const content = JSON.stringify({ name: 'k', messages: [
    { id: 1, type: 'message', date: '2026-10-01T10:00:00', text: 'Ish kerak, maosh ' + '7'.repeat(20000) },
    { id: 2, type: 'message', date: '2026-10-01T10:00:00', text: "Sotuvchi kerak, Toshkent. Oylik 4 mln so'm." }] });
  const t0 = performance.now();
  const { items, stats } = importFiles([{ name: 'result.json', content }]);
  assert.ok(performance.now() - t0 < 500, `${Math.round(performance.now() - t0)} ms`);
  assert.equal(items.length, 1); assert.equal(stats.tooLong, 1); assert.equal(stats.messages, 2);
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

test("Telegram HTML eksporti — e'lon sifatida o'qilmaydi, JSON tanlash kerakligi aytiladi", () => {
  const html = '<!DOCTYPE html><html><body><div class="message"><div class="text">Sotuvchi kerak, oylik 4 mln</div></div></body></html>';
  assert.throws(() => importFiles([{ name: 'messages.html', content: html }]), /HTML eksport.*Machine-readable JSON/);
  assert.throws(() => importFiles([{ name: 'kanal.txt', content: html }]), /HTML eksport/);
});

test("Xabarsiz JSON — tushunarli xato", () => {
  assert.throws(() => importFiles([{ name: 'x.json', content: '{"name":"a"}' }]), /xabarlar topilmadi/);
});

test("TXT: e'lonlar bo'sh qator bilan ajratilgan", () => {
  const txt = "Kuryer kerak, Buxoro. Kuniga to'lov, 5 mln so'm atrofida.\n\nPayvandchi kerak, Qarshi. Maosh 8 mln so'm, tajriba 2 yil.";
  assert.equal(importFiles([{ name: 'a.txt', content: txt }]).items.length, 2);
});

console.log(`\n${passed} ta import testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
