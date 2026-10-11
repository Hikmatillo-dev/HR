// IshQalqon — vakansiya matnini tahlil qiluvchi qoidalar tizimi.
// Har bir qoida "nima uchun" degan savolga javob beradi (tushuntiriladigan tahlil).
// Brauzerda ham, Node.js'da ham ishlaydi (server, Telegram bot, testlar).
(function (global) {
  'use strict';

  const USD_RATE = 12600; // taxminiy kurs, so'm / $
  const EUR_RATE = 13700; // taxminiy kurs, so'm / €
  const RUB_RATE = 150;   // taxminiy kurs, so'm / rubl

  // Xorijiy davlatlar (lotin + kirill/rus). Kirill o'zbekcha matn transliteratsiya orqali lotin qismiga tushadi.
  const ABROAD_RE = new RegExp([
    'koreya|yaponiya|xitoy(da|ga|dan)\\b|polsha|germaniya|chexiya|slovakiya|bolgariya|xorvatiya|serbiya|ruminiya|vengriya|litva|latviya|estoniya',
    "avstriya|italiya|ispaniya|gretsiya|finlyandiya|angliya|britaniya|\\bamerika(da|ga|dan|ning|lik)?\\b|\\baqsh\\b|kanada|\\bisroil(da|ga|dan|ning)?\\b|dubay|arab\\s+amirlik|\\bqatar|turkiya|rossiya|moskva",
    "yevropa|xorij|chet\\s+el|(ko'plab|boshqa|xorijiy|turli)\\s+davlat",
    'корея|корею|япони|китай(?!ск)|китае|польш|германи|чехи|словаки|болгари|хорвати|сербии|румыни|венгри|литв|латви|эстони',
    'австри|итали|испани|греци|финлянди|англи[яию](?![а-я])|британи|америк[аеиу](?![а-я])|сша(?![а-я])|канад|израил|дуба[йе]|оаэ|катар|турци|москв|петербург',
    'европ|за\\s+границ|за\\s+рубеж'
  ].join('|'));

  // ---------- Firibgarlik belgilari ----------
  const SCAM_RULES = [
    {
      id: 'prepay', weight: 40, label: "Oldindan pul so'ralmoqda", negatable: true,
      detail: "Halol ish beruvchi ishga olish uchun pul so'ramaydi. Bu firibgarlikning eng kuchli belgisi.",
      re: /oldindan\s+(to'lov|pul)|\d[\d\s.,]*\s*(\$|so'm|sum|сум|usd|dollar|ming|mln|евро|eur)\s*(\S+\s+)?oldindan|oldindan\s+\d[\d\s.,]*\s*(\$|so'm|sum|usd|dollar|ming|mln)|to'lov\s+qilish(ingiz)?\s+kerak|pul\s+(to'lab|tashlab|o'tkazib)|ro'yxatdan\s+o'tish\s+(uchun\s+)?(to'lov|pul)|rasmiylashtirish\s+uchun\s+(to'lov|pul)|([hx]ujjat\w*|forma|kiyim|tibbiy\s+ko'rik|test|imtihon|trening|o'qish|kurs)\s+(uchun\s+)?(to'lov|puli?)\b|o'qish\s+puli|xizmat\s+(haqi|narxi)\W{0,8}\d[\d\s.,]*\s*(so'm|sum|сум|сўм|\$|usd|dollar|ming|mln|eur|yevro)|стоимост\w*\s+услуг|услуг\w*\s+стоит|depozit|garov\s+puli|o'z\s+hisobingizdan|predoplata|предоплат|оплат\w*\s+за\s+(оформлени|обучени|регистрац|документ|форм|медосмотр|патент)|за\s+свой\s+сч[её]т|регистрац\w*\s+платн|платн\w*\s+регистрац|взнос|залог/
    },
    {
      id: 'personal', weight: 30, label: "Karta raqami yoki SMS kod so'ralmoqda",
      detail: "Karta raqami yoki SMS kodni hech kimga bermang: ular bilan kartangizdagi pul yechib olinadi. Maosh to'lash uchun SMS kod, PIN-kod yoki karta muddati hech qachon kerak bo'lmaydi.",
      re: /karta\s*(raqam|ma'lumot)|sms\s*kod|номер\s+карт|код\s+из\s+смс/
    },
    {
      // Pasport nusxasi o'zi firibgarlik emas (ko'p ish beruvchi so'raydi), lekin uni Telegramda notanish odamga
      // yuborish xavfli — shuning uchun alohida, kritik bo'lmagan belgi (o'rtacha xavf)
      id: 'idcopy', weight: 30, label: "Pasport nusxasi yoki rasmi yuborish so'ralmoqda",
      detail: "Pasport nusxasini notanish odamga Telegramda yubormang: u bilan sizning nomingizga kredit yoki SIM-karta rasmiylashtirish mumkin. Uni ish beruvchini tekshirgach, shaxsan yoki rasmiy ariza orqali bering.",
      re: /pasport\w*\s+(nusxa|rasm|surat|ma'lumot|skan)\w*\s+(\S+\s+){0,3}(yuboring|tashlang|jo'nating|yuborasiz)|(yuboring|tashlang|jo'nating)\s+(\S+\s+){0,2}pasport|паспорт\w*\s+(фото|скан|копи)|(фото|скан|копи)\w*\s+паспорт/
    },
    {
      id: 'passport', weight: 35, label: "Pasportni topshirish talab qilinmoqda",
      detail: "Ish beruvchi pasportingizni olib qolishi qonunga zid va odam savdosining asosiy belgilaridan biri.",
      re: /pasport\w*\s+(garov|qoldir|ish\s+beruvchida|bizda\s+(turadi|saqlanadi|qoladi))|pasport\w*\s+(\S+\s+){0,2}(topshir|yig'ib\s+olin|olib\s+qolin)|паспорт\w*\s+(оставл|оставит|оставь|в\s+залог|сда|отда|храни\w+\s+у\s+работодател)|(оставить|сдать)\s+паспорт/
    },
    {
      id: 'debt', weight: 35, label: "Qarz evaziga ishlash (qarz qulligi)",
      detail: "Yo'l yoki viza \"qarzi\"ni maoshdan ushlab qolish odamni ish beruvchiga qaram qilib qo'yadi. Bu odam savdosining belgisi.",
      re: /qarz\w*\s+(\S+\s+){0,3}(ushlab\s+qol|ayirib\s+qol)|(yo'l|viza|chipta|bilet|aviabilet|hujjat)\w*\s+(puli|xarajat\w*|haqi)[^.!?]{0,80}(maosh|oylik|ish\s+haqi)\w*dan\s+(ushlab|ayirib|chegirib)|(дорог|билет|перел[её]т|виз)\w*[^.!?]{0,80}(вычит|удерж)\w*\s+из\s+(зарплат|заработ)|ishlab\s+(uzasiz|qaytarasiz)|долг\w*\s+(\S+\s+){0,3}(вычит|удерж)|отработа(ете|ешь)\s+долг/
    },
    {
      id: 'illegal', weight: 20, label: "Noqonuniy ishlash taklif qilinmoqda",
      detail: "Hujjatsiz yoki patentsiz ishlash sizni deportatsiya va ish haqisiz qolish xavfiga qo'yadi.",
      re: /[hx]ujjatsiz\s+ish|patent\s+(shart\s+emas|kerak\s+emas)|patentsiz|без\s+(документов|патента)|нелегальн/
    },
    {
      id: 'entertain', weight: 20, label: "Ko'ngilochar sohada noaniq ish (hostes, raqqosa)",
      detail: "Xorijda \"hostes\", \"raqqosa\" yoki tungi klubga yosh qizlarni chaqirish odam savdosida ko'p uchraydi.",
      re: /hostes|raqqosa|eskort|tungi\s+klub|хостес|танцовщ|эскорт|ночн\w*\s+клуб/
    },
    {
      id: 'visa', weight: 25, label: "Viza yoki ish \"100% kafolatlangan\"",
      detail: "Hech kim vizani kafolatlay olmaydi. Xorijga ishga faqat litsenziyaga ega agentliklar yoki davlat dasturlari orqali boriladi.",
      re: /viza\w*\s*(100\s*%|kafolat|tayyor)|kafolatlangan\s+(viza|ish)|100\s*%\s*(kafolat|гарант)|гарантир\w*\s+(виз|трудоустр)/
    },
    {
      id: 'invest', weight: 25, label: "Investitsiya, piramida yoki referal sxema",
      detail: "Ish o'rniga pul tikish yoki odam taklif qilish so'ralsa, bu moliyaviy piramida bo'lishi mumkin.",
      re: /investitsiya|sarmoya|piramida|referal|tarmoq\s+marketing|greenway|gr[ei]e?nve[iy]|faberli[ck]|oriflame|orifleym|amway|herbalife|gerbalayf|siberian\s+wellness|coral\s+club|a'zo\s+bo'lish\s+(tekin|bepul)|\bmlm\b|jamoa\w*\s+quring|сетев\w+\s+маркетинг|(?<!kanal\w*\s)do'st\w*ni\s+taklif|kripto|forex|p2p|arbitraj|treyding|bot\s+orqali\s+daromad|инвест|реферал|крипт|форекс|арбитраж|трейдинг/
    },
    {
      id: 'easy', weight: 20, label: '"Oson pul" va\'dasi',
      detail: "Kam mehnat evaziga katta daromad va'da qilinishi jalb qilish usulidir.",
      re: /tez\s+pul|oson\s+pul|kuniga\s+\$?\s*\d[\d\s]*\$?(?![\d\s]*([-–]\s*\d+\s*)?(soat|час))|uydan\s+turib[^.\n]*(kuniga|oyiga|daromad)|telefon\s+orqali\s+(ish|daromad)|kunlik\s+(\d[\d\s]*\s*(ming|mln)\s+)?daromad|daromad\w*\s+cheksiz|cheksiz\s+daromad|yechib\s+oldim|telefon\s+(va\s+internet\s+)?bo'lsa\s+(kifoya|yetarli)|onla[yi]+n\s+daromad|online\s+daromad|passiv\s+daromad|л[её]гк\w+\s+(деньг|заработ)|пассивн\w+\s+доход|\d[\d\s]*\s*(сум|руб|\$|usd)\s+в\s+день|в\s+день\s+от\s+\d/
    },
    {
      id: 'link', weight: 15, label: "Shubhali yoki qisqartirilgan havola",
      detail: "Qisqartirilgan havolalar va noma'lum saytlar orqali login, karta ma'lumotlari o'g'irlanadi (fishing).",
      re: /bit\.ly|tinyurl|cutt\.ly|clck\.ru|goo\.su|is\.gd|\b[a-z0-9-]+\.(xyz|top|click|icu|buzz|online)\b|http:\/\//
    },
    {
      id: 'abroad', weight: 10, label: 'Xorijga ish taklifi',
      detail: "Xorijdagi ish takliflarida firibgarlik ko'p uchraydi. Agentlik litsenziyasini Tashqi mehnat migratsiyasi agentligi orqali tekshiring.",
      re: ABROAD_RE
    },
    {
      id: 'urgency', weight: 10, label: 'Shoshiltirish',
      detail: "\"Faqat bugun\", \"joylar cheklangan\" kabi iboralar o'ylab ko'rishga vaqt bermaslik uchun ishlatiladi.",
      re: /shoshiling|joylar\s+cheklangan|o'rin\w*\s+cheklangan|hozir(oq)?\s+boshlang|orqada\s+qolmang|ketish\s+muddati\s+qisqa|faqat\s+bugun|vaqt\s+kam|срочно|места\s+ограничен|только\s+сегодня/
    },
    {
      id: 'vague', weight: 10, label: 'Ish mazmuni yashirilgan',
      detail: "Ish haqidagi asosiy ma'lumot \"lichkada\" deb yashirilgan.",
      re: /batafsil\s+(ma'lumot\s+)?(lichkada|lichkaga)|ma'?lumot\w*\s+(ofi?e?s\w*|suhbat\w*)\s*(da\s+)?berila|yozsa?ng?iz\s+ma'?lumot|ish\s+haqida\s+lichkada|подробност\w*\s+в\s+(лс|личк)|(пишите|писать|вс[её])\s+в\s+(лс|личк)/
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
      re: /\d{2}\s*[-–]\s*\d{2}\s*(yosh|лет)(?!li\s+(o'quvchi|bola|talaba|o'smir|guruh))|\d{2}\s*yosh(gacha|dan\s+kichik)|yosh\w*\s*:?\s*\d{2}\s*[-–]\s*\d{2}|\d{2}\s*dan\s*\d{2}\s*yosh|(?<![\d.:\-–/])(1[6-9]|2\d)\s*[-–]\s*([2-5]\d)(?=\s*([,.;)]|$))|до\s*\d{2}\s*лет|не\s+старше\s+\d{2}|возраст\w*\s*:?\s*(от\s*)?\d{2}\s*[-–]/
    },
    {
      id: 'gender', label: "Jins bo'yicha cheklov",
      fix: "\"Qizlar kerak\" o'rniga \"xodim kerak\" deb yozing. Ishni erkak ham, ayol ham bajara oladi.",
      re: /ofitsiantka|официантк|продавщиц|секретарш|sekretarsha|fa[qk]at(gina)?\s+(qiz|ayol|erkak|yigit|o'?g'?il\s+bola)\w*|jins\w*\s*:?\s*#?(qiz|ayol|erkak|yigit)|#(qizlar|ayollar|ayoli|erkaklar|yigitlar)\b|(erkak|ayol|qiz|yigit)\w*\s*\(\s*\d{2}\s*[-–]|\d{2}\s*yosh\w*\s+(\S+\s+)?(qiz|ayol|erkak|yigit|o'?g'?il\s+bola)|(qizlar|yigitlar|erkaklar|ayollar)\s*(kerak|afzal|bo'lishi|[,.]|$)|chiroyli\s+qiz|qiz\s+bola\s+kerak|только\s+(девушк|мужчин|женщин|парн)\w*|требу\w+\s+(девушк|мужчин|женщин|парн)|для\s+девуш|девушк\w*\s+(до|от)\s+\d/
    },
    {
      id: 'appearance', label: "Tashqi ko'rinish talabi",
      fix: "Tashqi ko'rinish o'rniga \"xushmuomala\" yoki \"ozoda\" kabi kasbiy sifatlarni yozing.",
      re: /chiroyli(?!\s+(ofis|bino|joy|sharoit|interyer|xona|zal|mebel|manzara|shahar))|ko'rinishi\s+(yoqimli|chiroyli)|tashqi\s+ko'rinish|bo'yi\s+\d|приятн\w+\s+внешн|внешност|рост\s+от/
    },
    {
      id: 'marital', label: 'Oilaviy holat talabi',
      fix: "Oilaviy holatga oid talabni olib tashlang, uning ishga aloqasi yo'q.",
      re: /turmush(ga)?\s+(chiqmagan|qurmagan|qurgan)|uylanmagan|uylangan|oilali\s+bo'lish|bo'ydoq|farzand\w*siz|не\s+замужем|замужн|женат|без\s+детей/
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
    ['Xorij', ABROAD_RE]
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
    const isFee = idx => /(to'lov|puli?|uchun|narxi|xizmat\s+haqi|depozit|garov|оплат|предоплат|взнос|залог)[^.\n]{0,12}$/.test(t.slice(Math.max(0, idx - 30), idx));
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

    const daily = /(kuniga|kunlik|в\s+день)[^.\n\d]{0,20}\d[\d\s.,]*\s*(ming|mln|so'm|sum|сум|\$|usd|dollar|руб)/.test(t);
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

  const INCLUSIVE = /([qk]izlar|ayollar)\s*(va|,)\s+(yigitlar|erkaklar|bollar|o'g'il\s+bolalar)|(yigitlar|erkaklar)\s+va\s+(qizlar|ayollar)|мужчин\w*\s+и\s+женщин|женщин\w*\s+и\s+мужчин/u;
  const CRITICAL = ['prepay', 'personal', 'passport', 'debt'];
  const CRITICAL_FLOOR = 55;
  // Inkor: "depozit yo'q", "garov talab qilinmaydi", "без залога", "hech qanday to'lov olinmaydi"
  const NEG_AFTER = /^[^.!?\n]{0,25}?(yo'q|olinmaydi|talab\s+qilinmaydi|shart\s+emas|bepul|не\s+(требуется|нужн|бер[её]м)|нет\b|отсутств)/u;
  const NEG_BEFORE = /(hech\s+qanday|без|никак\w*)\s*$/u;

  function firstAffirmed(re, t) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(t))) {
      const before = t.slice(Math.max(0, m.index - 20), m.index);
      const after = t.slice(m.index + m[0].length, m.index + m[0].length + 40);
      if (!NEG_AFTER.test(after) && !NEG_BEFORE.test(before)) return m;
      if (!m[0].length) g.lastIndex++;
    }
    return null;
  }

  function analyze(text) {
    const n = normalize(text);
    // Kirill o'zbekcha matn ham lotin qoidalariga tushishi uchun ikkala variant tekshiriladi
    const t = /[а-яё]/.test(n) ? n + ' \n ' + transliterate(n) : n;

    const scam = [];
    for (const rule of SCAM_RULES) {
      const m = rule.negatable ? firstAffirmed(rule.re, t) : t.match(rule.re);
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

    // Daromad va'da qilinadi, lekin kasb ham, vazifa ham aytilmagan — ish mazmuni yashirilgan
    if (!scam.some(r => r.id === 'vague') && !prof && /daromad|доход|заработ/.test(t) &&
        !/vazifa|lavozim|ish\s+turi|bo'sh\s+ish\s+o'rni|vakansiya|обязанност|должност|ваканси/.test(t) &&
        !/\b(sot(ing|ish|asiz)|yetkaz|tozala|tayyorla|tik(ish|asiz)|qadoqla|yukla|haydaysiz)|продава|достав|убор/.test(t)) {
      const v = SCAM_RULES.find(r => r.id === 'vague');
      scam.push({ id: 'vague', label: v.label, weight: v.weight, match: 'daromad bor, ish turi yo\'q',
        detail: "Daromad va'da qilinadi, lekin qanday ish ekani — kasb ham, vazifalar ham — aytilmagan." });
    }

    const trust = [];
    for (const rule of TRUST_RULES) {
      const m = t.match(rule.re);
      if (m) trust.push({ id: rule.id, label: rule.label, weight: rule.weight, match: m[0] });
    }

    const discrimination = [];
    for (const rule of DISCRIMINATION_RULES) {
      const m = t.match(rule.re);
      if (!m) continue;
      // "Qizlar va yigitlar, ..." — ikkala jinsga murojaat, kamsitish emas ("faqat ..." bo'lmasa)
      if (rule.id === 'gender' && INCLUSIVE.test(t) && !/faqat|только/.test(m[0])) continue;
      discrimination.push({ id: rule.id, label: rule.label, fix: rule.fix, match: m[0] });
    }

    // Xorijga ish + tashqi ko'rinish talabi (ko'pincha yosh ayollar) — odam savdosida ma'lum jalb qilish usuli
    if (scam.some(r => r.id === 'abroad') && discrimination.some(d => d.id === 'appearance')) {
      scam.push({ id: 'lure', weight: 30, label: "Xorijga tashqi ko'rinishi bo'yicha xodim chaqirilmoqda",
        detail: "Xorijga \"chiroyli\", \"yosh qizlar\" chaqirilishi odam savdosida ko'p uchraydigan jalb qilish usuli. Ish beruvchi va agentlik litsenziyasini albatta tekshiring.",
        match: discrimination.find(d => d.id === 'appearance').match });
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
    const critical = scam.some(r => CRITICAL.includes(r.id));
    // Ishonch belgilari xavfni kamaytiradi, lekin pul yoki hujjat so'ralsa — yo'q
    const trustBonus = critical ? 0 : Math.min(15, trust.reduce((s, r) => s + r.weight, 0));
    let score = Math.max(0, Math.min(100, raw - (raw > 0 ? trustBonus : 0)));
    // Pul, karta/SMS kod yoki pasport so'ralsa — boshqa belgilar bo'lmasa ham kamida "yuqori xavf"
    if (critical) score = Math.max(score, CRITICAL_FLOOR);
    const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

    // Odam savdosi belgisi: pasportni olib qolish, qarz qulligi, xorijga tashqi ko'rinish bo'yicha chaqirish yoki xorijga ish + to'lov / "kafolatlangan viza" /
    // ko'ngilochar soha / noqonuniy ishlash
    const has = id => scam.some(r => r.id === id);
    const trafficking = has('passport') || has('debt') || has('lure') ||
      (has('abroad') && (has('prepay') || has('visa') || has('entertain') || has('illegal')));

    return {
      score, level, scam, trust, discrimination, transparency, salary, skills, trafficking,
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
