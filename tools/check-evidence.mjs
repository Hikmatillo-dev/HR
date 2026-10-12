// README.md, docs/JARAYON.md va docs/TAQDIMOT.md dagi dalillar repozitoriyga va bir-biriga mosmi.
//   npm run check:evidence            — to'liq: test fayllarini ishga tushirib, testlar sonini ham sanaydi (~1–2 daqiqa)
//   node tools/check-evidence.mjs --static  — tez qismi (npm test ichida): testlarni ishga tushirmaydi
// Tekshiradi: test sonlari, commit xeshlari va nomlari, real e'lonlar soni, aniqlik foizlari, AI/bot holati,
// fayl yo'llari, npm buyruqlari, eskirgan yozuvlar, TAQDIMOT dagi demo e'lonlarining haqiqiy natijasi.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC = process.argv.includes('--static');
const P = f => path.join(ROOT, f);

await import('../js/pii.js');
await import('../js/analyzer.js');
await import('../js/test-set.js');
await import('../js/test-set-v3.js');
await import('../js/evaluate.js');
await import('../js/validate-posting.js');
await import('../js/importer.js');
const A = globalThis.IshQalqon;
const { evaluate } = globalThis.IQEval;

const DOCS = { 'README.md': null, 'docs/JARAYON.md': null, 'docs/TAQDIMOT.md': null };
for (const f of Object.keys(DOCS)) DOCS[f] = readFileSync(P(f), 'utf8');
const pkg = JSON.parse(readFileSync(P('package.json'), 'utf8'));

let passed = 0;
const problems = [];
function check(name, fn) {
  const errs = [];
  try { fn(msg => errs.push(msg)); } catch (e) { errs.push(e.message); }
  if (errs.length) { problems.push(name); console.error(`  ✗ ${name}\n    - ${errs.join('\n    - ')}`); process.exitCode = 1; }
  else { passed++; console.log(`  ✓ ${name}`); }
}
const each = fn => Object.entries(DOCS).forEach(([f, t]) => fn(f, t));
const pct = x => `${(x * 100).toFixed(1)}%`;

// ---------- Repozitoriydan olingan faktlar ----------
const v3 = globalThis.TEST_SET_V3;
const v12 = globalThis.TEST_SET;
const v3now = evaluate(v3, A.analyze);
const v12now = evaluate(v12, A.analyze);
const v2base = globalThis.TEST_BASELINE;
const v3base = JSON.parse(readFileSync(P('tests/results/v3-baseline.json'), 'utf8'));
const F = {
  v3n: v3.length,
  channels: new Set(v3.map(c => c.source_channel)).size,
  risky: v3.filter(c => c.expected_risk_level !== 'low').length,
  ageGender: v3.filter(c => c.expected_flags.some(f => f === 'disc:age' || f === 'disc:gender')).length,
  v3correct: Math.round(v3now.risk.accuracy * v3.length),
  v1n: v12.filter(c => c.id.startsWith('v1-')).length,
  v2n: v12.filter(c => c.id.startsWith('v2-')).length
};

console.log(`Dalillar mosligi${STATIC ? ' (tez rejim)' : ''}`);

