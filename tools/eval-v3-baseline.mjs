#!/usr/bin/env node
// v3 (real e'lonlar) bo'yicha BOSHLANG'ICH natijani bir marta yozib qo'yish.
//
//   npm run eval:v3-baseline            — birinchi marta (fayl mavjud bo'lsa ishlamaydi)
//   npm run eval:v3-baseline -- --force — qayta yozish: faqat git holati toza bo'lsa;
//                                         eski natija tests/results/archive/ ga vaqt belgisi bilan ko'chiriladi
//
// Himoyalar:
//   - js/analyzer.js da commit qilinmagan o'zgarish bo'lsa — ishlamaydi (har doim)
//   - birinchi yozishda js/ va tools/ toza bo'lishi shart (evaluate.js, test-set-v3.js ham commit qilingan)
//   - --force: butun repozitoriy toza bo'lishi shart, eski natija archive/ ga ko'chiriladi
// Faylga yoziladi: git commit, sana, e'lonlar soni, analyzer.js / evaluate.js / test-set-v3.js SHA-256.
//
// Yoziladigan fayllar:
//   tests/results/v3-baseline.json   — metrikalar va xato bo'lgan testlar (asosiy natija)
//   js/results-v3-baseline.js        — shu natija brauzer uchun ("Loyiha haqida" bo'limi)
//   tests/results/v3-errors.md       — har bir xato uchun tahlil shabloni (inson to'ldiradi)
//   README.md                        — <!-- v3-baseline:start --> ... <!-- v3-baseline:end --> bloki
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = process.env.IQ_ROOT ? path.resolve(process.env.IQ_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = rel => path.join(ROOT, rel);
const FILES = {
  baseline: P('tests/results/v3-baseline.json'),
  browser: P('js/results-v3-baseline.js'),
  errors: P('tests/results/v3-errors.md'),
  archive: P('tests/results/archive'),
  readme: P('README.md'),
  analyzer: P('js/analyzer.js'),
  evaluate: P('js/evaluate.js'),
  v3: P('js/test-set-v3.js')
};
const force = process.argv.includes('--force');

function fail(msg) { console.error(`✗ ${msg}`); process.exit(1); }
// trimEnd: porcelain qatorining boshidagi bo'shliq (" M fayl") holat kodining bir qismi — uni kesmaslik kerak
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trimEnd();
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');

// ---------- 1. Git holati ----------
let commit, status;
try { commit = git('rev-parse', 'HEAD').trim(); status = git('status', '--porcelain', '--untracked-files=all'); }
catch (e) { fail("git repozitoriy topilmadi: natija qaysi commit'ga tegishli ekanini yozib bo'lmaydi"); }
const dirty = status.split('\n').filter(Boolean);
// "XY yo'l" yoki qayta nomlashda "XY eski -> yangi"
const dirtyPaths = dirty.map(l => l.slice(3).split(' -> ').pop().replace(/^"|"$/g, ''));
if (dirtyPaths.includes('js/analyzer.js')) {
  fail("js/analyzer.js da commit qilinmagan o'zgarish bor. Boshlang'ich natija o'zgartirilmagan qoidalar bilan olinishi kerak — avval commit qiling yoki o'zgarishni bekor qiling.");
}

// ---------- 2. Mavjud natija va --force ----------
const exists = existsSync(FILES.baseline);
if (exists && !force) {
  fail(`${path.relative(ROOT, FILES.baseline)} allaqachon mavjud. Boshlang'ich natija bir marta yoziladi.\n  Qayta yozish kerak bo'lsa: git holatini tozalang (commit) va "npm run eval:v3-baseline -- --force" ishlating.`);
}
if (force && exists) {
  if (dirty.length) fail(`--force faqat git holati toza bo'lganda ishlaydi. Commit qilinmagan fayllar:\n  ${dirty.join('\n  ')}`);
  mkdirSync(FILES.archive, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  copyFileSync(FILES.baseline, path.join(FILES.archive, `v3-baseline-${stamp}.json`));
  if (existsSync(FILES.errors)) copyFileSync(FILES.errors, path.join(FILES.archive, `v3-errors-${stamp}.md`));
  console.log(`Eski natija arxivlandi: tests/results/archive/v3-baseline-${stamp}.json`);
} else {
  // Birinchi yozish: qoidalar (js/), metrikalar (js/evaluate.js), real e'lonlar (js/test-set-v3.js) va vositalar
  // (tools/) commit qilingan bo'lishi shart — natija aynan qaysi kodga tegishli ekani git va xeshlar bilan isbotlanadi
  const uncommitted = dirtyPaths.filter(p => p.startsWith('js/') || p.startsWith('tools/'));
  if (uncommitted.length) {
    const key = ['js/evaluate.js', 'js/test-set-v3.js'].filter(f => uncommitted.includes(f));
    fail(`${key.length ? key.join(' va ') + ' commit qilinmagan. ' : ''}Boshlang'ich natija faqat js/ va tools/ toza bo'lganda yoziladi. Commit qilinmagan yoki yangi fayllar:\n  ${uncommitted.join('\n  ')}\n  Avval: git add ... && git commit`);
  }
}

// ---------- 3. Modullar va v3 to'plami ----------
for (const f of ['js/pii.js', 'js/analyzer.js', 'js/test-set.js', 'js/test-set-v3.js', 'js/evaluate.js']) await import(pathToFileURL(P(f)).href);
const A = globalThis.IshQalqon, E = globalThis.IQEval;
const v3 = globalThis.TEST_SET_V3 || [];
if (!v3.length) fail("js/test-set-v3.js bo'sh: avval real e'lonlarni qo'shing (README → Evaluation).");
const formatErrors = E.validateCases(v3, A, { real: true, idPattern: /^v3-\d{3}$/ });
if (formatErrors.length) fail(`v3 to'plamida ${formatErrors.length} ta format xatosi:\n  - ${formatErrors.join('\n  - ')}`);

// ---------- 4. Baholash ----------
const r = E.evaluate(v3, A.analyze);
const metrics = {
  accuracy: r.risk.accuracy,
  risk_recall: r.risk.recall,
  risk_precision: r.risk.precision,
  false_positive_rate: r.risk.fpr,
  discrimination_recall: r.discrimination.recall,
  discrimination_precision: r.discrimination.precision,
  trafficking_recall: r.trafficking.recall,
  trafficking_precision: r.trafficking.precision,
  reason_accuracy: r.flagRecall,          // kutilgan sabablar (belgilar)ning qancha qismi topildi
  exact_level_match: r.exactLevel
};
const counts = {
  risky: r.risk.positives, safe: r.n - r.risk.positives,
  tp: r.risk.tp, fp: r.risk.fp, fn: r.risk.fn, tn: r.risk.tn,
  discriminatory: r.discrimination.positives, trafficking: r.trafficking.positives, expected_flags: r.expectedFlagCount
};
const failures = r.failures.map(f => ({
  id: f.c.id, category: f.c.category, source_channel: f.c.source_channel, text: f.c.text,
  expected_risk_level: f.c.expected_risk_level, predicted_level: f.a.level, score: f.a.score,
  expected_flags: f.c.expected_flags, predicted_flags: [...f.flags].sort(), missed_flags: f.missedFlags,
  extra_flags: [...f.flags].filter(x => !f.c.expected_flags.includes(x)).sort(),
  problems: [
    !f.riskOk && (f.c.expected_risk_level === 'low' ? 'false_positive' : 'false_negative'),
    !f.discOk && 'discrimination',
    !f.traffOk && 'trafficking',
    f.missedFlags.length && 'missed_flags'
  ].filter(Boolean)
}));
const baseline = {
  created_at: new Date().toISOString(),
  n: r.n,
  git_commit: commit,
  git_dirty_files: dirty.map(l => l.slice(3)),
  analyzer_sha256: sha256(FILES.analyzer),
  evaluate_sha256: sha256(FILES.evaluate),
  test_set_v3_sha256: sha256(FILES.v3),
  metrics, counts, failures
};

// ---------- 5. Fayllarni yozish ----------
mkdirSync(path.dirname(FILES.baseline), { recursive: true });
writeFileSync(FILES.baseline, JSON.stringify(baseline, null, 2) + '\n');

const forBrowser = {
  created_at: baseline.created_at, n: baseline.n, git_commit: commit,
  analyzer_sha256: baseline.analyzer_sha256, evaluate_sha256: baseline.evaluate_sha256, test_set_v3_sha256: baseline.test_set_v3_sha256,
  metrics, counts, failure_ids: failures.map(f => f.id)
};
writeFileSync(FILES.browser, `// tools/eval-v3-baseline.mjs tomonidan yaratilgan — qo'lda o'zgartirmang.\nwindow.V3_BASELINE = ${JSON.stringify(forBrowser, null, 2)};\n`);

const pct = x => (x === null || x === undefined ? '—' : `${(x * 100).toFixed(1)}%`);
if (!existsSync(FILES.errors) || force) {
  const lines = [
    "# v3 xatolar tahlili",
    '',
    `Boshlang'ich natija: ${baseline.created_at.slice(0, 10)}, ${r.n} ta e'lon, commit \`${commit.slice(0, 7)}\`. Xatolar: ${failures.length}.`,
    '',
    "Har bir xato uchun **xato sababi** va **taklif etilayotgan tuzatish**ni to'ldiring. Tuzatish umumiy pattern bo'lishi kerak, bitta e'longa moslangan bo'lmasin.",
    "Tuzatishdan keyin `npm test` bilan v1, v2 va v3 ni qayta tekshiring. v2 5 punktdan ko'p pasaysa, tuzatishni qayta ko'rib chiqing.",
    ''
  ];
  for (const f of failures) {
    lines.push(
      `## ${f.id} · ${f.category} · ${f.source_channel}`, '',
      '**Matn:**', '', ...f.text.split('\n').map(l => `> ${l}`), '',
      `**Tizim bahosi:** ${f.predicted_level} (${f.score}/100); topilgan belgilar: ${f.predicted_flags.join(', ') || "yo'q"}`, '',
      `**To'g'ri javob:** ${f.expected_risk_level}; kutilgan belgilar: ${f.expected_flags.join(', ') || "yo'q"}${f.missed_flags.length ? `; topilmadi: ${f.missed_flags.join(', ')}` : ''}`, '',
      `**Muammo turi:** ${f.problems.join(', ')}`, '',
      '**Xato sababi:** _TODO_', '',
      '**Taklif etilayotgan tuzatish:** _TODO_', '',
      '**Holat:** ochiq', ''
    );
  }
  writeFileSync(FILES.errors, lines.join('\n'));
}

const block = [
  '<!-- v3-baseline:start -->',
  `**v3 boshlang'ich natija** (real e'lonlar, qoidalar o'zgartirilmasdan): ${baseline.created_at.slice(0, 10)}, ${r.n} ta e'lon, commit \`${commit.slice(0, 7)}\``,
  '',
  `SHA-256: \`analyzer.js\` \`${baseline.analyzer_sha256.slice(0, 12)}…\` · \`evaluate.js\` \`${baseline.evaluate_sha256.slice(0, 12)}…\` · \`test-set-v3.js\` \`${baseline.test_set_v3_sha256.slice(0, 12)}…\``,
  '',
  "| Ko'rsatkich | Natija |",
  '|---|---|',
  `| Umumiy aniqlik | ${pct(metrics.accuracy)} |`,
  `| Xavfli e'lonlarni topish (recall) | ${pct(metrics.risk_recall)} (${counts.tp}/${counts.risky}) |`,
  `| "Xavfli" deganida to'g'ri bo'lishi (precision) | ${pct(metrics.risk_precision)} |`,
  `| Halol e'lonni xavfli deyish (FPR) | ${pct(metrics.false_positive_rate)} (${counts.fp}/${counts.safe}) |`,
  `| Kamsitishni topish | ${pct(metrics.discrimination_recall)} |`,
  `| Odam savdosini topish | ${pct(metrics.trafficking_recall)} |`,
  `| Sabablar aniqligi (kutilgan belgilar topildi) | ${pct(metrics.reason_accuracy)} |`,
  '',
  `Xato bo'lgan testlar (${failures.length}): ${failures.map(f => f.id).join(', ') || "yo'q"}. Tahlil: \`tests/results/v3-errors.md\`.`,
  '<!-- v3-baseline:end -->'
].join('\n');
const readme = existsSync(FILES.readme) ? readFileSync(FILES.readme, 'utf8') : '';
const re = /<!-- v3-baseline:start -->[\s\S]*?<!-- v3-baseline:end -->/;
if (re.test(readme)) writeFileSync(FILES.readme, readme.replace(re, block));
else console.warn("README.md da <!-- v3-baseline:start --> bloki topilmadi — README yangilanmadi.");

// ---------- 6. Xulosa ----------
console.log(`✓ v3 boshlang'ich natija yozildi: ${r.n} ta e'lon, commit ${commit.slice(0, 7)}`);
console.log(`  aniqlik ${pct(metrics.accuracy)} · xavfli topish ${pct(metrics.risk_recall)} · FPR ${pct(metrics.false_positive_rate)} · kamsitish ${pct(metrics.discrimination_recall)} · odam savdosi ${pct(metrics.trafficking_recall)} · sabablar ${pct(metrics.reason_accuracy)}`);
console.log(`  Xatolar: ${failures.length} ta → tests/results/v3-errors.md`);
console.log('\nKeyingi qadam (analyzer.js ga tegmasdan):');
console.log('  git add tests/results js/results-v3-baseline.js README.md js/test-set-v3.js && git commit -m "test: v3 baseline"');
