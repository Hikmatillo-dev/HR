# 🛡️ IshQalqon

Telegram'dagi ish e'lonlarini **firibgarlik**, **odam savdosi belgilari** va **kamsitish** bo'yicha tekshiruvchi hamda mehnat bozorini tahlil qiluvchi platforma.

## Current limitations (hozirgi cheklovlar)

Hakamlar va foydalanuvchilar uchun halol holat (2026-10-11):

- **Dashboard hali real ma'lumot bilan sinalmagan.** Sukut bo'yicha sayt "Real ma'lumot yuklanmagan" holatini ko'rsatadi. 600 ta sintetik e'lon faqat **Demo** rejimida, har bir bo'limda "DEMO" belgisi bilan ko'rinadi. Real raqamlar uchun Telegram eksportini yuklash kerak.
- **Test to'plami kichik va qo'lda tayyorlangan.** 87 ta e'lonni loyiha muallifi yozgan, ular real Telegram e'lonlari emas. Qoidalar 49 ta yangi e'lonni ko'rmasdan oldingi natija: aniqlik **85%**, xavfli e'lonlarni topish **65%**, odam savdosi belgilarini topish **50%**. Hozirgi 100% natija optimistik, chunki qoidalar aynan shu xatolar asosida tuzatilgan.
- **Claude API real kalit bilan hali sinovdan o'tmagan.** U faqat soxta (mock) API bilan 11 ta avtomatik testdan o'tgan.
- **Telegram bot real token bilan hali ishga tushirilmagan.** Kod tayyor va token bo'lmasa to'g'ri xabar bilan to'xtaydi. `/check` va `/stats` buyruqlari hali yo'q (P1).
- **Valyuta kurslari taxminiy va kodga yozilgan:** 1 USD = 12 600, 1 EUR = 13 700, 1 RUB = 150 so'm (`js/analyzer.js`). Ular faqat maosh baholashga ta'sir qiladi.
- **Rasmiy idoralar nomlari tekshirilishi kerak.** "Tashqi mehnat migratsiyasi agentligi" va "Kambag'allikni qisqartirish va bandlik vazirligi" nomlari rasmiy manbadan tasdiqlanmagan.
- **Ma'lum xato holatlar:** qoidalar kalit so'zlarga tayanadi. Yangi so'z yoki imlo bilan yozilgan firibgarlikni o'tkazib yuborishi mumkin. Ikkala jinsga murojaat kabi kutilmagan iboralarni esa noto'g'ri belgilashi mumkin. Har bir topilgan xato `js/test-set.js` ga qo'shiladi.

## Imkoniyatlar

