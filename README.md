# 🛡️ IshQalqon

Telegram'dagi ish e'lonlarini **firibgarlik**, **odam savdosi belgilari** va **kamsitish** bo'yicha tekshiruvchi hamda mehnat bozorini tahlil qiluvchi platforma.

## Current limitations (hozirgi cheklovlar)

Hakamlar va foydalanuvchilar uchun halol holat (2026-10-11):

- **Dashboard hali real ma'lumot bilan sinalmagan.** Sukut bo'yicha sayt "Real ma'lumot yuklanmagan" holatini ko'rsatadi. 600 ta sintetik e'lon faqat **Demo** rejimida, har bir bo'limda "DEMO" belgisi bilan ko'rinadi. Real raqamlar uchun Telegram eksportini yuklash kerak.
- **Real ma'lumotdagi sifat hali o'lchanmagan.** v3 to'plami (real Telegram e'lonlari) tuzilmasi tayyor, lekin hali bo'sh.
- **Test to'plami kichik va qo'lda tayyorlangan.** 87 ta e'lonni loyiha muallifi yozgan, ular real Telegram e'lonlari emas. Qoidalar 49 ta yangi e'lonni ko'rmasdan oldingi natija: aniqlik **85%**, xavfli e'lonlarni topish **65%**, odam savdosi belgilarini topish **50%**. Hozirgi 100% natija optimistik, chunki qoidalar aynan shu xatolar asosida tuzatilgan.
- **Claude API real kalit bilan hali sinovdan o'tmagan.** U faqat soxta (mock) API bilan 11 ta avtomatik testdan o'tgan.
- **Telegram bot real token bilan hali ishga tushirilmagan.** `/start`, `/help`, `/check` va `/stats` soxta Telegram server bilan 14 ta testdan o'tgan.
- **Valyuta kurslari taxminiy:** 1 USD = 12 600, 1 EUR = 13 700, 1 RUB = 150 so'm. Kurslar `config/currency.js` da va `.env` orqali almashtiriladi; UI'da "Kurslar taxminiy" belgisi chiqadi. Lekin `js/analyzer.js` hali config'ga ulanmagan (pastdagi "Kutilayotgan ishlar"ga qarang). Kurslar faqat maosh baholashga ta'sir qiladi.
- **Rasmiy idoralar tasdiqlanmagan.** `config/official-sources.js` dagi ikkala manba `verified: false`: ular veb-qidiruvda topilgan, lekin `gov.uz` sahifalari ishlab chiqish muhitidan ochilmadi. Qidiruv natijalariga ko'ra "Tashqi mehnat migratsiyasi agentligi" endi "Vazirlar Mahkamasi huzuridagi Migratsiya agentligi" deb ataladi. UI'da "tekshirilmagan" belgisi chiqadi.
- **Ma'lum xato holatlar:** qoidalar kalit so'zlarga tayanadi. Yangi so'z yoki imlo bilan yozilgan firibgarlikni o'tkazib yuborishi mumkin. Ikkala jinsga murojaat kabi kutilmagan iboralarni esa noto'g'ri belgilashi mumkin. Har bir topilgan xato `js/test-set.js` ga qo'shiladi.

## Evaluation (sifatni o'lchash)

| To'plam | Fayl | Manba | Hajm | Vazifasi |
|---|---|---|---|---|
| **v1** | `js/test-set.js` | qo'lda yozilgan | 38 | Qoidalar shu e'lonlar asosida yozilgan (regressiya testi) |
| **v2** | `js/test-set.js` | qo'lda yozilgan, qiyin holatlar | 49 | Boshlang'ich natija: aniqlik 85.4%, xavfli topish 64.7%, FPR 3.2%, kamsitish 72.7%, odam savdosi 50% |
| **v3** | `js/test-set-v3.js` | **real Telegram e'lonlari** | 0 / 50 | Real ma'lumotdagi asosiy ko'rsatkich (hali to'ldirilmagan) |

