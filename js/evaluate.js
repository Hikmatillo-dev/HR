// Test to'plami bo'yicha sifatni o'lchash. Brauzerda ("Loyiha haqida") va Node.js'da (npm test) bir xil ishlaydi.
(function (global) {
  'use strict';

  // Tahlil natijasidan bashorat qilingan belgilar: firibgarlik qoidalari id'lari, "disc:<tur>" va "trafficking"
  function predictedFlags(a) {
    const flags = new Set(a.scam.map(s => s.id));
    a.discrimination.forEach(d => flags.add('disc:' + d.id));
    if (a.trafficking) flags.add('trafficking');
    return flags;
  }

  function binary(pairs) {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (const [pred, truth] of pairs) {
      if (pred && truth) tp++; else if (pred) fp++; else if (truth) fn++; else tn++;
    }
    const precision = tp + fp ? tp / (tp + fp) : null;
    const recall = tp + fn ? tp / (tp + fn) : null;
    return {
      tp, fp, fn, tn, n: pairs.length, positives: tp + fn,
      precision, recall,
      f1: precision !== null && recall !== null && precision + recall ? 2 * precision * recall / (precision + recall) : null,
      fpr: fp + tn ? fp / (fp + tn) : null, // xavfsiz e'lonni xavfli deb belgilash darajasi
      accuracy: pairs.length ? (tp + tn) / pairs.length : null
    };
  }

  function evaluate(cases, analyze) {
    const rows = cases.map(c => {
      const a = analyze(c.text);
      const flags = predictedFlags(a);
      const expected = c.expected_flags || [];
      return {
        c, a, flags,
        missedFlags: expected.filter(f => !flags.has(f)),
        riskOk: (a.level !== 'low') === (c.expected_risk_level !== 'low'),
        levelOk: a.level === c.expected_risk_level,
        discOk: a.discrimination.length > 0 === expected.some(f => f.startsWith('disc:')),
        traffOk: Boolean(a.trafficking) === expected.includes('trafficking')
      };
    });
    const expectedFlagCount = rows.reduce((n, r) => n + (r.c.expected_flags || []).length, 0);
    const missedFlagCount = rows.reduce((n, r) => n + r.missedFlags.length, 0);
    return {
      n: rows.length,
      risk: binary(rows.map(r => [r.a.level !== 'low', r.c.expected_risk_level !== 'low'])),
      exactLevel: rows.length ? rows.filter(r => r.levelOk).length / rows.length : null,
      discrimination: binary(rows.map(r => [r.a.discrimination.length > 0, (r.c.expected_flags || []).some(f => f.startsWith('disc:'))])),
      trafficking: binary(rows.map(r => [Boolean(r.a.trafficking), (r.c.expected_flags || []).includes('trafficking')])),
      flagRecall: expectedFlagCount ? (expectedFlagCount - missedFlagCount) / expectedFlagCount : null,
      expectedFlagCount,
      failures: rows.filter(r => !r.riskOk || !r.discOk || !r.traffOk || r.missedFlags.length)
    };
  }

  // ---------- Test e'lonlarini tekshirish (validatsiya) ----------
  const LEVELS = ['low', 'medium', 'high'];
  const CATEGORIES = ['scam', 'trafficking', 'discrimination', 'legit', 'trap', 'ambiguous'];
  // Yashirilmagan shaxsiy ma'lumot — qoidalar js/pii.js da (redaction bilan bir xil manba)
  const PII = () => {
    if (!global.IQPII) throw new Error('js/pii.js yuklanmagan (evaluate.js dan oldin yuklang)');
    return global.IQPII;
  };

  function knownFlags(A) {
    return new Set([
      ...A.SCAM_RULES.map(r => r.id), 'salary', 'trafficking',
      ...A.DISCRIMINATION_RULES.map(r => 'disc:' + r.id)
    ]);
  }

  /**
   * Test e'lonlarini tekshiradi. Natija: xatolar ro'yxati (bo'sh bo'lsa — hammasi to'g'ri).
   * opts.real: true — v3 real e'lonlar uchun qo'shimcha talablar (source_*, reviewer_notes, maxfiylik).
   */
  function validateCases(cases, A, opts) {
    opts = opts || {};
    const errors = [], seen = new Set(), flags = knownFlags(A);
    const idRe = opts.idPattern || /^v\d-\d{2,3}$/;
    cases.forEach((c, i) => {
      const where = `${c && c.id ? c.id : '#' + (i + 1)}`;
      const err = msg => errors.push(`${where}: ${msg}`);
      if (!c || typeof c !== 'object') return err("element obyekt emas");
      if (typeof c.id !== 'string' || !idRe.test(c.id)) err(`id noto'g'ri ("${c.id}"), kutilgan format: ${idRe}`);
      if (seen.has(c.id)) err('id takrorlangan');
      seen.add(c.id);
      if (typeof c.text !== 'string' || c.text.trim().length < 15) err("text bo'sh yoki juda qisqa");
      if (!LEVELS.includes(c.expected_risk_level)) err(`expected_risk_level: ${LEVELS.join(' | ')} bo'lishi kerak ("${c.expected_risk_level}")`);
      if (!Array.isArray(c.expected_flags)) err("expected_flags massiv bo'lishi kerak");
      else c.expected_flags.filter(f => !flags.has(f)).forEach(f => err(`noma'lum belgi "${f}". Mumkin: ${[...flags].join(', ')}`));
      if (typeof c.expected_reason !== 'string' || !c.expected_reason.trim()) err("expected_reason to'ldirilmagan");
      if (!CATEGORIES.includes(c.category)) err(`category: ${CATEGORIES.join(' | ')} bo'lishi kerak ("${c.category}")`);
      if (opts.real) {
        if (c.source_type !== 'real') err('source_type "real" bo\'lishi kerak');
        if (typeof c.source_channel !== 'string' || !c.source_channel.trim()) err("source_channel to'ldirilmagan");
        if (typeof c.reviewer_notes !== 'string') err("reviewer_notes satr bo'lishi kerak (bo'sh bo'lishi mumkin)");
        if (typeof c.text === 'string') {
          const left = PII().findPii(c.text);
          [...new Set(left.map(f => f.type))].forEach(t => err(`matnda yashirilmagan ${PII().LABELS[t]} bor — node tools/redact.mjs bilan tozalang`));
        }
      }
    });
    return errors;
  }

  /** To'xtatmaydigan ogohlantirishlar: ism + opa/aka, t.me va @username (ochiq kanal bo'lishi mumkin) */
  function validationWarnings(cases) {
    const out = [];
    for (const c of cases) {
      if (!c || typeof c.text !== 'string') continue;
      const names = PII().nameWarnings(c.text);
      if (names.length) out.push(`${c.id}: ism bo'lishi mumkin (${names.join(', ')}) — qo'lda tekshiring`);
      if (/(?:t|telegram)\.me\/(?!foydalanuvchi\b)\w|(?<![\w@./])@(?!foydalanuvchi\b)[A-Za-z]\w{3,}/.test(c.text)) {
        out.push(`${c.id}: t.me yoki @username bor — shaxsiy akkaunt bo'lsa yashiring`);
      }
    }
    return out;
  }

  global.IQEval = { evaluate, predictedFlags, validateCases, validationWarnings, knownFlags, LEVELS, CATEGORIES };
})(typeof window !== 'undefined' ? window : globalThis);