| Bo'lim | Nima qiladi |
|---|---|
| **1. Tekshirish** | Xavf bali (0–100) va shaffoflik indeksi (0–100). Har bir belgi uchun sabab va matndagi aniq ibora ko'rsatiladi. Odam savdosi belgisi alohida chiqadi. O'zbek (lotin, kirill) va rus tili hamda aralash yozuv qo'llab-quvvatlanadi. |
| **2. Bozor tahlili** | Real / Demo rejimlari va import hisoboti: xabarlar, vakansiyaga o'xshash, takroriy, noyob, xavf taqsimoti. Ko'rsatkichlar, hududlar xaritasi, dinamika, avtomatik xulosalar, CSV va PDF. |
| **3. Kasblar** | Talab va maosh xaritasi, ko'nikmalar (raqamli va an'anaviy), sohalar bo'yicha maosh. |
| **4. Kanallar** | Telegram kanallarga A–F reyting. |
| **5. Baza** | Filtrlash va qidirish mumkin bo'lgan vakansiyalar ro'yxati. |
| **6. Ish beruvchilar** | Halol va kamsitishsiz vakansiya yaratuvchi. |
| **7. Xavfsizlik** | 10 ta qoida va xorijga ketishdan oldingi tekshiruv ro'yxati. |
| **8. Loyiha** | Aniqlik ko'rsatkichlari: boshlang'ich (notanish e'lonlar) va hozirgi natija alohida. |
| **AI (ixtiyoriy)** | Claude orqali xulosa, iqtiboslar bilan sabablar, odam savdosi belgilari, yetishmayotgan ma'lumotlar, ish beruvchiga beriladigan savollar va kamsitishsiz variant. |
| **Telegram bot** | E'lonni yuborish yoki forward qilish orqali tekshirish. |

## Ishga tushirish

### 1. Saytni ochish (eng oddiy usul)
`index.html` ni brauzerda oching. Internet va o'rnatish kerak emas. AI'dan boshqa hamma narsa ishlaydi.

### 2. Real Telegram eksportini yuklash
1. **Telegram Desktop** → ish kanali → ⋮ → **Export chat history**
2. Formatni **"Machine-readable JSON"** qilib tanlang. Rasm va videolarni belgilamang.
3. 8–15 ta kanal uchun takrorlang: Toshkent, viloyatlar va "xorijda ish" kanallari.
4. Saytda **2. Bozor tahlili → 📂 Telegram eksportini yuklash** tugmasini bosing. Bir nechta `result.json` ni birdaniga tanlash mumkin.
5. Import hisobotini tekshiring: nechta xabar o'qildi, nechta takror olib tashlandi, nechta e'lon tahlil qilindi.

Fayl **faqat brauzerda** o'qiladi va `localStorage` da saqlanadi, serverga yuborilmaydi. O'chirish uchun "🗑️ Saqlangan ma'lumotni o'chirish" tugmasini bosing. Sinash uchun namunaviy fayl: `namuna/telegram-export-namuna.json`.

Ma'lumotni doimiy fayl sifatida saqlash uchun: `python3 tools/telegram_export.py k1/result.json k2/result.json` → `js/real-data.js`.

### 3. AI'ni yoqish
```bash
npm install
cp .env.example .env          # ANTHROPIC_API_KEY ni to'ldiring
npm run start:env             # http://localhost:3000  (Node.js 20.6+)
# yoki: ANTHROPIC_API_KEY=sk-ant-... npm start
```
Kalit bo'lmasa server baribir ishlaydi. Bunda tugma o'chiq turadi va "AI tahlil faollashtirilmagan: ANTHROPIC_API_KEY sozlanmagan." degan yozuv chiqadi. Soxta AI javobi hech qachon ko'rsatilmaydi.

**Birinchi real sinov:** saytda "Misol: odam savdosi" → "🤖 AI chuqur tahlil" ni bosing. Javobda iqtiboslar bilan sabablar, savollar va xulosa chiqishini tekshiring.

AI cheklovlari: matn 20–6000 belgi bo'lishi kerak, uzun matn kesilmaydi va rad etiladi. Vaqt chegarasi 45 soniya, xatoda 2 marta qayta urinadi, bitta IP dan daqiqasiga 10 ta so'rov. Promt `prompts/analysis.mjs` faylida.

### 4. Telegram botni ishga tushirish
```bash
# @BotFather → /newbot → tokenni .env ga TELEGRAM_BOT_TOKEN= qilib yozing
npm run bot:env
```
Token bo'lmasa bot "TELEGRAM_BOT_TOKEN o'rnatilmagan" deb to'xtaydi. Tekshirish: botga `/start` yozing, keyin e'lon matnini yuboring.

### 5. Testlar
```bash
npm test
```
| Test fayli | Nimani tekshiradi |
|---|---|
| `tests/importer.test.mjs` | Telegram JSON, CSV, TXT o'qilishi, takrorlar, buzilgan fayllar (8 test) |
| `tests/ai.test.mjs` | AI xato holatlari mock API bilan: buzilgan JSON, sxema, refusal, 401, 429, 500+retry, timeout, bo'sh/uzun matn, kalitsiz rejim (11 test) |
| `tests/run.mjs` | Test to'plami bo'yicha aniqlik, xavfli topish, FPR, kamsitish, odam savdosi, belgilar. Sifat chegarasidan pastga tushsa xato beradi |

Batafsil xatolar ro'yxati: `node tests/run.mjs --verbose`.

## Tuzilishi

```
index.html, css/            sahifa va dizayn
js/analyzer.js              TAHLIL YADROSI: qoidalar, maosh, hudud, kasb, shaffoflik, odam savdosi
js/importer.js              Telegram JSON / CSV / TXT importi va takrorlarni aniqlash
js/evaluate.js              aniqlik metrikalari (brauzer va testlar uchun bitta modul)
js/test-set.js              qo'lda belgilangan test to'plami + boshlang'ich natija
js/ui-*.js, js/app.js       interfeys modullari, real/demo rejimlari
js/sample-data.js           600 ta SINTETIK e'lon (faqat Demo rejimi)
prompts/analysis.mjs        Claude promti va javob sxemasi
lib/ai.mjs                  Claude API chaqiruvi va xatolarni boshqarish
server.mjs, bot.mjs         veb-server va Telegram bot
tools/telegram_export.py    eksportni js/real-data.js ga aylantirish
```

## Tahlil qanday ishlaydi

- **Firibgarlik (14 belgi):** oldindan to'lov, karta yoki SMS kod so'rash, pasportni olib qolish, qarz evaziga ishlash, hujjatsiz ishlash, kafolatlangan viza, piramida, "oson pul", shubhali havola, xorij, ko'ngilochar soha, shoshiltirish, yashirin ma'lumot, real bo'lmagan maosh.
- **Kritik belgilar:** pul, karta yoki SMS kod, pasport yoki qarz so'ralsa, e'lon kamida "yuqori xavf" deb baholanadi.
- **Inkor tushuniladi:** "depozit yo'q", "garov talab qilinmaydi" kabi iboralar xavf belgisi hisoblanmaydi.
- **Odam savdosi:** pasportni olib qolish yoki qarz qulligi; yoxud xorijga ish bilan birga to'lov, kafolatlangan viza, ko'ngilochar soha yoki hujjatsiz ishlash.
- **Kamsitish (5 tur):** yosh, jins, tashqi ko'rinish, oilaviy holat, millat yoki propiska. Har biri uchun qanday tuzatish kerakligi aytiladi.
- **Ishonch belgilari** (STIR, MChJ, rasmiy ishga joylashtirish, manzil) xavfni kamaytiradi. Kritik belgi bo'lsa, ular xavfni kamaytirmaydi.

## Hakamlarga cheklovlarni qanday tushuntirish kerak

> "Tizim qoidalarga asoslangan va har bir bahoni tushuntiradi. Biz uni o'zimiz yozgan 87 ta e'londa sinadik. Eng muhimi, qoidalar ko'rmagan 48 ta yangi e'londa aniqlik 85% chiqdi, lekin xavfli e'lonlarning faqat 65 foizi topildi. Topilmaganlarini tahlil qilib, qoidalarni tuzatdik. Real Telegram e'lonlarida natija pastroq bo'lishi mumkin, shuning uchun har bir xatoni test to'plamiga qo'shib boramiz. Tizim hukm chiqarmaydi: u xavf darajasi va sabablarini ko'rsatadi, qaror foydalanuvchida qoladi."

Kuchli tomon sifatida ko'rsating: o'lchanadigan sifat, ochiq hujjatlashtirilgan xatolar, maxfiylik (fayl serverga yuborilmaydi) va AI'siz ham ishlashi.

## 2 kunlik yakuniy reja

| Qachon | Nima qilinadi | Qanday tekshiriladi |
|---|---|---|
| **1-kun, ertalab** | 8–15 ta kanalni JSON qilib eksport qiling va saytga yuklang | Import hisobotida xabarlar soni > 0, takrorlar olib tashlangan, xavf taqsimoti ko'rinadi |
| **1-kun, tushlik** | Real e'lonlardan 50 tasini o'qib, qo'lda belgilang (xavfli / xavfsiz / kamsituvchi) va `js/test-set.js` ga `v3-xx` qilib qo'shing | `npm test` → **v3 natijasini qoidalarga tegmasdan yozib oling.** Bu real ma'lumotdagi birinchi halol ko'rsatkich |
| **1-kun, kechqurun** | v3 xatolarini `js/analyzer.js` da tuzating | `npm test` o'tadi; FPR ≤ 10% |
| **1-kun, kechqurun** | API kalit oling, `npm run start:env`, 5 ta e'londa AI'ni sinang | Javoblarda iqtiboslar e'lon matnida haqiqatan bor; o'zbekcha tushunarli |
| **2-kun, ertalab** | Bot tokenini oling va botni ishga tushiring, telefondan 5 ta e'lon yuboring | Javob 5 soniyadan tez keladi, disclaimer bor |
| **2-kun, ertalab** | Saytni internetga chiqaring (GitHub Pages yoki Netlify; AI uchun Node server) | Telefondan ochib, yuklash va tekshirishni sinang |
| **2-kun, tushlik** | Valyuta kurslari va idoralar nomlarini rasmiy manbadan tekshiring | README cheklovlar bo'limini yangilang |
| **2-kun, kechqurun** | Slaydlar, 2 daqiqalik zaxira video, 3 marta mashq | Taqdimot 7 daqiqadan oshmaydi |

## Taqdimot (5–7 daqiqa)

1. **Hikoya (30 soniya).** "Tanishim Koreyaga ish deb 500 dollar to'ladi..."
2. **Muammo (1 daqiqa).** **Real** import hisobotidagi raqamlar: "N ta kanal, M ta e'lon, X% xavfli".
3. **Demo (3 daqiqa).** Odam savdosi misoli → kirill misoli → real ma'lumot bilan xarita va kanallar reytingi → AI tahlil → ish beruvchi uchun vosita → hakam bergan e'lonni tekshirish.
4. **Sifat va halollik (1 daqiqa).** 8-bo'lim: boshlang'ich va hozirgi natija, cheklovlar.
5. **Kelajak (30 soniya).** Avtomatik monitoring, real ma'lumotda o'qitilgan model, litsenziyalar bazasi bilan integratsiya.

## Hakamlar savollariga javoblar

- **"Bu sun'iy intellektmi?"** Ikki qatlamli tizim. Birinchisi tushuntiriladigan qoidalar: tez, bepul, internetsiz ishlaydi. Ikkinchisi Claude bilan chuqur tahlil: kontekstni tushunadi, iqtibos keltiradi va savollar tavsiya qiladi.
- **"Aniqligi qanday?"** Yuqoridagi tushuntirishga qarang. Asosiy raqam — notanish e'lonlardagi boshlang'ich natija, 100% emas.
- **"Xato qilsa-chi?"** Tizim yakuniy hukm chiqarmaydi, sabablarni ko'rsatadi. Har bir xato test to'plamiga qo'shiladi.
- **"Shaxsiy ma'lumotlar?"** Yuklangan fayl brauzerdan chiqmaydi. AI tahlil faqat foydalanuvchi tugmani bosganda, bitta e'lon uchun ishlaydi.
- **"Pulni qanday topasiz?"** Kompaniyalarga "tasdiqlangan ish beruvchi" belgisi, kanallarga moderatsiya xizmati, davlat va xalqaro tashkilotlarga analitik hisobotlar.
