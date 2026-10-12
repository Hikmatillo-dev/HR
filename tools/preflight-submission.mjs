// Topshirishdan oldingi tekshiruv: npm run preflight
//   --no-tests     testlarni ishga tushirmaydi (tez tekshiruv)
//   --final        screenshot va video yo'qligi ham xato hisoblanadi (topshirish kuni)
//   --repo <dir>   boshqa git repozitoriyni tekshirish (tests/preflight.test.mjs uchun)
// Exit code: 0 — hammasi joyida, 1 — xato bor. Topilgan kalit yoki tokenning o'zi hech qachon chiqarilmaydi:
// faqat turi, joyi va uzunligi yoziladi.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const args = process.argv.slice(2);
const NO_TESTS = args.includes('--no-tests');
const FINAL = args.includes('--final');
const ROOT = path.resolve(args.includes('--repo') ? args[args.indexOf('--repo') + 1] : process.cwd());
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

const errors = [], warnings = [];
let section = '';
const ok = msg => console.log(`  ✓ ${msg}`);
const fail = msg => { errors.push(`${section}: ${msg}`); console.log(`  ✗ ${msg}`); };
const warn = msg => { warnings.push(`${section}: ${msg}`); console.log(`  ⚠️ ${msg}`); };
const head = title => { section = title; console.log(`\n${title}`); };

// Haqiqiy kalit formatlari. Testlardagi qisqa soxta qiymatlar ('sk-ant-test-...', 'AIza-test-...') bunga tushmaydi.
const SECRETS = [
  ['Anthropic API kaliti', /sk-ant-[a-z]{2,6}\d{2}-[A-Za-z0-9_-]{32,}/g],
  ['Google (Gemini) API kaliti', /AIza[0-9A-Za-z_-]{35}/g],
  ['Telegram bot tokeni', /\b\d{8,10}:AA[0-9A-Za-z_-]{33}\b/g]
];
const mask = s => `${s.slice(0, 4)}… (${s.length} belgi)`;
function findSecrets(text) {
  const out = [];
  for (const [kind, re] of SECRETS) for (const m of text.matchAll(re)) out.push({ kind, value: m[0], index: m.index });
  return out;
}
const lineOf = (text, i) => text.slice(0, i).split('\n').length;

console.log(`IshQalqon — topshirish preflight tekshiruvi${NO_TESTS ? ' (testlarsiz)' : ''}${FINAL ? ' (--final)' : ''}`);

