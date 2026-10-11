// IshQalqon — vakansiya matnini tahlil qiluvchi qoidalar tizimi.
// Har bir qoida "nima uchun shubhali" ekanini tushuntiradi (explainable AI).
(function (global) {
  'use strict';

  const USD_RATE = 12600; // taxminiy kurs, so'm / $

  const SCAM_RULES = [
    {
      id: 'prepay', weight: 40, label: "Oldindan pul so'ralmoqda",
      detail: "Halol ish beruvchi ishga olish uchun pul so'ramaydi. Bu firibgarlikning eng kuchli belgisi.",
      re: /oldindan\s+(to'lov|pul)|to'lov\s+qilish(ingiz)?\s+kerak|pul\s+(to'lab|tashlab|o'tkazib)|ro'yxatdan\s+o'tish\s+(uchun\s+)?(to'lov|pul)|rasmiylashtirish\s+uchun\s+(to'lov|pul)|hujjat\w*\s+uchun\s+(to'lov|pul)|o'qish\s+puli|kurs\s+(uchun\s+)?(to'lov|puli)|depozit|predoplata|предоплат|оплат\w*\s+за\s+(оформлени|обучени|регистрац|документ)|взнос/
    },
    {
      id: 'personal', weight: 30, label: "Karta yoki shaxsiy ma'lumot so'ralmoqda",
      detail: "Karta raqami, SMS kod yoki pasport rasmini notanish odamga yuborish pulingiz va shaxsingiz o'g'irlanishiga olib keladi.",
      re: /karta\s*(raqam|ma'lumot)|sms\s*kod|номер\s+карт|код\s+из\s+смс|pasport\s+(nusxa|rasm|ma'lumot)\w*\s+(yuboring|tashlang)|паспорт\w*\s+(фото|скан)/
    },
    {
      id: 'visa', weight: 25, label: "Viza yoki ish \"100% kafolatlangan\"",
      detail: "Hech kim vizani kafolatlay olmaydi. Xorijga ishga faqat litsenziyaga ega agentliklar yoki davlat dasturlari orqali boriladi.",
      re: /viza\s*(100\s*%|kafolat|tayyor)|kafolatlangan\s+(viza|ish)|100\s*%\s*(kafolat|гарант)|гарантир\w*\s+(виз|трудоустр)/
    },
    {
      id: 'invest', weight: 25, label: "Investitsiya, piramida yoki referal sxema",
      detail: "Ish o'rniga pul tikish yoki odam taklif qilish so'ralsa, bu moliyaviy piramida bo'lishi mumkin.",
      re: /investitsiya|sarmoya|piramida|referal|do'st\w*ni\s+taklif|kripto|forex|bot\s+orqali\s+daromad|инвест|реферал|крипт|форекс/
    },
    {
      id: 'easy', weight: 20, label: '"Oson pul" va\'dasi',
      detail: "Kam mehnat evaziga katta daromad va'da qilinishi jalb qilish usulidir.",
      re: /tez\s+pul|oson\s+pul|kuniga\s+\$?\s*\d[\d\s]*\$?|uydan\s+turib[^.\n]*(kuniga|oyiga|daromad)|telefon\s+orqali\s+(ish|daromad)|passiv\s+daromad|л[её]гк\w+\s+(деньг|заработ)|пассивн\w+\s+доход/
    },
    {
      id: 'abroad', weight: 10, label: 'Xorijga ish taklifi',
      detail: "Xorijdagi ish takliflarida firibgarlik ko'p uchraydi. Agentlik litsenziyasini Migratsiya agentligi orqali tekshiring.",
      re: /koreya|polsha|germaniya|chexiya|dubay|turkiya|rossiya|yevropa|xorij|chet\s+el|корея|корею|польш|германи|европ|за\s+границ|за\s+рубеж/
    },
    {
      id: 'urgency', weight: 10, label: 'Shoshiltirish',
      detail: "\"Faqat bugun\", \"joylar cheklangan\" kabi iboralar o'ylab ko'rishga vaqt bermaslik uchun ishlatiladi.",
      re: /shoshiling|joylar\s+cheklangan|faqat\s+bugun|vaqt\s+kam|срочно|места\s+ограничен|только\s+сегодня/
    },
    {
      id: 'vague', weight: 10, label: 'Ish mazmuni yashirilgan',
      detail: "Ish haqidagi asosiy ma'lumot \"lichkada\" deb yashirilgan.",
      re: /batafsil\s+(ma'lumot\s+)?(lichkada|lichkaga)|ish\s+haqida\s+lichkada|подробност\w*\s+в\s+(лс|личк)/
    }
  ];

  const DISCRIMINATION_RULES = [
    {
      id: 'age', label: 'Yosh cheklovi',
      re: /\d{2}\s*[-–]\s*\d{2}\s*(yosh|лет)|\d{2}\s*yosh(gacha|dan\s+kichik)|до\s*\d{2}\s*лет|не\s+старше\s+\d{2}/
    },
    {
      id: 'gender', label: 'Jins bo\'yicha cheklov',
      re: /faqat\s+(qiz|ayol|erkak|yigit)\w*|(qizlar|yigitlar|erkaklar|ayollar)\s+kerak|qiz\s+bola\s+kerak|только\s+(девушк|мужчин|женщин|парн)\w*|требуется\s+девушка/
    },
    {
      id: 'appearance', label: 'Tashqi ko\'rinish talabi',
      re: /chiroyli|ko'rinishi\s+(yoqimli|chiroyli)|tashqi\s+ko'rinish|bo'yi\s+\d|приятн\w+\s+внешн|внешност|рост\s+от/
    },
    {
      id: 'marital', label: 'Oilaviy holat talabi',
      re: /turmush(ga)?\s+(chiqmagan|qurmagan)|uylanmagan|bo'ydoq|farzand\w*siz|не\s+замужем|без\s+детей/
    },
    {
      id: 'origin', label: 'Millat yoki propiska talabi',
      re: /millati|propiska|прописк|только\s+(граждан|местн)|славян/
    }
  ];

  const REGIONS = [
    ['Toshkent viloyati', /toshkent\s+viloyat|ташкентск\w+\s+обл|chirchiq|olmaliq|angren|nurafshon/],
    ['Toshkent shahri', /toshkent|ташкент|tashkent/],
    ["Qoraqalpog'iston", /qoraqalpog'iston|nukus|каракалпак|нукус/],
    ['Andijon', /andijon|андижан/],
    ["Farg'ona", /farg'ona|фергана|qo'qon|marg'ilon/],
    ['Namangan', /namangan|наманган/],
    ['Samarqand', /samarqand|самарканд/],
    ['Buxoro', /buxoro|бухар/],
    ['Navoiy', /navoiy|навои/],
    ['Qashqadaryo', /qashqadaryo|qarshi|кашкадар|карши/],
    ['Surxondaryo', /surxondaryo|termiz|сурхандар|термез/],
    ['Jizzax', /jizzax|джизак/],
    ['Sirdaryo', /sirdaryo|guliston|сырдар|гулистан/],
    ['Xorazm', /xorazm|urganch|хорезм|ургенч/],
    ['Xorij', /koreya|polsha|germaniya|chexiya|dubay|turkiya|rossiya|yevropa|xorij|chet\s+el|корея|корею|польш|германи|европ|за\s+границ/]
  ];

  const CATEGORIES = [
    ['IT', /dasturchi|developer|frontend|backend|python|java|programmist|программист|1c|smm|dizayner|дизайнер/],
    ['Tibbiyot', /hamshira|shifokor|stomatolog|vrach|врач|медсестр|farmatsevt|aptek/],
    ["Ta'lim", /o'qituvchi|ustoz|repetitor|учител|преподавател|tarbiyachi/],
    ['Qurilish', /quruvchi|payvandchi|elektrik|santexnik|строител|сварщик|электрик|usta\b/],
    ['Transport', /haydovchi|kuryer|курьер|водител|ekspeditor|taksi/],
    ['Savdo', /sotuvchi|kassir|продав|кассир|merchandayzer|savdo\s+agent/],
    ['Ofis', /buxgalter|menejer|operator|administrator|бухгалтер|менеджер|оператор|администратор|kotib|ofis/],
    ['Xizmat', /ofitsiant|oshpaz|povar|повар|официант|farrosh|qorovul|barista/]
  ];

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[‘’ʻʼ`´]/g, "'")
      .replace(/\s+/g, ' ');
  }

  function toNumber(s) {
    return parseFloat(String(s).replace(/[\s,](?=\d{3}\b)/g, '').replace(/\s/g, '').replace(',', '.'));
  }

  // Maoshni mln so'mda (oylik) ajratib olish.
  function extractSalary(t) {
    const values = [];
    const mln = /(?:(\d+(?:[.,]\d+)?)\s*[-–]\s*)?(\d+(?:[.,]\d+)?)\s*(?:mln|million|миллион|млн)/g;
    const som = /(\d{1,3}(?:[\s.,]\d{3})+|\d{4,})\s*(?:so'm|sum|сум|сўм)/g;
    const usd = /\$\s*(\d[\d\s,]*\d|\d)|(\d[\d\s,]*\d|\d)\s*(?:\$|usd|dollar|доллар)/g;
    let m;
    while ((m = mln.exec(t))) {
      if (m[1]) values.push(toNumber(m[1]));
      values.push(toNumber(m[2]));
    }
    while ((m = som.exec(t))) values.push(toNumber(m[1].replace(/[.,]/g, '')) / 1e6);
    while ((m = usd.exec(t))) values.push(toNumber(m[1] || m[2]) * USD_RATE / 1e6);

    const daily = /kuniga|kunlik|в\s+день/.test(t);
    const clean = values
      .filter(v => isFinite(v))
      .map(v => (daily ? v * 26 : v))
      .filter(v => v >= 0.8 && v <= 500); // to'lovlar va tasodifiy raqamlarni chiqarib tashlash
    if (!clean.length) return null;
    const r = v => Math.round(v * 10) / 10;
    return { min: r(Math.min(...clean)), max: r(Math.max(...clean)), daily };
  }

  function firstMatch(list, t, fallback) {
    for (const [name, re] of list) if (re.test(t)) return name;
    return fallback;
  }

  function analyze(text) {
    const t = normalize(text);
    const scam = [];
    for (const rule of SCAM_RULES) {
      const m = t.match(rule.re);
      if (m) scam.push({ id: rule.id, label: rule.label, detail: rule.detail, weight: rule.weight, match: m[0] });
    }

    const salary = extractSalary(t);
    const category = firstMatch(CATEGORIES, t, 'Boshqa');
    const noExperience = /tajriba\s*(siz|shart\s+emas|talab\s+qilinmaydi|kerak\s+emas)|без\s+опыта|опыт\s+не\s+(нужен|обязател)/.test(t);
    if (salary && noExperience && salary.max >= 15) {
      scam.push({
        id: 'salary', weight: 20, label: 'Tajribasiz ish uchun haddan tashqari yuqori maosh',
        detail: `Taxminan ${salary.max} mln so'm/oy va'da qilinmoqda, lekin tajriba talab qilinmaydi. Bunday taklif real bozorga mos emas.`,
        match: `${salary.max} mln so'm`
      });
    } else if (salary && salary.max >= 40 && category !== 'IT') {
      scam.push({
        id: 'salary', weight: 15, label: 'Bozor darajasidan ancha yuqori maosh',
        detail: `Taxminan ${salary.max} mln so'm/oy. Bu kasb uchun odatiy darajadan bir necha barobar yuqori.`,
        match: `${salary.max} mln so'm`
      });
    }

    const discrimination = [];
    for (const rule of DISCRIMINATION_RULES) {
      const m = t.match(rule.re);
      if (m) discrimination.push({ id: rule.id, label: rule.label, match: m[0] });
    }

    const transparency = [];
    if (!salary) transparency.push({ id: 'nosalary', label: "Maosh ko'rsatilmagan" });
    if (!/\+?998[\s-]?\(?\d{2}\)?[\s-]?\d{3}|\+?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/.test(t)) {
      transparency.push({ id: 'nophone', label: "Telefon raqami yo'q" });
    }

    const score = Math.min(100, scam.reduce((s, r) => s + r.weight, 0));
    const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

    return {
      score, level, scam, discrimination, transparency, salary, category, noExperience,
      region: firstMatch(REGIONS, t, "Noma'lum")
    };
  }

  global.IshQalqon = {
    analyze, SCAM_RULES, DISCRIMINATION_RULES, USD_RATE,
    REGION_NAMES: REGIONS.map(r => r[0]),
    LEVEL_TEXT: { high: 'Yuqori xavf', medium: "O'rtacha xavf", low: 'Past xavf' }
  };
})(typeof window !== 'undefined' ? window : globalThis);