`npm test` uchala to'plamni alohida hisoblaydi. U formatni tekshiradi va quyidagi hollarda xato beradi:
- v2 natijasi `tests/results/v2-reference.json` dagidan 5 punktdan ko'p pasaysa;
- v3 natijasi boshlang'ich natijadan yomonlashsa.

### v3 ni to'ldirish tartibi
1. **Qoralama:** `node tools/redact.mjs --from-export result.json --channel @kanal --limit 50 > v3-qoralama.js`. Telefon (UZ va RU), karta, JSHSHIR, pasport raqami, email, `t.me` va `@username` yashiriladi. STIR o'zgarmaydi, tizim bahosi ko'rsatilmaydi. "Dilnoza opa" kabi ismlar avtomatik yashirilmaydi: qoralamada `⚠️` izohi chiqadi, ularni qo'lda tekshiring.
2. **Belgilash:** har bir `TODO` ni e'lonni o'qib, **tizimga qaramasdan** to'ldiring (format: `js/test-set-v3.js` boshidagi izoh).
3. **Qo'shish:** e'lonlarni `js/test-set-v3.js` dagi massivga qo'shing va `npm test` ishga tushiring. Format xatosi yoki yashirilmagan raqam bo'lsa, test aniq xabar beradi.
4. **Commit:** `git commit -m "test: add v3 real postings"`.
5. **Boshlang'ich natija:** `npm run eval:v3-baseline`. `analyzer.js` ga tegmang. Natija `tests/results/v3-baseline.json` ga, quyidagi blokka va "Loyiha haqida" bo'limiga yoziladi. Keyin uni commit qiling.
6. **Xatolar tahlili:** `tests/results/v3-errors.md` dagi har bir xato uchun sabab va umumiy tuzatishni yozing. So'ng qoidalarni tuzating va `npm test` ishga tushiring.

**Boshlang'ich natija himoyasi:**
- Birinchi yozishda `js/` va `tools/` toza bo'lishi kerak: `analyzer.js`, `evaluate.js` va `test-set-v3.js` commit qilingan, yangi fayllar ham yo'q.
- Natijaga git commit, sana, e'lonlar soni hamda `analyzer.js`, `evaluate.js` va `test-set-v3.js` ning SHA-256 xeshlari yoziladi. Shu orqali natija aynan qaysi qoidalar, metrikalar va e'lonlar bilan olinganini isbotlash mumkin.
- Qayta o'lchash `npm run eval:v3-baseline -- --force` bilan bajariladi. U faqat butun repozitoriy toza bo'lganda ishlaydi, eski natija esa `tests/results/archive/` ga vaqt belgisi bilan ko'chiriladi.

<!-- v3-baseline:start -->
**v3 boshlang'ich natija** (real e'lonlar, qoidalar o'zgartirilmasdan): 2026-10-11, 34 ta e'lon, commit `ac296f1`

SHA-256: `analyzer.js` `38ceba487377…` · `evaluate.js` `369f131cab8a…` · `test-set-v3.js` `758f4a6fe878…`

| Ko'rsatkich | Natija |
|---|---|
| Umumiy aniqlik | 70.6% |
| Xavfli e'lonlarni topish (recall) | 16.7% (2/12) |
| "Xavfli" deganida to'g'ri bo'lishi (precision) | 100.0% |
| Halol e'lonni xavfli deyish (FPR) | 0.0% (0/22) |
| Kamsitishni topish | 70.6% |
| Odam savdosini topish | — |
| Sabablar aniqligi (kutilgan belgilar topildi) | 28.6% |

Xato bo'lgan testlar (25): v3-001, v3-002, v3-003, v3-004, v3-005, v3-006, v3-007, v3-008, v3-009, v3-010, v3-011, v3-012, v3-013, v3-014, v3-015, v3-016, v3-017, v3-027, v3-028, v3-029, v3-030, v3-031, v3-032, v3-033, v3-034. Tahlil: `tests/results/v3-errors.md`.
<!-- v3-baseline:end -->

