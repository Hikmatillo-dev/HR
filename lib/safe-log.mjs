// Xavfsiz log: xato xabaridan API kalit, bot token va shaxsiy ma'lumot olib tashlanadi, matn qisqartiriladi.
// E'lon matni hech qachon logga yozilmasligi kerak — bu yerga faqat xato turi va qisqa tavsif beriladi.
import '../js/pii.js';

const SECRETS = [
  [/sk-ant-[A-Za-z0-9_-]{8,}/g, 'sk-ant-***'],           // Anthropic API kaliti
  [/\b\d{6,12}:[A-Za-z0-9_-]{30,}\b/g, '<bot-token>'],     // Telegram bot tokeni
  [/(bot)\d{6,12}:[A-Za-z0-9_-]{30,}/g, '$1<bot-token>'],  // URL ichidagi token (api.telegram.org/bot...)
  [/(x-api-key|authorization)\s*[:=]\s*\S+/gi, '$1: ***']
];
const MAX = 160;

/** Xabarni logga yozish uchun tozalash: maxfiy kalitlar va PII yashiriladi, birinchi qator, ≤ 160 belgi. */
export function sanitize(message) {
  let s = String(message ?? '').split('\n')[0];
  for (const [re, mask] of SECRETS) s = s.replace(re, mask);
  s = globalThis.IQPII.redact(s).text;
  return s.length > MAX ? s.slice(0, MAX) + '…' : s;
}

/** console.error o'rniga: faqat xato turi (code/status/name) va tozalangan qisqa xabar. Stack trace yo'q. */
export function logError(scope, err) {
  const e = err || {};
  const kind = e.code || e.status || e.name || 'Error';
  console.error(`[${scope}] ${kind}: ${sanitize(e.message ?? e)}`);
}
