# IshQalqon: himoya paketi

Format: 5 daqiqa nutq + 5 daqiqa jonli demo + hakamlar savollari. Har bir raqam va da'vo README, `docs/JARAYON.md`, kod, test yoki git commit bilan tasdiqlanadi. Hujjatlar mosligi `npm run check:evidence` bilan tekshiriladi. Shu skript quyidagi demo e'lonlarining natijasini ham `js/analyzer.js` orqali tekshiradi.

**Bir jumlada:** IshQalqon yoshlarni zamonaviy kasblar bozoriga xavfsiz kirishga yordam beradigan platforma.

## A. 5 daqiqalik nutq

**0:00–0:45 — Muammo.**
"Ko'p yoshlar birinchi ishini Telegram kanallaridan qidiradi. U yerda zamonaviy kasblar haqidagi e'lonlar bilan birga oldindan pul so'raydigan, 'viza 100% kafolatlangan' deydigan va pasportni topshirishni talab qiladigan e'lonlar ham bir oqimda turadi. Biz 5 ta kanaldan 34 ta real e'lonni qo'lda o'qib chiqdik: 17 tasida (50%) yosh yoki jins cheklovi bor, 12 tasi xavfli yoki shubhali."

**0:45–1:30 — G'oya: zamonaviy kasblar bozoriga xavfsiz kirish.**
"IshQalqon ikki savolga javob beradi. Birinchisi: bozor nimani so'rayapti — qaysi kasb, qaysi ko'nikma, qaysi hudud va qancha maosh. Ikkinchisi: bu aniq e'lon xavfsizmi. Xavfsizlik alohida mahsulot emas, yangi kasbga kirishning bir qismi."

**1:30–2:30 — Kasblar, ko'nikmalar, hudud, maosh.**
"Telegram eksportini yuklasangiz, har bir e'londan kasb, ko'nikmalar, hudud va maosh ajratiladi. Takrorlar olib tashlanadi. Natijada hududlar xaritasi, kasblar bo'yicha talab va maosh, raqamli va an'anaviy ko'nikmalar, kanallar reytingi chiqadi. Ma'lumot kam bo'lsa, sayt grafik chizmaydi va 'Ma'lumot yetarli emas' deydi: 34 ta real e'lon kasblar statistikasi uchun kam."

**2:30–3:30 — Xavf, kamsitish, odam savdosi va shaffof tahlil.**
"Har bir e'lon 15 ta firibgarlik qoidasi va real bo'lmagan maosh tekshiruvi, 5 turdagi kamsitish va shaffoflik indeksi bo'yicha baholanadi. Firibgarlik xavfi va kamsitish alohida ko'rsatiladi. Kamsituvchi e'lon 'past xavf' degani bilan yashirinib qolmaydi. Odam savdosi belgisi alohida chiqadi. Har bir baho sababi va e'lon matnidagi aniq iqtibos bilan beriladi. Tizim hukm chiqarmaydi, sababni ko'rsatadi."

**3:30–4:20 — Texnologiya, test va maxfiylik.**
"Asosiy tahlil brauzerda, internetsiz ishlaydi; yuklangan fayl serverga ketmaydi, telefon va karta raqamlari saqlashdan oldin yashiriladi. AI — Claude yoki Gemini — ixtiyoriy chuqur tahlil qatlami, uning iqtiboslari e'lon matnidan tekshiriladi. `npm test` da 172 ta unit test va aniqlik o'lchovi bor, `npm run test:ui` da 42 ta brauzer testi: telefon ekrani, klaviatura, qorong'i rejim, kontrast."

**4:20–5:00 — Halol cheklov va keyingi qadam.**
"Real e'lonlarda qoidalar o'zgartirilmasdan olingan natija: aniqlik 70.6%, xavfli e'lonni topish 16.7%. Xatolarni tahlil qilib qoidalarni tuzatdik: 91.2% va 75.0%, halol e'lonni xavfli deyish 0.0%. Lekin bu optimistik, chunki qoidalar shu e'lonlarga qarab tuzatilgan. Keyingi qadam: yangi kanallardan v4 to'plami bilan mustaqil o'lchash."

## B. 5 daqiqalik jonli demo