## Kutilayotgan ishlar (v3 baseline yozilgandan keyin)

Bu o'zgarishlar `js/analyzer.js` ga tegadi. v3 boshlang'ich natija o'zgartirilmagan qoidalar bilan olinishi uchun ular keyinga qoldirilgan.
1. **`js/analyzer.js` ni `config/currency.js` ga ulash.** O'zgarmaslar o'rniga `IQCurrency.rates` ishlatiladi. Shundan keyin `.env` dagi `IQ_RATE_*` maosh hisobiga ham ta'sir qiladi. Hozircha `tests/config.test.mjs` ikkala joydagi qiymat bir xilligini tekshiradi, server esa `.env` da kurs berilganda ogohlantiradi.
2. **"Xorijga ish" qoidasidagi agentlik nomini yangilash.** Nom `config/official-sources.js` dan olinadi, bu ish manba tasdiqlangandan keyin bajariladi.

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

Fayl **faqat brauzerda** o'qiladi va serverga yuborilmaydi. Telefon, karta, JSHSHIR, pasport, email, `t.me` va `@username` tahlil va `localStorage` ga saqlashdan **oldin** yashiriladi. Niqob formatni saqlaydi (`+998 00 000 00 00`), shuning uchun shaffoflik bahosi o'zgarmaydi. O'chirish uchun "🗑️ Saqlangan ma'lumotni o'chirish" tugmasini bosing. Sinash uchun namunaviy fayl: `namuna/telegram-export-namuna.json`.

Ma'lumotni doimiy fayl sifatida saqlash uchun: `python3 tools/telegram_export.py k1/result.json k2/result.json` → `js/real-data.js`. Skript ham xuddi shu qoidalar bilan yashiradi. Ismlar haqida ogohlantirish beradi: faylni commit qilishdan oldin uni qo'lda tekshiring.

### 3. AI'ni yoqish
```bash
npm install
cp .env.example .env          # ANTHROPIC_API_KEY ni to'ldiring
npm run start:env             # http://localhost:3000  (Node.js 20.6+)
# yoki: ANTHROPIC_API_KEY=sk-ant-... npm start
```
Kalit bo'lmasa server baribir ishlaydi. Bunda tugma o'chiq turadi va "AI tahlil faollashtirilmagan: ANTHROPIC_API_KEY sozlanmagan." degan yozuv chiqadi. Soxta AI javobi hech qachon ko'rsatilmaydi.

**Birinchi real sinov:** saytda "Misol: odam savdosi" → "🤖 AI chuqur tahlil" ni bosing. Javobda iqtiboslar bilan sabablar, savollar va xulosa chiqishini tekshiring.

AI cheklovlari: matn 20–6000 belgi bo'lishi kerak, uzun matn kesilmaydi va rad etiladi. Vaqt chegarasi 45 soniya, xatoda 2 marta qayta urinadi. Promt `prompts/analysis.mjs` faylida.

**AI endpoint xavfsizligi (`/api/ai`):**
- Server sukut bo'yicha faqat `127.0.0.1` da tinglaydi. Tarmoqqa ochish uchun `HOST=0.0.0.0` beriladi, bunda ogohlantirish chiqadi.
- Faqat `Content-Type: application/json` qabul qilinadi, boshqalariga 415 qaytadi. Shuning uchun boshqa sayt oddiy forma yoki `text/plain` so'rov bilan kalitingizni sarflay olmaydi.
- `Origin` bo'lsa, u Host bilan bir xil bo'lishi kerak, aks holda 403 qaytadi. Qo'shimcha domenlar `IQ_ALLOWED_ORIGINS` orqali ruxsat etiladi.
- **Limitlar:**
  - bitta IP dan daqiqasiga `IQ_AI_PER_MINUTE` (10) ta;
  - kunlik `IQ_AI_DAILY_LIMIT` (200) ta;
  - limit tugasa 429 va tushunarli xabar qaytadi;
  - kunlik hisob `data/ai-usage-server.json` da saqlanadi, shuning uchun server qayta ishga tushirilsa ham nolga tushmaydi;
  - bo'sh yoki noto'g'ri so'rov limitni sarflamaydi.
