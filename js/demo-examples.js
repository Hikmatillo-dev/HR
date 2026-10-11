// Bosh sahifadagi "Jonli misol" uchun SINTETIK demo e'lonlar va ularning oldindan yozilgan tahlil natijasi.
// Real e'lon emas: har biri sahifada "Demo misol" belgisi bilan ko'rsatiladi. Sahifa bu yerda analyzer.js ni chaqirmaydi.
// tests/demo-examples.test.mjs natija va iqtiboslar analyzer'ning haqiqiy javobiga mos kelishini tekshiradi.
(function (global) {
  'use strict';
  global.IQ_DEMO_EXAMPLES = [
    {
      id: 'prepay',
      title: "Oldindan to'lov",
      text: "🇰🇷 Koreyaga ishga! Viza 100% kafolat. Hujjat uchun 500$ to'lang. Joylar cheklangan!",
      level: 'high',
      trafficking: true,
      reasons: [
        { flag: 'prepay', label: "Oldindan pul so'ralmoqda", quote: "Hujjat uchun 500$ to'lang" },
        { flag: 'visa', label: 'Viza "100% kafolatlangan"', quote: 'Viza 100% kafolat' },
        { flag: 'urgency', label: 'Shoshiltirish', quote: 'Joylar cheklangan' }
      ]
    },
    {
      id: 'passport',
      title: 'Pasport olib qolish',
      text: "Dubayga mehmonxonaga ishchilar kerak. Yo'l chiptasi bepul. Pasportingiz ish beruvchida saqlanadi, yo'l puli maoshdan ushlab qolinadi.",
      level: 'high',
      trafficking: true,
      reasons: [
        { flag: 'passport', label: 'Pasportni ish beruvchi olib qoladi', quote: 'Pasportingiz ish beruvchida saqlanadi' },
        { flag: 'debt', label: "Qarz evaziga ishlash (yo'l puli maoshdan)", quote: "yo'l puli maoshdan ushlab qolinadi" },
        { flag: 'abroad', label: 'Xorijga ish taklifi', quote: 'Dubayga' }
      ]
    },
    {
      id: 'disc',
      title: 'Kamsitish',
      text: "Ofisga administrator kerak. Faqat qizlar, 18–25 yosh, chiroyli. Oylik 4 mln so'm, Toshkent.",
      level: 'low',
      trafficking: false,
      reasons: [
        { flag: 'disc:gender', label: "Jins bo'yicha cheklov", quote: 'Faqat qizlar' },
        { flag: 'disc:age', label: 'Yosh cheklovi', quote: '18–25 yosh' },
        { flag: 'disc:appearance', label: "Tashqi ko'rinish talabi", quote: 'chiroyli' }
      ]
    }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
