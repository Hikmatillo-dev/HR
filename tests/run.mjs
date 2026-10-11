// Tahlil sifatini o'lchash: node tests/run.mjs (yoki npm test)
import '../js/analyzer.js';
import '../js/test-set.js';

const { analyze } = globalThis.IshQalqon;
const cases = globalThis.TEST_SET;

function metrics(pred, truth) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  pred.forEach((p, i) => {
    if (p && truth[i]) tp++; else if (p && !truth[i]) fp++; else if (!p && truth[i]) fn++; else tn++;
  });
  const precision = tp / (tp + fp || 1), recall = tp / (tp + fn || 1);
  return { tp, fp, fn, tn, precision, recall, f1: 2 * precision * recall / (precision + recall || 1), accuracy: (tp + tn) / pred.length };
}

const results = cases.map(c => ({ c, a: analyze(c.text) }));
const scam = metrics(results.map(r => r.a.level !== 'low'), cases.map(c => c.scam));
const disc = metrics(results.map(r => r.a.discrimination.length > 0), cases.map(c => c.disc));

const pct = x => (x * 100).toFixed(1) + '%';
console.log(`Test to'plami: ${cases.length} ta e'lon\n`);
for (const [name, m] of [['Firibgarlik', scam], ['Kamsitish', disc]]) {
  console.log(`${name.padEnd(12)} aniqlik(precision) ${pct(m.precision)}  to'liqlik(recall) ${pct(m.recall)}  F1 ${pct(m.f1)}  umumiy ${pct(m.accuracy)}`);
}

const errors = results.filter(r => (r.a.level !== 'low') !== r.c.scam || (r.a.discrimination.length > 0) !== r.c.disc);
if (errors.length) {
  console.log(`\nXatolar (${errors.length}):`);
  for (const { c, a } of errors) {
    console.log(`- kutilgan scam=${c.scam} disc=${c.disc}; olingan ball=${a.score} disc=${a.discrimination.map(d => d.id)} | ${c.text.slice(0, 90)}`);
  }
}

// Sifat pasaysa CI/`npm test` xato beradi
if (scam.f1 < 0.9 || disc.f1 < 0.9) {
  console.error('\nSifat chegarasi (F1 ≥ 90%) bajarilmadi');
  process.exit(1);
}
