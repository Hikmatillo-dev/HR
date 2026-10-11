// Valyuta kurslari (so'm). Maoshni so'mga o'girishda ishlatiladi.
//
// Node.js (server, bot, testlar) uchun .env orqali almashtirish mumkin:
//   IQ_RATE_USD=12650  IQ_RATE_EUR=13800  IQ_RATE_RUB=152  IQ_RATES_UPDATED=2026-10-15  IQ_RATES_SOURCE="CBU, 2026-10-15"
// Brauzer .env ni o'qiy olmaydi: server.mjs bu faylni shu qiymatlar bilan to'ldirib beradi.
// Sayt fayl sifatida ochilsa (file://), quyidagi standart qiymatlar ishlatiladi.
//
// MUHIM: hozircha js/analyzer.js o'z ichidagi bir xil qiymatlardan foydalanadi (v3 baseline'gacha unga
// tegilmaydi). tests/config.test.mjs ikkalasi mos kelishini tekshiradi. Ulash — README → "Kutilayotgan ishlar".
(function (global) {
  'use strict';

  const DEFAULTS = {
    USD: 12600,
    EUR: 13700,
    RUB: 150,
    updated: '2026-10-11',
    source: "qo'lda kiritilgan taxminiy qiymat (rasmiy manbadan tekshirilmagan)",
    approximate: true
  };
  const MAX_AGE_DAYS = 30;

  function fromEnv(env) {
    const num = v => (v !== undefined && v !== '' && isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);
    const rates = { ...DEFAULTS };
    let overridden = false;
    for (const k of ['USD', 'EUR', 'RUB']) {
      const v = num(env['IQ_RATE_' + k]);
      if (v !== null) { rates[k] = v; overridden = true; }
    }
    if (env.IQ_RATES_UPDATED && /^\d{4}-\d{2}-\d{2}$/.test(env.IQ_RATES_UPDATED)) rates.updated = env.IQ_RATES_UPDATED;
    if (env.IQ_RATES_SOURCE) rates.source = env.IQ_RATES_SOURCE;
    // .env orqali sana bilan berilgan kurslar "taxminiy" emas (agar eskirmagan bo'lsa)
    rates.approximate = !(overridden && env.IQ_RATES_UPDATED);
    return rates;
  }

  const rates = global.IQ_CURRENCY_OVERRIDE || (typeof process !== 'undefined' && process.env ? fromEnv(process.env) : { ...DEFAULTS });

  /** Kurs taxminiymi: standart qiymat yoki yangilanganiga MAX_AGE_DAYS kundan oshgan. */
  function status(r, now) {
    r = r || rates;
    const ageDays = Math.floor(((now || new Date()) - new Date(r.updated + 'T00:00:00Z')) / 864e5);
    return { approximate: Boolean(r.approximate) || !(ageDays <= MAX_AGE_DAYS), ageDays, stale: !(ageDays <= MAX_AGE_DAYS) };
  }

  global.IQCurrency = { rates, DEFAULTS, MAX_AGE_DAYS, fromEnv, status };
})(typeof window !== 'undefined' ? window : globalThis);