// ---------- 1. Git holati ----------
head('1. Git holati');
let tracked = [];
try {
  console.log(`  Branch: ${git('rev-parse', '--abbrev-ref', 'HEAD').trim()}`);
  console.log(`  HEAD:   ${git('log', '-1', '--format=%h %s').trim()}`);
  const status = git('status', '--porcelain').trim();
  console.log(`  Status: ${status ? `${status.split('\n').length} ta o'zgarish yoki yangi fayl` : 'toza'}`);
  if (status) status.split('\n').slice(0, 15).forEach(l => console.log(`          ${l}`));
  if (status) warn("commit qilinmagan o'zgarishlar bor — topshirishdan oldin commit va push qiling");
  tracked = git('ls-files', '-z').split('\0').filter(Boolean);
} catch (e) {
  fail(`git repozitoriy emas yoki git ishlamadi: ${e.message.split('\n')[0]}`);
}

// ---------- 2. Git'ga tushmasligi kerak bo'lgan fayllar ----------
head("2. Git'dagi taqiqlangan fayllar");
const FORBIDDEN = [
  [/(^|\/)\.env(\..+)?$/, '.env (kalitlar)', f => !f.endsWith('.env.example')],
  [/^data\//, 'data/ (limit hisoblari, bot statistikasi, tuz)'],
  [/(^|\/)node_modules\//, 'node_modules/'],
  [/(^|\/)(qoralama[^/]*|belgilangan[^/]*|hammasi|v3-qoralama[^/]*)\.js$/, "qoralama yoki belgilash fayli (real e'lonlar)"],
  [/(^|\/)__pycache__\/|\.pyc$/, '__pycache__ / .pyc'],
  [/(^|\/)result\.json$/, 'Telegram eksporti (result.json)'],
  [/(^|\/)ChatExport[^/]*\//, 'Telegram eksporti papkasi']
];
let forbiddenFound = 0;
for (const f of tracked) {
  for (const [re, label, extra] of FORBIDDEN) {
    if (re.test(f) && (!extra || extra(f))) { fail(`${f} — ${label} git'da kuzatilmoqda (git rm --cached ${f})`); forbiddenFound++; }
  }
}
if (!forbiddenFound) ok(".env, data/, node_modules/, qoralama/belgilash fayllari, __pycache__ va Telegram eksportlari git'da yo'q");

// js/real-data.js — real e'lonlar faqat lokal; repozitoriyda bo'sh bo'lishi kerak
const realData = path.join(ROOT, 'js/real-data.js');
if (tracked.includes('js/real-data.js') && existsSync(realData)) {
  try {
    const ctx = { window: {} };
    vm.runInNewContext(readFileSync(realData, 'utf8'), ctx, { timeout: 1000 });
    const n = (ctx.window.REAL_VACANCIES || []).length;
    n ? fail(`js/real-data.js da ${n} ta real e'lon bor — real ma'lumot git'ga tushmasligi kerak`) : ok("js/real-data.js bo'sh (real e'lonlar faqat lokal)");
  } catch (e) { fail(`js/real-data.js ni o'qib bo'lmadi: ${e.message}`); }
}

// ---------- 3. .gitignore ----------
head('3. .gitignore');
const IGNORE_SAMPLES = [['.env', '.env'], ['.env.local', '.env.*'], ['data/bot-stats.json', 'data/'], ['node_modules/x/index.js', 'node_modules/'],
  ['qoralama1.js', 'qoralama*.js'], ['belgilangan1.js', 'belgilangan*.js'], ['hammasi.js', 'hammasi.js'], ['__pycache__/x.pyc', '__pycache__/'], ['k1/result.json', 'result.json']];
const notIgnored = IGNORE_SAMPLES.filter(([p]) => spawnSync('git', ['check-ignore', '-q', '--no-index', p], { cwd: ROOT }).status !== 0);
notIgnored.length ? notIgnored.forEach(([p, rule]) => fail(`"${p}" e'tiborsiz qoldirilmaydi — .gitignore ga "${rule}" qo'shing`))
  : ok(".env, data/, node_modules/, qoralama/belgilash fayllari, __pycache__ va result.json e'tiborsiz qoldiriladi");
if (spawnSync('git', ['check-ignore', '-q', '--no-index', '.env.example'], { cwd: ROOT }).status === 0) fail('.env.example ham e\'tiborsiz qoldirilgan — "!.env.example" qo\'shing');

// ---------- 4. Maxfiy kalitlar ----------
head('4. Maxfiy kalit va tokenlar');
let secretHits = 0;
const scanFile = (f, label) => {
  const p = path.join(ROOT, f);
  if (!existsSync(p) || statSync(p).isDirectory() || statSync(p).size > 20 * 1024 * 1024) return;
  const buf = readFileSync(p);
  if (buf.includes(0)) return; // ikkilik fayl
  const text = buf.toString('utf8');
  for (const s of findSecrets(text)) { fail(`${label}: ${f}:${lineOf(text, s.index)} — ${s.kind} (${mask(s.value)})`); secretHits++; }
};
tracked.forEach(f => scanFile(f, 'kuzatilayotgan fayl'));
// git add . bilan qo'shilib ketishi mumkin bo'lgan (e'tiborsiz qoldirilmagan) yangi fayllar
let untracked = [];
try { untracked = git('ls-files', '-z', '--others', '--exclude-standard').split('\0').filter(Boolean); } catch { /* yuqorida xato yozilgan */ }
untracked.forEach(f => scanFile(f, 'yangi (commit qilinmagan) fayl'));
if (!secretHits) ok(`${tracked.length} ta kuzatilayotgan va ${untracked.length} ta yangi faylda kalit yoki token yo'q`);

// Git tarixi: barcha branch va teglardagi har bir commit diffi
let historyHits = 0;
try {
  const log = git('log', '--all', '-p', '--no-color', '--no-textconv', '-U0', '--format=commit %h');
  let commit = '?', file = '?';
  for (const line of log.split('\n')) {
    if (line.startsWith('commit ')) commit = line.slice(7);
    else if (line.startsWith('+++ ')) file = line.slice(4).replace(/^b\//, '');
    else if (line.startsWith('+') || line.startsWith('-')) {
      for (const s of findSecrets(line)) { fail(`git tarixi: commit ${commit}, ${file} — ${s.kind} (${mask(s.value)}). Kalitni bekor qiling va tarixni tozalang`); historyHits++; }
    }
  }
  const n = git('rev-list', '--all', '--count').trim();
  if (!historyHits) ok(`git tarixidagi ${n} ta commitda kalit yoki token yo'q`);
} catch (e) { fail(`git tarixini o'qib bo'lmadi: ${e.message.split('\n')[0]}`); }

// ---------- 5. Topshirish hujjatlari ----------
head('5. Hujjatlar va dalillar');
const DOCS = ['README.md', 'docs/JARAYON.md', 'docs/TAQDIMOT.md', 'docs/SCREENSHOTS.md', 'docs/VIDEO_DEMO.md'];
const missingDocs = DOCS.filter(f => !existsSync(path.join(ROOT, f)));
missingDocs.length ? missingDocs.forEach(f => fail(`${f} yo'q`)) : ok(DOCS.join(', '));

const manifest = path.join(ROOT, 'docs/SCREENSHOTS.md');
if (existsSync(manifest)) {
  const shots = [...new Set([...readFileSync(manifest, 'utf8').matchAll(/`(docs\/screenshots\/[\w.-]+\.png)`/g)].map(m => m[1]))];
  const absent = shots.filter(f => !existsSync(path.join(ROOT, f)));
  if (shots.length !== 5) fail(`docs/SCREENSHOTS.md da 5 ta screenshot bo'lishi kerak, topildi ${shots.length}`);
  if (!absent.length) ok(`${shots.length} ta screenshot joyida`);
  else (FINAL ? fail : warn)(`${absent.length} ta screenshot hali olinmagan: ${absent.join(', ')}`);
  const untrackedShots = shots.filter(f => existsSync(path.join(ROOT, f)) && !tracked.includes(f));
  if (untrackedShots.length) warn(`screenshot bor, lekin commit qilinmagan: ${untrackedShots.join(', ')}`);
}
const videoDoc = path.join(ROOT, 'docs/VIDEO_DEMO.md');
if (existsSync(videoDoc)) {
  const video = (readFileSync(videoDoc, 'utf8').match(/`(docs\/video\/[\w.-]+\.mp4)`/) || [])[1];
  if (!video) fail('docs/VIDEO_DEMO.md da video fayl yo\'li (docs/video/….mp4) yo\'q');
  else if (existsSync(path.join(ROOT, video))) ok(`video lokal nusxasi bor: ${video} (${(statSync(path.join(ROOT, video)).size / 1e6).toFixed(1)} MB)`);
  else (FINAL ? fail : warn)(`video hali yozilmagan: ${video} (docs/VIDEO_DEMO.md)`);
}

const pkgPath = path.join(ROOT, 'package.json');
const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : { scripts: {} };
const NEED = ['test', 'test:ui', 'check:evidence', 'preflight', 'demo:local'];
const noScript = NEED.filter(s => !pkg.scripts?.[s]);
noScript.length ? noScript.forEach(s => fail(`package.json da "${s}" buyrug'i yo'q`)) : ok(`npm buyruqlari: ${NEED.join(', ')}`);

// ---------- 6. Testlar ----------
head('6. Testlar');
if (NO_TESTS) console.log("  (o'tkazib yuborildi: --no-tests)");
else {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  for (const [script, summary] of [['test', /dalil tekshiruvi o'tdi/], ['test:ui', /UI testi o'tdi|o'tkazib yuborildi/], ['check:evidence', /dalil tekshiruvi o'tdi/]]) {
    const t0 = Date.now();
    const r = spawnSync(npm, ['run', script], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, IQ_SKIP_DOTENV: '1' }, timeout: 600_000, maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32' });
    const out = `${r.stdout}${r.stderr}`;
    const last = out.trim().split('\n').filter(l => summary.test(l)).pop() || '';
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    if (r.status === 0) {
      ok(`npm run ${script} — ${secs} s${last ? `: ${last.trim()}` : ''}`);
      if (/o'tkazib yuborildi/.test(last)) warn(`npm run ${script}: Playwright topilmadi — brauzer testlari ishlamadi`);
    } else {
      fail(`npm run ${script} xato bilan tugadi (exit ${r.status ?? r.signal})`);
      out.split('\n').filter(l => /✗|Error|xato/i.test(l)).slice(0, 8).forEach(l => console.log(`      ${l.trim()}`));
    }
  }
}

// ---------- Natija ----------
console.log(`\nNatija: ${errors.length ? `❌ ${errors.length} ta xato` : '✅ xato yo\'q'}${warnings.length ? `, ⚠️ ${warnings.length} ta ogohlantirish` : ''}`);
if (errors.length) console.log('Topshirishdan oldin yuqoridagi ✗ bandlarni tuzating.');
process.exit(errors.length ? 1 : 0);
