# Screenshot manifesti (5 ta)

Topshirish va himoya uchun aynan 5 ta screenshot. Ular hali olinmagan. Har birini shu yerdagi ko'rsatma bo'yicha oling va ko'rsatilgan nom bilan `docs/screenshots/` ga qo'ying. `npm run preflight` qaysilari yetishmayotganini aytadi, `npm run preflight -- --final` esa yetishmasa xato beradi.

**Eskirgan rasmlar.** `docs/screenshots/` dagi hozirgi 1-bosh-sahifa.png, 2-tekshiruv.png, 3-bozor-tahlili.png, 4-telefon.png, 5-aniqlik.png va `docs/demo.gif` yangi bosh sahifadan (`3e5da80`) **oldin** olingan. Quyidagi 5 tasi olingach, README dagi havolalarni yangi nomlarga almashtiring va eski fayllarni o'chiring.

**Umumiy tayyorgarlik (hammasi uchun):**
- `npm run demo:local` → http://127.0.0.1:3000 (AI kalitsiz; internet shart emas). Yoki `index.html` ni to'g'ridan-to'g'ri oching.
- Chrome yoki Edge. O'lchamni aniq qilish uchun: F12 → qurilma rejimi (Ctrl+Shift+M) → **Responsive** → kenglik va balandlikni yozing → ⋮ → **Capture screenshot**.
- Brauzer masshtabi 100%. Kengaytmalar paneli, xatchoplar va shaxsiy tablar ko'rinmasin.
- Rejim: sahifadagi 🌓 tugmasi (yoki tizim sozlamasi).
- **Real va sintetik ma'lumot aralashmasin:** har bir screenshotda qaysi biri ekani ko'rsatilgan va caption'da yozilgan.

**PII tekshiruvi (har bir rasm uchun, saqlashdan oldin):** rasmni 100% kattalikda ochib qarang. Ochiq telefon raqami (`+998 00 000 00 00` kabi niqobdan boshqasi), karta, pasport, email, `@username`, `t.me` havola, real odam ismi yoki yuzi ko'rinmasin. Brauzerning manzil satrida va tablarda shaxsiy ma'lumot bo'lmasin.

---

## 1. Bosh sahifa: yangi hero

