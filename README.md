# 🛡️ IshQalqon

Telegram'dagi vakansiyalarni **firibgarlik** va **kamsitish** belgilari bo'yicha tekshiruvchi hamda mehnat bozorini tahlil qiluvchi platforma.

## Ishga tushirish

Hech narsa o'rnatish shart emas. `index.html` faylini brauzerda oching. Sayt internetsiz ham ishlaydi, chunki grafik kutubxonasi `vendor/` papkasida.

## Tuzilishi

| Fayl | Vazifasi |
|---|---|
| `js/analyzer.js` | Tahlil yadrosi: firibgarlik qoidalari, kamsitish, maosh, hudud va sohani aniqlash |
| `js/app.js` | Interfeys: tekshirish, dashboard, jadval, avtomatik xulosalar |
| `js/sample-data.js` | 400 ta **namunaviy (sintetik)** e'lon, faqat demo uchun |
| `js/real-data.js` | Haqiqiy Telegram ma'lumoti (skript yozadi) |
| `tools/telegram_export.py` | Telegram Desktop eksportini `real-data.js` ga aylantiradi |

## Haqiqiy ma'lumot yig'ish (eng muhim qadam!)

1. Telegram Desktop → ish kanali → ⋮ → **Export chat history** → format: **JSON** (media kerak emas)
2. Kamida 5–10 ta kanal uchun takrorlang (Toshkent va viloyat kanallari, xorijga ish kanallari)
3. Skriptni ishga tushiring:
   ```bash
   python3 tools/telegram_export.py kanal1/result.json kanal2/result.json ...
   ```
4. Saytni yangilang. Dashboard endi haqiqiy raqamlarni ko'rsatadi.

> Hakamlarga **haqiqiy raqamlar** bilan chiqing: "Biz 12 ta kanaldagi 3 000 ta e'lonni tahlil qildik, ularning X foizi xavfli chiqdi". Bu loyihaning eng kuchli tomoni bo'ladi.

## 2 kunlik reja

### 1-kun: ma'lumot va sifat
- [ ] Ertalab: 5–10 ta Telegram kanalni eksport qilib, `real-data.js` ga yuklash
- [ ] Jadvalda 50–100 ta e'lonni ko'zdan kechirish: tizim qayerda xato qilyapti?
- [ ] Xatolarni tuzatish uchun `js/analyzer.js` dagi qoidalarga yangi so'z va iboralarni qo'shish
- [ ] Kechqurun: saytni internetga chiqarish (pastga qarang) va QR-kod tayyorlash

### 2-kun: taqdimot
- [ ] 6–8 ta slayd (tuzilish pastda)
- [ ] 2 daqiqalik demo video, internet uzilib qolsa zaxira uchun
- [ ] 5–10 ta tanishingizga saytni sinatib, ularning fikrini yozib olish
- [ ] Taqdimotni kamida 3 marta ovoz chiqarib, vaqtni o'lchab mashq qilish

## Internetga chiqarish (5 daqiqa)
- **GitHub Pages:** repo → Settings → Pages → Branch: shu branch, `/ (root)` → Save
- yoki **Netlify Drop** (app.netlify.com/drop): papkani sudrab tashlash kifoya

## Taqdimot tuzilishi (5–7 daqiqa)
1. **Hikoya (30 soniya).** "Tanishim Koreyaga ish deb 500 dollar to'ladi. Na viza bo'ldi, na pul qaytdi."
2. **Muammo (1 daqiqa).** Vakansiyalar Telegram'da, nazorat yo'q. O'z raqamlaringizni ko'rsating: "X% xavfli, Y% kamsituvchi".
3. **Jonli demo (3 daqiqa).**
   - Firibgar e'lonni joylang. Tizim "Yuqori xavf" deydi va sabablarini ko'rsatadi.
   - Kamsituvchi e'lonni joylang. Tizim kamsitish turlarini aniqlaydi.
   - Dashboard: hududlar xaritasi va avtomatik xulosalar.
   - **Hakamdan istalgan e'lonni berishini so'rang.** Bu juda ta'sirli bo'ladi.
4. **Kimga foydali (1 daqiqa).** Ish izlovchi, Telegram kanal egasi, davlat idoralari (bandlik va migratsiya), kompaniyalar.
5. **Kelajak (30 soniya).** Telegram bot, avtomatik monitoring, til modeli (LLM) asosidagi tahlil, litsenziyalar bazasi bilan integratsiya.

## Hakamlar beradigan savollarga javoblar
- **"Bu sun'iy intellektmi?"** — Hozircha bu tushuntiriladigan qoidalar tizimi (explainable AI): har bir baho uchun aniq sabab ko'rsatiladi. Keyingi bosqichda yig'ilgan ma'lumot asosida modelni o'qitamiz.
- **"Xato qilishi mumkinmi?"** — Ha. Shuning uchun tizim "bu firibgar" deb hukm chiqarmaydi, "xavf darajasi" va sabablarini ko'rsatadi. Qaror foydalanuvchida qoladi.
- **"hh.uz yoki davlatning ish ilovasidan farqingiz nima?"** — Ular e'lon joylash uchun platforma. Biz esa Telegram'dagi tartibsiz bozorni tahlil qilamiz va foydalanuvchini himoya qilamiz.
- **"Ma'lumot qayerdan?"** — Ochiq Telegram kanallaridan. Shaxsiy ma'lumot yig'ilmaydi.
- **"Pulni qanday topasiz?"** — Kompaniyalarga "tasdiqlangan ish beruvchi" belgisi, kanallarga moderatsiya xizmati, davlat idoralariga analitik hisobotlar.