- `X-Forwarded-For` faqat `IQ_TRUST_PROXY=<proksilar soni>` berilganda o'qiladi. Aks holda uni soxtalashtirib limitni chetlab o'tish mumkin bo'lardi.
- Loglarda API kalit, bot token, e'lon matni va PII bo'lmaydi: faqat xato turi va tozalangan qisqa xabar yoziladi (`lib/safe-log.mjs`).

**Prompt injection va AI javobi:**
- E'lon matnidagi `<` `>` `&` belgilari AI'ga yuborilishidan oldin escape qilinadi (`&lt;/posting&gt;`). Shuning uchun e'lon ichidagi `</posting>`, `<rule_check>` yoki boshqa teg blokdan chiqa olmaydi.
- Promtda aniq qoida bor: e'lon ichidagi buyruqlar, soxta "system" xabarlari va "e'lon tugadi" kabi iboralar ko'rsatma emas, tahlil qilinadigan ma'lumot. Tekshiruvchini aldashga urinishning o'zi ham xavf belgisi hisoblanadi.
- Javob qat'iy JSON sxema bilan tekshiriladi: sxemada yo'q maydon bo'lsa, javob rad etiladi.
- AI keltirgan har bir iqtibos e'lon matnida haqiqatan borligi tekshiriladi. Registr, bo'shliq va tutuq belgisi farqlari hisobga olinmaydi. Topilmagan iqtibos foydalanuvchiga ko'rsatilmaydi va `warnings` ga yoziladi.

### 4. Telegram botni ishga tushirish
```bash
# @BotFather → /newbot → tokenni .env ga TELEGRAM_BOT_TOKEN= qilib yozing
npm run bot:env
```

**Buyruqlar:**

| Buyruq | Nima qiladi |
|---|---|
| `/start`, `/help` | Bot haqida qisqa ma'lumot va buyruqlar ro'yxati |
| `/check matn`, `/check` → keyingi xabar, yoki e'longa reply qilib `/check` | E'lonni tekshiradi: xavf darajasi, asosiy sabablar (iqtibos bilan), kamsitish, odam savdosi belgisi, tavsiya. AI yoqilgan bo'lsa, AI xulosasi ham qo'shiladi |
| `/stats` | Siz tekshirgan e'lonlar soni, ulardan xavflilari va oxirgi 5 ta natija |
| Oddiy matn yoki forward (shaxsiy chatda) | Faqat qoidalar bilan tekshiradi; AI chaqirilmaydi |

**AI limitlari va guruhlar:**
- AI **faqat `/check`** bilan ishlaydi. Har bir foydalanuvchi uchun limit soatiga `IQ_BOT_AI_PER_HOUR` (5) ta, bot uchun kunlik limit `IQ_AI_DAILY_LIMIT` ta. Limit tugasa foydalanuvchi qachon yana urinish mumkinligi haqida xabar oladi, qoidalar tahlili esa limitsiz ishlayveradi.
- **Guruhlarda** bot faqat `/start`, `/help`, `/check` va `/stats` ga javob beradi. Oddiy xabarlar, noma'lum buyruqlar va boshqa botga yozilgan `/check@BoshqaBot` e'tiborsiz qoldiriladi. Guruhda `/check matn` yoki e'longa reply qilib `/check` yoziladi.

