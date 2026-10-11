#!/usr/bin/env node
// Real e'lonlardagi shaxsiy ma'lumotni yashirish va v3 test to'plami uchun qoralama tayyorlash.
//
//   Bitta matn:        node tools/redact.mjs --text "Kassir kerak, tel +998 90 123 45 67"
//   Fayl/stdin:        node tools/redact.mjs < elonlar.txt
//   Telegram eksporti: node tools/redact.mjs --from-export result.json --channel @kanal --limit 50 > v3-qoralama.js
//
// Qoralamada expected_* maydonlari 'TODO' bo'ladi va tizim bahosi KO'RSATILMAYDI: belgini inson
// e'lonning o'zini o'qib qo'yishi kerak, tizimga qarab emas. TODO qolgan e'lon npm test'dan o'tmaydi.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import '../js/analyzer.js';
import '../js/importer.js';
import '../js/test-set-v3.js';

const MASK = {
  phone: '+998 XX XXX XX XX',
  card: 'XXXX XXXX XXXX XXXX',
  email: '[email]',
  username: '@[foydalanuvchi]'
};

const CARD_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const PHONE_RE = /(\+?998[\s-]?)?\(?\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const USERNAME_RE = /(^|[^\w@])@([A-Za-z][\w]{3,31})\b/g;

/** Matndagi telefon, karta, email va @username'larni yashiradi. STIR/INN (kompaniya raqami) o'zgarmaydi. */
export function redact(text) {
  const counts = { phone: 0, card: 0, email: 0, username: 0 };
  let out = String(text);
  out = out.replace(CARD_RE, () => { counts.card++; return MASK.card; });
  out = out.replace(EMAIL_RE, () => { counts.email++; return MASK.email; });
  out = out.replace(PHONE_RE, (m, _p, offset, whole) => {
    if (/(stir|inn|инн)\s*:?\s*$/i.test(whole.slice(Math.max(0, offset - 12), offset))) return m;
    counts.phone++; return MASK.phone;
  });
  out = out.replace(USERNAME_RE, (m, pre) => { counts.username++; return pre + MASK.username; });
  return { text: out, counts };
}

function nextIdNumber() {
  const nums = (globalThis.TEST_SET_V3 || []).map(c => Number((c.id.match(/^v3-(\d{3})$/) || [])[1])).filter(Boolean);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

/** Telegram eksportidan v3 qoralamasi (JS obyektlar matni). */
export function draftFromExport(files, { channel, limit = 50, startId = nextIdNumber() } = {}) {
  const { items, stats } = globalThis.IQImporter.importFiles(files);
  const picked = items.slice(0, limit);
  const totals = { phone: 0, card: 0, email: 0, username: 0 };
  const entries = picked.map((item, i) => {
    const { text, counts } = redact(item.text);
    Object.keys(totals).forEach(k => { totals[k] += counts[k]; });
    const id = `v3-${String(startId + i).padStart(3, '0')}`;
    return [
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
    process.stdout.write(`// Yashirildi: ${totals.phone} telefon, ${totals.card} karta, ${totals.email} email, ${totals.username} username\n`);
    process.stdout.write(`// Har bir TODO ni e'lonni o'qib to'ldiring, keyin js/test-set-v3.js ichidagi massivga qo'shing.\n`);
    process.stdout.write(code + '\n');
    return;
  }
  const input = arg('--text') ?? readFileSync(0, 'utf8');
  const { text, counts } = redact(input);
  process.stdout.write(text.endsWith('\n') ? text : text + '\n');
  console.error(`Yashirildi: ${counts.phone} telefon, ${counts.card} karta, ${counts.email} email, ${counts.username} username`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(e => { console.error('Xatolik:', e.message); process.exit(1); });
}
