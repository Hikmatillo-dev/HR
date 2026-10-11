// js/pii.js va tools/telegram_export.py bir xil yashirishini tekshirish: node tests/redact-parity.test.mjs
// Python o'rnatilmagan bo'lsa test o'tkazib yuboriladi.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../js/pii.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = globalThis.IQPII;
const CASES = [
  'Tel: +998 90 123 45 67, 901234567, (90) 123-45-67, +998(90)1234567',
  'Tel: +7 (999) 123-45-67, 89991234567, 8 (999) 123-45-67',
  'Pasport: AA1234567, AB 1234567; JSHSHIR 31234567890123',
  'Karta 8600 1234 5678 9012, 8600123456789012; hr@firma.uz',
  'Telegram: t.me/hr_dilnoza, https://t.me/Ish_Kanal, telegram.me/hr_ali, @recruiter_ali',
  '«Audit Pro» MChJ, STIR: 305123456; STIR raqami: 305123456; ИНН 305123456; СТИР: 305 123 456',
  "Maosh 1 500 000 so'm, 2026-10-11, 10:00–18:00, IELTS 7.0, to'lov 500$",
  'Murojaat: Dilnoza opa yoki Aziz aka, Нодира опа',
  'Tel +998 00 000 00 00, +7 000 000 00 00, [pasport], [JSHSHIR], @foydalanuvchi, t.me/foydalanuvchi',
  'Кореяга иш! Тел: +998 93 555 66 77, @hr_bot_uz'
];

console.log('Redaction: JS va Python mosligi');
const py = spawnSync('python3', ['-c', `
import json, sys
sys.path.insert(0, 'tools')
from telegram_export import redact, name_warnings
cases = json.load(sys.stdin)
print(json.dumps([{"text": redact(c)[0], "counts": redact(c)[1], "names": name_warnings(c)} for c in cases], ensure_ascii=False))
`], { cwd: ROOT, input: JSON.stringify(CASES), encoding: 'utf8' });

if (py.error || py.status === null) {
  console.log("  Python topilmadi — moslik testi o'tkazib yuborildi.\n");
  process.exit(0);
}
if (py.status !== 0) { console.error(py.stderr); process.exit(1); }

const results = JSON.parse(py.stdout);
let passed = 0;
CASES.forEach((c, i) => {
  const js = P.redact(c), pyr = results[i];
  const ok = js.text === pyr.text && JSON.stringify(js.counts) === JSON.stringify(pyr.counts) && JSON.stringify(P.nameWarnings(c)) === JSON.stringify(pyr.names);
  if (ok) passed++;
  else { process.exitCode = 1; console.error(`  ✗ ${JSON.stringify(c)}\n    JS: ${JSON.stringify(js.text)} ${JSON.stringify(js.counts)}\n    PY: ${JSON.stringify(pyr.text)} ${JSON.stringify(pyr.counts)}`); }
});
console.log(`  ${passed}/${CASES.length} holatda JS va Python natijasi bir xil`);
console.log(`\n${passed} ta moslik testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
