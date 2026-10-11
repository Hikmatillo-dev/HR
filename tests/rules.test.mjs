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
  hasNot("Mahsulotlarimizni soting va daromad oling", 'vague');
});

test("Ish vaqti ('kuniga 10-12 soat') — 'oson pul' emas va maoshni kunlik deb ko'paytirmaydi", () => {
  hasNot('Omborga ishchi. Ish kuniga 10-12 soat, oylik 700$', 'easy');
  hasNot('Кунига 3-4 соат ишлайсиз, ойлик 500$', 'easy');
  assert.equal(analyze('Ish kuniga 10-12 soat, oylik 700$').salary.daily, false);
  has("Uydan turib kuniga 300 ming so'm daromad", 'easy');
  assert.equal(analyze("Kunlik 150 000 so'm to'lanadi, yuk tashish").salary.daily, true);
});

test("Kanalga do'st taklif qilish — referal sxema emas; pul evaziga do'st taklif qilish — referal", () => {
  hasNot("Ishchilar kerak. Kanalimizga do'stlaringizni taklif qiling", 'invest');
  has("3 ta do'stingizni taklif qiling va har biri uchun bonus oling", 'invest');
});

test("Xorij: yangi davlatlar topiladi; ko'cha nomi, til, oshxona va qahva nomi — xorij emas", () => {
  for (const t of ['Bolgariyada ish taklifi', 'Литвада ишлаш', 'Yaponiyada ishlash uchun', 'Xorvatiya: qurilish', "Ko'plab davlatlar bilan hamkorlik", 'Работа в США']) has(t, 'abroad');
  for (const t of ["Isroilov ko'chasi 5, sotuvchi", 'Знание английского языка, офис-менеджер', 'Повар китайской кухни',
    'Xitoy oshxonasiga oshpaz', 'Amerikancha kofe tayyorlovchi barista', 'Bae restorani']) hasNot(t, 'abroad');
  assert.equal(analyze('Bolgariyada avtomexanik').region, 'Xorij');
});

test("Klassik xorij firibgarligi kirillda: 'визаси кафолатланган', 'хужжатлар учун 1000$ олдиндан' — yuqori xavf, odam savdosi", () => {
  const r = analyze('Тайёр иш! Корея визаси кафолатланган, хужжатлар учун 1000$ олдиндан');
  assert.equal(r.level, 'high'); assert.ok(r.trafficking);
  for (const id of ['prepay', 'visa', 'abroad']) has('Тайёр иш! Корея визаси кафолатланган, хужжатлар учун 1000$ олдиндан', id);
  has("Germaniyaga ish, oldindan 500$ to'laysiz", 'prepay');
  hasNot("Maosh har oy 5 mln, oldindan avans yo'q", 'prepay');
});

test("Qarz qulligi 'qarz' so'zisiz: yo'l/viza puli maoshdan ushlab qolinadi; soliq ushlanishi — emas", () => {
  const t = "Rossiyaga ish, yo'l puli ish beruvchidan, keyin maoshdan ushlab qolinadi";
  has(t, 'debt'); assert.ok(analyze(t).trafficking);
  has('Билет покупаем мы, потом стоимость вычитаем из зарплаты', 'debt');
  hasNot('Soliqlar maoshdan ushlab qolinadi, sotuvchi, oylik 4 mln', 'debt');
  hasNot("Yo'l puli kompaniya hisobidan, maosh 1500$", 'debt');
});

test("Rus tilida 'oson pul' va yashirin ish: 'от 500 000 сум в день', 'пишите в лс'", () => {
  const t = 'Работа на дому, оплата каждый день, от 500 000 сум в день, пишите в лс';
  has(t, 'easy'); has(t, 'vague'); assert.notEqual(analyze(t).level, 'low');
});

test("Xorijga 'chiroyli' ofitsiantka chaqirish — odam savdosi xavfi; 'yosh' so'zisiz '18-25,' yosh cheklovi", () => {
  const t = 'Ofitsiantka kerak, chiroyli, 18-25, Dubayda restoranga, viza tekin';
  const r = analyze(t);
  assert.ok(r.trafficking, 'odam savdosi belgisi'); assert.notEqual(r.level, 'low');
  for (const id of ['disc:age', 'disc:gender', 'disc:appearance', 'lure']) has(t, id);
  hasNot('Chiroyli qizlar kerak, Toshkent, kafe', 'lure');
});

test("Raqamlar oralig'i yosh emas: maosh, ish vaqti, smena, sana; 'chiroyli ofis' — tashqi ko'rinish talabi emas", () => {
  for (const t of ["Oylik 18-25 mln so'm, dasturchi", 'Ish vaqti 10-18. Sotuvchi', 'Smena 20-08, qorovul', 'Sana: 2025-07-18, sotuvchi']) hasNot(t, 'disc:age');
  hasNot('Chiroyli ofis, Toshkent, administrator', 'disc:appearance');
  has('Официантка в кафе, Ташкент, график 2/2', 'disc:gender');
  hasNot('Ofitsiant kerak, Toshkent', 'disc:gender');
});

test("C2: pasport nusxasini yuborish so'ralsa — o'rtacha xavf (kritik emas); karta/SMS kod — yuqori; shaxsan topshirish — xavf emas", () => {
  const t = 'Kassir kerak. Ariza uchun pasport nusxasini yuboring. Maosh 4 mln, Toshkent, Chilonzor';
  has(t, 'idcopy'); hasNot(t, 'personal'); assert.equal(analyze(t).level, 'medium');
  assert.equal(analyze('Karta raqamingizni va SMS kodni yuboring').level, 'high');
  assert.equal(analyze('Для регистрации пришлите фото паспорта и номер карты').level, 'high');
  hasNot("Hujjatlar: pasport nusxasi, diplom — kadrlar bo'limiga shaxsan olib keling", 'idcopy');
});

console.log(`\n${passed} ta qoida testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
