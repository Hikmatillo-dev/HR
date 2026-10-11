#!/usr/bin/env node
// Real e'lonlardagi shaxsiy ma'lumotni yashirish va v3 test to'plami uchun qoralama tayyorlash.
//
//   Bitta matn:        node tools/redact.mjs --text "Kassir kerak, tel +998 90 123 45 67"
//   Yashiriladi: telefon (UZ, RU), karta, JSHSHIR, pasport, email, t.me, @username. STIR yashirilmaydi.
//   Ism + opa/aka ("Dilnoza opa") avtomatik yashirilmaydi — ogohlantirish chiqadi.
//   Fayl/stdin:        node tools/redact.mjs < elonlar.txt
//   Telegram eksporti: node tools/redact.mjs --from-export result.json --channel @kanal --limit 50 > v3-qoralama.js
//
// Qoralamada expected_* maydonlari 'TODO' bo'ladi va tizim bahosi KO'RSATILMAYDI: belgini inson
// e'lonning o'zini o'qib qo'yishi kerak, tizimga qarab emas. TODO qolgan e'lon npm test'dan o'tmaydi.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import '../js/pii.js';
import '../js/analyzer.js';
import '../js/importer.js';
import '../js/test-set-v3.js';

const P = globalThis.IQPII;
export const MASK = P.MASK;

/**
 * Matndagi PII'ni yashiradi: telefon (UZ va RU), karta, JSHSHIR, pasport, email, t.me va @username.
 * STIR/INN (kompaniyaning ochiq raqami) o'zgarmaydi. Qoidalar: js/pii.js
 */
export function redact(text) {
  const { text: out, counts } = P.redact(text);
  return { text: out, counts, names: P.nameWarnings(out) };
}

const summary = c => Object.entries(c).filter(([, n]) => n).map(([k, n]) => `${n} ${P.LABELS[k]}`).join(', ') || "hech narsa";

function nextIdNumber() {
  const nums = (globalThis.TEST_SET_V3 || []).map(c => Number((c.id.match(/^v3-(\d{3})$/) || [])[1])).filter(Boolean);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

/** Telegram eksportidan v3 qoralamasi (JS obyektlar matni). */
export function draftFromExport(files, { channel, limit = 50, startId = nextIdNumber() } = {}) {
  const { items, stats } = globalThis.IQImporter.importFiles(files);
  const picked = items.slice(0, limit);
  const totals = {};
  const entries = picked.map((item, i) => {
    const { text, counts, names } = redact(item.text);
    Object.entries(counts).forEach(([k, n]) => { totals[k] = (totals[k] || 0) + n; });
    const id = `v3-${String(startId + i).padStart(3, '0')}`;
    return [
      ...(names.length ? [`    // ⚠️ ${id}: ism bo'lishi mumkin (${names.join(', ')}) — qo'lda tekshiring va kerak bo'lsa yashiring`] : []),
      '    {',
      `      id: '${id}',`,
      `      text: ${JSON.stringify(text)},`,
      `      source_channel: ${JSON.stringify(channel || item.channel || '')},`,
      "      source_type: 'real',",
      "      expected_risk_level: 'TODO', // low | medium | high",
      '      expected_flags: [], // masalan: prepay, abroad, trafficking, disc:age',
      "      expected_reason: 'TODO',",
      "      category: 'TODO', // scam | trafficking | discrimination | legit | trap | ambiguous",
      `      reviewer_notes: ${JSON.stringify(item.date ? `e'lon sanasi: ${item.date}` : '')}`,
      '    },'
    ].join('\n');
  });
  return { code: entries.join('\n'), count: entries.length, stats, totals };
}

// ---------- CLI ----------
async function main(argv) {
  const arg = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n').replace(/^\/\/ ?/gm, ''));
    return;
  }
  if (arg('--from-export')) {
    const paths = argv.filter((a, i) => argv[i - 1] === '--from-export');
    const files = paths.map(p => ({ name: p, content: readFileSync(p, 'utf8') }));
    const limit = Number(arg('--limit')) || 50;
    const { code, count, stats, totals } = draftFromExport(files, { channel: arg('--channel'), limit });
    process.stdout.write(`// v3 qoralama: ${count} ta e'lon (${stats.messages} xabardan, ${stats.duplicates} takror olib tashlandi)\n`);
    process.stdout.write(`// Yashirildi: ${summary(totals)}\n`);
    process.stdout.write(`// Har bir TODO ni e'lonni o'qib to'ldiring, keyin js/test-set-v3.js ichidagi massivga qo'shing.\n`);
    process.stdout.write(code + '\n');
    return;
  }
  const input = arg('--text') ?? readFileSync(0, 'utf8');
  const { text, counts, names } = redact(input);
  process.stdout.write(text.endsWith('\n') ? text : text + '\n');
  console.error(`Yashirildi: ${summary(counts)}`);
  if (names.length) console.error(`⚠️ Ism bo'lishi mumkin: ${names.join(', ')} — qo'lda tekshiring`);
}

// CLI faqat fayl to'g'ridan-to'g'ri ishga tushirilganda. Boshqa moduldan, `node -e` yoki REPL'dan
// import qilinganda process.argv[1] bo'lmasligi mumkin — bu holatda hech narsa qilinmaydi.
const isMain = (() => {
  try { return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href; }
  catch { return false; }
})();
if (isMain) {
  main(process.argv.slice(2)).catch(e => { console.error('Xatolik:', e.message); process.exit(1); });
}
