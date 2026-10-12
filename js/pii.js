// Shaxsiy ma'lumotni (PII) topish va yashirish — yagona manba.
// Ishlatiladi: brauzer (yuklangan eksport localStorage'ga yozilishidan oldin), tools/redact.mjs,
// js/evaluate.js (v3 validatori). tools/telegram_export.py da xuddi shu qoidalar takrorlangan —
// tests/redact-parity.test.mjs ikkalasi bir xil natija berishini tekshiradi.
//
// Niqoblar formatni saqlaydi: telefon "+998 00 000 00 00" — haqiqiy raqam yo'q, lekin analyzer.js
// uni "aloqa ma'lumoti bor" deb taniydi, shuning uchun yashirish shaffoflik bahosini o'zgartirmaydi.
(function (global) {
  'use strict';

  const MASK = {
    card: 'XXXX XXXX XXXX XXXX',
    pinfl: '[JSHSHIR]',
    passport: '[pasport]',
    email: '[email]',
    tme: 't.me/foydalanuvchi',
    username: '@foydalanuvchi',
    phoneRu: '+7 000 000 00 00',
    phoneUz: '+998 00 000 00 00'
  };

  // Tartib muhim: uzunroq raqamlar (karta, JSHSHIR) telefon qoidasidan oldin
  const RULES = [
    ['card', /(?<![\d])\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}(?![\d])/g],
    ['pinfl', /(?<![\d])\d{14}(?![\d])/g],
    // Seriya lotin (AA, AB, KA ...) yoki kirill yozuvdagi o'xshash harflar (АА, АВ, АС, АЕ, КА): "ОТ 5000000" — emas
    ['passport', /(?<![A-Za-zА-Яа-яЁё\d])(?:[A-Z]{2}|[АК][АВСЕ])\s?\d{7}(?![\d])/g],
    ['email', /[\w.+-]+@[\w-]+\.[A-Za-z.]{2,}/g],
    // Kanal/foydalanuvchi nomi, shuningdek yopiq guruhga taklif havolasi: t.me/+AbCd…, t.me/joinchat/AbCd…
    ['tme', /(?:https?:\/\/)?(?:t|telegram)\.me\/(?:\+[\w-]{6,}|joinchat\/[\w-]{6,}|(?!foydalanuvchi\b)[A-Za-z][\w]{3,31})/g],
    ['username', /(?<![\w@./])@(?!foydalanuvchi\b)[A-Za-z][\w]{3,31}\b/g],
    ['phoneRu', /(?<![\d+])(?:\+7|8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?![\d])/g],
    ['phoneUz', /(?<![\d])(?:(?:\+?998)[\s-]?)?\(?\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?![\d])/g]
  ];

  // STIR/INN — kompaniyaning ochiq soliq raqami: "STIR: 305123456", "STIR raqami: 305123456" yashirilmaydi
  // (\b kirill harflari bilan ishlamaydi, shuning uchun lookahead)
  const STIR_BEFORE = /(stir|inn|инн|стир)(?![a-zа-я])[^\d\n]{0,15}$/i;
  // Faqat nol yoki niqob — yashirilgan qiymat, PII emas
  // (mamlakat kodi +998 / +7 hisobga olinmaydi)
  const isMasked = s => !/[1-9]/.test(String(s).replace(/^\s*\+?(998|7)(?!\d)/, ''));

  function isStir(text, index) {
    return STIR_BEFORE.test(text.slice(Math.max(0, index - 30), index));
  }

  /** Matndagi PII'ni yashiradi. Natija: { text, counts } */
  function redact(input) {
    let text = String(input);
    const counts = { card: 0, pinfl: 0, passport: 0, email: 0, tme: 0, username: 0, phoneRu: 0, phoneUz: 0 };
    for (const [type, re] of RULES) {
      text = text.replace(re, (m, ...args) => {
        const offset = args[args.length - 2], whole = args[args.length - 1];
        if (isMasked(m) && /\d/.test(m)) return m; // allaqachon niqoblangan — qayta hisoblanmaydi
        if ((type === 'phoneUz' || type === 'pinfl') && isStir(whole, offset)) return m;
        counts[type]++;
        return MASK[type];
      });
    }
    return { text, counts };
  }

  /** Yashirilmagan PII'ni topadi (validator uchun). Natija: [{ type, value }] */
  function findPii(text) {
    const found = [];
    for (const [type, re] of RULES) {
      if (type === 'username' || type === 'tme') continue; // ochiq kanal havolalari bo'lishi mumkin — faqat ogohlantirish
      const g = new RegExp(re.source, 'g');
      let m;
      while ((m = g.exec(text))) {
        if (isMasked(m[0])) continue;
        if ((type === 'phoneUz' || type === 'pinfl') && isStir(text, m.index)) continue;
        found.push({ type, value: m[0] });
      }
    }
    return found;
  }

  // Ism + "opa/aka" ("Dilnoza opa", "Aziz aka") — avtomatik yashirilmaydi, inson tekshirishi kerak
  const NAME_RE = /(?<![\p{L}])[A-ZА-ЯЎҚҒҲ][a-zа-яўқғҳ'ʻ‘]{2,}\s+(opa|aka|опа|ака)(?![\p{L}])/gu;
  function nameWarnings(text) {
    return [...String(text).matchAll(NAME_RE)].map(m => m[0]);
  }

  const LABELS = {
    card: 'karta raqami', pinfl: 'JSHSHIR (PINFL)', passport: 'pasport raqami', email: 'email',
    tme: 't.me havola', username: '@username', phoneRu: 'rus telefon raqami', phoneUz: 'telefon raqami'
  };

  global.IQPII = { redact, findPii, nameWarnings, MASK, LABELS };
})(typeof window !== 'undefined' ? window : globalThis);
