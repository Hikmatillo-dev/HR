// .env faylini o'qish: oddiy `npm start` / `npm run bot` ham kalit va tokenni topadi (`start:env` shart emas).
// Muhitda allaqachon berilgan qiymatlar ustidan yozilmaydi. Testlar IQ_SKIP_DOTENV=1 bilan o'chiradi.
// server.mjs va bot.mjs da BIRINCHI import bo'lishi kerak: boshqa modullar env'ni yuklanish paytida o'qiydi.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
if (!process.env.IQ_SKIP_DOTENV && existsSync(file)) {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile(file); } catch (e) { console.error(`.env faylini o'qib bo'lmadi: ${e.message}`); }
  } else {
    console.warn(".env topildi, lekin bu Node.js versiyasi uni o'qiy olmaydi (20.12+ kerak). Node'ni yangilang yoki: node --env-file=.env ...");
  }
}
