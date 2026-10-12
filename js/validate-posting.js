// Vakansiya matnini tahlildan OLDIN tekshirish: bo'sh, juda qisqa yoki mazmunsiz matnga xavf bahosi berilmaydi
// ("abc" yoki "12345 !!!" ga yashil "past xavf" chiqishi foydalanuvchini chalg'itadi).
// Qoida: kamida 20 belgi (bo'shliqlarsiz chetlar) va kamida bitta 3+ harfli so'z (lotin, kirill yoki boshqa yozuv).
// tests/validate.test.mjs loyihadagi barcha real va namunaviy e'lonlar bu qoidadan o'tishini tekshiradi.
(function (global) {
  'use strict';
  const MIN_CHARS = 20;
  const MESSAGE = "E'lon matni juda qisqa yoki mazmunsiz. Kamida 20 belgi va harfli so'z kiriting.";
  const WORD = /\p{L}{3,}/u;

  /** Natija: { ok: true } yoki { ok: false, reason: 'empty' | 'short' | 'no_words', message } */
  function check(text) {
    const t = String(text ?? '').trim();
    if (!t) return { ok: false, reason: 'empty', message: MESSAGE };
    if (t.length < MIN_CHARS) return { ok: false, reason: 'short', message: MESSAGE };
    if (!WORD.test(t)) return { ok: false, reason: 'no_words', message: MESSAGE };
    return { ok: true };
  }

  global.IQValidate = { check, MIN_CHARS, MESSAGE };
})(typeof window !== 'undefined' ? window : globalThis);
