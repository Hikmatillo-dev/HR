# Oflayn demo video (90–120 soniya)

Maqsad: internet va AI kalitsiz ishlaydigan asosiy oqimni ko'rsatish. Taqdimot kuni internet yoki kompyuter ishlamasa, shu video zaxira bo'ladi (`docs/TAQDIMOT.md`, D bo'lim).

| | |
|---|---|
| **Fayl nomi** | `docs/video/ishqalqon-demo-offline.mp4` |
| **Format** | MP4 (H.264 video, AAC ovoz), 1920×1080 yoki 1280×720, 30 kadr/s, ≤ 50 MB, 90–120 soniya |
| **Qayerga** | Lokal nusxa `docs/video/` ichida turadi, lekin git'ga qo'shilmaydi (`.gitignore`: katta fayllar tarixni og'irlashtiradi). Topshirish uchun tanlov platformasiga yoki GitHub → Releases → yangi reliz → fayl sifatida yuklang va havolani README'ga qo'shing. |
| **Ovoz** | Ixtiyoriy. Ovozsiz bo'lsa, quyidagi "ekranda aytish" iboralarini qisqa yozuv sifatida ko'rsating. |

## 1. Yozishdan oldingi tayyorgarlik

```bash
npm install            # bir marta, internet kerak
npm test               # hammasi o'tishi kerak (✗ yo'q)
npm run test:ui        # brauzer testlari (Playwright o'rnatilgan bo'lsa)
npm run preflight -- --no-tests   # kalitlar va taqiqlangan fayllar yo'qligi
```

So'ng:
1. **Internetni o'chiring** (Wi-Fi / kabel). Video shuni ko'rsatadi: sayt internetsiz ishlaydi.
2. `npm run demo:local` → terminalda "lokal oflayn demo (AI kalitsiz)" va `http://127.0.0.1:3000` chiqadi. Bu buyruq API kalit talab qilmaydi va `.env` ni o'qimaydi. AI tugmasi ataylab o'chiq bo'ladi. `npm start` ham ishlaydi, lekin u `.env` dagi kalitni o'qiydi.
3. Brauzerda http://127.0.0.1:3000 ni oching. Brauzer oynasi 1366×768 atrofida, masshtab 100%, yorug' rejim. Boshqa tablar, xatchoplar va bildirishnomalar yopiq (Windows: "Fokus", macOS: "Bezovta qilmang").
4. Agar avval eksport yuklangan bo'lsa, **🗑️ Saqlangan ma'lumotni o'chirish**.
5. Kiritiladigan matnni (pastda) buferga nusxalab qo'ying.

AI tugmasini videoda ishlatish **majburiy emas**. Agar ko'rsatsangiz, faqat o'chiq holatini va "AI tahlil faollashtirilmagan" degan sababni ko'rsating.

## 2. Ssenariy (vaqt bo'yicha)

| Vaqt | Ekranda | Ekranda aytish yoki yozish |
|---|---|---|
| 0:00–0:10 | Terminal: `npm run demo:local` banneri; Wi-Fi o'chiq belgisi | "Internet o'chiq, AI kaliti yo'q. Sayt lokal ishlaydi." |
| 0:10–0:22 | Bosh sahifa: sarlavha, 3 qiymat, raqamlar manbasi, jonli misol | "IshQalqon yoshlarni zamonaviy kasblar bozoriga xavfsiz kirishga yordam beradi. Raqamlar — 34 ta real e'londan; o'ngdagi misol sintetik." |
| 0:22–0:45 | **Vakansiyani tekshirish** → matnni qo'yish → **Tekshirish** → natija va iqtiboslar | "Xavfli vakansiya: oldindan to'lov, pasport, kafolatlangan viza. Har bir sabab matndagi iqtibos bilan. Odam savdosi belgisi alohida." |
| 0:45–1:05 | **Bozor tahlili** → **📂 Telegram eksportini yuklash** → `namuna/telegram-export-namuna.json` → import hisoboti | "Bu **sintetik namunaviy eksport**, real kanal emas. 41 ta xabar, 6 ta takror olib tashlandi, telefon raqamlari saqlashdan oldin yashirildi. Fayl serverga ketmaydi." |
| 1:05–1:30 | **Demo** → hududlar xaritasi → **Zamonaviy kasblar** (talab va maosh, ko'nikmalar) → **Kanallar** reytingi | "Kasblar grafigi Demo rejimida, sintetik 600 ta e'londa — DEMO belgisi bor. Real namunada ma'lumot yetarli emasligini sayt ochiq aytadi." |
| 1:30–1:45 | F12 → Ctrl+Shift+M → 390px → ☰ menyu → 🌓 qorong'i rejim | "Telefonda va qorong'i rejimda ham ishlaydi; avtomatik testlar bilan tekshirilgan." |
| 1:45–1:55 | Tekshiruv natijasi ostidagi o'chiq **🤖 AI chuqur tahlil** tugmasi va sababi (ixtiyoriy) | "AI — ixtiyoriy qo'shimcha qatlam. Asosiy natija AI'siz." |
| 1:55–2:00 | **Real ma'lumot** → **🗑️ Saqlangan ma'lumotni o'chirish** | "Yuklangan ma'lumot bir tugma bilan o'chiriladi." |

Kiritiladigan **sintetik** matn (natija `npm run check:evidence` bilan tekshiriladi):

<!-- evidence:analyze level=high trafficking=true flags=prepay,passport,visa,abroad,urgency disc=0 -->
```text
Koreyaga ish! Zavodga ishchilar kerak, oylik 2500$. Viza 100% kafolatlangan. Hujjatlar uchun oldindan 500$ to'lov qilasiz, pasportingizni bizga topshirasiz. Joylar cheklangan, tez yozing!
```

## 3. Ekranni yozib olish (istalgan bittasi)

- **OBS Studio** (Windows, macOS, Linux; bepul): Sources → **+** → "Display Capture" (yoki "Window Capture" → brauzer). Settings → Output → Recording Format: **mp4** (yoki mkv, keyin File → Remux Recordings → mp4). Settings → Video: 1920×1080, 30 FPS. **Start Recording** / **Stop Recording**.
- **Windows Game Bar** (Windows 10/11): brauzer oynasini oching → **Win+Alt+R** — yozish boshlanadi/to'xtaydi. Fayl: Videolar → Captures (MP4). Game Bar faqat bitta oynani yozadi: terminal qismini alohida yozing yoki OBS ishlating.
- **GNOME** (Ubuntu va boshqalar): **Print Screen** → yuqoridagi kamera/video belgisi → hudud yoki ekran → yozish; yoki **Ctrl+Shift+Alt+R**. Fayl: Videos → Screencasts (WebM). MP4 ga o'tkazish: `ffmpeg -i yozuv.webm -c:v libx264 -crf 23 -pix_fmt yuv420p ishqalqon-demo-offline.mp4`.
- **macOS**: **Cmd+Shift+5** → "Record Entire Screen" yoki "Record Selected Portion" → Record. Fayl `.mov`; MP4 uchun: `ffmpeg -i yozuv.mov -c:v libx264 -crf 23 -pix_fmt yuv420p ishqalqon-demo-offline.mp4`.

**Tayyor versiya.** `docs/video/ishqalqon-demo-offline.mp4` (110 soniya, 1280×720, H.264, ~6 MB) shu ssenariy bo'yicha `npm run demo:local` serverida avtomatik yozib olingan (Playwright, ekrandagi izohlar bilan). Unda terminal va Wi-Fi o'chiq belgisi yo'q; kerak bo'lsa yuqoridagi tartibda o'zingiz qayta yozing.

## 4. Yozgandan keyin

1. Videoni oxirigacha ko'ring. Ochiq telefon raqami, shaxsiy ism, boshqa tab yoki bildirishnoma ko'rinmasin.
2. Davomiyligi 90–120 soniya ekanini tekshiring.
3. Faylni `docs/video/ishqalqon-demo-offline.mp4` ga qo'ying va `npm run preflight` → "video lokal nusxasi bor" chiqishini tekshiring.
4. Videoni topshirish platformasiga yoki GitHub Release'ga yuklang.