| | |
|---|---|
| **Fayl** | `docs/screenshots/01-hero-1366-light.png` |
| **Viewport** | 1366 × 768 |
| **Rejim** | yorug' (light) |
| **Qanday kelish** | Sahifani oching, yuqorida qoling. Jonli misol animatsiyasi tugashini kuting (~4 soniya: sabablar ro'yxati va "Bu avtomatik tahlil" izohi chiqadi). |
| **Ko'rinishi shart** | Sarlavha "Zamonaviy kasblar bozoriga xavfsiz kiring"; 3 ta qiymat kartasi; "Vakansiyani tekshirish" va "Zamonaviy kasblarni ko'rish" tugmalari; raqamlar va ularning ostidagi "Manba: real namuna — 5 ta Telegram kanalidan…" yozuvi; o'ngda "Demo misol" belgili jonli misol (natija va iqtiboslar bilan); menyuda "Zamonaviy kasblar". |
| **Ma'lumot** | Raqamlar — real namuna (34 ta e'lon, PII yashirilgan). Jonli misol — **sintetik**, "Demo misol" deb belgilangan. |
| **Caption** | "Bosh sahifa: IshQalqon yoshlarni zamonaviy kasblar bozoriga xavfsiz kiritadi. Raqamlar — 34 ta real e'londan, manbasi bilan; o'ngdagi misol sintetik." |
| **PII** | Sahifada faqat agregat raqamlar va sintetik matn bor. Manzil satrini tekshiring. |
| **Mezon** | 2.1 (topshiriqqa moslik), 4.1 (muammo va yechim), 6.3 (mazmun va uslub uyg'unligi), 4.2 (taqdimot materiallari). |

## 2. Vakansiyani tekshirish: xavfli kirillcha e'lon

| | |
|---|---|
| **Fayl** | `docs/screenshots/02-tekshiruv-xavfli.png` |
| **Viewport** | 1366 × 900 |
| **Rejim** | yorug' (light) |
| **Qanday kelish** | "Vakansiyani tekshirish" → maydonga quyidagi **sintetik** matnni qo'ying → **Tekshirish**. Natija kartasining yuqori qismi va sabablar ko'rinadigan qilib aylantiring. |
| **Ko'rinishi shart** | "Firibgarlik xavfi: yuqori"; "🚨 Odam savdosi belgisi"; kamsitish alohida (yosh, jins); sabablar ro'yxati (oldindan to'lov, pasportni topshirish, "100% kafolatlangan" viza, xorij, shoshiltirish), har biri e'lon matnidagi iqtibos bilan. |
| **Ma'lumot** | **Sintetik** matn (quyida). Analizator natijasi `npm run check:evidence` bilan tekshiriladi. |
| **Caption** | "Kirillcha yozilgan sintetik e'lon: firibgarlik xavfi yuqori, odam savdosi belgisi va 2 ta kamsituvchi talab — har bir sabab matndagi iqtibos bilan." |
| **PII** | Matnda telefon va ism yo'q. |
| **Mezon** | 4.1 (muammo va yechim), 5.3 (moslashtirish: kirill yozuvi), 4.2. |

<!-- evidence:analyze level=high trafficking=true flags=prepay,passport,visa,abroad,urgency disc=age,gender -->
```text
Кореяга иш! Заводга ишчилар керак, ойлик 2500$. Виза 100% кафолатланган. Ҳужжатлар учун олдиндан 500$ тўлов қиласиз, паспортингизни бизга топширасиз. Фақат 20-30 ёшли йигитлар. Тез ёзинг, жойлар чекланган!
```

## 3. Telegram eksport importi

| | |
|---|---|
| **Fayl** | `docs/screenshots/03-import-hisoboti.png` |
| **Viewport** | 1366 × 900 |
| **Rejim** | yorug' (light) |
| **Qanday kelish** | Menyu → **Bozor tahlili** → **📂 Telegram eksportini yuklash** → `namuna/telegram-export-namuna.json` (sintetik fayl). Import hisoboti ko'rinadigan qilib aylantiring. Rasmdan keyin **🗑️ Saqlangan ma'lumotni o'chirish**. |
| **Ko'rinishi shart** | "📥 Import hisoboti · telegram-export-namuna.json" (sintetik fayl nomi); 41 ta xabar, 6 ta takror (olib tashlandi), 34 ta noyob e'lon; xavf taqsimoti; "🔒 Shaxsiy ma'lumot yashirildi: 17 telefon raqami. Brauzerda faqat yashirilgan matn saqlanadi." |
| **Ma'lumot** | **Sintetik** namunaviy eksport (real kanal emas). Fayl nomi rasmda ko'rinib turadi. |
| **Caption** | "Sintetik namunaviy Telegram eksporti: 41 ta xabar o'qildi, 6 ta takror olib tashlandi, 34 ta e'lon tahlil qilindi; 17 ta telefon raqami saqlashdan oldin yashirildi. Fayl serverga yuborilmaydi." |
| **PII** | Telefonlar niqoblangan. Sahifa pastidagi e'lonlar ro'yxatida ham ochiq raqam yo'qligini tekshiring. |
| **Mezon** | 5.4 (sifat va xavfsizlik dalili), 2.4 (ma'lumotning izchilligi), 4.2. |

## 4. Bozor va zamonaviy kasblar

| | |
|---|---|
| **Fayl** | `docs/screenshots/04-bozor-kasblar.png` |
| **Viewport** | kenglik 1366; uzun rasm (pastga qarang) |
| **Rejim** | yorug' (light) |
| **Qanday kelish** | **Bozor tahlili** → **Demo** tugmasi. F12 → Ctrl+Shift+P → "Capture full size screenshot". Rasmni "Hududlar xaritasi" sarlavhasidan "Kanallar" jadvalining oxirigacha qirqing (Paint, Preview yoki istalgan muharrir). Tugagach **Real ma'lumot** ga qayting. |
| **Ko'rinishi shart** | "DEMO" belgisi; hududlar xaritasi; kasblar bo'yicha talab va maosh grafigi; ko'nikmalar (raqamli va an'anaviy); kanallar A–F reytingi. |
| **Ma'lumot** | **Sintetik (Demo rejimi, 600 ta e'lon).** Real namunada (34 ta) kasblar uchun ma'lumot yetarli emas va sayt buni ochiq aytadi, shuning uchun grafik faqat Demo rejimida ko'rsatiladi. |
| **Caption** | "Demo rejimi (sintetik 600 ta e'lon, DEMO belgisi bilan): hududlar, kasblar bo'yicha talab va maosh, ko'nikmalar, kanallar reytingi. Real ma'lumot yuklanganda xuddi shu tahlil real e'lonlarda quriladi." |
| **PII** | Sintetik ma'lumot; kanal nomlari ham sintetik. |
| **Mezon** | 2.1 (topshiriqqa moslik), 3.1 (tuzilish), 4.1, 4.2. |

## 5. Telefon: qorong'i rejim

| | |
|---|---|
| **Fayl** | `docs/screenshots/05-mobil-390-dark.png` |
| **Viewport** | 390 × 844 |
| **Rejim** | qorong'i (dark) |
| **Qanday kelish** | Qurilma rejimi 390 × 844 → 🌓 bilan qorong'i rejim → **☰** ni bosing (menyu ochiq holda bitta rasm), keyin menyudan **Tekshirish** → 2-screenshotdagi matnni qo'ying → **Tekshirish**. Menyu ochiq holat va natija bitta rasmda chiqmasa, natijali holatni oling va menyu ochiq holatni video yoki taqdimotda ko'rsating. |
| **Ko'rinishi shart** | Gorizontal scroll yo'q; ☰ menyu (yoki uning tugmasi); natija "Firibgarlik xavfi: yuqori" va sabablar qorong'i rejimda o'qiladigan kontrast bilan. |
| **Ma'lumot** | **Sintetik** matn (2-screenshotdagi). |
| **Caption** | "Telefonda (390px), qorong'i rejim: menyu va tekshiruv natijasi. Barcha matn WCAG AA kontrastiga mos (avtomatik testlangan)." |
| **PII** | Matnda telefon va ism yo'q. |
| **Mezon** | 3.1 (tuzilish va navigatsiya), 5.4 (sifat: mobil va accessibility testlari), 4.2. |

---

**Mezon raqamlari** musobaqa auditidagi tartib bo'yicha yozilgan. Topshirishdan oldin rasmiy reglament matni bilan solishtiring.
