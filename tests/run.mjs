// Tahlil sifatini o'lchash: node tests/run.mjs (npm test ichida ham ishlaydi)
import '../js/analyzer.js';
import '../js/test-set.js';
import '../js/evaluate.js';

const { analyze } = globalThis.IshQalqon;
const { evaluate } = globalThis.IQEval;
const cases = globalThis.TEST_SET;
const verbose = process.argv.includes('--verbose');

const pct = x => (x === null ? '  —  ' : (x * 100).toFixed(1).padStart(5) + '%');

function report(title, subset) {
  const r = evaluate(subset, analyze);
  console.log(`\n${title}: ${r.n} ta e'lon`);
  console.log(`  Umumiy aniqlik (xavfli/xavfsiz to'g'ri ajratildi) ${pct(r.risk.accuracy)}`);
  console.log(`  Xavfli e'lonlarni topish (recall)                  ${pct(r.risk.recall)}  (${r.risk.tp}/${r.risk.positives})`);
  console.log(`  "Xavfli" deganida to'g'ri bo'lishi (precision)     ${pct(r.risk.precision)}`);
  console.log(`  Xavfsiz e'lonni xavfli deb belgilash (FPR)         ${pct(r.risk.fpr)}  (${r.risk.fp}/${r.risk.fp + r.risk.tn})`);
  console.log(`  Kamsitishni topish: recall / precision             ${pct(r.discrimination.recall)} / ${pct(r.discrimination.precision)}`);
  console.log(`  Odam savdosi belgilari: recall / precision         ${pct(r.trafficking.recall)} / ${pct(r.trafficking.precision)}`);
  console.log(`  Kutilgan belgilar topildi (flag recall)            ${pct(r.flagRecall)}  (${r.expectedFlagCount} ta belgi)`);
  console.log(`  Daraja to'liq mos (low/medium/high)                ${pct(r.exactLevel)}`);
  if (r.failures.length && (verbose || title.startsWith('UMUMIY'))) {
    console.log(`\n  Xatolar (${r.failures.length}):`);
    for (const f of r.failures) {
      const why = [];
      if (!f.riskOk) why.push(`daraja: kutilgan ${f.c.expected_risk_level}, olingan ${f.a.level} (${f.a.score})`);
      if (f.missedFlags.length) why.push(`topilmadi: ${f.missedFlags.join(', ')}`);
      if (!f.discOk && !f.missedFlags.some(x => x.startsWith('disc:'))) why.push(`ortiqcha kamsitish: ${f.a.discrimination.map(d => d.id)}`);
      if (!f.traffOk && !f.missedFlags.includes('trafficking')) why.push('ortiqcha odam savdosi belgisi');
      console.log(`  - ${f.c.id} [${f.c.category}] ${why.join('; ')}\n      ${f.c.text.slice(0, 100).replace(/\n/g, ' ')}`);
    }
  }
  return r;
}

const b = globalThis.TEST_BASELINE;
if (b) {
  console.log(`Boshlang'ich natija — qoidalar ${b.set} e'lonlarini ko'rmasdan (${b.date}, ${b.n} ta):`);
  console.log(`  aniqlik ${pct(b.accuracy)} · xavfli topish ${pct(b.riskRecall)} · FPR ${pct(b.fpr)} · kamsitish ${pct(b.discRecall)} · odam savdosi ${pct(b.traffRecall)}`);
  console.log('  Quyidagi hozirgi natijalar optimistik: qoidalar shu e\'lonlardagi xatolar asosida tuzatilgan.');
}

report("v1 (qoidalar shu e'lonlar asosida yozilgan)", cases.filter(c => c.id.startsWith('v1')));
report("v2 (yangi qiyin e'lonlar)", cases.filter(c => c.id.startsWith('v2')));
const all = report('UMUMIY', cases);

// Sifat chegarasi: pasaysa npm test xato beradi. Chegaralar "mukammallik"ni emas, regressiyani ushlash uchun.
const gates = [
  ['Xavfli e\'lonlarni topish (recall) ≥ 90%', all.risk.recall >= 0.9],
  ['Xavfsiz e\'lonni xavfli deyish (FPR) ≤ 10%', all.risk.fpr <= 0.1],
  ['Kamsitish recall ≥ 85%', all.discrimination.recall >= 0.85],
  ['Odam savdosi recall ≥ 80%', all.trafficking.recall >= 0.8]
];
console.log('\nSifat chegaralari:');
gates.forEach(([name, ok]) => console.log(`  ${ok ? '✓' : '✗'} ${name}`));
if (gates.some(g => !g[1])) process.exitCode = 1;
