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

console.log(`\n${passed} ta qoida testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
