// tools/eval-v3-baseline.mjs ni vaqtinchalik git repozitoriyda tekshirish: node tests/baseline.test.mjs
// Haqiqiy loyiha fayllariga tegilmaydi. Bu yerdagi 3 ta e'lon — SINOV UCHUN SOXTA, real to'plamga kirmaydi.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'tools/eval-v3-baseline.mjs');
const dir = mkdtempSync(path.join(tmpdir(), 'iq-baseline-'));
const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' });
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, env: { ...process.env, IQ_ROOT: dir }, encoding: 'utf8' });
const commitAll = msg => { git('add', '-A'); git('commit', '-qm', msg); };

const FIXTURE = `(function (g) { g.TEST_SET_V3 = [
  { id: 'v3-001', text: "Koreyaga ish! Hujjat uchun to'lov 500$. Tel +998 XX XXX XX XX", source_channel: '@sinov', source_type: 'real',
    expected_risk_level: 'high', expected_flags: ['prepay', 'abroad', 'trafficking'], expected_reason: 'sinov', category: 'trafficking', reviewer_notes: 'SINOV' },
  { id: 'v3-002', text: "Kassir kerak, Toshkent. Maosh 4 mln so'm. Tel +998 XX XXX XX XX", source_channel: '@sinov', source_type: 'real',
    expected_risk_level: 'low', expected_flags: [], expected_reason: 'sinov', category: 'legit', reviewer_notes: '' },
  { id: 'v3-003', text: "Yangi ish imkoniyati, ma'lumot uchun yozing, ishonchli kompaniya", source_channel: '@sinov', source_type: 'real',
    expected_risk_level: 'medium', expected_flags: ['vague'], expected_reason: 'sinov: tizim topa olmasligi kutiladi', category: 'ambiguous', reviewer_notes: '' }
]; })(globalThis);
`;

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log("Baseline skripti testlari (vaqtinchalik repozitoriyda)");
try {
  cpSync(path.join(REPO, 'js'), path.join(dir, 'js'), { recursive: true });
  cpSync(path.join(REPO, 'README.md'), path.join(dir, 'README.md'));
  rmSync(path.join(dir, 'js/real-data.js'), { force: true });
  git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't');
  commitAll('init');

  test("v3 bo'sh — natija yozilmaydi", () => {
    const r = run();
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /bo'sh/);
    assert.ok(!existsSync(path.join(dir, 'tests/results/v3-baseline.json')));
  });

  writeFileSync(path.join(dir, 'js/test-set-v3.js'), FIXTURE);
  commitAll('v3 sinov');

  test("Birinchi marta: JSON, brauzer fayli, xatolar shabloni va README bloki yoziladi", () => {
    const r = run();
    assert.equal(r.status, 0, r.stderr);
    const b = JSON.parse(readFileSync(path.join(dir, 'tests/results/v3-baseline.json'), 'utf8'));
    assert.equal(b.n, 3);
    for (const k of ['accuracy', 'risk_recall', 'false_positive_rate', 'discrimination_recall', 'trafficking_recall', 'reason_accuracy']) assert.ok(k in b.metrics, k);
    assert.equal(b.git_commit.length, 40);
    assert.equal(b.analyzer_sha256.length, 64);
    assert.deepEqual(b.failures.map(f => f.id), ['v3-003']);
    assert.deepEqual(b.failures[0].problems, ['false_negative', 'missed_flags']);
    assert.match(readFileSync(path.join(dir, 'js/results-v3-baseline.js'), 'utf8'), /window\.V3_BASELINE = /);
    assert.match(readFileSync(path.join(dir, 'tests/results/v3-errors.md'), 'utf8'), /## v3-003[\s\S]*Xato sababi:\*\* _TODO_/);
    assert.match(readFileSync(path.join(dir, 'README.md'), 'utf8'), /v3 boshlang'ich natija\*\* \(real e'lonlar[\s\S]*Umumiy aniqlik \| 66\.7%/);
  });

  test('Qayta ishga tushirish --force siz rad etiladi', () => {
    const r = run();
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /allaqachon mavjud/);
  });

  test("--force git holati toza bo'lmasa rad etiladi (natija hali commit qilinmagan)", () => {
    const r = run('--force');
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /git holati toza/);
    assert.ok(!existsSync(path.join(dir, 'tests/results/archive')));
  });

  test("--force toza holatda: eski natija archive/ ga vaqt belgisi bilan ko'chiriladi", () => {
    commitAll('baseline');
    const before = readFileSync(path.join(dir, 'tests/results/v3-baseline.json'), 'utf8');
    const r = run('--force');
    assert.equal(r.status, 0, r.stderr);
    const files = readdirSync(path.join(dir, 'tests/results/archive'));
    const archived = files.find(f => /^v3-baseline-\d{4}-\d{2}-\d{2}T.*\.json$/.test(f));
    assert.ok(archived, files.join(','));
    assert.equal(readFileSync(path.join(dir, 'tests/results/archive', archived), 'utf8'), before);
    assert.ok(files.some(f => /^v3-errors-.*\.md$/.test(f)));
  });

  test("analyzer.js da commit qilinmagan o'zgarish bo'lsa ishlamaydi", () => {
    commitAll('force');
    appendFileSync(path.join(dir, 'js/analyzer.js'), '\n// o\'zgarish\n');
    const r = run('--force');
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /analyzer\.js da commit qilinmagan/);
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`\n${passed} ta baseline testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
