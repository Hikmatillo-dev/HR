// Tahlil sifatini o'lchash: node tests/run.mjs [--verbose]  (npm test ichida ham ishlaydi)
//   v1 — birinchi qo'lda yozilgan to'plam (qoidalar shu asosda yozilgan)
//   v2 — keyin qo'shilgan qiyin qo'lda yozilgan e'lonlar
//   v3 — REAL Telegram e'lonlari (js/test-set-v3.js)
import { existsSync, readFileSync } from 'node:fs';
import '../js/analyzer.js';
import '../js/test-set.js';
import '../js/test-set-v3.js';
import '../js/evaluate.js';

const A = globalThis.IshQalqon;
const { evaluate, validateCases } = globalThis.IQEval;
const handmade = globalThis.TEST_SET;
const v3 = globalThis.TEST_SET_V3 || [];
const verbose = process.argv.includes('--verbose');
const results = new URL('./results/', import.meta.url);

const pct = x => (x === null || x === undefined ? '  —  ' : (x * 100).toFixed(1).padStart(5) + '%');

// ---------- 1. Test e'lonlarining formati ----------
const formatErrors = [
  ...validateCases(handmade, A),
  ...validateCases(v3, A, { real: true, idPattern: /^v3-\d{3}$/ }),
  ...[...handmade, ...v3].map(c => c.id).filter((id, i, all) => all.indexOf(id) !== i).map(id => `${id}: id to'plamlar orasida takrorlangan`)
];
if (formatErrors.length) {
  console.error(`Test to'plamida ${formatErrors.length} ta format xatosi:\n  - ${formatErrors.join('\n  - ')}`);
  process.exit(1);
}

function report(title, subset, showFailures) {
  const r = evaluate(subset, A.analyze);
  console.log(`\n${title}: ${r.n} ta e'lon`);
  console.log(`  Umumiy aniqlik (xavfli/xavfsiz to'g'ri ajratildi) ${pct(r.risk.accuracy)}`);
  console.log(`  Xavfli e'lonlarni topish (recall)                  ${pct(r.risk.recall)}  (${r.risk.tp}/${r.risk.positives})`);
  console.log(`  "Xavfli" deganida to'g'ri bo'lishi (precision)     ${pct(r.risk.precision)}`);
  console.log(`  Xavfsiz e'lonni xavfli deb belgilash (FPR)         ${pct(r.risk.fpr)}  (${r.risk.fp}/${r.risk.fp + r.risk.tn})`);
  console.log(`  Kamsitishni topish: recall / precision             ${pct(r.discrimination.recall)} / ${pct(r.discrimination.precision)}`);
  console.log(`  Odam savdosi belgilari: recall / precision         ${pct(r.trafficking.recall)} / ${pct(r.trafficking.precision)}`);
  console.log(`  Kutilgan belgilar topildi (flag recall)            ${pct(r.flagRecall)}  (${r.expectedFlagCount} ta belgi)`);
  console.log(`  Daraja to'liq mos (low/medium/high)                ${pct(r.exactLevel)}`);
  if (r.failures.length && (verbose || showFailures)) {
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

// ---------- 2. Boshlang'ich natijalar ----------
const b = globalThis.TEST_BASELINE;
if (b) {
  console.log(`v2 boshlang'ich natija — qoidalar v2 ni ko'rmasdan (${b.date}, ${b.n} ta):`);
  console.log(`  aniqlik ${pct(b.accuracy)} · xavfli topish ${pct(b.riskRecall)} · FPR ${pct(b.fpr)} · kamsitish ${pct(b.discRecall)} · odam savdosi ${pct(b.traffRecall)}`);
}
const v3BaselineFile = new URL('v3-baseline.json', results);
const v3Baseline = existsSync(v3BaselineFile) ? JSON.parse(readFileSync(v3BaselineFile, 'utf8')) : null;
if (v3Baseline) {
  const m = v3Baseline.metrics;
  console.log(`v3 boshlang'ich natija — real e'lonlar (${v3Baseline.created_at.slice(0, 10)}, ${v3Baseline.n} ta, commit ${v3Baseline.git_commit.slice(0, 7)}):`);
  console.log(`  aniqlik ${pct(m.accuracy)} · xavfli topish ${pct(m.risk_recall)} · FPR ${pct(m.false_positive_rate)} · kamsitish ${pct(m.discrimination_recall)} · odam savdosi ${pct(m.trafficking_recall)}`);
}

// ---------- 3. Hozirgi natijalar ----------
const v1r = report("v1 (qo'lda, qoidalar shu asosda yozilgan)", handmade.filter(c => c.id.startsWith('v1')));
const v2r = report("v2 (qo'lda, qiyin e'lonlar)", handmade.filter(c => c.id.startsWith('v2')));
let v3r = null;
if (v3.length) v3r = report('v3 (REAL Telegram e\'lonlari)', v3, true);
else console.log("\nv3 (REAL Telegram e'lonlari): hali qo'shilmagan — js/test-set-v3.js ga real e'lonlarni qo'shing.");
const all = report("UMUMIY (v1 + v2)", handmade, true);

// ---------- 4. Sifat chegaralari ----------
// Maqsad — mukammallik emas, regressiyani ushlash: yangi qoida eski holatlarni buzmasligi kerak.
const ref = JSON.parse(readFileSync(new URL('v2-reference.json', results), 'utf8'));
const DROP = 0.05; // v2 natijasi saqlangan qiymatdan 5 punktdan ko'p pasaymasligi kerak
const gates = [
  ["v1+v2: xavfli e'lonlarni topish (recall) ≥ 90%", all.risk.recall >= 0.9],
  ["v1+v2: xavfsiz e'lonni xavfli deyish (FPR) ≤ 10%", all.risk.fpr <= 0.1],
  ['v1+v2: kamsitish recall ≥ 85%', all.discrimination.recall >= 0.85],
  ['v1+v2: odam savdosi recall ≥ 80%', all.trafficking.recall >= 0.8],
  [`v2: aniqlik ${pct(ref.accuracy).trim()} dan 5 punktdan ko'p pasaymagan`, v2r.risk.accuracy >= ref.accuracy - DROP],
  [`v2: xavfli topish ${pct(ref.risk_recall).trim()} dan 5 punktdan ko'p pasaymagan`, v2r.risk.recall >= ref.risk_recall - DROP],
  [`v2: FPR ${pct(ref.false_positive_rate).trim()} dan 5 punktdan ko'p oshmagan`, v2r.risk.fpr <= ref.false_positive_rate + DROP],
  [`v2: kamsitish recall 5 punktdan ko'p pasaymagan`, v2r.discrimination.recall >= ref.discrimination_recall - DROP],
  [`v2: odam savdosi recall 5 punktdan ko'p pasaymagan`, v2r.trafficking.recall >= ref.trafficking_recall - DROP]
];
// v3 uchun chegara faqat boshlang'ich natija yozilgandan keyin: undan yomonlashmasligi kerak
if (v3r && v3Baseline) {
  gates.push([`v3: aniqlik boshlang'ich natijadan (${pct(v3Baseline.metrics.accuracy).trim()}) past emas`, v3r.risk.accuracy >= v3Baseline.metrics.accuracy - 1e-9]);
}
console.log('\nSifat chegaralari:');
gates.forEach(([name, ok]) => console.log(`  ${ok ? '✓' : '✗'} ${name}`));
if (gates.some(g => !g[1])) process.exitCode = 1;