**Tayyorgarlik (demo oldidan):** `npm start` → http://localhost:3000. Brauzer oynasi 1366px atrofida, yorug' rejim. Agar kalit bo'lsa, terminalda AI provayderi yozilganini tekshiring. Zaxira sifatida ikkinchi oynada `index.html` ochiq tursin.

**0:00–0:30 — Bosh sahifa.** Sarlavha "Zamonaviy kasblar bozoriga xavfsiz kiring", 3 ta qiymat, raqamlar ostidagi "Manba: real namuna — 5 ta Telegram kanalidan…" yozuvi. Jonli misol "Demo misol" deb belgilangan: u sintetik.

**0:30–1:30 — Xavfli e'lon.** **Vakansiyani tekshirish** tugmasini bosing, quyidagi matnni maydonga qo'ying va **Tekshirish** ni bosing:

<!-- evidence:analyze level=high trafficking=true flags=prepay,passport,visa,abroad,urgency disc=0 -->
```text
Koreyaga ish! Zavodga ishchilar kerak, oylik 2500$. Viza 100% kafolatlangan. Hujjatlar uchun oldindan 500$ to'lov qilasiz, pasportingizni bizga topshirasiz. Joylar cheklangan, tez yozing!
```
Kutilgan natija: firibgarlik xavfi **yuqori**, **odam savdosi belgisi**; sabablar: oldindan to'lov, pasportni topshirish, "100% kafolatlangan" viza, xorij, shoshiltirish. Har biri iqtibos bilan ko'rsatiladi.

**1:30–2:15 — Kamsituvchi e'lon.** **Tozalash** → matnni qo'ying → **Tekshirish**:

<!-- evidence:analyze level=low trafficking=false flags= disc=age,gender,appearance,marital -->
```text
Ofis menejeri kerak. Faqat qizlar, yoshi 20-25, chiroyli, turmush qurmagan. Toshkent, Chilonzor. Oylik 5 mln so'm, 5/2, 9:00-18:00.
```
Kutilgan natija: firibgarlik xavfi **past**, lekin **4 ta kamsituvchi talab**: yosh, jins, tashqi ko'rinish, oilaviy holat. Ayting: "Firibgarlik va kamsitish alohida o'lchanadi."

**2:15–2:35 — Mazmunsiz kiritish.** Maydonga `abc` yozing → **Tekshirish**.

<!-- evidence:invalid -->
```text
abc
```
Kutilgan natija: baho chiqmaydi, "E'lon matni juda qisqa yoki mazmunsiz. Kamida 20 belgi va harfli so'z kiriting." degan xabar chiqadi.

**2:35–3:35 — Telegram eksport.** Menyuda **Bozor tahlili** → **📂 Telegram eksportini yuklash** → `namuna/telegram-export-namuna.json`. Ayting: "Bu **sintetik namunaviy fayl**, real kanal emas." Import hisoboti: 41 ta xabar, 6 ta takror, 34 ta noyob e'lon. Bosh sahifadagi manba yozuvi "siz yuklagan Telegram eksporti" ga o'zgaradi. Agar o'zingizning real eksportingiz bo'lsa, uni yuklang (`docs/JARAYON.md`, 8-bo'lim).

**3:35–4:15 — Kasblar, hudud, kanallar.** Hududlar xaritasidagi katakni bosing: ro'yxat filtrlanadi. **Zamonaviy kasblar**: kichik namunada "Ma'lumot yetarli emas" chiqadi. Grafikni ko'rsatish uchun **Demo** ni bosing va "DEMO" belgisini ko'rsating. **Kanallar**: A–F reyting. Keyin **Real ma'lumot** ga qayting va **🗑️ Saqlangan ma'lumotni o'chirish** ni bosing.

**4:15–4:40 — Mobil ko'rinish.** DevTools → qurilma rejimi (Ctrl+Shift+M) → 390px. ☰ menyu, gorizontal scroll yo'q. 🌓 bilan qorong'i rejim.

**4:40–5:00 — AI va fallback.**
- **AI yoqilgan bo'lsa:** "🤖 AI chuqur tahlil" → xulosa, iqtiboslar, ish beruvchiga savollar.
- **AI ishlamasa** (kalit yo'q, limit tugagan, internet yo'q): tugma o'chiq va sababi yoziladi, yoki "AI tahlili bajarilmadi: … Qoidalar tizimi natijasi yuqorida o'z kuchida." chiqadi. Ayting: "AI ixtiyoriy qatlam; asosiy natija yuqorida turibdi."
- **Internet ishlamasa:** hammasi lokal ishlaydi (Chart.js ham `vendor/` da). Faqat AI ishlamaydi.

## C. Hakamlar savollariga 15 ta javob

1. **Nega bu "Zamonaviy kasblar" tanloviga mos?**
   Sayt yoshga zamonaviy kasblar bozorini ko'rsatadi: qaysi kasb va ko'nikma so'ralayotgani, hudud va maosh. Shu bozorga kirishdagi asosiy to'siq — firibgarlik va kamsitish — ham tekshiriladi. Dalil: bosh sahifa, "Zamonaviy kasblar" bo'limi va menyusi, commit `3e5da80`.

2. **AI nimaga kerak?**
   Mahsulotda ixtiyoriy chuqur tahlil uchun: xulosa, iqtibosli sabablar, ish beruvchiga savollar va kamsitishsiz variant. Asosiy baho AI'siz, qoidalar bilan chiqadi. Ishlab chiqishda Claude Code dasturlash yordamchisi sifatida ishlatilgan (`docs/JARAYON.md`, 3-bo'lim).