check("README 'Hakam uchun 1 daqiqa' bilan boshlanadi va kerakli bandlar bor", err => {
  const t = DOCS['README.md'];
  const firstH2 = (t.match(/^## (.+)$/m) || [])[1];
  if (firstH2 !== 'Hakam uchun 1 daqiqa') err(`birinchi bo'lim: "${firstH2}"`);
  const block = t.split(/^## /m)[1] || '';
  for (const s of ['IshQalqon yoshlarni zamonaviy kasblar bozoriga xavfsiz kirishga yordam beradigan platforma.',
    'Kasblar va ko\'nikmalar', 'Hudud va maosh', 'Xavfsiz vakansiyalar', 'E\'lon tekshirish', 'Telegram eksport',
    'npm install', 'npm start', 'npm test', 'npm run test:ui', 'AI\'siz ham ishlaydi', 'ixtiyoriy chuqur tahlil qatlami', 'Halol cheklovlar']) {
    if (!block.includes(s)) err(`yo'q: "${s}"`);
  }
});

check('Eskirgan yozuvlar qolmagan (2 kunlik reja, 5–7 daqiqa, eski test sonlari va raqamlar)', err => {
  const stale = [/2 kunlik/i, /5[–-]7 daqiqa/i, /hozircha bo'sh\b(?!.*real-data)/, /hali real ma'lumot bilan sinalmagan/,
    /\((?:7|8|13) test\)/, /48 ta yangi e'londa aniqlik 85%/, /Dashboard hali/];
  each((f, t) => stale.forEach(re => { if (re.test(t)) err(`${f}: ${re}`); }));
});

check(`Real e'lonlar: ${F.v3n} ta, ${F.channels} ta kanal, ${F.risky} ta xavfli, ${F.ageGender} tasida yosh/jins cheklovi`, err => {
  each((f, t) => {
    for (const m of t.matchAll(/(\d+) ta (?:ochiq )?(?:Telegram )?kanal(?:dan|idan|i)\b/g)) if (+m[1] !== F.channels) err(`${f}: "${m[0]}" (kutilgan ${F.channels})`);
    for (const m of t.matchAll(/(\d+) ta real/g)) if (+m[1] !== F.v3n) err(`${f}: "${m[0]}" (kutilgan ${F.v3n})`);
    for (const m of t.matchAll(/(\d+) ta e'londan (\d+) tasida/g)) {
      if (+m[1] !== F.v3n) err(`${f}: "${m[0]}"`);
      if (![F.v3correct, F.ageGender].includes(+m[2])) err(`${f}: "${m[0]}" — ${m[2]} na aniqlik (${F.v3correct}), na yosh/jins (${F.ageGender}) soniga teng`);
    }
    for (const m of t.matchAll(/(\d+) tasida \((\d+)%\)/g)) if (+m[1] !== F.ageGender || +m[2] !== Math.round(F.ageGender / F.v3n * 100)) err(`${f}: "${m[0]}"`);
    for (const m of t.matchAll(/(\d+) tasi xavfli/g)) if (+m[1] !== F.risky) err(`${f}: "${m[0]}"`);
  });
  if (!DOCS['README.md'].includes(`| ${F.v1n} |`) || !DOCS['README.md'].includes(`| ${F.v2n} |`)) err(`README jadvalida v1=${F.v1n}, v2=${F.v2n} yo'q`);
});

check('Aniqlik foizlari faqat o\'lchangan natijalardan; 91.2% har doim boshlang\'ich natija va "optimistik" bilan', err => {
  const allowed = new Set(['100.0%', '0.0%']);
  const add = (...xs) => xs.forEach(x => { if (typeof x === 'number') allowed.add(pct(x)); });
  const m3 = v3base.metrics;
  add(m3.accuracy, m3.risk_recall, m3.risk_precision, m3.false_positive_rate, m3.discrimination_recall, m3.reason_accuracy, m3.exact_level_match);
  for (const r of [v3now, v12now]) add(r.risk.accuracy, r.risk.recall, r.risk.precision, r.risk.fpr, r.discrimination.recall, r.flagRecall, r.exactLevel);
  add(v2base.accuracy, v2base.riskRecall, v2base.riskPrecision, v2base.fpr, v2base.discRecall, v2base.discPrecision, v2base.traffRecall, v2base.flagRecall);
  const now = pct(v3now.risk.accuracy), base = pct(m3.accuracy);
  each((f, t) => {
    for (const m of t.matchAll(/\d+\.\d%/g)) if (!allowed.has(m[0])) err(`${f}: ${m[0]} hech qaysi o'lchovda yo'q`);
    if (t.includes(now) && !(t.includes(base) && /optimistik/.test(t))) err(`${f}: ${now} bor, lekin ${base} yoki "optimistik" yo'q`);
    if (!t.includes(now)) err(`${f}: hozirgi v3 natija ${now} ko'rsatilmagan`);
    if (!t.includes(base)) err(`${f}: boshlang'ich v3 natija ${base} ko'rsatilmagan`);
  });
  const riskNow = `${v3now.risk.tp}/${v3now.risk.positives}`, riskBase = `${v3base.counts.tp}/${v3base.counts.risky}`;
  if (!DOCS['README.md'].includes(riskNow) || !DOCS['README.md'].includes(riskBase)) err(`README da ${riskBase} va ${riskNow} bo'lishi kerak`);
});

check('AI va bot holati uchala hujjatda bir xil va qarama-qarshi da\'vo yo\'q', err => {
  const status = ['Claude API: real kalit bilan sinalmagan', "Gemini API: real kalit bilan faqat qo'lda sinalgan", 'Telegram bot: real token bilan sinalmagan'];
  each((f, t) => {
    status.forEach(s => {
      if (!t.includes(s)) err(`${f}: "${s}" yo'q`);
      // Har bir "Claude API: real kalit bilan …" aynan holat bilan davom etishi kerak
      const head = s.slice(0, s.indexOf(' bilan ') + 7);
      for (const m of t.matchAll(new RegExp(head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "[^.;,()\\n]*", 'g'))) if (m[0].trim() !== s) err(`${f}: "${m[0]}"`);
    });
    for (const re of [/real (?:kalit|token) bilan sinalgan/i, /real token bilan ishga tushirilgan/i, /100% aniq(?!lik" da'vosi)/i]) {
      if (re.test(t)) err(`${f}: ${re}`);
    }
  });
});

check('Commit xeshlari repozitoriyda bor va nomlari to\'g\'ri', err => {
  const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: ROOT }).toString().trim() === 'true';
  const subject = h => { try { return execFileSync('git', ['log', '-1', '--format=%s', h], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; } };
  let skipped = 0;
  each((f, t) => {
    for (const m of t.matchAll(/`([0-9a-f]{7})`(?: \(«([^»]+)»\))?/g)) {
      const s = subject(m[1]);
      if (s === null) { if (shallow) skipped++; else err(`${f}: ${m[1]} topilmadi`); continue; }
      if (m[2] && m[2] !== s) err(`${f}: ${m[1]} nomi "${s}", hujjatda "${m[2]}"`);
    }
  });
  if (skipped) console.log(`    (sayoz klon: ${skipped} ta xesh tekshirilmadi)`);
});

check("Hujjatdagi fayl yo'llari va npm buyruqlari mavjud", err => {
  // .env va data/ git'ga tushmaydi; k1/result.json — README dagi buyruq misoli
  const ignore = /^(\.env|data\/|tests\/results\/archive\/|k\d\/)/;
  each((f, t) => {
    for (const m of t.matchAll(/`([\w.-]+(?:\/[\w.-]+)+\/?)`/g)) {
      const p = m[1];
      if (ignore.test(p) || /^(?:text|application|image)\/[\w.+-]+$/.test(p)) continue; // MIME turi, fayl emas
      if (!existsSync(P(p))) err(`${f}: \`${p}\` mavjud emas`);
    }
    for (const m of t.matchAll(/npm run ([\w:-]+)/g)) if (!pkg.scripts[m[1]]) err(`${f}: "npm run ${m[1]}" package.json da yo'q`);
  });
});

check("TAQDIMOT dagi demo e'lonlari aytilgan natijani beradi", err => {
  const t = DOCS['docs/TAQDIMOT.md'];
  const blocks = [...t.matchAll(/<!-- evidence:(\w+)([^>]*)-->\s*```text\n([\s\S]*?)\n```/g)];
  if (blocks.length < 3) err(`kamida 3 ta demo bloki kerak, topildi ${blocks.length}`);
  for (const [, kind, attrs, text] of blocks) {
    if (kind === 'invalid') { if (globalThis.IQValidate.check(text).ok) err(`"${text}" validatsiyadan o'tib ketdi`); continue; }
    const want = Object.fromEntries([...attrs.matchAll(/(\w+)=([\w,]*)/g)].map(m => [m[1], m[2]]));
    if (!globalThis.IQValidate.check(text).ok) err(`demo e'lon validatsiyadan o'tmaydi: ${text.slice(0, 30)}`);
    const a = A.analyze(text);
    const ids = a.scam.map(s => s.id).sort().join(','), disc = a.discrimination.map(d => d.id).sort().join(',');
    if (a.level !== want.level) err(`daraja ${a.level}, kutilgan ${want.level}: ${text.slice(0, 30)}`);
    if (String(Boolean(a.trafficking)) !== want.trafficking) err(`odam savdosi ${Boolean(a.trafficking)}: ${text.slice(0, 30)}`);
    if (ids !== (want.flags || '').split(',').filter(Boolean).sort().join(',')) err(`belgilar: ${ids}, kutilgan ${want.flags}`);
    if (disc !== (want.disc === '0' ? '' : (want.disc || '').split(',').sort().join(','))) err(`kamsitish: ${disc}, kutilgan ${want.disc}`);
  }
  const { stats } = globalThis.IQImporter.importFiles([{ name: 'result.json', content: readFileSync(P('namuna/telegram-export-namuna.json'), 'utf8') }]);
  const s = `${stats.messages} ta xabar, ${stats.duplicates} ta takror, ${stats.unique} ta noyob e'lon`;
  if (!t.includes(s)) err(`namunaviy eksport natijasi hujjatda "${s}" bo'lishi kerak`);
});

// ---------- Test sonlari ----------
const UNIT = pkg.scripts.test.match(/tests\/[\w.-]+\.test\.mjs/g);
const claims = re => Object.entries(DOCS).flatMap(([f, t]) => [...t.matchAll(re)].map(m => [f, +m[1]]));
const tableCounts = Object.fromEntries([...DOCS['README.md'].matchAll(/^\| `(tests\/[\w.-]+\.mjs)` \|.*\| (\d+)(?: chegara)? \|$/gm)].map(m => [m[1], +m[2]]));

check(`Test sonlari hujjatlar o'rtasida bir xil (${UNIT.length} ta unit test fayli)`, err => {
  const totals = claims(/(\d+) ta unit test\b/g), ui = claims(/(\d+) ta brauzer testi/g), files = claims(/(\d+) ta test fayli/g);
  const sum = UNIT.reduce((n, f) => n + (tableCounts[f] ?? NaN), 0);
  if (UNIT.some(f => !(f in tableCounts))) err(`README jadvalida yo'q: ${UNIT.filter(f => !(f in tableCounts)).join(', ')}`);
  for (const [f, n] of totals) if (n !== sum) err(`${f}: ${n} ta unit test, README jadvali yig'indisi ${sum}`);
  for (const [f, n] of ui) if (n !== tableCounts['tests/ui.e2e.mjs']) err(`${f}: ${n} ta brauzer testi, jadvalda ${tableCounts['tests/ui.e2e.mjs']}`);
  for (const [f, n] of files) if (n !== UNIT.length) err(`${f}: ${n} ta test fayli, package.json da ${UNIT.length}`);
  for (const f of Object.keys(DOCS)) {
    if (!totals.some(([g]) => g === f)) err(`${f}: unit testlar soni yozilmagan`);
    if (!ui.some(([g]) => g === f)) err(`${f}: brauzer testlari soni yozilmagan`);
  }
  const c = tableCounts;
  const need = {
    'README.md': [`soxta (mock) API bilan ${c['tests/ai.test.mjs']} ta`, `Avtomatik testlar (${c['tests/ai-gemini.test.mjs']} ta)`, `${c['tests/bot.test.mjs']} ta testdan`],
    'docs/JARAYON.md': [`(${c['tests/ai.test.mjs']} + ${c['tests/ai-gemini.test.mjs']} ta test)`, `${c['tests/bot.test.mjs']} ta test`, `(${c['tests/redact.test.mjs']} ta)`, `(${c['tests/validate.test.mjs']} ta)`],
    'docs/TAQDIMOT.md': [`Claude ${c['tests/ai.test.mjs']} ta, Gemini ${c['tests/ai-gemini.test.mjs']} ta, bot ${c['tests/bot.test.mjs']} ta test`, `${c['tests/redact.test.mjs'] + c['tests/redact-parity.test.mjs']} ta test`]
  };
  for (const [f, list] of Object.entries(need)) list.forEach(s => { if (!DOCS[f].includes(s)) err(`${f}: "${s}" yo'q`); });
});

if (!STATIC) {
  check('Test sonlari haqiqiy ishga tushirish natijasiga teng', err => {
    const count = file => {
      const r = spawnSync(process.execPath, [file], { cwd: ROOT, env: { ...process.env, IQ_SKIP_DOTENV: '1' }, encoding: 'utf8', timeout: 300_000 });
      const out = r.stdout + r.stderr;
      if (r.status !== 0) err(`${file} xato bilan tugadi`);
      // redact-parity holatlarni bitta qatorda sanaydi: "10 ta moslik testi o'tdi"
      const ok = (out.match(/^\s*✓/gm) || []).length || +((out.match(/(\d+) ta moslik testi o'tdi/) || [])[1] || 0);
      return { ok, skipped: /o'tkazib yuborildi/.test(out) };
    };
    for (const f of [...UNIT, 'tests/ui.e2e.mjs']) {
      const { ok, skipped } = count(f);
      if (skipped && !ok) { console.log(`    (${f}: o'tkazib yuborildi — sanalmadi)`); continue; }
      if (ok !== tableCounts[f]) err(`${f}: ishga tushirilganda ${ok}, README da ${tableCounts[f]}`);
    }
    const gates = (spawnSync(process.execPath, ['tests/run.mjs'], { cwd: ROOT, encoding: 'utf8' }).stdout.match(/^\s*✓ v/gm) || []).length;
    if (gates !== tableCounts['tests/run.mjs']) err(`tests/run.mjs: ${gates} ta chegara, README da ${tableCounts['tests/run.mjs']}`);
  });
}

console.log(`\n${passed} ta dalil tekshiruvi o'tdi${process.exitCode ? `, xatolar: ${problems.length}` : ''}${STATIC ? " (to'liq tekshiruv: npm run check:evidence)" : ''}\n`);
