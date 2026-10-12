# 📰 Xabarnoma

Yirik o'zbek yangiliklar portallari uslubidagi yangiliklar sayti. O'quv loyihasi: barcha yangiliklar to'qima, rasmlar [picsum.photos](https://picsum.photos)'dan olinadi.

**🌐 Sayt:** https://hikmatillo-dev.github.io/xabarnoma/

## Imkoniyatlar
- **Bosh sahifa:** asosiy yangilik, kategoriya bloklari, video bo'limi
- **⚡ Tezkor yangiliklar** yuguruvchi qatori
- **Jonli ma'lumot:** Markaziy bank valyuta kursi (USD, EUR, RUB) va Toshkent ob-havosi (Open-Meteo). Internet bo'lmasa zaxira qiymatlar ko'rinadi.
- **4 til:** O'zbek lotin, O'zbek kirill (butun sayt avtomatik o'giriladi), rus va ingliz (interfeys)
- **Kategoriya, teg va video sahifalari**, "Ko'proq yuklash" tugmasi
- **Qidiruv:** sarlavha, matn va teglar bo'yicha
- **Maqola sahifasi:** muallif, o'qish vaqti, shrift kattaligi (A−/A+), chop etish, o'qish progressi, teglar, Telegram/Facebook/X'ga ulashish, havolani nusxalash, oldingi/keyingi maqola, mavzuga oid yangiliklar
- **Izohlar** va **ko'rishlar soni** (brauzerda saqlanadi)
- **So'nggi yangiliklar** lentasi va **Ko'p o'qilgan** reytingi
- 🌙 Tungi rejim, 📱 telefon uchun menyu, ↑ yuqoriga tugmasi, 404 sahifa

## Ishga tushirish
O'rnatish shart emas: `index.html` faylini brauzerda oching.

Yoki lokal server orqali:
```bash
python3 -m http.server 8000
# keyin http://localhost:8000 ni oching
```

## Tuzilishi
| Fayl | Vazifasi |
|---|---|
| `index.html` | Bosh sahifa, kategoriya, teg, qidiruv, video |
| `article.html` | Maqola sahifasi |
| `layout.js` | Umumiy qismlar: header, footer, til, tema, kurs, ob-havo |
| `data.js` | Yangiliklar va kategoriyalar ro'yxati |
| `style.css` | Dizayn (yorug' va tungi rejim, moslashuvchan) |

Yangilik qo'shish uchun `data.js` dagi `NEWS` ro'yxatiga yangi element qo'shing.

## Texnologiyalar
HTML, CSS, oddiy JavaScript (framework yo'q), localStorage, Fetch API.
