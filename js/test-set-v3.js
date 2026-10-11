// v3 — REAL Telegram e'lonlari asosidagi test to'plami.
//
// Qoidalar:
//   1. Faqat haqiqiy Telegram kanallaridan olingan e'lonlar (source_type: 'real').
//   2. Telefon (UZ/RU), karta, JSHSHIR, pasport raqami va email yashirilgan bo'lishi shart — `npm test` qolganini
//      topsa xato beradi. Ism + opa/aka va @username uchun ogohlantirish chiqadi: qo'lda tekshiring.
//      Qoralama tayyorlash: node tools/redact.mjs --from-export result.json --channel @kanal --limit 50
//   3. Belgini (expected_*) inson qo'yadi, tizim natijasiga qarab EMAS.
//   4. Birinchi to'ldirilgandan keyin: npm run eval:v3-baseline (analyzer.js ga TEGMASDAN).
//
// Maydonlar:
//   id                   'v3-001', 'v3-002', ... (uch xonali)
//   text                 e'lon matni (yashirilgan)
//   source_channel       '@kanal_nomi' yoki kanal nomi
//   source_type          'real'
//   expected_risk_level  'low' | 'medium' | 'high'
//   expected_flags       topilishi shart bo'lgan belgilar, masalan ['prepay', 'abroad', 'trafficking', 'disc:age']
//                        (to'liq ro'yxat: README → "Evaluation" yoki xato xabarida)
//   expected_reason      nima uchun shunday belgilangani (1 jumla)
//   category             'scam' | 'trafficking' | 'discrimination' | 'legit' | 'trap' | 'ambiguous'
//   reviewer_notes       izoh: kim, qachon belgiladi, shubhalar (bo'sh satr bo'lishi mumkin)
//
// Namuna (izohdan chiqarmang — bu real e'lon emas):
//   {
//     id: 'v3-001',
//     text: "Koreyaga ishga! Viza 100% kafolat. Hujjat uchun to'lov 500$. Tel: +998 00 000 00 00",
//     source_channel: '@ish_kanali',
//     source_type: 'real',
//     expected_risk_level: 'high',
//     expected_flags: ['prepay', 'visa', 'abroad', 'trafficking'],
//     expected_reason: "Xorijga ish uchun oldindan pul va viza kafolati",
//     category: 'trafficking',
//     reviewer_notes: "H.A., 2026-10-12. Kanalda 3 marta takrorlangan."
//   },
(function (global) {
  'use strict';
  global.TEST_SET_V3 = [
    {
      id: 'v3-001',
      text: "‼️ ДИККАТ ДИККАТ ДИККАТ‼️\n\n2025 йил ЯНГИ МАКСАДЛАРГА \nЭРИШИШНИ ХОХЛАГАНЛАР УЧУН\n\n      ФАКАТ ВА ФАКАТ\n\n       ✅ЁШЛАРНИ ✅\n\n  ГРЕНВЕЙ КОМПАНИЯСИ\nИНТЕРНЕТ МАГАЗИНГА\n    РЕКЛАМА МЕНЕДЖЕРИГА\n\n 🗄 18 ёшдан 40 ёшгача болган \n    барча йигит ва кизларни \n     ишга таклиф киламиз   \n     ТАЛАБАЛАРНИ ХАМ \n\n⏰ Иш вакти:\n   Чегараланмаган уз ишиздан\nайрилмаган холда қу‌шимча ишлашиз мумкин кунига 3-4 соат Якшанба дам \n  \n   💸💸💸 КАТТА ДАРОМАД 💸💸\n\n  БИЗДА ХАР ХАФТА ОЙЛИК ОЛАСИЗ\n\n 📎📎 300 $. --- 700 $ ГАЧА 📎📎\n\n     ➕ БЕПУЛ БИЛИМ\n     ➕САЁХАТЛАР\n     ➕БОНУСЛАР\n\n📄 Талаблар:\n   –Ишга этиборли, харакатчан,   \n    о'з ишига масулиятли болиши\n    керак.\n\n📄 Кулайликлар:\n   –Диплом шарт эмас, иш \n     тогрисида малумот берилади\n     ва оргатилади.\n  \n 🔊 ИШ ХАКИДА МАЛУМОТ \n     ОФЕСДА БЕРИЛАДИ\n\n📍Манзил: \n\nНАМАНГАН ШАХРИ\n\nФАРҐОНА ШАХРИ \n\nТОШКЕНТ ШАХРИ\n\nБУХОРА ШАХРИ\n\nВА МАСОФАВИЙ\n\n✍✍ @foydalanuvchi\n✍✍ @foydalanuvchi\n\nTel orqali faqat 10:00 dan 17:00 gacha maʼlumot olishingiz mumkin✅\n\n+998 00 000 00 00",
      source_channel: "https://t.me/namangan_ish_bor_Elonlarim",
      source_type: 'real',
      expected_risk_level: 'medium',
      expected_flags: ['invest','vague','disc:age'],
      expected_reason: "Greenway (tarmoq marketingi) 'reklama menejeri' deb yashirilgan, ish haqida faqat ofisda aytiladi, 18-40 yosh cheklovi",
      category: 'scam',
      reviewer_notes: "e'lon sanasi: 2025-07-05; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-002',
      text: "🏭MirGlass kompaniyasi shisha mahsulotlari ishlab chiqarish va ularni qayta ishlashning barcha turlari bilan shug'ullanadi, shuningdek, shisha konstruksiyalar, masalan, shisha ayvonlar, akvariumlar, stollar, pollar, dush kabinalari, panjaralar va to'siqlar, ofis to'siqlari, har qanday turdagi ko'zgularni ishlab chiqish bo'yicha dizayn yechimlarini taklif etadi.\n\n🔥Bo’sh ish o'rni: Oyna mahsulotlari ishlab chiqarish zavodiga tajribali ishchilar ishga taklif qilamiz \n• KROMKA, ZAKALKA bo'yicha mutaxassislar\n• STEKLOPAKETLAR ishlab chiqarish bo'yicha mutaxassislar\n• UPAKOVSHKLAR\n\n‼️Talablar: 18dan 35yoshagacha\n\nIsh sharoitalari:\n🔸6/1 8:00dan 18:00\n🔸Kompaniya hisobidan tushlik\n💰Oylik ish haqi 5 000 000-6 000 000dan bo'shlanadi \n\n📍Manzil: Toshkent Zangiota, Urtaovul posyolkasi\n\n☎️Murojaat uchun: \n+998 00 000 00 00\n\n👉🏻 https://t.me/+DjhIrYjtd0k5ZGMy",
      source_channel: "https://t.me/namangan_ish_bor_Elonlarim",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['disc:age'],
      expected_reason: "Kompaniya, manzil, maosh va ish vaqti aniq; faqat 18-35 yosh cheklovi bor",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-07-18; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-003',
      text: "AYOLLAR UCHUN AJOYIB ONLINE ISH IMKONIYATI!\n\nXalqaro kompaniyada rasmiy ish!\n\nAgar siz:\n✅ Mas’uliyatli\n✅ Reja asosida ishlay oladigan\n✅ Maqsad sari intiluvchan\n✅ Tirishqoq va mehnatsevar\n✅ O‘zbek tilida bemalol suhbat qura oladigan\n✅ Xushmuomala bo‘lsangiz, bizning jamoamiz aynan sizni qidirmoqda!\n\nIsh sharoitlari:\n📌 Ish faqat ONLINE\n📌 Telefon va internet bo‘lsa kifoya\n📌 Topshiriqlarni o‘z vaqtida bajarsangiz yetarli\n📌 Oylik daromad – suhbat asosida kelishiladi (26 mln so‘m va undan yuqori!)\n\n💼 Rasmiy ish!\n👩‍💻 Faqat ayollar uchun!\n📢 Ishga qabul suhbat asosida!\n\nAgar siz ushbu imkoniyatni qo‘ldan boy bermoqchi bo‘lmasangiz, hoziroq biz bilan bog‘laning!\n\n📩 Murojaat uchun: 👇👇👇\nTel:+998 00 000 00 00\nTelegram: @foydalanuvchi\nTelegram Gurux: t.me/foydalanuvchi\nTelegram Kanal: t.me/foydalanuvchi",
      source_channel: "https://t.me/namangan_ish_bor_Elonlarim",
      source_type: 'real',
      expected_risk_level: 'high',
      expected_flags: ['salary','vague','easy','disc:gender'],
      expected_reason: "Ish mazmuni yo'q, 'telefon va internet kifoya', 26 mln+ so'm va'dasi, faqat ayollar",
      category: 'scam',
      reviewer_notes: "e'lon sanasi: 2025-07-19; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-004',
      text: "😊ASSALOMU ALEYKUM😊 \n\n🌷MEN FABERLIC KAMPANIYASI A'ZOSIMAN, ISMIM [ism]\n\nSIZI ONLINE ISHGA TAKLIF QILAMAN❤️\n               \nFABERLIC KOMPANIYASI IMKONIYATLARI :\n\n1: A'ZO BO'LISH TEKIN ✅\n2: 20%, 26%, 70% SKITKADA MAXSULOTLAR OLISH ✅\n3: OFIS OCHISH IMKONIYATI ✅\n4: BOLA PULI OLISH IMKONIYATI ✅\n5: TEKIN DARSLAR✅\n6: O'ZIZGA O'ZINGIZ KASMETOLOG BO'LIB ISHLASH IMKONIYATI BOR ✅ \n7: OYLIKKA CHIQISH IMKONIYATLARI 30 MINDAN 10 MLNGACHA\n8:HAR KATALOG SOVGALAR✅\n\nAZO BOLIB BIRINCHI QADAMDAN OTSANGIZ SIZGA  KAMPANIYA TARAFIDAN AJOYIB SOVGAMIZ TAQDIM ETILADI😍\n\nJIDDIY BIZNESS, AGAR JIDDIY QARASHNI HOHLAB ISHLIDIGANLAR BO'LSA LICHKADA 0 DAN O'RGATAMAN\n\n@foydalanuvchi\n\n t.me/foydalanuvchi\n\nhttps://t.me/+YP1NgYCFxu1jMDYy\n\n\ninstagram.com/foydalanuvchi",
      source_channel: "https://t.me/namangan_ish_bor_Elonlarim",
      source_type: 'real',
      expected_risk_level: 'medium',
      expected_flags: ['invest'],
      expected_reason: "Faberlic tarmoq marketingi: ish emas, a'zo yig'ish; daromad 30 mingdan 10 mln gacha noaniq",
      category: 'scam',
      reviewer_notes: "e'lon sanasi: 2025-07-27; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-005',
      text: "📍 Hudud: #Toshkent\n🚺 Jinsi: #Qizlar\n🆔 Yosh: 19–25\n💲 Oylik: 300$-1000$\n☎️ Aloqa: +998 00 000 00 00\n Telegram: @foydalanuvchi \n\nIsh haqida ma’lumot:\n\n-Talablar: Sotuv sohasida 1+ yillik tajriba, ravon nutq.\n\n-Takliflar: Qulay lokatsiya, shinam ofis, yuqori daromad, shaxsiy rivojlanish imkoniyati.\n\n-Ish vaqti: 09:00–18:00 / 14:00–22:00\n\n-Ish kuni: 6/1\n\n-Manzil:Bodomzor  metrosi, Isfi instituti\n\n👉🏻 https://t.me/+DjhIrYjtd0k5ZGMy",
      source_channel: "https://t.me/namangan_ish_bor_Elonlarim",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['disc:gender','disc:age'],
      expected_reason: "Ish sharoiti, manzil va maosh aniq; faqat 19-25 yoshli qizlar",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-07-28; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-006',
      text: "📍  Hudud: #Toshkent \n\nТашкилотимизга янги ваканциялар очилди шошилинг! \n(Фақатгина Давлат ташкилотлари билан ишланади, суҳбат асосида ишга қабул қилинади).\n\nБизга сотув менеджерлари керак булиб, \nиш душанбадан - жумагача \nсоат 9:00 дан 18:00 гача. \nКолган барча маьлумотлар сухбат давомида берилади. \n\nТалаблар: Факатгина эркаклар кабул килинади ишга. (Масулятли каттиятли айолла боса уйлаб курилади) Коникарли даражада юридик билим ва нутк бойлиги. Гапга уста ва хушмуомалалик. Ишга нисбатан маъсулият ва қаттият, Классик форма.\nМурожаат қилганда резюме ва ўзингиз хақингизда тўлиқ маълумот билан мурожаат қилинг кўриб чиқиб жавоб берилади. \n\nХудуд: Тошкент Шахар, Чилонзор тумани\nЁш: 20- 40 гача (талабалар хам булади)\nОйлик: 2.000.000 сумдан бошланади Сотув хажмидан келиб чикиб белгиланади.\n\n Мурожаат учун: \n@foydalanuvchi @foydalanuvchi\n\n👉🏻 https://t.me/+DjhIrYjtd0k5ZGMy",
      source_channel: "https://t.me/namangan_ish_bor_Elonlarim",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['disc:gender','disc:age'],
      expected_reason: "Sotuv menejeri, manzil va maosh bor; faqat erkaklar, 20-40 yosh",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-07-29; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-007',
      text: "📍  Hudud: #Тошкент Шахри\n🚹 #Айоли  \n🆔 Yosh: 22-35 \n💲Oylik:200-600$ гача \n☎️ Tel:+998 00 000 00 00\n\n⚡️\n\n📣 Ish haqida: Офисда Ноутбукда Ишланади Иш 0 дан ургатилади\n\n❗️ Talablar: Рустилини Блищ керак Тошкент Шахрида Яшаши керак\n\n⏰ Ish vaqti: 9-18.00\n\n✉️ Aloqa uchun: @foydalanuvchi\n– \n\n📌 Manzil: Тошкент Шахар\n\n👉🏻 https://t.me/+DjhIrYjtd0k5ZGMy",
      source_channel: "https://t.me/namangan_ish_bor_Elonlarim",
      source_type: 'real',
      expected_risk_level: 'medium',
      expected_flags: ['vague','disc:gender','disc:age'],
      expected_reason: "Ish mazmuni noaniq ('ofisda noutbukda'), faqat ayollar, 22-35 yosh, Toshkentda yashash talabi",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-07-30; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-008',
      text: "📍  Hudud: #Тошкент\n🚹 #Кизлар, боллар\n🆔 Yosh: 18-35\n💲Oylik: 2500000 дан бошланади\n☎️ Tel: +998 00 000 00 00\n\n⚡️\n\n📣 Ish haqida:\nБетонкада йулни юзида салкин ичимликлар ва майда чуйда озик овкат махсулотлари сотилади.\n❗️ Talablar:\nЧаккон, хушмуомала, маъсулиятли.\n⏰ Ish vaqti:\n22:00-08:00\n✉️ Aloqa uchun:\n– телеграм: @foydalanuvchi\n\n📌 Manzil:\nУчтепа тумани, истирохат бетонка, ориентир: сомон бозор.",
      source_channel: "https://t.me/namangan_ish_bor_Elonlarim",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['disc:age'],
      expected_reason: "Ish, manzil, vaqt va maosh aniq; 18-35 yosh cheklovi",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-08-01; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-009',
      text: "👍👍👍👍👍👍\n📍 Hudud: #Toshkent\n🚹 #Ayollar\n🆔 Yosh: 18–40\n💲Oylik: 3 000 000 so‘mdan boshlab, donabay\n☎️ Tel: +998 00 000 00 00\n\n⚡️ Tikuvchilik tsexiga Tikuvchi, Master kerak\n\n📣 Ish haqida:\nTikuvchilik tsexiga tikuvchi, master  lavozimlariga ishchilar qabul qilinmoqda. Ish haqi donabay hisoblanadi.\n\n❗️ Talablar:\n– Mas’uliyatli\n– Chaqqon, tartibli, halol, ozoda, intizomli\n– 18–40 yoshdagi qizlar va ayollar\n– Yomon odatlarsiz bo‘lishi kerak\n\n⏰ Ish vaqti:\n– 09:00 dan 19:00 gacha\n\n✉️ Aloqa uchun:\n– +998 00 000 00 00\n\n📌 Manzil:\n– Toshkent shahri, Uchtepa tumani\n\nBiz taklif qilamiz:\n– 2 mahal ovqat ishxona hisobidan\n– Uzoqdan kelganlarga yotoqxona beriladi\n\n👉🏻 https://t.me/+DjhIrYjtd0k5ZGMy",
      source_channel: "https://t.me/namangan_ish_bor_Elonlarim",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['disc:gender','disc:age'],
      expected_reason: "Tikuvchilik sexi, manzil, maosh, yotoqxona aniq; faqat 18-40 yoshli ayollar",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-08-02; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-010',
      text: "🇰🇷 Koreyada ishlab chiqarish zavodlarida ishlang!\nKimyo, kimyo-texnologiya yoki muxandislik yo'nalishida tahsil olganmisiz? Koreyada ishlab chiqarish sohasida yuqori maoshli ishga joylashish imkoniyati siz uchun!\n\n📰 Mos keladigan bakalavr yo'nalishlari: \n• Kimyo\n• Kimyo-texnologiyalari (barcha yo'nalishlar) \n• Muhandis mexanik\n\n💸 Ish haqi:\n• 2000$ dan 2300$ gacha + qo'shimcha ish haqi\n\n⚠️ Talablar: \n• Erkaklar (23-40 yosh) \n• Bakalavr diplomi\n• Koreys tilini bilish \n\n❗️ Koreys tilini bilmaydiganlarga - hozirdan o'rganishni tavsiya qilamiz! \n\n🧾 Oson va tez ro'yxatdan o'tish! \nOnline ro'yxatdan o'tish\n\n☎️ Savollar bo'yicha:\n+998 00 000 00 00",
      source_channel: "@YouthGlobeXBA",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['abroad','disc:gender','disc:age'],
      expected_reason: "Koreya, litsenziyali agentlik; kasb, maosh, diplom va til talabi aniq, pul so'ralmaydi; faqat 23-40 yoshli erkaklar",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-07-16; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-011',
      text: "🇭🇷 Xorvatiya: Qurilish Sohasida Ish Takliflari!\n\n✈️ Ketish muddati qisqa – tezkor ishga chiqish imkoniyati!\n\n\n👤 Bo'sh ish o'rinlari:\n• Qolipchi\n• Armaturachi\n• G'isht teruvchi\n\n💸 Ish haqi soatiga:\n• €4.5 (EUR) \n• Ish tajribasiga qarab oylik oshiriladi\n\n⚠️ Talablar:\n• Erkak (21-48 yosh)\n• Kamida 2 yillik ish tajribasi\n• Til bilish shart emas\n\n✅ Ish beruvchi ta'minlaydi:\n• Bepul Transport\n• Bepul Turar joy\n• Bepul Ovqat\n\n⚡️ Oson va tez ro‘yxatdan o‘tish:\nOnline ro'yxatdan o'tish\n\n☎️ Savollar bo‘yicha: \n+998 00 000 00 00",
      source_channel: "@YouthGlobeXBA",
      source_type: 'real',
      expected_risk_level: 'medium',
      expected_flags: ['abroad','urgency','disc:gender','disc:age'],
      expected_reason: "Xorvatiya qurilishi: soatiga 4.5 EUR mahalliy darajadan past ko'rinadi, ish beruvchi nomi yo'q, 'ketish muddati qisqa' shoshiltirish; faqat 21-48 yoshli erkaklar",
      category: 'ambiguous',
      reviewer_notes: "e'lon sanasi: 2025-07-16; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-012',
      text: "🇧🇬 Bolgariyada ish taklifi\nAvtobus haydovchisi va mexanigi lavozimlariga ishchilar qabul qilinmoqda!\n\n👤 Ish o'rinlari:\n• Avtobus haydovchisi\n• Avtobus mexanigi\n\n💸 Ish haqi:\n• €1000 – €1500 (EUR)\n\nVazifalar:\n• Haydovchilar uchun – Shaharlararo va keyinchalik qisqa xalqaro yo‘nalishlarda avtobus haydash (Gretsiya, Turkiya va boshqalar)\n\n• Mexaniklar uchun – Avtobuslarga texnik xizmat ko‘rsatish va nosozliklarni bartaraf etish\n\n⚠️ Talablar:\n• Erkaklar (22-45 yosh)\n• Rus tilini bilishi shart\n• D toifali haydovchilik guvohnomasi\n• Kamida 2 yillik ish tajribasi\n\n✅ Ish beruvchi ta'minlaydi:\n• 2 oy bepul turar joy\n• Ish vaqtida bepul ovqat\n\n⚡️ Oson va tez ro‘yxatdan o‘tish:\nOnline ro'yxatdan o'ting\n\n\n☎️ Savollar bo‘yicha: \n+998 00 000 00 00",
      source_channel: "@YouthGlobeXBA",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['abroad','disc:gender','disc:age'],
      expected_reason: "Bolgariya avtobus haydovchisi: vazifa, maosh, D toifa talabi aniq; faqat 22-45 yoshli erkaklar",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-07-16; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-013',
      text: "🇧🇬 Bolgariyada ish taklifi\n\n👤 Ish o'rinlari:\n• Lift operatori\n• Lift texnik xizmatchisi\n\n💲 Ish haqi:\n• $1700 (USD)\n\n⚠️ Talablar:\n• Erkaklar (25-45 yosh)\n• Rus tilida muloqot qila olish\n• Kamida 2-3 yillik ish tajribasi soha bo‘yicha\n\n✅ Ish beruvchi ta'minlaydi:\n• Bepul Ovqat\n• Bepul Turar joy\n\n⚡️ Oson va tez ro‘yxatdan o‘tish:\nOnline ro'yxatdan o'tish\n\n☎️ Savollar bo‘yicha: \n+998 00 000 00 00",
      source_channel: "@YouthGlobeXBA",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['abroad','disc:gender','disc:age'],
      expected_reason: "Bolgariya lift operatori: maosh va tajriba talabi aniq; faqat 25-45 yoshli erkaklar",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-07-16; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-014',
      text: "📣 CE toifali haydovchilar uchun ish taklifi\nAgar siz tajribali yuk mashinasi haydovchisi bo‘lsangiz, Slovakiyada rasmiy asosda ish boshlashingiz mumkin!\n\n🚚 Ish o‘rni:\n• CE toifali haydovchi\n\n💸 Ish haqi:\n• €2200 - €2600 (EUR)\n\nVazifalar:\n• Yevropa Ittifoqi (asosan Avstriya, Germaniya, Shveytsariya, Slovakiya) bo‘ylab xalqaro yuk tashish\n• Texnik ko‘rik va transportni tayyor holatda ushlab turish\n• Harakat xavfsizligi va Yevropa YHQlariga rioya qilish\n• Yuk hujjatlarini yuritish, mijozlar va bojxona bilan muloqot\n• Yuklarning xavfsizligini ta’minlash, yetkazib berish muddatlariga rioya qilish\n\n⚠️ Talablar:\n• Erkaklar (21 - 50 yosh)\n• CE toifali haydovchilik guvohnomasi\n• Chip va Taxo kartalariga ega bo‘lish\n• KOD 95 (bo'lsa afzallik bo'ladi)\n• Kamida 1 yillik ish tajribasi\n• Rus tilida erkin muloqot\n\n⚡️ Oson va tez ro‘yxatdan o‘tish:\nOnline ro'yxatdan o'tish\n\n☎️ Savollar bo‘yicha: \n+998 00 000 00 00",
      source_channel: "@YouthGlobeXBA",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['abroad','disc:gender','disc:age'],
      expected_reason: "Slovakiya CE haydovchi: vazifalar, maosh, guvohnoma talabi batafsil; faqat 21-50 yoshli erkaklar",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-07-16; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-015',
      text: "🇷🇺Rossiya: Qurilish Sohasida Ish Takliflari!\n\n✈️ Ketish muddati qisqa – tezkor ishga chiqish imkoniyati!\n\n👤 Bo‘sh ish soni: 400 ta\n\n👤 Bo'sh ish o'rinlari:\n• Qolipchi\n• Armaturachi\n• G'isht teruvchi\n\n💸 1800$ \n\n⚠️ Talablar:\n• Erkak (21-48 yosh)\n• Kamida 2 yillik ish tajribasi\n• Til bilish shart emas\n\n✅ Ish beruvchi ta'minlaydi:\n• Bepul Transport\n• Bepul Turar joy\n• Bepul Ovqat\n\n⚡️ Oson va tez ro‘yxatdan o‘tish:\nOnline ro'yxatdan o'tish\n\n\n☎️ Savollar bo‘yicha: \n+998 00 000 00 00",
      source_channel: "@YouthGlobeXBA",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['abroad','urgency','disc:gender','disc:age'],
      expected_reason: "Rossiya qurilishi: kasb va maosh bor, pul so'ralmaydi, 'ketish muddati qisqa'; faqat 21-48 yoshli erkaklar",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-07-17; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-016',
      text: "Ish izlashdan charchaganlar uchun — Youth Globe  bilan kafolatli yo‘l!\n\n🔹 Youth Globe – litsenziyaga ega, qonuniy faoliyat yurituvchi agentlik.\n🔹 Ko‘plab davlatlar bilan rasmiy hamkorlik.\n🔹 Har xil yo‘nalish va kasblar uchun ish imkoniyatlari bor.\n\n– Uy-joy bilan ta’minlanasiz\n– Yo‘l xarajatlari qoplanadi\n– Kasbingiz, tajribangiz va til darajangizga qarab tanlov\n– Hujjatlar rasmiy va shartnoma asosida\n\n🎯 Bizning maqsadimiz — yoshlar, ishchilar va mutaxassislar uchun ochiq va halol yo‘l yaratish.\n\n📰 Telegram kanalimizda tez va oson ro'yxatdam o'ting!\nOson ro'yxatdan o'tish\n\n📞 Aloqa: +998 00 000 00 00\n📍 Manzil: Novza metro yaqinida, ofisimizga kelib bemalol ma’lumot oling.",
      source_channel: "@YouthGlobeXBA",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['abroad'],
      expected_reason: "Agentlik reklamasi: 'kafolatli yo'l' iborasi bor, lekin litsenziya, ofis manzili, shartnoma aytilgan, pul so'ralmaydi — noto'g'ri signal tuzog'i",
      category: 'trap',
      reviewer_notes: "e'lon sanasi: 2025-07-17; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-017',
      text: "🇧🇬 Bolgariya | Avtoservisda ishlash imkoniyati!\n\n🛠 Ish o'rinlari va oylik maoshlar:\n• Avtomexanik\n\n📌 Vazifalar:\nAvtomobillarni ta'mirlash va texnik xizmat ko‘rsatish\n\n💸 Ish haqi:\n• €1200 (EUR)\n\n⚠️ Umumiy talablar:\n• Erkak (25-40 yosh)\n• Rus tilida muloqot qila olish\n• Dvigatellar va transmissiyalarni ta'mirlashni bilish\n• Kamida 5 yillik tajriba\n• Ish jarayonidan video taqdim etish\n\n✅ Ish beruvchi ta'minlaydi:\n• Bepul Turar joy\n• Bepul Transport\n\n⚡️ Oson va tez ro‘yxatdan o‘tish:\nOnline ro'yxatdan o'tish\n\n☎️ Savollar bo‘yicha: \n+998 00 000 00 00",
      source_channel: "@YouthGlobeXBA",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['abroad','disc:gender','disc:age'],
      expected_reason: "Bolgariya avtomexanik: vazifa, maosh, 5 yil tajriba aniq; faqat 25-40 yoshli erkaklar",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2025-07-19; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-018',
      text: "🔥 Yuk tashuvchi (logistika)\n\n💰 Maosh: 2 200 000 soʻmdan\n📍 Joylashuv: Butun Oʻzbekiston boʻylab\n🏢 Uzum\n\n#HH_Uzbekistan #HH_Logistika #HH_Uzum\n\n📌 Vazifalar:\n• Omborda tovarni yuklash, tushirish va koʻchirish\n• Saralash va saqlash zonasida tartibni saqlash\n\n✅ Siz nima olasiz:\n• Rasmiy ishga joylashish\n• Barqaror yuklama va oʻz vaqtida toʻlov\n• Oʻz shahringizda ish\n\n📋 Talablar:\n• Jismoniy mehnatga tayyorlik\n• Masʼuliyat va intizom\n• Tajriba talab qilinmaydi\n\n⏰ Grafik:\n• 2/2\n\n👇 «Ariza qoldirish» tugmasini bosing, anketa 2 daqiqa vaqt oladi.",
      source_channel: "@ish_headhunter",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: [],
      expected_reason: "Uzum: maosh, vazifalar, grafik, rasmiy ishga joylashish aniq; pul so'ralmaydi",
      category: 'legit',
      reviewer_notes: "e'lon sanasi: 2026-06-18; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-019',
      text: "🔥 Piyoda kuryer (Yandex Yetkazib berish)\n\n💰 Maosh: 4 900 000 dan 8 000 000 soʻmgacha\n📍 Joylashuv: butun Oʻzbekiston boʻylab\n🏢 Яндекс Доставка\n\n#HH_Uzbekistan #HH_Kuryer #HH_Yandex\n\n📌 Vazifalar:\n• Buyurtmalarni mijozlarga piyoda yetkazish\n• Ilovadagi marshrut boʻyicha harakatlanish\n• Yetkazib berish muddatlariga rioya qilish\n• Buyurtmalarni ehtiyotkorlik bilan tashish\n\n✅ Siz nima olasiz:\n• Erkin grafik\n• Doimiy buyurtmalar oqimi\n• Kechikishsiz toʻlovlar\n• Yandex va hamkor parkdan 24/7 qoʻllab-quvvatlash\n• Elektrovelosiped ijaraga olish imkoniyati\n\n📋 Talablar:\n• Android yoki iOS smartfon\n• Shaharni yaxshi bilish\n• Oʻzini ish bilan taʼminlovchi maqomi\n• Yoshi 18 dan\n\n⏰ Grafik:\n• Erkin grafik\n\n👇 «Ariza qoldirish» tugmasini bosing, anketa 2 daqiqa vaqt oladi.",
      source_channel: "@ish_headhunter",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: [],
      expected_reason: "Yandex kuryer: shartlar aniq; '18 yoshdan' qonuniy minimal yosh, kamsitish emas",
      category: 'trap',
      reviewer_notes: "e'lon sanasi: 2026-06-18; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-020',
      text: "🔥 Uzum Tezkor mijozlar/kuryerlarni qoʻllab-quvvatlash mutaxassisi\n\n💰 Maosh: 4 000 000 dan 5 000 000 gacha soʻm\n📍 Joylashuv: Toshkent\n🏢 Uzum\n\n#HH_Toshkent #HH_Support #HH_Uzum\n\n📌 Vazifalar:\n• Mijozlar, kuryerlar va hamkorlar bilan chat va telefon orqali muloqot\n• Savollar va murakkab vaziyatlarni hal qilishda yordam\n• Yetkazib berish boʻyicha yordam\n\n✅ Siz nima olasiz:\n• Rasmiy ishga joylashish\n• Haq toʻlanadigan oʻqitish\n• Shinam ofis va doʻstona jamoa\n\n📋 Talablar:\n• Aniq va savodli yozma nutq\n• Rus va oʻzbek tillari\n• Ishonchli kompyuter foydalanuvchisi\n\n⏰ Grafik:\n• 2/2, smena boshlanishi suhbatda kelishiladi\n\n👇 «Ariza qoldirish» tugmasini bosing, anketa 2 daqiqa vaqt oladi.",
      source_channel: "@ish_headhunter",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: [],
      expected_reason: "Uzum qo'llab-quvvatlash: maosh, vazifalar, til talabi, rasmiy ish aniq",
      category: 'legit',
      reviewer_notes: "e'lon sanasi: 2026-06-18; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-021',
      text: "🔥 Uzum Tezkor kuryerlarni jalb qilish boʻyicha mutaxassis\n\n💰 Maosh: 4 000 000 soʻmdan\n📍 Joylashuv: Toshkent\n🏢 Uzum\n\n#HH_Toshkent #HH_Kuryer #HH_Uzum\n\n📌 Vazifalar:\n• Nomzodlarga qoʻngʻiroq qilib, shartlar haqida tayyor matnlar boʻyicha gapirish\n• Faol boʻlmagan kuryerlarni yoʻriqnoma boʻyicha ishga qaytarish\n\n✅ Siz nima olasiz:\n• Rasmiy ishga joylashish\n• Haq toʻlanadigan oʻqitish\n• Shinam ofis va doʻstona jamoa\n\n📋 Talablar:\n• Rus va oʻzbek tillari, savodli nutq\n• Xushmuomalalik va tushunarli tushuntira olish\n\n⏰ Grafik:\n• 5/2 soat 10:00 dan 19:00 gacha\n\n👇 «Ariza qoldirish» tugmasini bosing, anketa 2 daqiqa vaqt oladi.",
      source_channel: "@ish_headhunter",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: [],
      expected_reason: "Uzum kuryer jalb qilish: maosh, vazifa, grafik 5/2 aniq",
      category: 'legit',
      reviewer_notes: "e'lon sanasi: 2026-06-18; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-022',
      text: "🔥 Buyurtma yigʻuvchi\n\n💰 Maosh: 2 700 000 dan 8 000 000 gacha soʻm\n📍 Joylashuv: Toshkent, Sergeli tumani\n🏢 Uzum\n\n#HH_Toshkent #HH_Ombor #HH_Uzum\n\n📌 Vazifalar:\n• Buyurtmalarni yigʻish, skanerlash va qadoqlash\n• Tovarni saralash va omborda tartibni saqlash\n\n✅ Siz nima olasiz:\n• Rasmiy ishga joylashish\n• Bepul ovqatlanish\n• Ish joyida oʻqitish va karyera oʻsishi\n\n📋 Talablar:\n• Jismoniy mehnat va smenali grafikka tayyorlik\n• Smartfon/kompyuterdan boshlangʻich foydalanish\n• Tajriba shart emas, hammasini oʻrgatamiz\n\n⏰ Grafik:\n• 2/2 (2 kun kunduzgi → 2 dam → 2 kun tungi → 2 dam)\n\n👇 «Ariza qoldirish» tugmasini bosing, anketa 2 daqiqa vaqt oladi.",
      source_channel: "@ish_headhunter",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: [],
      expected_reason: "Uzum ombor: maosh, tuman, grafik, rasmiy ish va bepul ovqat aniq",
      category: 'legit',
      reviewer_notes: "e'lon sanasi: 2026-06-18; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-023',
      text: "🔥 Taksi qoʻllab-quvvatlash operatori\n\n💰 Maosh: 10 600 000 soʻm (gross)\n📍 Joylashuv: Masofaviy · butun Oʻzbekiston boʻylab\n🏢 Wildberries (RWB)\n\n#HH_Uzbekistan #HH_Support #HH_Wildberries\n\n📌 Vazifalar:\n• Mijozlarning chatga kelgan xabarlariga javob berish\n• Muammolarni tushunib, mijozlarga hal qilishda yordam berish\n• Turli savollar boʻyicha maslahat va batafsil maʼlumot berish\n• Fikr-mulohazalarni yigʻish va tahlil qilish\n\n✅ Siz nima olasiz:\n• Rasmiy ishga joylashish\n• Masofaviy format — uydan ish\n• Ish grafigi 2/2 (12 soatlik smenalar)\n• Karyera oʻsishi va kasbiy oʻqitish\n\n📋 Talablar:\n• Oʻzbek va rus tillarini bilish\n• Qoʻllab-quvvatlashda 1 yildan ortiq tajriba\n• Tayyor sxemasiz mustaqil ishlay olish\n• Barqaror internet va uyda kompyuter/noutbuk\n\n⏰ Grafik:\n• 2/2, 12 soatlik smenalar\n\n👇 «Ariza qoldirish» tugmasini bosing, anketa 2 daqiqa vaqt oladi.",
      source_channel: "@ish_headhunter",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: [],
      expected_reason: "Wildberries masofaviy: 'uydan ish' va yuqori maosh bor, lekin kompaniya, 1 yil tajriba talabi, vazifalar va grafik aniq",
      category: 'trap',
      reviewer_notes: "e'lon sanasi: 2026-06-18; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-024',
      text: "🔥 Farrosh\n\n💰 Maosh: 3 400 000 soʻmdan\n📍 Joylashuv: Toshkent\n🏢 Uzum\n\n#HH_Toshkent #HH_Tozalash #HH_Uzum\n\n📌 Vazifalar:\n• Ofis xonalarida tozalik va tartibni saqlash\n• Nam tozalash, chiqindini chiqarish, materiallarni nazorat qilish\n\n✅ Siz nima olasiz:\n• Rasmiy ishga joylashish\n• Barqaror maosh va qulay grafik\n• Ahil jamoa\n\n📋 Talablar:\n• Aniqlik va masʼuliyat\n• Tajriba talab qilinmaydi\n\n⏰ Grafik:\n• 5/2\n\n👇 «Ariza qoldirish» tugmasini bosing, anketa 2 daqiqa vaqt oladi.",
      source_channel: "@ish_headhunter",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: [],
      expected_reason: "Uzum farrosh: maosh, vazifa, grafik, rasmiy ish aniq",
      category: 'legit',
      reviewer_notes: "e'lon sanasi: 2026-06-18; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-025',
      text: "🔥 Bank kartalarini sotish boʻyicha mutaxassis\n\n💰 Maosh: 5 000 000 soʻmdan\n📍 Joylashuv: Toshkent\n🏢 Uzum\n\n#HH_Toshkent #HH_Savdo #HH_Uzum\n\n📌 Vazifalar:\n• Mijozlarga bank mahsulotlari (kartalar, muddatli toʻlov, limitlar) boʻyicha maslahat berish\n• Bank xizmatlarini rasmiylashtirish va rejani bajarish\n• Mijozlarga savollarni hal qilishda yordam berish\n\n✅ Siz nima olasiz:\n• Rasmiy ishga joylashish\n• Oʻqitish va tajribali xodimlar yordami\n• Reja bajarilgani uchun mukofotlar\n\n📋 Talablar:\n• Savodli ogʻzaki va yozma nutq\n• Savdo yoki mijozlar bilan ishlash tajribasi ustunlik boʻladi\n\n⏰ Grafik:\n• 5/2 soat 11:00 dan 20:00 gacha\n\n👇 «Ariza qoldirish» tugmasini bosing, anketa 2 daqiqa vaqt oladi.",
      source_channel: "@ish_headhunter",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: [],
      expected_reason: "Uzum: 'bank kartalari' — bu kartalarni sotish ishi, karta raqami so'ralmaydi; shartlar aniq",
      category: 'trap',
      reviewer_notes: "e'lon sanasi: 2026-06-18; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-026',
      text: "🔥 Buyurtmalarni topshirish punkti administratori\n\n💰 Maosh: 5 000 000 soʻmdan\n📍 Joylashuv: Toshkent\n🏢 Uzum\n\n#HH_Toshkent #HH_PVZ #HH_Uzum\n\n📌 Vazifalar:\n• Buyurtmalarni qabul qilish va topshirish, qaytarishlar bilan ishlash\n• Tovar hisobi va saqlash, BTPda tartibni saqlash\n• Kassa bilan ishlash va savdo rejasini bajarish\n\n✅ Siz nima olasiz:\n• Rasmiy ishga joylashish\n• Oʻqitish va karyera oʻsishi\n• Uyga yaqin ish, BTPlar barcha tumanlarda\n\n📋 Talablar:\n• Diqqatlilik, masʼuliyat, qiyin vaziyatlarda xotirjamlik\n• Kompyuterda ishlay olish\n\n⏰ Grafik:\n• 2/2 soat 09:00 dan 21:00 gacha\n\n👇 «Ariza qoldirish» tugmasini bosing, anketa 2 daqiqa vaqt oladi.",
      source_channel: "@ish_headhunter",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: [],
      expected_reason: "Uzum topshirish punkti: maosh, vazifa, grafik, rasmiy ish aniq",
      category: 'legit',
      reviewer_notes: "e'lon sanasi: 2026-06-18; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-027',
      text: "✨ Assalomu alaykum! ✨\n🌞 Hayrli kun, aziz biznes hamkorlar! 🌞\n💸 Bugungi kunda sizga ajoyib imkoniyatni taqdim etamiz! 💸\n📈 Bir kunlik daromad — 300 ming so‘mdan 600 ming so‘mgacha! 📈\n✅ Bu real, bu tasdiqlangan — va bu imkoniyat siz uchun! ✅\n⚡ Siz aytganimdek, to‘g‘ri yondashuv bilan bu daromadga bemalol erishish mumkin! ⚡\n⏳ Harakat bo‘lsa, natija muqarrar! ⏳\n🚀 Orqada qolmang — siz ham boshlang, siz ham yuring daromadli yo‘lda! 🚀\n🤝 Hamkorlik – rivojning kaliti! 🤝\n⭐ Ishonchli tizim ⭐\n♻️ Doimiy qo‘llab-quvvatlash ♻️\n💯 Tez natija 💯\n⏰ Hozir boshlang — ertangi muvaffaqiyat sizniki bo‘lsin! ⏰\n🔣 @foydalanuvchi 🔣\n📞 +998 00 000 00 00 📞",
      source_channel: "@onlayn_halol_ish_uyda_ish",
      source_type: 'real',
      expected_risk_level: 'high',
      expected_flags: ['easy','vague','urgency'],
      expected_reason: "Kunlik 300-600 ming so'm va'dasi, ish mazmuni umuman yo'q, 'hozir boshlang' shoshiltirish",
      category: 'scam',
      reviewer_notes: "e'lon sanasi: 2025-05-19; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-028',
      text: "🌙✨ Assalomu alaykum, aziz yurtdoshlar! ✨🌙\n───••●๑۩۞۩๑●••───\nKechangiz hayrli, qalbingiz nurli bo‘lsin!\nSiz bilan bugun hayotingizda ijobiy o‘zgarishlar olib keladigan bir imkoniyat haqida bo‘lishmoqchiman.\n\n━━━━━━━━━━━━━━\n✅ Men bugun yana o‘z daromadimni muvaffaqiyatli yechib oldim! ✅\n━━━━━━━━━━━━━━\nBu oddiygina daromad emas – bu halol mehnat, qonuniy yo‘l, va eng muhimi boshqalarga yaxshilik qilib topilgan rizq!\n\n✦✦✦ Loyiha qanday? ✦✦✦\n╔═══❖•ೋ°•°ೋ•❖═══╗\n✔ Halol va ishonchli\n✔ Qonuniy asosda ishlaydi\n✔ Shaffof tizim\n✔ Yordam berib, foyda topasiz\n╚═══❖•ೋ°•°ೋ•❖═══╝\n\nKimlar uchun?\nஜ۩۞۩ஜ\nSiz – oilasiga halol rizq topishni istagan ota\nYoki – vaqtini foydali o‘tkazmoqchi bo‘lgan onaxon\nYoki – telefon orqali daromad topmoqchi bo‘lgan yoshlar bo‘lsangiz –\nBu loyiha aynan siz uchun yaratilgan!\nஜ۩۞۩ஜ\n\n✉️ Ma’lumot oling, tekshirib ko‘ring, ma’qul kelsa — birga ishlaymiz! ✉️\n╭━━━╮━━━╮━━━╮\nSizga foyda, boshqalarga esa yaxshilik!\nBaraka va muvaffaqiyat yo‘lidagi birinchi qadamni bugun tashlang!\n╰━━━╯━━━╯━━━╯\n\n✨ Dua va ezgu niyatlar bilan, sizni kutamiz! ✨\n🔣 @foydalanuvchi 🔣\n📞 +998 00 000 00 00 📞",
      source_channel: "@onlayn_halol_ish_uyda_ish",
      source_type: 'real',
      expected_risk_level: 'high',
      expected_flags: ['easy','vague','invest'],
      expected_reason: "'Daromadimni yechib oldim', 'yordam berib foyda topasiz' — referal sxema belgisi, ish nima ekani aytilmagan",
      category: 'scam',
      reviewer_notes: "e'lon sanasi: 2025-05-19; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-029',
      text: "Valeykum Assalomu alaykum onlayin daromad yozsayiz malumot berib qo'yaman 😊✅ @foydalanuvchi",
      source_channel: "@onlayn_halol_ish_uyda_ish",
      source_type: 'real',
      expected_risk_level: 'medium',
      expected_flags: ['vague'],
      expected_reason: "'Onlayn daromad' deyiladi, ish, maosh, kompaniya haqida hech narsa yo'q, faqat shaxsiy yozishmaga chaqiriladi",
      category: 'ambiguous',
      reviewer_notes: "e'lon sanasi: 2025-05-20; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-030',
      text: "🌟 Assalomu alaykum, hayrli kech! 🌟\n\n✨ Bugun o'z daromadlarimni yechib oldim,\n💰 Kunlik 400 ming daromadim, barakasi bersin!\n\n🔥 Kecha 500 edi, Alhamdulillah! 🔥\n\n🕊 Shafof, halol va qonuniy onlayn ishim,\n💼 Tavsiya qilaman hamma uchun!\n🔣 @foydalanuvchi 🔣\n📞 +998 00 000 00 00 📞",
      source_channel: "@onlayn_halol_ish_uyda_ish",
      source_type: 'real',
      expected_risk_level: 'high',
      expected_flags: ['easy','vague'],
      expected_reason: "Kunlik 400-500 ming so'm 'daromad isboti', ish mazmuni yo'q",
      category: 'scam',
      reviewer_notes: "e'lon sanasi: 2025-05-20; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-031',
      text: "✨ Assalomu alaykum!\n– Yuragingizga osoyishtalik, ishlaringizga fayz tilayman!\n\n☀️ Hayrli kun!\n– Bugungi kuningiz nurli va omadli bo‘lsin!\n\n⏳ 2 kun sukutda edim...\n– Ammo bu sukunat orqasida mehnat bor edi!\n\n⚡️ Bugun esa yangilik bor!\n\n💸 2 kunlik daromad: 1 300 000 so‘m!\n– Ha, bir million uch yuz ming!\n– Pulni muammosiz yechib oldim!\n\n✅ Ish HALOL!\n⚖️ QONUNIY!\n🔍 SHAFFOF!\n\n🖥️ ONLAYN ISH — Siz uchun qulay!\n\n👑 O‘zingiz BOSHLIQ!\n⏰ Vaqtni O‘ZINGIZ belgilaysiz!\n\n📈 Daromad cheksiz – mehnatga yarasha!\n\n✉️ Ma’lumot olish uchun yozing:\nTelegram: @foydalanuvchi\n📞 Telefon: +998 00 000 00 00\n\n🚀 Harakat boshlanishi — bu sizning QADAMINGIZ!\n⭐️ Orzularni kutmang – ULARGA BORING!",
      source_channel: "@onlayn_halol_ish_uyda_ish",
      source_type: 'real',
      expected_risk_level: 'high',
      expected_flags: ['easy','vague'],
      expected_reason: "2 kunda 1.3 mln, 'daromad cheksiz', 'o'zingiz boshliq' — ish nima ekani aytilmagan",
      category: 'scam',
      reviewer_notes: "e'lon sanasi: 2025-05-24; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-032',
      text: "@foydalanuvchi\n\nЛитвада ишлаш истагида бўлган талабгорларга хозирги кунда агентлигимиз ишга жойлайдиган ВАКАНСИЯЛАР (22/01/2019)\n@foydalanuvchi\n\nСваркачи (полуавтомат)\nСваркачи (MIG, TIG)\nСлесарь (темир ишларига)\nҚурувчилар (қурилиш ва ремонт ишларига)\nОператор (ишлаб чиқариш линиясига; электромеханика ёки электрика сохасида маълумотга эга бўлганлар)\nОператор (автоматлашган қадоқлаш машинасига; эркаклар/аёллар)\nАррачи (автоматлашган линия билан ишлашга; ёғоч кўмири ишлаб чиқариш)\nТракторчилар (трактор, фронтальный погрузчикда ишлаш, права В)\nАвтомаляр (автомобилларга краска сепиш, DUPONT краскалари билан ишлаш; Сертификат шарт)\nДальнобойщиклар (С,Е права)\n\n@foydalanuvchi \n\nЮқоридаги ва бошқа вакансилар ҳақида маълумот олиш учун офисимизга ташриф буюришингиз мумкин\nМанзил: Фарғона ш. Сайлгох 29\n\n👇👇👇👇👇КАНАЛИМИЗГА ДЎСТЛАРИНГИЗНИ ТАКЛИФ ҚИЛИНГ\n@foydalanuvchi",
      source_channel: "@getvisauzb",
      source_type: 'real',
      expected_risk_level: 'low',
      expected_flags: ['abroad'],
      expected_reason: "Litva: agentlik, aniq kasblar ro'yxati, ofis manzili; pul so'ralmaydi (maosh ko'rsatilmagan)",
      category: 'legit',
      reviewer_notes: "e'lon sanasi: 2019-01-22; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-033',
      text: "@foydalanuvchi\n\nASSALOMU ALEYKUM\n\nIELTS 6.0 SERTIFIKATI BORLAR DIQQATIGA!\n\nYAPONIYADA ISHLASH UCHUN 10 TA NOMZOD ZARUR\n\n@foydalanuvchi\n\nTalablar:\n35 yoshgacha o'gil bolalar\nIELTS 6.0 sertifikati\n\nIsh joyi:\nOxirgi tehnologiyalar bilan jihozlangan taniqli kompaniya Avtoservisining avtomoykasida\n\nISH XAQI: $1500\n\nIsh beruvchi talabi bo'yicha Aprel oyiga ishga yetib borish kerak\n\n👆 Iltimos vakansiya bo'yicha FAQAT TALABGA JAVOB BERADIGAN NOMZODLAR murojaat qilsin. IELTS SERTIFIKATINI ADMINGA YUBORIB KEYIN TO'LIQ MA'LUMOT OLISHINGIZ MUMKIN\n\n@foydalanuvchi",
      source_channel: "@getvisauzb",
      source_type: 'real',
      expected_risk_level: 'medium',
      expected_flags: ['abroad','disc:gender','disc:age'],
      expected_reason: "Yaponiya avtomoykasi uchun IELTS 6.0 talabi ishga mos emas, ma'lumot faqat sertifikat yuborilgach beriladi; faqat 35 yoshgacha erkaklar",
      category: 'discrimination',
      reviewer_notes: "e'lon sanasi: 2019-01-28; AI taklifi, inson tekshirdi"
    },
    {
      id: 'v3-034',
      text: "@foydalanuvchi\n\nПОЛЬШАДА ҚОНУНИЙ ИШЛАШ!\n\nUNISTAFF хусусий бандлик агентлиги Польшадаги хамкори талабига кўра бўш иш ўринларини тўлдириш бўйича ТАНЛОВ ЭЪЛОН ҚИЛАДИ!\n\n@foydalanuvchi\n\nВакансия:\nЛЕСА МОНТАЖ КИЛИШГА ИШЧИЛАР (малакали ва малакасиз ишчилар)\n\nИш жойи:\nГДАНСК Ш. ПОЛЬША\n\nТалаблар:\n50 ЁШГАЧА СОГЛОМ ЭРКАКЛАР\nРУС ТИЛИ БОШЛАНГИЧ БИЛИШ ШАРТ (билмаганлар жараён давомида урганишлари учун вакт етади)\n\nХафтада 6 кун иш (Шанба киска), кунига 10-12 соатдан\n\nОйлик маош:\n$600-850\n\n@foydalanuvchi\nКушимчалар:\n- Компания агентлигимизда ИШОНЧЛИ иш берувчилар руйхатида туради\n- Ишчилар кийими бепул берилади\n- Ёток жой бепул берилади (2 кишилик ва 4 кишилик хоналар)\n- Мехнат шартномаси тугагандан кейин узайтириш имконияти бор\n- Талабгорларни Польшадаги иш жойигача UNISTAFF XBA ходимлари кузатиб боради\n- Кетувчиларга Авиабилет олишда 20% чегирма олишда ёрдам берамиз. \n\nUNISTAFF хусусий бандлик агентлиги билан шартнома тузилгандан иш жойигача етиб бориш жараёни 4 ойдан 6 ойгача. Бу Польша Мехнат биржасидан квотани талабгорга расмийлаштириш ва Польша элчихонасига руйхатга куйиш учун кетадиган вактни уз ичига олади.\n@foydalanuvchi\nБУ ВАКАНСИЯ БЎЙИЧА БЎШ ИШ ЎРИНЛАРИ ЧЕКЛАНГАН 120 ТА (10 февральгача)\nХИЗМАТ НАРХИ ❗️ 9,600,000 СЎМ! (БУ НАРХ ФАҚАТ ЛЕСА МОНТАЖЧИЛАРИ ВАКАНСИЯСИ УЧУН. 4,000,000 сўм Шартнома тузганда, 5,600,000 сўм ишга қабул қилинганлик ҳақида Хужжатлар Польшадан етиб келганда тўланади)\n\nБошқа давлатларга (Корея, Литва, Польша, Германия, Словакия) ишга бориш бўйича маълумотларни фақат офисда олиш мумкин. \n(Лицензия №000026)\n\nМанзил: Фарғона ш. Сайлгох-29\nОриентир: EVOS кафеси, ASIA UZ супермаркети\n244-08-58\n\nКаналимизга дўстларингизни таклиф қилинг 👉@foydalanuvchi",
      source_channel: "@getvisauzb",
      source_type: 'real',
      expected_risk_level: 'high',
      expected_flags: ['prepay','abroad','urgency','disc:gender','disc:age'],
      expected_reason: "Litsenziyali agentlik, lekin ishchidan 9.6 mln so'm xizmat haqi (4 mln shartnomada oldindan); '120 ta, 10 fevralgacha' shoshiltirish; 50 yoshgacha erkaklar",
      category: 'ambiguous',
      reviewer_notes: "e'lon sanasi: 2019-01-30; AI taklifi, inson tekshirdi"
    }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