3. **AI hamma kodni yozganmi?**
   Kodning katta qismi Claude Code yordamida yozilgan va bu commitlarda `Co-Authored-By: Claude` qatori bilan ochiq ko'rsatilgan. Muallif yo'nalish va ustuvorliklarni tanlagan, real e'lonlarni yig'ib qo'lda belgilagan, har bir bosqichni tekshirib qabul qilgan yoki qaytargan, saytni va Gemini'ni o'zi sinagan.

4. **Nimani o'zingiz moslashtirgansiz?**
   Real e'lonlarni tizimga qaramasdan belgilash (`ac296f1`) va AI taklif qilgan noto'g'ri belgilarni rad etish (masalan, asossiz "odam savdosi"). Boshlang'ich natija qoidalarga tegmasdan olinishini talab qilish (`e14e600`). Real namunadagi xatolar asosida qoidalarni umumiy holatga keltirish (`docs/JARAYON.md`, 4-bo'lim). Bosh sahifani tanlov yo'nalishiga moslash.

5. **Tizim qanchalik aniq?**
   Real e'lonlarda qoidalar o'zgartirilmasdan: aniqlik 70.6%, xavfli e'lonni topish 16.7%. Tuzatilgandan keyin: 91.2%, 75.0%, halol e'lonni xavfli deyish 0.0%. Qo'lda yozilgan v2 to'plamida (qoidalar ko'rmasdan): 85.4% / 64.7%. Asosiy halol raqam — boshlang'ich natija.

6. **91.2% nimani bildiradi?**
   34 ta real e'londan 31 tasida tizimning "xavfli yoki xavfsiz" degan qarori inson belgisi bilan mos keldi. Bu yakuniy real aniqlik emas: qoidalar aynan shu e'lonlardagi xatolar asosida tuzatilgan, shuning uchun natija optimistik. Mustaqil o'lchov uchun yangi e'lonlar (v4) kerak.

7. **Real ma'lumot qayerdan?**
   5 ta ochiq Telegram kanalidan olingan 34 ta e'lon (`js/test-set-v3.js`). Telefon, karta, pasport, `@username` va havolalar yashirilgan. Har bir e'lon tizimga qaramasdan qo'lda belgilangan. Bosh sahifadagi jonli misollar va Demo rejimidagi 600 ta e'lon sintetik va shunday belgilangan.

8. **Maxfiylik qanday himoyalangan?**
   Yuklangan fayl brauzerdan chiqmaydi. Shaxsiy raqamlar tahlil va saqlashdan oldin yashiriladi (`js/pii.js`, 24 ta test). AI faqat tugma bosilganda bitta e'lon uchun chaqiriladi. Bot `user_id` ni tuzli SHA-256 ko'rinishida saqlaydi, e'lon matnini saqlamaydi. Kalitlar `.env` da, git'da yo'q.

9. **Nega Telegram?**
   O'zbekistonda ko'p ish e'lonlari Telegram kanallarida joylanadi va real namunamiz ham shu yerdan. Telegram Desktop kanalni JSON qilib eksport qiladi, uni brauzerda xavfsiz o'qish mumkin. Bot esa foydalanuvchi e'lonni o'qiyotgan joyning o'zida tekshirishga imkon beradi.

10. **Odam savdosini qanday ajratasiz?**
    Qoida ochiq (`js/analyzer.js`): pasportni olib qolish, qarz qulligi, xorijga tashqi ko'rinish bo'yicha chaqirish yoki xorijga ish bilan birga to'lov, "kafolatlangan viza", ko'ngilochar soha yoki noqonuniy ishlash. Bu yakuniy hukm emas, "belgi". Qo'lda yozilgan to'plamda u 100% topiladi, lekin real namunada inson belgilagan odam savdosi holati yo'q va bitta ortiqcha belgi bor (v3-034).

11. **Firibgar e'lon noto'g'ri past xavf olsa nima qilasiz?**
    Bu bo'ladi: real namunadagi 12 ta xavfli e'londan 3 tasi hali "past" oladi (v3-007, v3-011, v3-033). Har bir bunday xato test to'plamiga qo'shiladi va qoida umumiy naqsh sifatida tuzatiladi. `npm test` real e'lonlardagi natija pasaysa xato beradi. Sayt har doim "Yakuniy qaror o'zingizda" deydi va xavfsizlik bo'limida tekshiruv ro'yxatini beradi.

12. **Internet yoki AI ishlamasa nima bo'ladi?**
    Asosiy tahlil, bozor tahlili va grafiklar internetsiz ishlaydi. AI tugmasi o'chiq turadi va sababi yoziladi; AI xato bersa, "Qoidalar tizimi natijasi yuqorida o'z kuchida" deyiladi. Soxta AI javobi ko'rsatilmaydi.

13. **Bot va AI real kalit yoki token bilan tekshirilganmi?**
    Claude API: real kalit bilan sinalmagan. Gemini API: real kalit bilan faqat qo'lda sinalgan. Telegram bot: real token bilan sinalmagan. Hammasi mock serverlar bilan avtomatik testlangan: Claude 14 ta, Gemini 13 ta, bot 21 ta test.

14. **Cheklovlaringiz nima?**
    Real to'plam kichik (34 ta), qoidalar kalit so'zlarga tayanadi va yangi imlodagi firibgarlikni o'tkazib yuborishi mumkin. Kasblar statistikasi uchun real ma'lumot hali kam. Valyuta kurslari taxminiy, rasmiy idoralar ro'yxati tasdiqlanmagan. UI faqat Chromium'da testlangan. To'liq ro'yxat: README → Cheklovlar.

15. **Keyingi 3 qadam nima?**
    1) Yangi kanallardan v4 to'plamini yig'ib, qoidalarga tegmasdan mustaqil o'lchash. 2) Bot va AI'ni real token va kalit bilan sinab, natijani hujjatlash. 3) Kasblar statistikasi uchun yetarli real eksport yig'ish va valyuta kurslarini `js/analyzer.js` ga config orqali ulash.

