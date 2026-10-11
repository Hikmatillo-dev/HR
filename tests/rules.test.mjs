// Qoidalarning aniq holatlari: node tests/rules.test.mjs
// Misollar sun'iy (v3 real e'lonlari emas) — qoida umumiy naqshni topishini va noto'g'ri signal bermasligini tekshiradi.
import assert from 'node:assert/strict';
import '../js/analyzer.js';

const { analyze } = globalThis.IshQalqon;
const flags = text => {
  const r = analyze(text);
  return new Set([...r.scam.map(s => s.id), ...r.discrimination.map(d => 'disc:' + d.id)]);
};

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}
const has = (text, id) => assert.ok(flags(text).has(id), `"${text}" → ${id} kutilgan, topilgani: ${[...flags(text)].join(', ') || "yo'q"}`);
const hasNot = (text, id) => assert.ok(!flags(text).has(id), `"${text}" → ${id} bo'lmasligi kerak`);

console.log('Qoida testlari');

test("Yosh cheklovining turli yozilishi topiladi; '18 yoshdan' (qonuniy minimal yosh) — kamsitish emas", () => {
  for (const t of ['Yosh: 19–25', 'Ёш: 20- 40 гача', "Talablar: 18dan 35yoshagacha", '35 yoshgacha']) has(t, 'disc:age');
  for (const t of ['Yoshi 18 dan, smartfon kerak', "Talablar: 18 yoshdan katta", "3-6 yoshli bolalar bilan ishlash"]) hasNot(t, 'disc:age');
});

test("Jins cheklovi: heshteg, ro'yxat bandi, yoshdan keyingi jins, 'fakatgina'; ikkala jinsga murojaat — emas", () => {
  for (const t of ['Jinsi: #Qizlar', '🚹 #Ayollar', 'Talablar: • Erkaklar (21-48 yosh)', "35 yoshgacha o'g'il bolalar",
    'Факатгина эркаклар кабул килинади', '50 ёшгача соглом эркаклар']) has(t, 'disc:gender');
  for (const t of ['Qizlar va yigitlar ishga taklif qilinadi', '#Кизлар, боллар', 'Erkaklar va ayollar uchun sartaroshxona',
    "Ayollar kiyimi do'koniga sotuvchi", "20 yoshdan katta har qanday qiz ham, yigit ham"]) hasNot(t, 'disc:gender');
});

test("Agentlik 'xizmat haqi/narxi' + summa — oldindan to'lov; ofitsiantning 'xizmat haqi 10%' va 'bepul' — emas", () => {
  has("Xorijga ish. Xizmat narxi 9 600 000 so'm, shartnomada 4 mln to'lanadi", 'prepay');
  has("Xizmat haqi: 500$", 'prepay');
  hasNot("Ofitsiant kerak. Maosh 3 mln + xizmat haqi 10%", 'prepay');
  hasNot("Agentlik xizmat haqi olinmaydi, maosh 1500$", 'prepay');
  const r = analyze("Polsha. Xizmat narxi 9 600 000 so'm. Oylik 700$");
  assert.ok(r.salary && r.salary.max < 15, "to'lov summasi maosh deb hisoblanmaydi");
});

test("Tarmoq marketingi brendlari va 'a'zo bo'lish tekin' — referal sxema", () => {
  for (const t of ['Greenway kompaniyasiga menejer', "Faberlic kompaniyasi: a'zo bo'lish tekin", 'ГРИНВЕЙ компанияси']) has(t, 'invest');
});

test("'Kunlik daromad', 'daromadimni yechib oldim', 'telefon bo'lsa kifoya' — oson pul", () => {
  for (const t of ["Bir kunlik daromad 300 ming so'mdan", "Bugun daromadimni yechib oldim!", "Telefon va internet bo'lsa kifoya", 'Onlayn daromad, yozing']) has(t, 'easy');
  hasNot("Yuk tashuvchi, kunlik ish haqi 150 000 so'm, manzil: Sergeli", 'easy');
});

test("Shoshiltirish: 'hozir boshlang', 'ketish muddati qisqa', 'o'rinlar cheklangan'", () => {
  for (const t of ['Hozir boshlang — orqada qolmang!', 'Ketish muddati qisqa', "Bo'sh ish o'rinlari cheklangan"]) has(t, 'urgency');
});

test("Ish mazmuni yashirilgan: ma'lumot faqat ofisda; daromad bor, lekin ish turi yo'q", () => {
  has("Ish haqida ma'lumot ofisda beriladi", 'vague');
  has("Kuniga katta daromad! Halol va qonuniy. Yozing", 'vague');
  hasNot("Sotuvchi kerak. Vazifa: kassa, mijozlar bilan ishlash. Daromad 5 mln", 'vague');
  hasNot("Omborchi kerak, oylik daromad 4 mln so'm, Toshkent", 'vague');
});

console.log(`\n${passed} ta qoida testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
