// v3 — REAL Telegram e'lonlari asosidagi test to'plami.
//
// Qoidalar:
//   1. Faqat haqiqiy Telegram kanallaridan olingan e'lonlar (source_type: 'real').
//   2. Telefon, karta raqami va email yashirilgan bo'lishi shart. `npm test` yashirilmagan raqamni topsa xato beradi.
//      Qoralama tayyorlash: node tools/redact.mjs --from-export result.json --channel @kanal --limit 50
//   3. Belgini (expected_*) inson qo'yadi, tizim natijasiga qarab EMAS.
//   4. Birinchi to'ldirilgandan keyin: npm run eval:v3-baseline (analyzer.js ga TEGMASDAN).
//
// Maydonlar:
//   id                   'v3-001', 'v3-002', ... (uch xonali)
//   text                 e'lon matni (yashirilgan)
//   source_channel       '@kanal_nomi' yoki kanal nomi
//   source_type          'real'
//   expected_risk_level  'low' | 'medium' | 'high'
//   expected_flags       topilishi shart bo'lgan belgilar, masalan ['prepay', 'abroad', 'trafficking', 'disc:age']
//                        (to'liq ro'yxat: README → "Evaluation" yoki xato xabarida)
//   expected_reason      nima uchun shunday belgilangani (1 jumla)
//   category             'scam' | 'trafficking' | 'discrimination' | 'legit' | 'trap' | 'ambiguous'
//   reviewer_notes       izoh: kim, qachon belgiladi, shubhalar (bo'sh satr bo'lishi mumkin)
//
// Namuna (izohdan chiqarmang — bu real e'lon emas):
//   {
//     id: 'v3-001',
//     text: "Koreyaga ishga! Viza 100% kafolat. Hujjat uchun to'lov 500$. Tel: +998 XX XXX XX XX",
//     source_channel: '@ish_kanali',
//     source_type: 'real',
//     expected_risk_level: 'high',
//     expected_flags: ['prepay', 'visa', 'abroad', 'trafficking'],
//     expected_reason: "Xorijga ish uchun oldindan pul va viza kafolati",
//     category: 'trafficking',
//     reviewer_notes: "H.A., 2026-10-12. Kanalda 3 marta takrorlangan."
//   },
(function (global) {
  'use strict';
  global.TEST_SET_V3 = [
    // Real e'lonlarni shu yerga qo'shing
  ];
})(typeof window !== 'undefined' ? window : globalThis);