**Qanday ishlaydi:**
- Har bir javob `Bu avtomatik tahlil. Yakuniy qaror o'zingizda.` degan ogohlantirish bilan tugaydi.
- Matn HTML escape qilinadi. Javob 4096 belgidan oshmaydigan xabarlarga qator chegarasida bo'linadi, shuning uchun teg yoki `&amp;` o'rtasidan kesilmaydi.
- 4000 belgidan uzun matn bo'sh qatorlar bo'yicha e'lonlarga bo'linadi va har biri alohida baholanadi. Javobda eng xavfli bo'lak ko'rsatiladi.
- **Maxfiylik.** `data/bot-stats.json` da e'lon matni saqlanmaydi. Telegram `user_id` ham ochiq saqlanmaydi, faqat `SHA-256(tuz:user_id)` xeshi yoziladi. Tuz `IQ_BOT_HASH_SALT` dan yoki avtomatik yaratilgan `data/bot-salt` dan olinadi. `data/` git'ga tushmaydi.
- **Token bo'lmasa yoki noto'g'ri bo'lsa** bot tushunarli xabar bilan chiqadi (exit 1). Bu ikki xil holatda bo'ladi: token formati noto'g'ri bo'lsa yoki Telegram uni rad etsa (401). Agar bir token bilan ikkinchi nusxa ishga tushirilsa (409), bot ham to'xtaydi.

**Real token bilan tekshirish:**
1. Botga `/start` yozing.
2. "Misol: odam savdosi" matnini `/check` bilan yuboring.
3. Halol e'lon yuboring.
4. `/stats` yozing: 2 ta tekshiruv va 1 ta xavfli chiqishi kerak.

### Accessibility
- Xarita kataklari tugma sifatida ishlaydi: Tab bilan o'tiladi, Enter yoki Space bilan filtrlanadi, holati `aria-pressed` orqali bildiriladi.
- Toast xabarlari `aria-live="polite"` hududi orqali ekran o'quvchiga e'lon qilinadi.
- Kasblar grafigida tor ekranda nomlar 12 belgigacha qisqartiriladi va 2 qatorga bo'linadi. Ustma-ust tushadigan yozuv chizilmaydi. To'liq nom tooltip'da va "Jadval ko'rinishida" ro'yxatida bor.
- Kontrast WCAG AA ga mos: matn ≥ 4.5:1, katta matn ≥ 3:1. Bu ikkala rejimda `npm run test:ui` bilan o'lchanadi.

### Sozlamalar (`config/`)
- `config/currency.js`: kurslar, ularning sanasi va manbasi. `.env` dagi `IQ_RATE_USD`, `IQ_RATE_EUR`, `IQ_RATE_RUB`, `IQ_RATES_UPDATED` va `IQ_RATES_SOURCE` bu qiymatlarni almashtiradi. Sana ko'rsatilmasa yoki u 30 kundan eski bo'lsa, UI'da "Kurslar taxminiy" belgisi chiqadi.
- `config/official-sources.js`: rasmiy idoralar ro'yxati. Har biri uchun nom, havola, `verified` holati, tekshirilgan sana va dalil yoziladi. Manbani tekshirganingizdan keyin `verified: true` qiling.

