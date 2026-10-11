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

  global.IQEval = { evaluate, predictedFlags };
})(typeof window !== 'undefined' ? window : globalThis);