## D. Oflayn zaxira reja

| Vaziyat | Nima qilinadi |
|---|---|
| Hammasi ishlaydi | `npm start` → http://localhost:3000, yuqoridagi demo |
| Internet yo'q | `npm run demo:local` (kalitsiz, faqat `127.0.0.1`) yoki `index.html` — qoidaviy tahlil, import, grafiklar ishlaydi. AI qadamini o'tkazib yuborib, "AI ixtiyoriy qatlam" deb ayting |
| API kalit yo'q yoki limit tugagan | Tugma o'chiq va sababi yoziladi. Qoidaviy natijani ko'rsating; AI testlari mock API bilan bor (`tests/ai.test.mjs`, `tests/ai-gemini.test.mjs`) |
| Server ishga tushmaydi | `index.html` ni brauzerda to'g'ridan-to'g'ri oching: AI'dan boshqa hamma narsa ishlaydi |
| Kompyuter yoki brauzer ishlamaydi | Oflayn demo video (`docs/VIDEO_DEMO.md`), `docs/SCREENSHOTS.md` dagi 5 ta screenshot. Ular olinmaguncha: `docs/demo.gif` va eski skrinshotlar — yangi bosh sahifadan oldin olingan, buni ayting |
| Savolga dalil kerak | `npm test` va `npm run test:ui` ni jonli ishga tushirish; `git log --oneline` |
