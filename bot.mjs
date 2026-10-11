// IshQalqon Telegram boti. Buyruqlar: /start, /help, /check, /stats (mantiq: lib/bot-core.mjs)
// Ishga tushirish: npm run bot  (.env dagi TELEGRAM_BOT_TOKEN avtomatik o'qiladi)
// AI xulosa uchun qo'shimcha: ANTHROPIC_API_KEY=...
import './lib/env.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN o'rnatilmagan. @BotFather → /newbot orqali token oling va .env ga yozing (README → Telegram bot).");
  process.exit(1);
}
if (!/^\d+:[\w-]{30,}$/.test(TOKEN)) {
  console.error("TELEGRAM_BOT_TOKEN formati noto'g'ri. U \"123456789:AA...\" ko'rinishida bo'ladi.");
  process.exit(1);
}

const { createBot, AI_PER_HOUR_DEFAULT } = await import('./lib/bot-core.mjs');
const { createDailyQuota, createWindowLimiter, parseLimit, DEFAULT_DAILY_LIMIT } = await import('./lib/ai-quota.mjs');
const { logError } = await import('./lib/safe-log.mjs');
const { createStore } = await import('./lib/bot-store.mjs');
const { aiEnabled, aiAnalyze } = await import('./lib/ai.mjs');

// IQ_TELEGRAM_API — faqat testlar uchun (soxta Telegram server)
const API = `${process.env.IQ_TELEGRAM_API || 'https://api.telegram.org'}/bot${TOKEN}`;
const DATA_DIR = process.env.IQ_BOT_DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');

class TelegramError extends Error {
  constructor(method, status, description) { super(`${method}: ${description}`); this.status = status; }
}

async function tg(method, body, timeoutMs = 40_000) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs)
  });
  const data = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  if (!data.ok) throw new TelegramError(method, data.error_code || res.status, data.description);
  return data.result;
}

const store = createStore(DATA_DIR);
// AI limitlari: foydalanuvchiga soatiga IQ_BOT_AI_PER_HOUR (standart 5), bot bo'yicha kunlik IQ_AI_DAILY_LIMIT
const aiLimiter = createWindowLimiter({ max: parseLimit(process.env.IQ_BOT_AI_PER_HOUR, AI_PER_HOUR_DEFAULT), windowMs: 3600_000 });
const aiDaily = createDailyQuota({ limit: parseLimit(process.env.IQ_AI_DAILY_LIMIT, DEFAULT_DAILY_LIMIT), file: path.join(DATA_DIR, 'ai-usage-bot.json') });
setInterval(() => aiLimiter.cleanup(), 600_000).unref();

let me;
try {
  me = await tg('getMe', {}, 15_000);
} catch (e) {
  console.error(e.status === 401 || e.status === 404 ? "Token noto'g'ri yoki bekor qilingan: @BotFather dan yangi token oling." : "Telegram'ga ulanib bo'lmadi. Internet va tokenni tekshiring.");
  logError('telegram', e);
  process.exit(1);
}
const handle = createBot({
  send: (chatId, html) => tg('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', link_preview_options: { is_disabled: true } }),
  store,
  ai: { enabled: aiEnabled, analyze: aiAnalyze },
  aiLimiter, aiDaily,
  botUsername: me.username
});
await tg('setMyCommands', {
  commands: [
    { command: 'check', description: "E'lonni tekshirish" },
    { command: 'stats', description: 'Mening statistikam' },
    { command: 'help', description: 'Yordam' }
  ]
}).catch(e => logError('setMyCommands', e));
console.log(`@${me.username} ishga tushdi (AI: ${aiEnabled ? `yoqilgan, foydalanuvchiga soatiga ${aiLimiter.max} ta, kunlik ${aiDaily.limit} ta` : "o'chirilgan"}). Statistika: ${store.file}`);

let offset = 0, stopping = false;
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stopping = true; console.log("\nTo'xtatilmoqda..."); setTimeout(() => process.exit(0), 500).unref(); });

while (!stopping) {
  try {
    const updates = await tg('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
    for (const u of updates) {
      offset = u.update_id + 1;
      if (u.message) handle(u.message).catch(e => logError('xabar', e));
    }
  } catch (e) {
    if (e.status === 401) { console.error("Token bekor qilingan. Bot to'xtatildi."); process.exit(1); }
    if (e.status === 409) { console.error("Bu token bilan boshqa bot nusxasi ishlayapti (409). Bittasini to'xtating."); process.exit(1); }
    logError('ulanish', e);
    await new Promise(r => setTimeout(r, 3000));
  }
}
