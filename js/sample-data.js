// NAMUNAVIY (SINTETIK) MA'LUMOT — faqat demo uchun.
// Haqiqiy ma'lumot: saytga Telegram eksportini yuklang yoki tools/telegram_export.py -> js/real-data.js
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
  const weighted = list => {
    const total = list.reduce((s, x) => s + x[1], 0);
    let r = rand() * total;
    for (const [v, w] of list) if ((r -= w) < 0) return v;
    return list[0][0];
  };

  const REGIONS = [
    ['Toshkent shahri', 30], ['Toshkent viloyati', 6], ['Samarqand', 8], ["Farg'ona", 7], ['Andijon', 6],
    ['Namangan', 6], ['Buxoro', 5], ['Qashqadaryo', 5], ['Surxondaryo', 4], ['Xorazm', 4],
    ['Navoiy', 3], ['Jizzax', 3], ['Sirdaryo', 2], ["Qoraqalpog'iston", 3]
  ];
  const REGIONS_CYRL = {
    'Toshkent shahri': 'Тошкент шаҳри', 'Samarqand': 'Самарқанд', "Farg'ona": 'Фарғона', 'Andijon': 'Андижон',
    'Namangan': 'Наманган', 'Buxoro': 'Бухоро', 'Qashqadaryo': 'Қашқадарё', 'Xorazm': 'Хоразм'
  };

  // [lavozim, maosh min, maosh max (mln so'm), kompaniya, talablar, talab vazni]
  const JOBS = [
    ['Frontend dasturchi', 9, 22, "«Smart Code» MChJ", 'React, TypeScript, Git, 1 yillik tajriba', 4],
    ['Python dasturchi (backend)', 10, 25, "«Data Soft» MChJ", 'Python, Django/FastAPI, SQL, Git', 4],
    ['Data tahlilchi', 9, 18, "«Raqamli Bank» AJ", 'SQL, Power BI, Excel, ingliz tili', 2],
    ['UI/UX dizayner', 7, 15, "«Pixel Studio» MChJ", 'Figma, portfolio', 2],
    ['SMM mutaxassis', 5, 10, "«Brend Media» agentligi", 'Instagram, target reklama, video montaj', 4],
    ['Marketolog', 6, 12, "«Baraka Trade» MChJ", 'target reklama, CRM, tahlil', 2],
    ['Sotuvchi-konsultant', 3, 5, "«Yangi Davr» savdo markazi", "muloqot, o'zbek va rus tili", 6],
    ['Kassir', 3, 4.5, "«Baraka Market» supermarketi", "kompyuter savodxonligi, ma'suliyat", 5],
    ["Ingliz tili o'qituvchisi", 5, 10, "«Bilim» o'quv markazi", 'IELTS 7.0+, pedagogik tajriba', 4],
    ["Matematika o'qituvchisi", 4, 8, "«Kelajak» xususiy maktabi", "oliy ma'lumot, 2 yil tajriba", 3],
    ['Hamshira', 3.5, 6, "«Nur Med» klinikasi", "tibbiy ma'lumot, sertifikat", 3],
    ['Stomatolog', 8, 20, "«Oq Tabassum» MChJ", "oliy tibbiy ma'lumot", 2],
    ['Payvandchi', 6, 10, "«Mustahkam Qurilish» MChJ", '3-razryad, tajriba', 3],
    ['Elektrik', 5, 9, "«Energo Servis» MChJ", 'elektr xavfsizligi guruhi', 3],
    ['Kuryer', 4, 8, "«Tez Yetkaz» xizmati", 'smartfon, velosiped yoki skuter', 5],
    ['Haydovchi (B toifa)', 5, 9, "«Logistika Plus» MChJ", 'B toifali guvohnoma, 3 yil staj', 4],
    ['Buxgalter', 5, 10, "«Audit Pro» MChJ", '1C, Excel, soliq hisoboti', 4],
    ['Call-markaz operatori', 3.5, 6, "«Aloqa Servis» MChJ", "muloqot, o'zbek va rus tili, kompyuter savodxonligi", 5],
    ['Oshpaz', 5, 10, "«Milliy Taomlar» restorani", 'milliy taomlar tajribasi', 3],
    ['Ofitsiant', 3, 5, "«Choyxona Navro'z»", 'xushmuomalalik', 3],
    ['Ombor ishchisi', 3.5, 5.5, "«Logistika Plus» MChJ", 'jismoniy chidamlilik', 2]
  ];
  const jobPool = JOBS.map(j => [j, j[5]]);

  const phone = () => `+998 ${pick(['90', '91', '93', '94', '97', '99', '33', '88'])} ${100 + Math.floor(rand() * 900)} ${10 + Math.floor(rand() * 90)} ${10 + Math.floor(rand() * 90)}`;
  const stir = () => String(300000000 + Math.floor(rand() * 99999999));

  function legit(region) {
    const [job, lo, hi, company, req] = weighted(jobPool);
    const a = between(lo, (lo + hi) / 2), b = between((lo + hi) / 2, hi);
    const salary = rand() < 0.3 ? 'Maosh: suhbat asosida' : `Maosh: ${a}–${b} mln so'm`;
    const extra = rand() < 0.35 ? `\nSTIR: ${stir()}` : '';
    return pick([
      () => `📢 ${company} ${region}dagi filialiga ${job} kerak.\n\nTalablar: ${req}.\n${salary}\nIsh vaqti: 9:00–18:00, rasmiy ishga joylashtirish.${extra}\n\n📞 ${phone()}`,
      () => `VAKANSIYA: ${job}\nKompaniya: ${company}${extra}\nManzil: ${region}\nTalablar: ${req}\n${salary}\nRezyumeni yuboring yoki qo'ng'iroq qiling: ${phone()}`,
      () => `${company} jamoasiga ${job} taklif qilinadi.\n📍 ${region}\n✅ ${req}\n💰 ${salary}\n✅ Ijtimoiy paket, o'z vaqtida oylik\nAloqa: ${phone()}`,
      () => `${job} kerak! ${region}.\n${salary}. Talab: ${req}.\nLichkaga yozing.`
    ])();
  }

  function legitCyrl(region) {
    const r = REGIONS_CYRL[region] || 'Тошкент шаҳри';
    return pick([
      () => `«Барака Маркет» МЧЖ ${r}даги дўконига сотувчи керак.\nТалаблар: муомала маданияти, рус тили.\nМаош: ${between(3, 5)} млн сўм\nИш вақти: 9:00–18:00\n📞 ${phone()}`,
      () => `Бухгалтер керак. ${r}.\nТалаб: 1C, Excel, 2 йил тажриба.\nМаош: ${between(5, 9)} млн сўм. Расмий ишга жойлаштириш.\nТел: ${phone()}`,
      () => `Ҳамшира керак, «Нур Мед» клиникаси, ${r}.\nТиббий маълумот, сертификат.\nМаош: ${between(3.5, 6)} млн сўм. ${phone()}`
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
      () => `Germaniyaga ishga! Kafolatlangan viza, oyiga 3000 € gacha. Tajriba shart emas. Oldindan to'lov 400$. Shoshiling!`,
      () => `P2P arbitraj orqali kuniga 1 000 000 so'mgacha! Telefon orqali ish, tajriba shart emas. Ro'yxatdan o'tish: bit.ly/ish-daromad`,
      () => `Rossiyaga qurilishga ishchilar kerak. Oyiga 150 000 rubl. Yo'l bepul. Pasportlar ish beruvchida turadi. Hujjat uchun to'lov 1 mln so'm.`,
      () => `Кореяга иш! Виза 100% кафолат. Ойига $2500. Тажриба шарт эмас. Ҳужжат учун тўлов 500$. Шошилинг!`
    ])();
  }

  function discriminatory(region) {
    return pick([
      () => `${region}dagi ofisga ofis-menejer kerak.\nTalablar: faqat qizlar, 20–27 yosh, ko'rinishi chiroyli, turmushga chiqmagan.\nMaosh: ${between(3, 5)} mln so'm\n📞 ${phone()}`,
      () => `Sotuvchi kerak! ${region}. 18–25 yoshgacha qizlar, bo'yi 165 dan baland. Maosh ${between(3, 4.5)} mln so'm. Tel: ${phone()}`,
      () => `Haydovchi kerak. Faqat erkaklar, ${region}. 35 yoshgacha, shu shahar propiskasi bo'lishi shart. Maosh ${between(5, 8)} mln so'm. ${phone()}`,
      () => `Требуется администратор в салон (${region}), девушка до 30 лет, приятной внешности. Зарплата ${between(4, 6)} млн сум. ${phone()}`,
      () => `Buxgalter kerak. ${region}. Talab: 30 yoshgacha, ayollar, turmush qurmagan, 1C bilishi shart. Maosh suhbat asosida. ${phone()}`,
      () => `«Smart Code» MChJ ga Python dasturchi kerak. ${region}. Faqat yigitlar, 28 yoshgacha. Maosh ${between(10, 18)} mln so'm. ${phone()}`
    ])();
  }

  // Kanallar har xil "tozalikka" ega: [nom, halol, firibgar, kamsituvchi] ehtimollari
  const CHANNELS = [
    ['@namuna_rasmiy_ish', 0.92, 0.02, 0.06],
    ['@namuna_ish_toshkent', 0.70, 0.12, 0.18],
    ['@namuna_vakansiya_uz', 0.64, 0.14, 0.22],
    ['@namuna_ish_bor', 0.48, 0.36, 0.16],
    ['@namuna_xorij_ish', 0.20, 0.75, 0.05],
    ['@namuna_ish_viloyat', 0.68, 0.12, 0.20]
  ];

  const now = new Date('2026-10-10T12:00:00');
  const data = [];
  for (let i = 0; i < 600; i++) {
    const [channel, pOk, pScam] = weighted(CHANNELS.map(c => [c, [2, 2, 2.2, 1.6, 1, 1.4][CHANNELS.indexOf(c)]]));
    const region = weighted(REGIONS);
    const r = rand();
    let text;
    if (r < pOk) text = rand() < 0.08 ? legitCyrl(region) : legit(region);
    else if (r < pOk + pScam) text = scam(region);
    else text = discriminatory(region);
    const date = new Date(now.getTime() - Math.floor(rand() * 30) * 864e5);
    data.push({ id: i + 1, text, date: date.toISOString().slice(0, 10), channel });
  }

  global.SAMPLE_VACANCIES = data;
})(typeof window !== 'undefined' ? window : globalThis);
