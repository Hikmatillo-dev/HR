# 🛡️ IshQalqon

Telegram'dagi vakansiyalarni **firibgarlik**, **odam savdosi belgilari** va **kamsitish** bo'yicha tekshiruvchi hamda mehnat bozorini chuqur tahlil qiluvchi platforma.

## Imkoniyatlar

| # | Bo'lim | Nima qiladi |
|---|---|---|
| 1 | **Vakansiyani tekshirish** | Xavf bali (0–100) va shaffoflik indeksi (0–100) beradi. Har bir belgining sababi tushuntiriladi, matnda topilgan iboralar rang bilan belgilanadi. O'zbek (lotin va kirill) va rus tilini tushunadi. Natijani yoki tayyor shikoyat matnini nusxalash mumkin. |
| 2 | **Bozor tahlili** | Ko'rsatkichlar paneli, xavf darajalari, firibgarlik belgilari, **hududlar xaritasi** (4 xil ko'rsatkich bilan), kunlik dinamika, kamsitish turlari, shaffoflik kamchiliklari va avtomatik xulosalar. |
| 3 | **Zamonaviy kasblar** | Kasblar xaritasi (talab va maosh), eng ko'p so'raladigan ko'nikmalar (raqamli va an'anaviy), sohalar bo'yicha maosh. Masalan: "raqamli ko'nikma talab qilinadigan e'lonlarda maosh X% yuqori". |
| 4 | **Kanallar reytingi** | Har bir Telegram kanalga A–F baho beriladi: xavfli e'lonlar ulushi, kamsitish, shaffoflik va takroriy e'lonlar asosida. |
| 5 | **Vakansiyalar bazasi** | Qidiruv, daraja, hudud, soha va kamsitish bo'yicha filtrlar. Qatorni bossangiz, to'liq tahlil ochiladi. |
| 6 | **Ish beruvchilar uchun** | Halol vakansiya yaratuvchi: shakl to'ldiriladi, shaffof e'lon matni tayyorlanadi va kamsitish bo'lsa darhol ogohlantiradi. |
| 7 | **Xavfsizlik qo'llanmasi** | 10 ta oltin qoida va xorijga ketishdan oldingi interaktiv tekshiruv ro'yxati (brauzerda saqlanadi). |
| 8 | **Loyiha va aniqlik** | Ishlash sxemasi va test to'plamidagi aniqlik ko'rsatkichlari (brauzerda jonli hisoblanadi). |
| + | **Ma'lumot yuklash** | Telegram Desktop eksporti (JSON), CSV yoki TXT faylini to'g'ridan-to'g'ri saytga yuklash mumkin. Takroriy e'lonlar avtomatik olib tashlanadi. |
| + | **Eksport** | Barcha tahlilni CSV formatda yuklab olish (Excel'da ochiladi) va PDF hisobot chop etish. |
| + | **AI chuqur tahlil** | Claude API orqali xulosa, maslahat va kamsitishsiz qayta yozilgan variant beradi (ixtiyoriy). |
| + | **Telegram bot** | E'lonni botga yuboring yoki forward qiling, bot darhol tekshiradi. |
| + | **Qorong'i rejim**, mobil ekranga moslashuv | |

## Ishga tushirish

**1. Eng oddiy usul.** `index.html` faylini brauzerda oching. Hech narsa o'rnatish shart emas, internetsiz ham ishlaydi. AI'dan boshqa barcha funksiyalar ishlaydi.

**2. Server orqali (AI bilan):**
```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start        # http://localhost:3000
```
Kalit bo'lmasa ham server ishlaydi, faqat AI tugmasi ko'rinmaydi.

**3. Telegram bot:**
```bash
TELEGRAM_BOT_TOKEN=123:ABC... npm run bot     # token @BotFather dan olinadi
```

**4. Sifat testi:**
```bash
npm test
```

## Tuzilishi

```
index.html            sahifa (8 bo'lim)
css/style.css         dizayn (yorug' va qorong'i rejim)
js/analyzer.js        TAHLIL YADROSI: qoidalar, maosh, hudud, kasb, ko'nikma, shaffoflik
js/ui-*.js, app.js    interfeys modullari
js/sample-data.js     600 ta NAMUNAVIY (sintetik) e'lon, faqat demo uchun
js/test-set.js        qo'lda belgilangan test to'plami
js/real-data.js       haqiqiy ma'lumot (tools/telegram_export.py yozadi)
lib/ai.mjs            Claude API bilan chuqur tahlil
server.mjs, bot.mjs   veb-server va Telegram bot
tools/telegram_export.py   Telegram eksportini real-data.js ga aylantiradi
namuna/telegram-export-namuna.json   yuklashni sinash uchun namunaviy fayl
tests/run.mjs         aniqlik o'lchovi (precision, recall, F1)
```

## ⚠️ Muhim: haqiqiy ma'lumot

Saytdagi raqamlar hozir **sintetik** ma'lumotdan olingan, sayt buni ochiq ko'rsatib turadi. Hakamlar oldiga **haqiqiy** raqamlar bilan chiqing:

1. Telegram Desktop → ish kanali → ⋮ → **Export chat history** → format: **JSON** (media kerak emas)
2. 8–15 ta kanal uchun takrorlang: Toshkent va viloyat kanallari, xorijga ish kanallari
3. Saytdagi **"📂 Telegram eksportini yuklash"** tugmasini bosing (bir nechta faylni birdan tanlash mumkin)
4. Doimiy saqlash uchun: `python3 tools/telegram_export.py k1/result.json k2/result.json ...`

## Tahlil qanday ishlaydi

- **Firibgarlik (11 belgi):** oldindan to'lov, karta yoki SMS kod so'rash, pasportni olib qolish, "100% viza", piramida va kripto sxemalar, "oson pul", shubhali havolalar, xorij, shoshiltirish, yashirilgan ma'lumot, real bo'lmagan maosh.
- **Ishonch belgilari** (xavfni kamaytiradi): STIR, yuridik shakl, rasmiy ishga joylashtirish, sayt, manzil. Agar pul yoki hujjat so'ralgan bo'lsa, bu belgilar xavfni kamaytirmaydi.
- **Kamsitish (5 tur):** yosh, jins, tashqi ko'rinish, oilaviy holat, millat yoki propiska. Har biri uchun qanday tuzatish kerakligi aytiladi.
- **Shaffoflik indeksi (7 mezon):** maosh, aloqa, kompaniya, manzil, ish vaqti, talablar, rasmiy ishga joylashtirish.
- **Kirill → lotin:** kirill alifbosidagi o'zbekcha matn ham lotin qoidalari bilan tekshiriladi.
- To'lov summalari ("hujjat uchun 500$") maosh deb hisoblanmaydi. Dollar, yevro va rubl so'mga o'giriladi (taxminiy kurs).

Yangi firibgarlik usuli paydo bo'lsa, `js/analyzer.js` ga bitta qator qo'shiladi va `npm test` bilan tekshiriladi.

## 2 kunlik reja

**1-kun: ma'lumot**
- [ ] 8–15 ta kanalni eksport qiling va saytga yuklang
- [ ] Jadvalda 100 ta e'lonni ko'rib chiqing: tizim qayerda xato qildi?
- [ ] Xatolarni `js/test-set.js` ga qo'shing, `js/analyzer.js` dagi qoidalarni yaxshilang, `npm test` ishga tushiring
- [ ] Saytni internetga chiqaring: GitHub Pages (Settings → Pages) yoki Netlify Drop
- [ ] Telegram botni ishga tushirib ko'ring

**2-kun: taqdimot**
- [ ] 7–8 ta slayd va 2 daqiqalik zaxira demo video
- [ ] 5–10 kishiga sinatib ko'ring va fikrlarini yozib oling
- [ ] Taqdimotni 3 marta ovoz chiqarib, vaqtni o'lchab mashq qiling

## Taqdimot (5–7 daqiqa)

1. **Hikoya (30 soniya).** "Tanishim Koreyaga ish deb 500 dollar to'ladi. Na viza bo'ldi, na pul qaytdi."
2. **Muammo (1 daqiqa).** O'zingiz yig'gan raqamlar: "N ta e'londan X% xavfli, Y% kamsituvchi".
3. **Demo (3 daqiqa):**
   - "Odam savdosi" misolini tekshiring: tizim 95 ball beradi va sabablarini ko'rsatadi
   - Kirill alifbosidagi e'lonni tekshiring
   - Hududlar xaritasi va kanallar reytingi
   - Kasblar xaritasi: "zamonaviy kasblar va ko'nikmalar"
   - Ish beruvchi uchun halol e'lon yaratish
   - Telefondan botga e'lon yuboring
   - **Hakamdan istalgan e'lonni berishini so'rang**
4. **Kimga foydali (1 daqiqa).** Ish izlovchilar, kanal egalari, davlat idoralari, kompaniyalar.
5. **Kelajak (30 soniya).** Avtomatik monitoring, yig'ilgan ma'lumotda o'qitilgan model, litsenziyalar bazasi bilan integratsiya.

## Hakamlar savollariga javoblar

- **"Bu sun'iy intellektmi?"** Ikki qatlamli tizim. Birinchisi tushuntiriladigan qoidalar tizimi: tez, bepul, internetsiz ishlaydi va har bir bahoning sababini ko'rsatadi. Ikkinchisi til modeli (Claude) bilan chuqur tahlil: kontekstni tushunadi va kamsitishsiz variantni yozib beradi. Yig'ilgan ma'lumot asosida keyinroq o'z modelimizni o'qitamiz.
- **"Aniqligi qanday?"** Test to'plamida precision va recall o'lchanadi (8-bo'lim, `npm test`). Hozirgi to'plam kichik, shuning uchun uni haqiqiy e'lonlar bilan kengaytiryapmiz.
- **"Xato qilsa-chi?"** Tizim "bu firibgar" deb hukm chiqarmaydi. U xavf darajasi va sabablarini ko'rsatadi, qaror foydalanuvchida qoladi.
- **"hh.uz yoki davlat ish portallaridan farqingiz nima?"** Ular e'lon joylash platformasi. Biz Telegram'dagi nazoratsiz bozorni tahlil qilamiz va himoya qilamiz.
- **"Shaxsiy ma'lumotlar?"** Faqat ochiq kanallardagi e'lonlar tahlil qilinadi. Foydalanuvchi ma'lumoti saqlanmaydi, tekshiruv brauzerning o'zida bajariladi.
- **"Pulni qanday topasiz?"** Kompaniyalarga "tasdiqlangan ish beruvchi" belgisi, kanallarga moderatsiya xizmati, davlat va xalqaro tashkilotlarga analitik hisobotlar.
