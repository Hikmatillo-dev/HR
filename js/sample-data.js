// NAMUNAVIY (SINTETIK) MA'LUMOT — faqat demo uchun.
// Haqiqiy Telegram ma'lumoti: tools/telegram_export.py -> js/real-data.js
(function (global) {
  'use strict';

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = rng(2026);
  const pick = a => a[Math.floor(rand() * a.length)];
  const between = (a, b) => Math.round((a + rand() * (b - a)) * 2) / 2;

  const REGIONS = [
    ['Toshkent shahri', 30], ['Toshkent viloyati', 6], ['Samarqand', 8], ["Farg'ona", 7], ['Andijon', 6],
    ['Namangan', 6], ['Buxoro', 5], ['Qashqadaryo', 5], ['Surxondaryo', 4], ['Xorazm', 4],
    ['Navoiy', 3], ['Jizzax', 3], ['Sirdaryo', 2], ["Qoraqalpog'iston", 3]
  ];
  const weighted = list => {
    const total = list.reduce((s, x) => s + x[1], 0);
    let r = rand() * total;
    for (const [v, w] of list) if ((r -= w) < 0) return v;
    return list[0][0];
  };

  const JOBS = [
    ['Frontend dasturchi', 8, 20, "«Smart Code» IT kompaniyasi", 'React, TypeScript, 1 yillik tajriba'],
    ['Python dasturchi', 10, 25, "«Data Soft» MChJ", 'Django/FastAPI, SQL, Git'],
    ['SMM mutaxassis', 5, 10, "«Brend Media» agentligi", 'Instagram, Telegram, kontent reja'],
    ['Sotuvchi-konsultant', 3, 5, "«Yangi Davr» savdo markazi", "muloqotchanlik, o'zbek va rus tili"],
    ['Kassir', 3, 4.5, "«Baraka Market» supermarketi", "ma'suliyat, kompyuter savodxonligi"],
    ["Ingliz tili o'qituvchisi", 5, 10, "«Bilim» o'quv markazi", 'IELTS 7.0+'],
    ["Matematika o'qituvchisi", 4, 8, "«Kelajak» xususiy maktabi", "oliy ma'lumot, 2 yil tajriba"],
    ['Hamshira', 3.5, 6, "«Nur Med» klinikasi", "tibbiy ma'lumot, sertifikat"],
    ['Stomatolog', 8, 20, "«Oq Tabassum» stomatologiyasi", "oliy tibbiy ma'lumot"],
    ['Payvandchi', 6, 10, "«Mustahkam Qurilish» MChJ", '3-razryad, tajriba'],
    ['Elektrik', 5, 9, "«Energo Servis» MChJ", 'elektr xavfsizligi guruhi'],
    ['Kuryer', 4, 8, "«Tez Yetkaz» xizmati", 'shaxsiy telefon, velosiped yoki skuter'],
    ['Haydovchi (B toifa)', 5, 9, "«Logistika Plus» MChJ", 'B toifali guvohnoma, 3 yil staj'],
    ['Buxgalter', 5, 10, "«Audit Pro» MChJ", '1C, soliq hisoboti'],
    ['Call-markaz operatori', 3.5, 6, "«Aloqa Servis» MChJ", "o'zbek va rus tili"],
    ['Oshpaz', 5, 10, "«Milliy Taomlar» restorani", 'milliy taomlar tajribasi'],
    ['Ofitsiant', 3, 5, "«Choyxona Navro'z»", "xushmuomalalik"]
  ];

  const phone = () => `+998 ${pick(['90', '91', '93', '94', '97', '99', '33', '88'])} ${100 + Math.floor(rand() * 900)} ${10 + Math.floor(rand() * 90)} ${10 + Math.floor(rand() * 90)}`;

  function legit(region) {
    const [job, lo, hi, company, req] = pick(JOBS);
    const a = between(lo, (lo + hi) / 2), b = between((lo + hi) / 2, hi);
    const salary = rand() < 0.3 ? "Maosh: suhbat asosida" : `Maosh: ${a}–${b} mln so'm`;
    return pick([
      () => `📢 ${company} ${region}dagi filialiga ${job} kerak.\n\nTalablar: ${req}.\n${salary}\nIsh vaqti: 9:00–18:00, rasmiy ishga joylashtirish.\n\n📞 ${phone()}`,
      () => `VAKANSIYA: ${job}\nKompaniya: ${company}\nManzil: ${region}\nTalablar: ${req}\n${salary}\nRezyumeni yuboring yoki qo'ng'iroq qiling: ${phone()}`,
      () => `${company} jamoasiga ${job} taklif qilinadi.\n📍 ${region}\n✅ ${req}\n💰 ${salary}\n✅ Ijtimoiy paket, o'z vaqtida oylik\nAloqa: ${phone()}`
    ])();
  }

  function scam(region) {
    return pick([
      () => `🇰🇷 KOREYAGA ISH! Viza 100% kafolat! Oyiga $${pick([2000, 2500, 3000])} dan. Tajriba shart emas.\nHujjatlarni rasmiylashtirish uchun to'lov ${pick([300, 500, 700])}$. Joylar cheklangan, shoshiling!\n${region}dan qabul. Lichkaga yozing`,
      () => `Uydan turib telefon orqali kuniga ${pick(['300 000', '500 000'])} so'mdan daromad! Tajriba shart emas.\nRo'yxatdan o'tish uchun to'lov 99 000 so'm. Batafsil lichkada.`,
      () => `💸 Investitsiya loyihasi! 1 mln qo'ying — oyiga 30% daromad. Do'stingizni taklif qiling va bonus oling. ${region}. Lichkaga yozing`,
      () => `Срочно! Работа в Польше на складе, зарплата от ${pick([1800, 2000, 2200])}$. Без опыта. Оплата за оформление документов ${pick([250, 300])}$. Подробности в лс. Набор из г. ${region}`,
      () => `Operator kerak, oyiga ${pick([25, 30])} mln so'm, tajriba shart emas! ${region}. Ishga kirish uchun karta raqamingiz va SMS kodni yuboring.`,
      () => `Kuryer kerak! ${region}. Kuniga $${pick([60, 80])}. O'qish puli 200 000 so'm (keyin qaytariladi). Faqat bugun!`,
      () => `Germaniyaga ishga! Kafolatlangan viza, oyiga 3000 € gacha. Tajriba shart emas. Oldindan to'lov 400$. Shoshiling!`
    ])();
  }

  function discriminatory(region) {
    return pick([
      () => `${region}dagi ofisga ofis-menejer kerak.\nTalablar: faqat qizlar, 20–27 yosh, ko'rinishi chiroyli, turmushga chiqmagan.\nMaosh: ${between(3, 5)} mln so'm\n📞 ${phone()}`,
      () => `Sotuvchi kerak! ${region}. 18–25 yoshgacha qizlar, bo'yi 165 dan baland. Maosh ${between(3, 4.5)} mln so'm. Tel: ${phone()}`,
      () => `Haydovchi kerak. Faqat erkaklar, ${region}. 35 yoshgacha, shu shahar propiskasi bo'lishi shart. Maosh ${between(5, 8)} mln so'm. ${phone()}`,
      () => `Требуется администратор в салон (${region}), девушка до 30 лет, приятной внешности. Зарплата ${between(4, 6)} млн сум. ${phone()}`,
      () => `Buxgalter kerak. ${region}. Talab: 30 yoshgacha, ayollar, turmush qurmagan. Maosh suhbat asosida. ${phone()}`
    ])();
  }

  const CHANNELS = ['@namuna_ish_kanal_1', '@namuna_ish_kanal_2', '@namuna_vakansiya_uz', '@namuna_ish_bor', '@namuna_xorij_ish'];
  const now = new Date('2026-10-10T12:00:00');
  const data = [];
  for (let i = 0; i < 400; i++) {
    const region = weighted(REGIONS);
    const r = rand();
    const text = r < 0.62 ? legit(region) : r < 0.82 ? scam(region) : discriminatory(region);
    const date = new Date(now.getTime() - Math.floor(rand() * 30) * 864e5);
    data.push({ id: i + 1, text, date: date.toISOString().slice(0, 10), channel: pick(CHANNELS) });
  }

  global.SAMPLE_VACANCIES = data;
})(typeof window !== 'undefined' ? window : globalThis);
