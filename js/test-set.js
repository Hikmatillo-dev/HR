// Qo'lda belgilangan test to'plami: tizim sifatini o'lchash uchun (npm test va "Loyiha haqida" bo'limi).
//
// Maydonlar:
//   id                   — v1-xx: birinchi to'plam (qoidalar shu e'lonlar asosida yozilgan)
//                          v2-xx: keyin qo'shilgan qiyin e'lonlar (qoidalar ularni ko'rmasdan oldin baholangan)
//   text                 — e'lon matni
//   expected_risk_level  — low | medium | high  (asosiy baho: low yoki "xavfli" = medium/high)
//   expected_flags       — topilishi shart bo'lgan belgilar: firibgarlik qoidasi id'lari (prepay, passport, ...),
//                          "disc:<tur>" (age, gender, appearance, marital, origin) va "trafficking"
//   expected_reason      — nima uchun shunday belgilangani (inson tomonidan)
//   category             — scam | trafficking | discrimination | legit | trap (xato signal tuzog'i) | ambiguous
//
// Muhim: e'lonlarni loyiha muallifi yozgan. Bu real Telegram ma'lumoti emas, shuning uchun natijalar
// faqat yo'nalish ko'rsatkichi. Real e'lonlardan topilgan xatolarni shu yerga qo'shib boring.
(function (global) {
  'use strict';
  const T = (id, category, expected_risk_level, expected_flags, expected_reason, text) =>
    ({ id, category, expected_risk_level, expected_flags, expected_reason, text });

  global.TEST_SET = [
    // ===================== v1: birinchi to'plam =====================
    T('v1-01', 'trafficking', 'high', ['prepay', 'visa', 'abroad', 'trafficking'], "Xorij + kafolatlangan viza + hujjat puli",
      "Polshaga ishga taklif! Zavodda ishlash, oyiga 2200$. Viza tayyor, 100% kafolat. Hujjat uchun to'lov 450$. Murojaat: lichkaga"),
    T('v1-02', 'scam', 'high', ['prepay'], "Ro'yxatdan o'tish uchun pul so'ralmoqda",
      "Ishga qabul! Faqat telefoningiz bo'lsa yetarli. Kuniga 400 000 so'm. Ro'yxatdan o'tish uchun to'lov 50 000 so'm"),
    T('v1-03', 'scam', 'medium', ['invest'], "Kripto piramida, ish emas",
      "Diqqat! Kripto loyiha, 500$ qo'ysangiz oyiga 40% foyda. Do'stlaringizni taklif qiling"),
    T('v1-04', 'scam', 'high', ['personal', 'salary'], "Karta raqami va SMS kod so'ralmoqda",
      "Оператор на дому, без опыта, доход от 15 млн сум в месяц. Для регистрации отправьте номер карты и код из смс"),
    T('v1-05', 'trafficking', 'high', ['prepay', 'visa', 'abroad', 'urgency', 'trafficking'], "Kafolatlangan viza + oldindan to'lov",
      "Работа в Европе! Гарантированная виза, зарплата 2500 евро. Предоплата за оформление 300$. Срочно, места ограничены!"),
    T('v1-06', 'trafficking', 'high', ['prepay', 'abroad', 'trafficking'], "Tibbiy ko'rik uchun oldindan pul",
      "Koreyaga mavsumiy ish. Tajriba shart emas, oyiga $3000. Tibbiy ko'rik uchun to'lov 1 mln so'm oldindan"),
    T('v1-07', 'trafficking', 'high', ['passport', 'abroad', 'trafficking'], "Pasport ish beruvchida qoladi",
      "Turkiyaga mehmonxonaga ishchilar kerak. Yo'l, uy-joy bepul. Pasportingiz ish beruvchida turadi. Batafsil lichkada"),
    T('v1-08', 'scam', 'high', ['prepay'], "Forma uchun pul",
      "Kassir kerak. Ishga kirish uchun forma uchun to'lov 300 000 so'm. Maosh 4 mln so'm. Tel +998 90 111 22 33"),
    T('v1-09', 'scam', 'high', ['easy', 'salary', 'vague'], "Uydan katta pul, tajribasiz, ma'lumot yashirin",
      "Uydan turib internet orqali oyiga 20 mln so'mgacha! Tajriba shart emas. Batafsil ma'lumot lichkada"),
    T('v1-10', 'scam', 'medium', ['link', 'urgency'], "Qisqartirilgan havola + shoshiltirish",
      "Ish bor! Kuniga 100$ to'lanadi. Faqat bugun ro'yxatdan o'ting: cutt.ly/rabota-uz"),
    T('v1-11', 'trafficking', 'high', ['prepay', 'visa', 'abroad', 'trafficking'], "Kirill: kafolatlangan viza + hujjat puli",
      "Кореяга ишга! Виза 100% кафолат. Тажриба шарт эмас. Ҳужжат учун тўлов 600$"),
    T('v1-12', 'scam', 'medium', ['invest'], "Treyding/investitsiya talab qilinadi",
      "Treyding bo'yicha menejer kerak. Bot orqali daromad, investitsiya kiritish talab qilinadi. Oyiga 30 mln so'm"),
    T('v1-13', 'scam', 'high', ['prepay'], "Trening uchun pul",
      "Trening uchun to'lov 250 000 so'm, keyin ishga olamiz. Savdo agenti, oyiga 12 mln so'm"),
    T('v1-14', 'trafficking', 'high', ['prepay', 'abroad', 'urgency', 'trafficking'], "Depozit + xorij + shoshiltirish",
      "Germaniyada ombor ishi! Oyiga 2800 €, tajriba kerak emas. Joylar cheklangan, shoshiling! Depozit 200 €"),
    T('v1-15', 'legit', 'low', [], "Yuqori, lekin IT uchun real maosh; kompaniya va aloqa bor",
      "«Smart Code» MChJ ga Senior Python dasturchi kerak. Toshkent. Talablar: 5 yil tajriba, Django, PostgreSQL. Maosh: 30–45 mln so'm. Rasmiy ishga joylashtirish. +998 71 200 00 00"),
    T('v1-16', 'legit', 'low', [], "Kunlik to'lov — kuryer uchun odatiy",
      "Kuryer kerak, Samarqand. Kunlik to'lov, smartfon bo'lishi kerak. Maosh 5–7 mln so'm. Tel: +998 93 555 66 77"),
    T('v1-17', 'legit', 'low', [], "'Lichkaga yozing' o'zi xavf emas",
      "Sotuvchi kerak. Andijon, markaziy bozor. Maosh 4 mln so'm. Lichkaga yozing yoki qo'ng'iroq qiling +998 94 222 33 44"),
    T('v1-18', 'legit', 'low', [], "STIR, manzil, maosh bor",
      "Buxgalter kerak. «Audit Pro» MChJ, STIR: 305123456. Manzil: Buxoro sh., Navoiy ko'chasi 12. 1C, soliq hisoboti. Maosh 7–9 mln so'm. +998 65 223 44 55"),
    T('v1-19', 'legit', 'low', [], "Oddiy o'qituvchi vakansiyasi",
      "Ingliz tili o'qituvchisi kerak. IELTS 7.5+. Namangan. Haftasiga 5 kun, 14:00–19:00. Maosh 6–10 mln so'm. +998 69 227 11 22"),
    T('v1-20', 'trap', 'low', [], "'18 yoshdan katta' — qonuniy talab; 'avans' — ish beruvchi to'laydi",
      "Payvandchi kerak, 18 yoshdan katta, 3-razryad. Qashqadaryo, Qarshi. Maosh 8 mln so'm, avans beriladi. +998 75 221 00 11"),
    T('v1-21', 'legit', 'low', [], "Rus tilida halol vakansiya",
      "Требуется бухгалтер в ООО «Восток Трейд», Ташкент. Опыт от 2 лет, 1С. Зарплата 8 млн сум. Официальное трудоустройство. +998 71 150 20 30"),
    T('v1-22', 'legit', 'low', [], "Kirill: halol vakansiya",
      "Ҳамшира керак. «Нур Мед» клиникаси, Фарғона. Тиббий маълумот. Маош 5 млн сўм. +998 73 244 55 66"),
    T('v1-23', 'legit', 'low', [], "Email orqali aloqa",
      "Data analyst kerak. SQL, Power BI, Excel. Toshkent, Yunusobod. Maosh 12–18 mln so'm. Rezyume: hr@bank.uz"),
    T('v1-24', 'legit', 'low', [], "Choychaqa bilan maosh",
      "Ofitsiant kerak, Xiva. Smenali ish grafigi. Maosh 3,5 mln so'm + choychaqa. +998 62 375 00 00"),
    T('v1-25', 'legit', 'low', [], "Oddiy haydovchi vakansiyasi",
      "Haydovchi kerak (C toifa). Logistika kompaniyasi, Navoiy. 3 yil staj. Maosh 9 mln so'm. +998 79 223 11 00"),
    T('v1-26', 'trap', 'low', [], "Rasmiy dastur haqida ogohlantirish — firibgarlik emas",
      "Koreyaga EPS-TOPIK dasturi bo'yicha ishga ketish haqida ma'lumot: hujjatlar faqat davlat agentligining rasmiy sayti orqali qabul qilinadi, agentlik hech qanday pul olmaydi."),
    T('v1-27', 'legit', 'low', [], "SMM vakansiyasi",
      "SMM mutaxassis kerak. Instagram, target reklama, video montaj. Farg'ona. Maosh 6–9 mln so'm. Portfolio bilan murojaat qiling: +998 91 777 88 99"),
    T('v1-28', 'legit', 'low', [], "Yotoqxona beriladi — halol",
      "Ombor ishchisi kerak, Toshkent viloyati, Chirchiq. 2/2 smena. Maosh 5 mln so'm. Yotoqxona beriladi. +998 70 600 70 80"),
    T('v1-29', 'discrimination', 'low', ['disc:gender', 'disc:age'], "Jins va yosh cheklovi",
      "Ofis-menejer kerak. Faqat qizlar, 22-28 yosh. Maosh 4 mln so'm. Toshkent. +998 90 123 45 67"),
    T('v1-30', 'discrimination', 'low', ['disc:gender', 'disc:age', 'disc:appearance'], "Rus: jins, yosh, tashqi ko'rinish",
      "Требуется официантка, девушки до 25 лет, приятной внешности. Самарканд. 3,5 млн сум. +998 66 233 44 55"),
    T('v1-31', 'discrimination', 'low', ['disc:gender'], "Faqat erkaklar",
      "Haydovchi kerak, faqat erkaklar. Andijon. Maosh 7 mln so'm. +998 74 222 11 00"),
    T('v1-32', 'discrimination', 'low', ['disc:appearance', 'disc:gender'], "Chiroyli qizlar, bo'y talabi",
      "Sotuvchi kerak, chiroyli qizlar, bo'yi 170 dan. Toshkent. Maosh 5 mln so'm. +998 99 111 00 11"),
    T('v1-33', 'discrimination', 'low', ['disc:marital', 'disc:age'], "Oilaviy holat va yosh",
      "Kotiba kerak. Turmushga chiqmagan, 25 yoshgacha. Buxoro. Maosh 3 mln so'm. +998 65 111 22 33"),
    T('v1-34', 'discrimination', 'low', ['disc:origin'], "Propiska talabi",
      "Qorovul kerak. Toshkent propiskasi bo'lishi shart. Maosh 4 mln so'm. +998 71 111 22 33"),
    T('v1-35', 'discrimination', 'low', ['disc:age', 'disc:appearance'], "Yosh va tashqi ko'rinish",
      "Administrator kerak. Talab: 20-30 yosh, ko'rinishi yoqimli. Namangan. Maosh 4 mln so'm. +998 69 111 22 33"),
    T('v1-36', 'discrimination', 'low', ['disc:gender', 'disc:age'], "Rus: faqat yigitlar, yosh",
      "Требуется продавец, только парни, не старше 30. Фергана. 4 млн сум. +998 73 111 22 33"),
    T('v1-37', 'trafficking', 'high', ['prepay', 'abroad', 'disc:gender', 'disc:age', 'disc:appearance', 'trafficking'], "Xorijga yosh qizlar + oldindan to'lov",
      "Dubayga ofitsiantka kerak! Faqat qizlar 18-25 yosh, chiroyli. Oyiga $3000, tajriba shart emas. Viza uchun oldindan to'lov 500$"),
    T('v1-38', 'trafficking', 'high', ['prepay', 'abroad', 'disc:gender', 'disc:age', 'disc:appearance', 'trafficking'], "Rus: xorijga qizlar + rasmiylashtirish puli",
      "Работа в Турции для девушек до 25 лет, приятной внешности. Зарплата 2000$. Оплата за оформление документов 200$"),

    // ===================== v2: yangi qiyin e'lonlar =====================
    // --- Rus tili ---
    T('v2-01', 'trafficking', 'high', ['prepay', 'abroad', 'trafficking'], "Rossiya + patent uchun oldindan pul",
      "Требуются упаковщики в Москву, зарплата от 120 000 руб. Без опыта. Оплата за оформление патента 3 млн сум, предоплата обязательна."),
    T('v2-02', 'scam', 'high', ['prepay'], "O'qish nomzod hisobidan — ishga olish uchun pul",
      "Обучение за свой счёт — 500 000 сум, после обучения трудоустройство менеджером. Доход до 20 млн сум."),
    T('v2-03', 'trafficking', 'high', ['passport', 'abroad', 'disc:gender', 'trafficking'], "Pasportni ish beruvchida qoldirish, qizlar, xorij",
      "Работа в Дубае для девушек, хостес. Билеты и жильё за счёт фирмы. Паспорт оставить у работодателя на время контракта."),
    T('v2-04', 'legit', 'low', [], "Rus: halol, rasmiy",
      "ООО «Артель Сервис», Ташкент. Требуется инженер-электрик, опыт от 3 лет. Зарплата 9–12 млн сум, официальное трудоустройство. +998 71 200 11 22"),
    T('v2-05', 'trap', 'low', [], "'Аванс' — ish beruvchi to'laydi, firibgarlik emas",
      "Требуется кассир, Наманган. Выплата зарплаты два раза в месяц, аванс 15-го числа. 4 млн сум. +998 69 222 33 44"),
    T('v2-06', 'discrimination', 'low', ['disc:origin', 'disc:age', 'disc:appearance'], "Millat, yosh, tashqi ko'rinish",
      "Требуется секретарь, только славянской внешности, до 35 лет. Ташкент. 5 млн сум. +998 90 000 11 22"),
    T('v2-07', 'scam', 'high', ['personal'], "Pasport rasmi va karta raqami so'ralmoqda",
      "Подработка оператором чата, 300$ в неделю. Для регистрации пришлите фото паспорта и номер карты."),
    T('v2-08', 'legit', 'low', [], "Rus: haydovchi",
      "Компания «Транс Логистик» ищет водителя категории C. Опыт 3 года. Зарплата 8 млн сум. Адрес: Андижан. +998 74 210 00 00"),
    T('v2-09', 'scam', 'high', ['easy', 'prepay'], "Oson pul + pullik ro'yxatdan o'tish",
      "Работа на дому! Лёгкий заработок от 100$ в день. Без опыта. Регистрация платная — 50 000 сум."),
    T('v2-10', 'legit', 'low', [], "Rus: oshpaz",
      "Нужен повар в кафе, Нукус. График 2/2. Зарплата 6 млн сум. Тел +998 61 222 33 44"),

    // --- Kirill o'zbek ---
    T('v2-11', 'legit', 'low', [], "Kirill: sotuvchi",
      "«Нур Савдо» МЧЖ га сотувчи керак. Андижон шаҳри. Маош 4 млн сўм. Иш вақти 9:00–18:00. +998 74 223 44 55"),
    T('v2-12', 'trafficking', 'high', ['prepay', 'abroad', 'urgency', 'trafficking'], "Kirill: xorij + oldindan to'lov",
      "Польшага ишга! Ойига 2000$. Тажриба шарт эмас. Олдиндан тўлов 300$. Шошилинг, жойлар чекланган!"),
    T('v2-13', 'discrimination', 'low', ['disc:gender', 'disc:age', 'disc:appearance'], "Kirill: jins, yosh, tashqi ko'rinish",
      "Ресепшнга фақат қизлар керак, 18-25 ёш, чиройли. Тошкент. Маош 4 млн сўм. +998 90 111 22 33"),
    T('v2-14', 'trafficking', 'high', ['passport', 'prepay', 'abroad', 'trafficking'], "Kirill: pasport ish beruvchida + hujjat puli",
      "Россияга қурилишга ишчилар керак. Йўл бепул. Паспортлар иш берувчида туради. Ҳужжат учун тўлов 1 млн сўм."),
    T('v2-15', 'legit', 'low', [], "Kirill: o'qituvchi",
      "Ўқитувчи керак: математика. Самарқанд, «Билим» мактаби. Маош 6–8 млн сўм. Тел: +998 66 233 11 00"),
    T('v2-16', 'scam', 'medium', ['invest'], "Kirill: kripto va referal",
      "Крипто лойиҳа! 1 млн сўм киритинг, ҳар куни 5% фойда. Дўстингизни таклиф қилинг."),
    T('v2-17', 'scam', 'high', ['personal', 'salary'], "Kirill: karta va SMS kod",
      "Онлайн оператор керак. Иш бошлаш учун карта рақамингиз ва СМС кодни юборинг. Ойига 15 млн сўм, тажриба шарт эмас."),
    T('v2-18', 'discrimination', 'low', ['disc:marital', 'disc:gender'], "Kirill: oilaviy holat va jins",
      "Котиба керак. Турмушга чиқмаган, фарзандсиз аёллар. Наманган. 3 млн сўм. +998 69 000 11 22"),

    // --- Aralash lotin-kirill ---
    T('v2-19', 'trafficking', 'high', ['prepay', 'visa', 'abroad', 'trafficking'], "Aralash yozuv: viza kafolati + to'lov",
      "Koreyaga ish! Виза 100% kafolat, oyiga $2500. Hujjat uchun тўлов 500$"),
    T('v2-20', 'trap', 'low', [], "Aralash yozuv, 'опыт не обязателен' — oddiy maosh bilan normal",
      "Sotuvchi kerak. Магазин в центре Ташкента. Maosh 4,5 mln so'm. Опыт не обязателен. +998 90 777 66 55"),
    T('v2-21', 'discrimination', 'low', ['disc:gender', 'disc:age'], "Aralash yozuv: jins va yosh",
      "Официантка kerak, faqat qizlar, до 25 лет. Bukhara. 3 mln so'm. +998 65 222 11 00"),
    T('v2-22', 'scam', 'high', ['prepay'], "Aralash yozuv: ishga kirish uchun предоплата",
      "Ishga kirish uchun предоплата 200 000 so'm. Kuryer, kuniga 50$. Yozing."),

    // --- Odam savdosi belgilari ---
    T('v2-23', 'trafficking', 'high', ['passport', 'abroad', 'trafficking'], "Pasport ish beruvchida saqlanadi",
      "Dubayga ofitsiantkalar kerak. Yo'l chiptasi bepul. Pasportingiz ish beruvchida saqlanadi. Oyiga 1500$."),
    T('v2-24', 'trafficking', 'high', ['passport', 'visa', 'prepay', 'abroad', 'trafficking'], "Pasportni topshirish + kafolat + to'lov",
      "Turkiyaga tikuvchilar kerak. Viza va ish 100% kafolat. Pasportni bizga topshirasiz, keyin hujjatlar tayyorlanadi. Hujjat uchun to'lov 400$."),
    T('v2-25', 'trafficking', 'high', ['passport', 'illegal', 'abroad', 'trafficking'], "Hujjatsiz ishlash + pasportlarni yig'ib olish",
      "Rossiyada qurilish ishi. Hujjatsiz ishlash mumkin, patent shart emas. Kelganingizda pasportlar yig'ib olinadi."),
    T('v2-26', 'trafficking', 'high', ['debt', 'abroad', 'trafficking'], "Qarz evaziga ishlash (qarz qulligi)",
      "Chet elga ishga yuboramiz. Yo'l va viza xarajati 3000$ — qarzni ish haqidan ushlab qolamiz, ishlab qaytarasiz."),
    T('v2-27', 'trafficking', 'medium', ['entertain', 'abroad', 'disc:age', 'disc:appearance', 'trafficking'], "Xorijda yosh qizlar uchun 'hostes/raqqosa'",
      "Qizlar uchun xorijda yuqori maoshli ish: hostes, raqqosa. Yoshi 18-23, chiroyli. Yo'l bepul, hujjatlar bizdan."),
    T('v2-28', 'trap', 'low', [], "Firibgarlikdan ogohlantiruvchi rasmiy e'lon",
      "Koreyaga EPS-TOPIK dasturi: ro'yxatdan o'tish faqat Tashqi mehnat migratsiyasi agentligi orqali, bepul. Firibgarlardan ehtiyot bo'ling, hech kimga pul to'lamang!"),

    // --- Kamsitish ---
    T('v2-29', 'discrimination', 'low', ['disc:origin'], "Turar joy (propiska) talabi",
      "Qorovul kerak. Faqat shu mahalla fuqarolari, Toshkent propiskasi majburiy. 4 mln so'm. +998 71 100 00 00"),
    T('v2-30', 'discrimination', 'low', ['disc:origin'], "Millat talabi",
      "Sotuvchi kerak, millati o'zbek bo'lishi shart. Farg'ona. 4 mln so'm. +998 73 000 00 00"),
    T('v2-31', 'ambiguous', 'low', [], "Minimal yosh (25+) — munozarali, lekin qoidalar uni kamsitish deb hisoblamaydi",
      "Qo'riqchi kerak, 25 yoshdan katta, harbiy xizmatni o'tagan bo'lsa afzal. Maosh 5 mln so'm. +998 90 222 22 22"),
    T('v2-32', 'discrimination', 'low', ['disc:gender'], "Rus: 'требуются мужчины'",
      "Требуются мужчины на склад, грузчики. 5 млн сум. Ташкент. +998 71 333 22 11"),
    T('v2-33', 'discrimination', 'low', ['disc:appearance'], "Tashqi ko'rinish va bo'y",
      "Administrator kerak, tashqi ko'rinishi yoqimli, bo'yi 165 dan past bo'lmasin. Samarqand. 4 mln so'm. +998 66 111 22 33"),
    T('v2-34', 'discrimination', 'low', ['disc:marital', 'disc:gender'], "Uylangan erkaklar afzal",
      "Buxgalter kerak, uylangan erkaklar afzal. Navoiy. 6 mln so'm. +998 79 111 22 33"),
    T('v2-35', 'trap', 'low', [], "'5 лет' — tajriba, yosh emas",
      "Требуется бухгалтер, опыт не менее 5 лет. Ташкент. Зарплата 9 млн сум. +998 71 444 55 66"),
    T('v2-36', 'trap', 'low', [], "'14-16 yoshli o'quvchilar' — mijozlar yoshi, nomzod emas",
      "14-16 yoshli o'quvchilar uchun matematika repetitori kerak. Jizzax. Soatbay 100 000 so'm. +998 72 555 66 77"),

    // --- Xato signal tuzoqlari (halol e'lonlar) ---
    T('v2-37', 'trap', 'low', [], "'Oylik to'lov' — maosh to'lanishi haqida",
      "Kassir kerak, Jizzax. Oylik to'lov o'z vaqtida, har oyning 10-sanasida. 3,5 mln so'm. +998 72 111 22 33"),
    T('v2-38', 'trap', 'low', [], "Forma bepul beriladi",
      "Ofitsiant kerak, Termiz. Ish kiyimi (forma) bepul beriladi. 3 mln so'm. +998 76 000 11 22"),
    T('v2-39', 'trap', 'low', [], "O'qish bepul va stipendiya",
      "O'qish bepul, o'qish davrida stipendiya 2 mln so'm. Keyin operator sifatida ishga olamiz. Toshkent. +998 71 222 00 11"),
    T('v2-40', 'trap', 'low', [], "Pasport nusxasini kadrlar bo'limiga shaxsan olib kelish — odatiy",
      "Hamshira kerak, Guliston. Hujjatlar: pasport nusxasi, diplom, 3x4 rasm — kadrlar bo'limiga shaxsan olib keling. Maosh 4 mln so'm."),
    T('v2-41', 'trap', 'low', [], "Yuqori maosh, lekin IT va tajribali",
      "Senior Java dasturchi kerak, 7 yil tajriba, Toshkent. «Fintech Pro» MChJ. Maosh: 40–60 mln so'm. +998 71 555 00 00"),
    T('v2-42', 'trap', 'low', [], "Kunlik to'lov kartaga — kuryer uchun odatiy",
      "Kuryer kerak, Andijon. To'lov har kuni kartaga o'tkaziladi, kuniga 250 000 so'mgacha. +998 74 333 22 11"),
    T('v2-43', 'trap', 'low', [], "'Depozit yo'q' — inkor",
      "Kuryer kerak, Samarqand. Garov talab qilinmaydi, depozit yo'q. Velosiped kompaniya tomonidan beriladi. 5 mln so'm. +998 66 444 55 66"),
    T('v2-44', 'trap', 'low', [], "Xizmat safari xorijga — halol",
      "«Silk Hotel» MChJ mehmonxonasiga administrator kerak. Ingliz va rus tili. Koreyaga xizmat safarlari bo'lishi mumkin. Toshkent. 7 mln so'm. +998 71 777 00 00"),

    // --- Noaniq e'lonlar ---
    T('v2-45', 'ambiguous', 'low', ['vague'], "Ma'lumot juda kam, lekin firibgarlik dalili yo'q",
      "Ish bor. Batafsil lichkada."),
    T('v2-46', 'ambiguous', 'low', ['abroad'], "Xorij, lekin rasmiy dastur va hujjatlar bepul",
      "Xorijda ish: Germaniyada parvarish xodimlari kerak. Nemis tili B1. Rasmiy dastur, hujjatlar bepul. +998 71 000 00 00"),
    T('v2-47', 'ambiguous', 'medium', ['invest', 'easy'], "Tarmoq marketingi + passiv daromad",
      "Tarmoq marketingi: mahsulotlarimizni soting, jamoangizni quring va passiv daromad oling!"),
    T('v2-48', 'ambiguous', 'low', [], "'Uydan ishlash' — masofaviy ish, oddiy maosh",
      "Uydan ishlash: kontent-menejer, oyiga 3–5 mln so'm. Portfolio yuboring: hr@media.uz"),
    T('v2-49', 'trap', 'low', [], "Ikkala jinsga murojaat — kamsitish emas (v2 baholangandan keyin topilib qo'shilgan)",
      "Qizlar va yigitlar, ishga marhamat! Call-markazga operatorlar kerak. Toshkent. 4 mln so'm. +998 71 300 40 50")
  ];

  // Qoidalar v2 e'lonlarini KO'RMASDAN oldingi natija (2026-10-11, 48 ta e'lon, tests/run.mjs).
  // Bu — yangi, notanish e'lonlarda tizim qanday ishlashining eng halol ko'rsatkichi.
  // Keyin qoidalar shu xatolar asosida tuzatildi, shuning uchun hozirgi v2 natijasi optimistik.
  global.TEST_BASELINE = {
    date: '2026-10-11', set: 'v2', n: 48,
    accuracy: 0.854, riskRecall: 0.647, riskPrecision: 0.917, fpr: 0.032,
    discRecall: 0.727, discPrecision: 0.889, traffRecall: 0.5, traffPrecision: 1.0, flagRecall: 0.672
  };
})(typeof window !== 'undefined' ? window : globalThis);
