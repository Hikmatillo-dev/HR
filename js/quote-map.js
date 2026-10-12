// Analyzer iqtibosini (match) asl e'lon matnidagi aniq fragmentga bog'lash.
// analyzer.js kirill matnni lotinga transliteratsiya qilib ham tekshiradi, shuning uchun iqtibos lotincha bo'lishi mumkin
// ("oldindan 500$"), e'lon esa kirillcha ("олдиндан 500$"). Ikkala matn bir xil "tekis" ko'rinishga keltiriladi —
// analyzer.js dagi normalize() + transliterate() kabi: kichik harf, bitta apostrof, bitta bo'shliq, harfma-harf
// transliteratsiya — va har bir tekis belgining asl matndagi o'rni eslab qolinadi.
// Ishonchli moslik topilmasa (masalan, hisoblangan "31.5 mln so'm" yoki harfning yarmi) — hech narsa qaytarilmaydi.
(function (global) {
  'use strict';
  const APOS = /[‘’ʻʼ`´]/;
  const translit = s => (global.IshQalqon && global.IshQalqon.transliterate ? global.IshQalqon.transliterate(s) : s);

  // flat — tekis matn; from[k] / to[k] — k-chi tekis belgi asl matnning qaysi belgisidan olingani
  function flatten(text) {
    let flat = '', i = 0;
    const from = [], to = [];
    for (const ch of String(text ?? '')) {
      if (/\s/.test(ch)) {
        if (flat && !flat.endsWith(' ')) { flat += ' '; from.push(i); to.push(i + ch.length); }
      } else {
        let piece = ch.toLowerCase();
        if (APOS.test(piece)) piece = "'";
        piece = translit(piece);
        for (let k = 0; k < piece.length; k++) { from.push(i); to.push(i + ch.length); }
        flat += piece;
      }
      i += ch.length;
    }
    return { flat, from, to };
  }
  const flatOf = s => flatten(s).flat.trim();

  /** Barcha mosliklar chapdan o'ngga: [{ start, end }] — asl matndagi indekslar (text.slice(start, end)) */
  function locateAll(text, quote) {
    const q = flatOf(quote);
    if (q.length < 2) return [];
    const src = String(text ?? '');
    const { flat, from, to } = flatten(src);
    const out = [];
    for (let a = flat.indexOf(q); a !== -1;) {
      const start = from[a], end = to[a + q.length - 1];
      // Asl fragment yana o'sha iqtibosga aylanishi shart: harfning yarmiga ("ш" → "sh" dan faqat "h") tushgan moslik rad etiladi
      const ok = flatOf(src.slice(start, end)) === q;
      if (ok) out.push({ start, end });
      a = flat.indexOf(q, ok ? a + q.length : a + 1);
    }
    return out;
  }

  /** Birinchi moslikning asl matni yoki null */
  function locate(text, quote) {
    const r = locateAll(text, quote)[0];
    return r ? String(text).slice(r.start, r.end) : null;
  }

  global.IQQuote = { locate, locateAll };
})(typeof window !== 'undefined' ? window : globalThis);