### 5. Testlar
```bash
npm test
```
| Test fayli | Nimani tekshiradi |
|---|---|
| `tests/importer.test.mjs` | Telegram JSON, CSV, TXT o'qilishi, takrorlar, buzilgan fayllar (8 test) |
| `tests/ai.test.mjs` | AI xato holatlari mock API bilan: buzilgan JSON, sxema, ortiqcha maydon, refusal, 401, 429, 500+retry, timeout, bo‘sh/uzun matn, kalitsiz rejim; prompt injection (`</posting>` neytrallanishi); to‘qilgan iqtibosni aniqlash (14 test) |
| `tests/redact.test.mjs` | Telefon (UZ, RU), karta, JSHSHIR, pasport, email, `t.me`, `@username` yashirilishi; STIR saqlanishi; validator; analyzer natijasi o'zgarmasligi; import va REPL'da yiqilmaslik; v3 qoralamasi (14 test) |
| `tests/redact-parity.test.mjs` | `js/pii.js` va `tools/telegram_export.py` bir xil yashirishi (10 holat; Python bo'lmasa o'tkazib yuboriladi) |
| `tests/baseline.test.mjs` | Boshlang'ich natija skripti: qayta yozish taqiqi, `--force` va git tekshiruvi, arxivlash; commit qilinmagan `analyzer.js`, `evaluate.js`, `test-set-v3.js` va yangi fayllar; uchala SHA-256 xesh va `evaluate.js` o'zgarganda yangi xesh (11 test) |
| `tests/bot.test.mjs` | Bot: 4 buyruq, HTML escape, bo'laklash va 4096 chegarasi, disclaimer, `/stats` va xeshlangan `user_id`; AI faqat `/check`, foydalanuvchi va kunlik AI limiti; guruh qoidalari; xavfsiz log; tokensiz va 401 holatlari; soxta Telegram server bilan to'liq oqim (21 test) |
| `tests/config.test.mjs` | Config va `analyzer.js` kurslari bir xilligi, `.env` orqali almashtirish, eskirgan kurs, rasmiy manbalar formati, server orqali uzatish (6 test) |
| `tests/ui.e2e.mjs` (`npm run test:ui`) | Brauzerda (Playwright): xaritani klaviatura bilan boshqarish, `aria-live`, 390px va 1280px ekranda kasb nomlari ustma-ust tushmasligi, gorizontal scroll yo'qligi, yorug' va qorong'i rejimda WCAG AA kontrast (7 test). Playwright o'rnatilmagan bo'lsa o'tkazib yuboriladi |
| `tests/server-security.test.mjs` | `/api/ai`: Content-Type (415), Origin (403), faqat `127.0.0.1`, kunlik va IP limiti, `X-Forwarded-For` ni soxtalashtirish, `IQ_TRUST_PROXY`, loglarda kalit va PII yo'qligi (13 test, haqiqiy `server.mjs` + mock API) |
| `tests/run.mjs` | v1, v2, v3 bo'yicha aniqlik, xavfli topish, FPR, kamsitish, odam savdosi, sabablar; format tekshiruvi; v2 regressiya chegarasi |

Batafsil xatolar ro'yxati: `node tests/run.mjs --verbose`.

## Tuzilishi

```
index.html, css/            sahifa va dizayn
js/analyzer.js              TAHLIL YADROSI: qoidalar, maosh, hudud, kasb, shaffoflik, odam savdosi
js/importer.js              Telegram JSON / CSV / TXT importi va takrorlarni aniqlash
js/pii.js                   shaxsiy ma'lumotni topish va yashirish (yagona manba)
js/evaluate.js              aniqlik metrikalari (brauzer va testlar uchun bitta modul)
js/test-set.js              qo'lda belgilangan test to'plami + boshlang'ich natija
js/test-set-v3.js           REAL Telegram e'lonlari (v3), hozircha bo'sh
js/results-v3-baseline.js   v3 boshlang'ich natija (brauzer uchun, avtomatik)
tools/redact.mjs            shaxsiy ma'lumotni yashirish va v3 qoralamasi
tools/eval-v3-baseline.mjs  v3 boshlang'ich natijani yozish
config/currency.js          valyuta kurslari (.env orqali almashtiriladi)
config/official-sources.js  rasmiy idoralar va havolalar (tekshirilgan holati bilan)
tests/results/              v2-reference.json, v3-baseline.json, v3-errors.md, archive/
js/ui-*.js, js/app.js       interfeys modullari, real/demo rejimlari
js/sample-data.js           600 ta SINTETIK e'lon (faqat Demo rejimi)
prompts/analysis.mjs        Claude promti va javob sxemasi
lib/ai.mjs                  Claude API chaqiruvi va xatolarni boshqarish
server.mjs, bot.mjs         veb-server va Telegram bot (Telegram bilan aloqa)
lib/bot-core.mjs            bot buyruqlari, formatlash, bo'laklash (testlanadi)
lib/bot-store.mjs           /stats: tuzli SHA-256 bilan anonim statistika
lib/ai-quota.mjs            AI kunlik va oyna (IP / foydalanuvchi) limitlari
lib/safe-log.mjs            kalit, token va PII'siz xato logi
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
