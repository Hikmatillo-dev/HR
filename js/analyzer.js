// IshQalqon — vakansiya matnini tahlil qiluvchi qoidalar tizimi.
// Har bir qoida "nima uchun" degan savolga javob beradi (tushuntiriladigan tahlil).
// Brauzerda ham, Node.js'da ham ishlaydi (server, Telegram bot, testlar).
(function (global) {
  'use strict';

  const USD_RATE = 12600; // taxminiy kurs, so'm / $
  const EUR_RATE = 13700; // taxminiy kurs, so'm / €
  const RUB_RATE = 150;   // taxminiy kurs, so'm / rubl

  // ---------- Firibgarlik belgilari ----------
  const SCAM_RULES = [
    {
      id: 'prepay', weight: 40, label: "Oldindan pul so'ralmoqda",
      detail: "Halol ish beruvchi ishga olish uchun pul so'ramaydi. Bu firibgarlikning eng kuchli belgisi.",
      re: /oldindan\s+(to'lov|pul)|to'lov\s+qilish(ingiz)?\s+kerak|pul\s+(to'lab|tashlab|o'tkazib)|ro'yxatdan\s+o'tish\s+(uchun\s+)?(to'lov|pul)|rasmiylashtirish\s+uchun\s+(to'lov|pul)|(hujjat\w*|forma|kiyim|tibbiy\s+ko'rik|test|imtihon|trening|o'qish|kurs)\s+(uchun\s+)?(to'lov|puli?)\b|o'qish\s+puli|depozit|garov\s+puli|predoplata|предоплат|оплат\w*\s+за\s+(оформлени|обучени|регистрац|документ|форм|медосмотр)|взнос|залог/
    },
    {
      id: 'personal', weight: 30, label: "Karta yoki shaxsiy ma'lumot so'ralmoqda",
      detail: "Karta raqami, SMS kod yoki pasport rasmini notanish odamga yuborish pulingiz va shaxsingiz o'g'irlanishiga olib keladi.",
      re: /karta\s*(raqam|ma'lumot)|sms\s*kod|номер\s+карт|код\s+из\s+смс|pasport\s+(nusxa|rasm|ma'lumot)\w*\s+(yuboring|tashlang)|паспорт\w*\s+(фото|скан)/
    },
    {
      id: 'passport', weight: 35, label: "Pasportni topshirish talab qilinmoqda",
      detail: "Ish beruvchi pasportingizni olib qolishi qonunga zid va odam savdosining asosiy belgilaridan biri.",
      re: /pasport\w*\s+(garov|qoldir|ish\s+beruvchida|bizda\s+turadi)|паспорт\w*\s+(оставля|в\s+залог|храни\w+\s+у\s+работодател)/
    },
    {
      id: 'visa', weight: 25, label: "Viza yoki ish \"100% kafolatlangan\"",
      detail: "Hech kim vizani kafolatlay olmaydi. Xorijga ishga faqat litsenziyaga ega agentliklar yoki davlat dasturlari orqali boriladi.",
      re: /viza\s*(100\s*%|kafolat|tayyor)|kafolatlangan\s+(viza|ish)|100\s*%\s*(kafolat|гарант)|гарантир\w*\s+(виз|трудоустр)/
    },
    {
      id: 'invest', weight: 25, label: "Investitsiya, piramida yoki referal sxema",
      detail: "Ish o'rniga pul tikish yoki odam taklif qilish so'ralsa, bu moliyaviy piramida bo'lishi mumkin.",
      re: /investitsiya|sarmoya|piramida|referal|do'st\w*ni\s+taklif|kripto|forex|p2p|arbitraj|treyding|bot\s+orqali\s+daromad|инвест|реферал|крипт|форекс|арбитраж|трейдинг/
    },
    {
      id: 'easy', weight: 20, label: '"Oson pul" va\'dasi',
      detail: "Kam mehnat evaziga katta daromad va'da qilinishi jalb qilish usulidir.",
      re: /tez\s+pul|oson\s+pul|kuniga\s+\$?\s*\d[\d\s]*\$?|uydan\s+turib[^.\n]*(kuniga|oyiga|daromad)|telefon\s+orqali\s+(ish|daromad)|passiv\s+daromad|л[её]гк\w+\s+(деньг|заработ)|пассивн\w+\s+доход/
    },
    {
      id: 'link', weight: 15, label: "Shubhali yoki qisqartirilgan havola",
      detail: "Qisqartirilgan havolalar va noma'lum saytlar orqali login, karta ma'lumotlari o'g'irlanadi (fishing).",
      re: /bit\.ly|tinyurl|cutt\.ly|clck\.ru|goo\.su|is\.gd|\b[a-z0-9-]+\.(xyz|top|click|icu|buzz|online)\b|http:\/\//
    },
    {
      id: 'abroad', weight: 10, label: 'Xorijga ish taklifi',
      detail: "Xorijdagi ish takliflarida firibgarlik ko'p uchraydi. Agentlik litsenziyasini Tashqi mehnat migratsiyasi agentligi orqali tekshiring.",
      re: /koreya|polsha|germaniya|chexiya|dubay|turkiya|rossiya|yevropa|xorij|chet\s+el|корея|корею|польш|германи|турци|дубай|европ|за\s+границ|за\s+рубеж/
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

  // ---------- Ishonch belgilari (xavfni kamaytiradi) ----------
  const TRUST_RULES = [
    { id: 'stir', weight: 10, label: "STIR (INN) ko'rsatilgan", re: /(stir|inn|инн)\s*:?\s*\d{9}\b/ },
    { id: 'legal', weight: 5, label: "Yuridik shakli ko'rsatilgan (MChJ, AJ...)", re: /\b(mchj|aj|xk|ooo|ao|chp|ytt)\b/ },
    { id: 'official', weight: 5, label: 'Rasmiy ishga joylashtirish', re: /rasmiy\s+(ishga|bandlik)|mehnat\s+daftarcha|mehnat\s+shartnoma|официальн\w+\s+трудоустр|трудов\w+\s+договор/ },
    { id: 'site', weight: 5, label: "Kompaniya sayti ko'rsatilgan", re: /https:\/\/[a-z0-9.-]+\.(uz|com|org|net)\b|\bwww\.[a-z0-9-]+\.(uz|com)\b/ },
    { id: 'address', weight: 5, label: "Aniq manzil ko'rsatilgan", re: /manzil\s*:|mo'ljal\s*:|adres\s*:|orientir\s*:|\bko'chasi\b|\bulisa\b|\bmahalla\b/ }
  ];

  // ---------- Kamsitish ----------
  const DISCRIMINATION_RULES = [
    {
      id: 'age', label: 'Yosh cheklovi',
      fix: "Yosh chegarasini olib tashlang. Buning o'rniga kerakli tajriba yoki ko'nikmani yozing.",
      re: /\d{2}\s*[-–]\s*\d{2}\s*(yosh|лет)|\d{2}\s*yosh(gacha|dan\s+kichik)|до\s*\d{2}\s*лет|не\s+старше\s+\d{2}/
    },
    {
      id: 'gender', label: "Jins bo'yicha cheklov",
      fix: "\"Qizlar kerak\" o'rniga \"xodim kerak\" deb yozing. Ishni erkak ham, ayol ham bajara oladi.",
      re: /faqat\s+(qiz|ayol|erkak|yigit)\w*|(qizlar|yigitlar|erkaklar|ayollar)\s+kerak|qiz\s+bola\s+kerak|только\s+(девушк|мужчин|женщин|парн)\w*|требуется\s+девушка/
    },
    {
      id: 'appearance', label: "Tashqi ko'rinish talabi",
      fix: "Tashqi ko'rinish o'rniga \"xushmuomala\" yoki \"ozoda\" kabi kasbiy sifatlarni yozing.",
      re: /chiroyli|ko'rinishi\s+(yoqimli|chiroyli)|tashqi\s+ko'rinish|bo'yi\s+\d|приятн\w+\s+внешн|внешност|рост\s+от/
    },
    {
      id: 'marital', label: 'Oilaviy holat talabi',
      fix: "Oilaviy holatga oid talabni olib tashlang, uning ishga aloqasi yo'q.",
      re: /turmush(ga)?\s+(chiqmagan|qurmagan)|uylanmagan|bo'ydoq|farzand\w*siz|не\s+замужем|без\s+детей/
    },
    {
      id: 'origin', label: 'Millat yoki propiska talabi',
      fix: "Millat va propiska talabini olib tashlang. Kerak bo'lsa, \"ish joyiga yaqin yashovchi\" deb yozing.",
      re: /millati|propiska|прописк|только\s+(граждан|местн)|славян/
    }
  ];

  // ---------- Hududlar ----------
  const REGIONS = [
    ['Toshkent viloyati', /toshkent\s+viloyat|ташкентск\w+\s+обл|chirchiq|olmaliq|angren|nurafshon|bekobod/],
    ['Toshkent shahri', /toshkent|ташкент|tashkent|chilonzor|yunusobod|mirzo\s+ulug'bek|sergeli|yakkasaroy/],
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
    ['Xorij', /koreya|polsha|germaniya|chexiya|dubay|turkiya|rossiya|yevropa|xorij|chet\s+el|корея|корею|польш|германи|турци|дубай|европ|за\s+границ/]
  ];

  // ---------- Kasblar (soha bilan) ----------
  const PROFESSIONS = [
    ['Dasturchi', 'IT', /dasturchi|developer|frontend|backend|programmist|программист|fullstack|1c\s+dasturchi/],
    ['Data tahlilchi', 'IT', /data\s+(analyst|tahlilchi)|аналитик\s+данных|bi\s+analyst/],
    ['Dizayner', 'IT', /dizayner|дизайнер|ui\/ux|grafik\s+dizayn/],
    ['SMM mutaxassis', 'Marketing', /\bsmm\b|targetolog|таргетолог|kontent\s+menejer/],
    ['Marketolog', 'Marketing', /marketolog|маркетолог/],
    ['Stomatolog', 'Tibbiyot', /stomatolog|стоматолог/],
    ['Hamshira', 'Tibbiyot', /hamshira|медсестр/],
    ['Shifokor', 'Tibbiyot', /shifokor|vrach|врач/],
    ['Farmatsevt', 'Tibbiyot', /farmatsevt|фармацевт|provizor/],
    ["O'qituvchi", "Ta'lim", /o'qituvchi|ustoz|repetitor|учител|преподавател/],
    ['Tarbiyachi', "Ta'lim", /tarbiyachi|воспитател/],
    ['Payvandchi', 'Qurilish', /payvandchi|сварщик/],
    ['Elektrik', 'Qurilish', /elektrik|электрик|elektromontyor/],
    ['Quruvchi', 'Qurilish', /quruvchi|строител|suvoqchi|g'isht\s+teruvchi|santexnik/],
    ['Kuryer', 'Transport', /kuryer|курьер/],
    ['Haydovchi', 'Transport', /haydovchi|водител|taksi/],
    ['Sotuvchi', 'Savdo', /sotuvchi|продав/],
    ['Kassir', 'Savdo', /kassir|кассир/],
    ['Savdo agenti', 'Savdo', /savdo\s+agent|торгов\w+\s+агент|merchandayzer/],
    ['Buxgalter', 'Ofis', /buxgalter|бухгалтер/],
    ['Operator', 'Ofis', /operator|оператор|call[-\s]?markaz|call[-\s]?center/],
    ['Administrator', 'Ofis', /administrator|администратор|resepshn|kotib/],
    ['Menejer', 'Ofis', /menejer|менеджер/],
    ['Oshpaz', 'Xizmat', /oshpaz|povar|повар/],
    ['Ofitsiant', 'Xizmat', /ofitsiant|официант/],
    ['Farrosh', 'Xizmat', /farrosh|уборщи|qorovul|охранник/],
    ['Ombor ishchisi', 'Xizmat', /omborchi|ombor|склад|qadoqlovchi|упаковщ/]
  ];

  // ---------- Ko'nikmalar ----------
  // digital: true — zamonaviy (raqamli) ko'nikma
  const SKILLS = [
    ['Python', true, /python/], ['JavaScript', true, /javascript|\bjs\b/], ['TypeScript', true, /typescript/],
    ['React', true, /react/], ['Node.js', true, /node\.?js/], ['SQL', true, /\bsql\b|postgres|mysql/],
    ['Java', true, /\bjava\b/], ['PHP', true, /\bphp\b|laravel/], ['C# / .NET', true, /c#|\.net/],
    ['Flutter', true, /flutter/], ['Git', true, /\bgit\b/], ['Django / FastAPI', true, /django|fastapi/],
    ['1C', true, /\b1c\b|1с/], ['Excel', true, /excel/], ['Power BI', true, /power\s*bi/],
    ['Figma', true, /figma/], ['Photoshop', true, /photoshop/], ['AutoCAD', true, /autocad/],
    ['Video montaj', true, /montaj|premiere|capcut/], ['Target reklama', true, /target|таргет/],
    ['SMM', true, /\bsmm\b|instagram|kontent/], ['CRM', true, /\bcrm\b|amocrm|bitrix/],
    ['Kompyuter savodxonligi', true, /kompyuter\s+savodxon|компьютер|ms\s+office|word\b/],
    ['Ingliz tili', false, /ingliz|english|английск|ielts/], ['Rus tili', false, /rus\s+tili|русск/],
    ['Koreys tili', false, /koreys|topik|корейск/], ['Nemis tili', false, /nemis|немецк/],
    ['Haydovchilik guvohnomasi', false, /guvohnoma|toifa|права\s+категории/],
    ['Oliy ma\'lumot', false, /oliy\s+(ma'lumot|tibbiy)|высшее/], ['Muloqot', false, /muloqot|kommunikab|xushmuomala|коммуникаб/],
    ['Soliq hisoboti', false, /soliq|налог/], ['Payvandlash', false, /payvand|razryad|сварк/]
  ];

  // JavaScript'da \w faqat lotin harflarini tanidi — kirill uchun Unicode harflar sinfiga almashtiramiz
  const unicodeRe = re => new RegExp(re.source.replace(/\\w/g, "[\\p{L}\\d_']"), 'u');
  [SCAM_RULES, TRUST_RULES, DISCRIMINATION_RULES].forEach(list => list.forEach(r => { r.re = unicodeRe(r.re); }));
  [REGIONS, PROFESSIONS, SKILLS].forEach(list => list.forEach(item => { item[item.length - 1] = unicodeRe(item[item.length - 1]); }));

  // ---------- Kirill → lotin (o'zbek) ----------
  const CYR = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y',
    'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
    'х': 'x', 'ц': 's', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': "'", 'ь': '', 'ы': 'i', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ў': "o'", 'қ': 'q', 'ғ': "g'", 'ҳ': 'h'
  };
  const transliterate = t => t.replace(/[а-яёўқғҳ]/g, c => CYR[c] ?? c);

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
    const eur = /€\s*(\d[\d\s,]*\d|\d)|(\d[\d\s,]*\d|\d)\s*(?:€|eur|yevro|евро)/g;
    const rub = /(\d[\d\s]*\d|\d)\s*(?:rubl|руб)/g;
    // To'lov summasi (masalan "hujjat uchun to'lov 500$") maosh emas — o'tkazib yuboramiz
    const isFee = idx => /(to'lov|puli?|uchun|depozit|garov|оплат|предоплат|взнос|залог)[^.\n]{0,12}$/.test(t.slice(Math.max(0, idx - 30), idx));
    let m;
    while ((m = mln.exec(t))) {
      if (isFee(m.index)) continue;
      if (m[1]) values.push(toNumber(m[1]));
      values.push(toNumber(m[2]));
    }
    while ((m = som.exec(t))) if (!isFee(m.index)) values.push(toNumber(m[1].replace(/[.,]/g, '')) / 1e6);
    while ((m = usd.exec(t))) if (!isFee(m.index)) values.push(toNumber(m[1] || m[2]) * USD_RATE / 1e6);
    while ((m = eur.exec(t))) if (!isFee(m.index)) values.push(toNumber(m[1] || m[2]) * EUR_RATE / 1e6);
    while ((m = rub.exec(t))) if (!isFee(m.index)) values.push(toNumber(m[1]) * RUB_RATE / 1e6);

    const daily = /kuniga|kunlik|в\s+день/.test(t);
    const clean = values
      .filter(v => isFinite(v))
      .map(v => (daily ? v * 26 : v))
      .filter(v => v >= 0.8 && v <= 500); // to'lovlar va tasodifiy raqamlarni chiqarib tashlash
    if (!clean.length) return null;
    const r = v => Math.round(v * 10) / 10;
    return { min: r(Math.min(...clean)), max: r(Math.max(...clean)), daily };
  }

  function firstMatch(list, t) {
    for (const item of list) if (item[item.length - 1].test(t)) return item;
    return null;
  }

  // Matndagi nomzodlarni "dedup" qilish uchun kalit (raqamlar va bo'shliqlarsiz)
  function fingerprint(text) {
    // Telefon raqamlarini olib tashlaymiz: bir xil e'lon har xil raqam bilan qayta joylanadi
    return normalize(text).replace(/\+?998[\d\s()-]{9,}|\d{2,3}[\s-]\d{3}[\s-]\d{2}[\s-]\d{2}/g, '')
      .replace(/[^\p{L}\d]+/gu, ' ').trim().slice(0, 200);
  }

  function analyze(text) {
    const n = normalize(text);
    // Kirill o'zbekcha matn ham lotin qoidalariga tushishi uchun ikkala variant tekshiriladi
    const t = /[а-яё]/.test(n) ? n + ' \n ' + transliterate(n) : n;

    const scam = [];
    for (const rule of SCAM_RULES) {
      const m = t.match(rule.re);
      if (m) scam.push({ id: rule.id, label: rule.label, detail: rule.detail, weight: rule.weight, match: m[0] });
    }

    const salary = extractSalary(t);
    const prof = firstMatch(PROFESSIONS, t);
    const profession = prof ? prof[0] : 'Boshqa';
    const category = prof ? prof[1] : 'Boshqa';
    const noExperience = /tajriba\s*(siz|shart\s+emas|talab\s+qilinmaydi|kerak\s+emas)|без\s+опыта|опыт\s+не\s+(нужен|обязател)/.test(t);
    if (salary && noExperience && salary.max >= 15) {
      scam.push({
        id: 'salary', weight: 20, label: 'Tajribasiz ish uchun haddan tashqari yuqori maosh',
        detail: `Oyiga taxminan ${salary.max} mln so'm va'da qilinmoqda, lekin tajriba talab qilinmaydi. Bunday taklif real bozorga mos emas.`,
        match: `${salary.max} mln so'm`
      });
    } else if (salary && salary.max >= 40 && category !== 'IT') {
      scam.push({
        id: 'salary', weight: 15, label: 'Bozor darajasidan ancha yuqori maosh',
        detail: `Oyiga taxminan ${salary.max} mln so'm. Bu kasb uchun odatiy darajadan bir necha barobar yuqori.`,
        match: `${salary.max} mln so'm`
      });
    }

    const trust = [];
    for (const rule of TRUST_RULES) {
      const m = t.match(rule.re);
      if (m) trust.push({ id: rule.id, label: rule.label, weight: rule.weight, match: m[0] });
    }

    const discrimination = [];
    for (const rule of DISCRIMINATION_RULES) {
      const m = t.match(rule.re);
      if (m) discrimination.push({ id: rule.id, label: rule.label, fix: rule.fix, match: m[0] });
    }

    const skills = SKILLS.filter(s => s[2].test(t)).map(s => ({ name: s[0], digital: s[1] }));

    const hasPhone = /\+?998[\s-]?\(?\d{2}\)?[\s-]?\d{3}|\+?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/.test(t);
    const hasContact = hasPhone || /@[a-z0-9_]{4,}|e-?mail|pochta/.test(t);
    const regionItem = firstMatch(REGIONS, t);

    // Shaffoflik indeksi: e'lon nomzodga qancha kerakli ma'lumot beradi (0–100)
    const checks = [
      ['salary', "Maosh ko'rsatilgan", 30, !!salary],
      ['contact', "Aloqa ma'lumoti bor", 15, hasContact],
      ['company', "Kompaniya nomi yoki STIR bor", 15, /«[^»]+»|"[^"]{3,}"|\b(mchj|ooo|xk)\b|(stir|inn|инн)\s*:?\s*\d{9}/.test(t)],
      ['place', "Hudud yoki manzil ko'rsatilgan", 10, !!regionItem || trust.some(x => x.id === 'address')],
      ['schedule', "Ish vaqti yoki grafigi bor", 10, /ish\s+vaqti|grafik|smena|\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}|график|смен/.test(t)],
      ['requirements', "Talablar aniq yozilgan", 10, /talab|tajriba|требован|опыт/.test(t) || skills.length > 0],
      ['official', 'Rasmiy ishga joylashtirish', 10, trust.some(x => x.id === 'official')]
    ];
    const transparency = {
      score: checks.reduce((s, c) => s + (c[3] ? c[2] : 0), 0),
      checks: checks.map(c => ({ id: c[0], label: c[1], weight: c[2], ok: c[3] }))
    };

    const raw = scam.reduce((s, r) => s + r.weight, 0);
    const critical = scam.some(r => r.id === 'prepay' || r.id === 'personal' || r.id === 'passport');
    // Ishonch belgilari xavfni kamaytiradi, lekin pul yoki hujjat so'ralsa — yo'q
    const trustBonus = critical ? 0 : Math.min(15, trust.reduce((s, r) => s + r.weight, 0));
    const score = Math.max(0, Math.min(100, raw - (raw > 0 ? trustBonus : 0)));
    const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

    return {
      score, level, scam, trust, discrimination, transparency, salary, skills,
      profession, category, noExperience, hasContact,
      region: regionItem ? regionItem[0] : "Noma'lum",
      script: /[а-яё]/.test(n) ? (/[ўқғҳ]/.test(n) ? 'uz-cyrl' : 'ru') : 'uz-latn'
    };
  }

  global.IshQalqon = {
    analyze, normalize, fingerprint, transliterate,
    SCAM_RULES, TRUST_RULES, DISCRIMINATION_RULES, USD_RATE,
    REGION_NAMES: REGIONS.map(r => r[0]),
    LEVEL_TEXT: { high: 'Yuqori xavf', medium: "O'rtacha xavf", low: 'Past xavf' }
  };
})(typeof window !== 'undefined' ? window : globalThis);
