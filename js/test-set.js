// Qo'lda belgilangan test to'plami: tizim aniqligini o'lchash uchun.
// scam: firibgarlik xavfi bor (o'rtacha yoki yuqori bo'lishi kerak)
// disc: kamsituvchi talab bor
// Yangi qiyin holatlarni shu yerga qo'shing va `npm test` bilan tekshiring.
(function (global) {
  'use strict';
  global.TEST_SET = [
    // --- Firibgar ---
    { scam: true, disc: false, text: "Polshaga ishga taklif! Zavodda ishlash, oyiga 2200$. Viza tayyor, 100% kafolat. Hujjat uchun to'lov 450$. Murojaat: lichkaga" },
    { scam: true, disc: false, text: "Ishga qabul! Faqat telefoningiz bo'lsa yetarli. Kuniga 400 000 so'm. Ro'yxatdan o'tish uchun to'lov 50 000 so'm" },
    { scam: true, disc: false, text: "Diqqat! Kripto loyiha, 500$ qo'ysangiz oyiga 40% foyda. Do'stlaringizni taklif qiling" },
    { scam: true, disc: false, text: "Оператор на дому, без опыта, доход от 15 млн сум в месяц. Для регистрации отправьте номер карты и код из смс" },
    { scam: true, disc: false, text: "Работа в Европе! Гарантированная виза, зарплата 2500 евро. Предоплата за оформление 300$. Срочно, места ограничены!" },
    { scam: true, disc: false, text: "Koreyaga mavsumiy ish. Tajriba shart emas, oyiga $3000. Tibbiy ko'rik uchun to'lov 1 mln so'm oldindan" },
    { scam: true, disc: false, text: "Turkiyaga mehmonxonaga ishchilar kerak. Yo'l, uy-joy bepul. Pasportingiz ish beruvchida turadi. Batafsil lichkada" },
    { scam: true, disc: false, text: "Kassir kerak. Ishga kirish uchun forma uchun to'lov 300 000 so'm. Maosh 4 mln so'm. Tel +998 90 111 22 33" },
    { scam: true, disc: false, text: "Uydan turib internet orqali oyiga 20 mln so'mgacha! Tajriba shart emas. Batafsil ma'lumot lichkada" },
    { scam: true, disc: false, text: "Ish bor! Kuniga 100$ to'lanadi. Faqat bugun ro'yxatdan o'ting: cutt.ly/rabota-uz" },
    { scam: true, disc: false, text: "Кореяга ишга! Виза 100% кафолат. Тажриба шарт эмас. Ҳужжат учун тўлов 600$" },
    { scam: true, disc: false, text: "Treyding bo'yicha menejer kerak. Bot orqali daromad, investitsiya kiritish talab qilinadi. Oyiga 30 mln so'm" },
    { scam: true, disc: false, text: "Trening uchun to'lov 250 000 so'm, keyin ishga olamiz. Savdo agenti, oyiga 12 mln so'm" },
    { scam: true, disc: false, text: "Germaniyada ombor ishi! Oyiga 2800 €, tajriba kerak emas. Joylar cheklangan, shoshiling! Depozit 200 €" },

    // --- Halol (qiyin holatlar ham bor) ---
    { scam: false, disc: false, text: "«Smart Code» MChJ ga Senior Python dasturchi kerak. Toshkent. Talablar: 5 yil tajriba, Django, PostgreSQL. Maosh: 30–45 mln so'm. Rasmiy ishga joylashtirish. +998 71 200 00 00" },
    { scam: false, disc: false, text: "Kuryer kerak, Samarqand. Kunlik to'lov, smartfon bo'lishi kerak. Maosh 5–7 mln so'm. Tel: +998 93 555 66 77" },
    { scam: false, disc: false, text: "Sotuvchi kerak. Andijon, markaziy bozor. Maosh 4 mln so'm. Lichkaga yozing yoki qo'ng'iroq qiling +998 94 222 33 44" },
    { scam: false, disc: false, text: "Buxgalter kerak. «Audit Pro» MChJ, STIR: 305123456. Manzil: Buxoro sh., Navoiy ko'chasi 12. 1C, soliq hisoboti. Maosh 7–9 mln so'm. +998 65 223 44 55" },
    { scam: false, disc: false, text: "Ingliz tili o'qituvchisi kerak. IELTS 7.5+. Namangan. Haftasiga 5 kun, 14:00–19:00. Maosh 6–10 mln so'm. +998 69 227 11 22" },
    { scam: false, disc: false, text: "Payvandchi kerak, 18 yoshdan katta, 3-razryad. Qashqadaryo, Qarshi. Maosh 8 mln so'm, avans beriladi. +998 75 221 00 11" },
    { scam: false, disc: false, text: "Требуется бухгалтер в ООО «Восток Трейд», Ташкент. Опыт от 2 лет, 1С. Зарплата 8 млн сум. Официальное трудоустройство. +998 71 150 20 30" },
    { scam: false, disc: false, text: "Ҳамшира керак. «Нур Мед» клиникаси, Фарғона. Тиббий маълумот. Маош 5 млн сўм. +998 73 244 55 66" },
    { scam: false, disc: false, text: "Data analyst kerak. SQL, Power BI, Excel. Toshkent, Yunusobod. Maosh 12–18 mln so'm. Rezyume: hr@bank.uz" },
    { scam: false, disc: false, text: "Ofitsiant kerak, Xiva. Smenali ish grafigi. Maosh 3,5 mln so'm + choychaqa. +998 62 375 00 00" },
    { scam: false, disc: false, text: "Haydovchi kerak (C toifa). Logistika kompaniyasi, Navoiy. 3 yil staj. Maosh 9 mln so'm. +998 79 223 11 00" },
    { scam: false, disc: false, text: "Koreyaga EPS-TOPIK dasturi bo'yicha ishga ketish haqida ma'lumot: hujjatlar faqat davlat agentligining rasmiy sayti orqali qabul qilinadi, agentlik hech qanday pul olmaydi." },
    { scam: false, disc: false, text: "SMM mutaxassis kerak. Instagram, target reklama, video montaj. Farg'ona. Maosh 6–9 mln so'm. Portfolio bilan murojaat qiling: +998 91 777 88 99" },
    { scam: false, disc: false, text: "Ombor ishchisi kerak, Toshkent viloyati, Chirchiq. 2/2 smena. Maosh 5 mln so'm. Yotoqxona beriladi. +998 70 600 70 80" },

    // --- Kamsituvchi ---
    { scam: false, disc: true, text: "Ofis-menejer kerak. Faqat qizlar, 22-28 yosh. Maosh 4 mln so'm. Toshkent. +998 90 123 45 67" },
    { scam: false, disc: true, text: "Требуется официантка, девушки до 25 лет, приятной внешности. Самарканд. 3,5 млн сум. +998 66 233 44 55" },
    { scam: false, disc: true, text: "Haydovchi kerak, faqat erkaklar. Andijon. Maosh 7 mln so'm. +998 74 222 11 00" },
    { scam: false, disc: true, text: "Sotuvchi kerak, chiroyli qizlar, bo'yi 170 dan. Toshkent. Maosh 5 mln so'm. +998 99 111 00 11" },
    { scam: false, disc: true, text: "Kotiba kerak. Turmushga chiqmagan, 25 yoshgacha. Buxoro. Maosh 3 mln so'm. +998 65 111 22 33" },
    { scam: false, disc: true, text: "Qorovul kerak. Toshkent propiskasi bo'lishi shart. Maosh 4 mln so'm. +998 71 111 22 33" },
    { scam: false, disc: true, text: "Administrator kerak. Talab: 20-30 yosh, ko'rinishi yoqimli. Namangan. Maosh 4 mln so'm. +998 69 111 22 33" },
    { scam: false, disc: true, text: "Требуется продавец, только парни, не старше 30. Фергана. 4 млн сум. +998 73 111 22 33" },

    // --- Ham firibgar, ham kamsituvchi ---
    { scam: true, disc: true, text: "Dubayga ofitsiantka kerak! Faqat qizlar 18-25 yosh, chiroyli. Oyiga $3000, tajriba shart emas. Viza uchun oldindan to'lov 500$" },
    { scam: true, disc: true, text: "Работа в Турции для девушек до 25 лет, приятной внешности. Зарплата 2000$. Оплата за оформление документов 200$" }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
