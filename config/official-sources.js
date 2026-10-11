// Rasmiy idoralar va ularning manbalari. UI (Xavfsizlik bo'limi) shu yerdan oladi.
//
// verified: true  — sahifa ochilib, nomi va manzili tasdiqlangan.
// verified: false — topilgan, lekin rasmiy sahifa ochib tekshirilmagan. UI'da "tekshirilmagan" deb ko'rsatiladi.
// Tekshirgandan keyin verified: true, checked_at va checked_by ni yangilang. Telefon raqamlarini faqat
// rasmiy sahifadan ko'chiring — bu yerga taxminiy raqam yozmang.
(function (global) {
  'use strict';
  global.IQ_OFFICIAL_SOURCES = [
    {
      id: 'migration',
      name: "O'zbekiston Respublikasi Vazirlar Mahkamasi huzuridagi Migratsiya agentligi",
      former_name: 'Tashqi mehnat migratsiyasi agentligi',
      purpose: "Xorijga ishga yuboruvchi agentliklar litsenziyasi va xorijda ishlash bo'yicha ma'lumot",
      url: 'https://gov.uz/oz/migration',
      verified: false,
      checked_at: '2026-10-11',
      evidence: "Veb-qidiruv: gov.uz/oz/migration/pages/about va agentlik nizomi sahifasi; OAV xabarlari agentlik qayta tashkil etilganini aytadi. Sahifa ishlab chiqish muhitidan ochilmadi (gov.uz ga ulanish yo'q)."
    },
    {
      id: 'employment',
      name: "O'zbekiston Respublikasi Kambag'allikni qisqartirish va bandlik vazirligi",
      purpose: "Bandlik, mehnat huquqi va mehnat inspeksiyasi (ishga qabulda kamsitish, ish haqi masalalari)",
      url: 'https://gov.uz/oz/bv',
      verified: false,
      checked_at: '2026-10-11',
      evidence: "Veb-qidiruv: vazirlik sahifalari gov.uz/oz/bv ostida. Sahifa ishlab chiqish muhitidan ochilmadi; mehnat.uz domeni tasdiqlanmadi."
    }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
