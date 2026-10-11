// Sayt + AI API serveri: node server.mjs  (http://localhost:3000)
// AI uchun: ANTHROPIC_API_KEY=... node server.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aiEnabled, aiDisabledReason, aiAnalyze, AiError, MAX_CHARS, validateText } from './lib/ai.mjs';
import { createDailyQuota, createWindowLimiter, parseLimit, DEFAULT_DAILY_LIMIT } from './lib/ai-quota.mjs';
import { logError } from './lib/safe-log.mjs';
import './config/currency.js';

// .env dagi IQ_RATE_* kurslari brauzerga config/currency.js orqali uzatiladi
const CURRENCY = globalThis.IQCurrency.rates;
const RATES_OVERRIDDEN = ['USD', 'EUR', 'RUB'].some(k => process.env['IQ_RATE_' + k]);

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
// Sukut bo'yicha faqat shu kompyuterdan: tarmoqdagi boshqalar AI kalitingizni ishlata olmaydi.
// Tashqariga ochish kerak bo'lsa: HOST=0.0.0.0 (va IQ_AI_DAILY_LIMIT ni o'ylab qo'ying)
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = process.env.IQ_DATA_DIR || path.join(ROOT, 'data');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const PUBLIC = ['index.html', 'css/', 'js/', 'vendor/', 'namuna/', 'config/'];

// ---------- AI limitlari ----------
// 1) Bir IP dan daqiqasiga IQ_AI_PER_MINUTE ta (standart 10). 2) Server bo'yicha kunlik IQ_AI_DAILY_LIMIT ta
// (standart 200; 0 — AI o'chiq). Kunlik hisob data/ai-usage-server.json da — qayta ishga tushirish uni nolga tushirmaydi.
const perIp = createWindowLimiter({ max: parseLimit(process.env.IQ_AI_PER_MINUTE, 10), windowMs: 60_000 });
const daily = createDailyQuota({ limit: parseLimit(process.env.IQ_AI_DAILY_LIMIT, DEFAULT_DAILY_LIMIT), file: path.join(DATA_DIR, 'ai-usage-server.json') });
setInterval(() => perIp.cleanup(), 60_000).unref();

// Proksi orqasida (nginx, Cloudflare) haqiqiy IP X-Forwarded-For da bo'ladi. Lekin bu sarlavhani istalgan
// mijoz soxtalashtira oladi, shuning uchun u FAQAT IQ_TRUST_PROXY=<ishonchli proksilar soni> berilganda o'qiladi:
// ro'yxatning o'ngdan N-chi qiymati olinadi (o'zimizning proksi qo'shgan manzil).
const TRUST_PROXY = parseLimit(process.env.IQ_TRUST_PROXY, 0);
function clientIp(req) {
  const socketIp = req.socket.remoteAddress || 'unknown';
  if (!TRUST_PROXY) return socketIp;
  const chain = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
  return chain.length >= TRUST_PROXY ? chain[chain.length - TRUST_PROXY] : socketIp;
}

// Origin bo'lsa — sahifa shu serverning o'zidan ochilgan bo'lishi shart (boshqa sayt kalitni sarflay olmasin).
// Origin yo'q so'rovlar (curl, server-server) brauzer emas — ular Content-Type va limitlar bilan cheklanadi.
const EXTRA_ORIGINS = String(process.env.IQ_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
function originAllowed(req) {
  const origin = req.headers.origin;
  if (origin === undefined) return true;
  if (EXTRA_ORIGINS.includes(origin)) return true;
  let host;
  try { host = new URL(origin).host; } catch { return false; } // "null" va buzilgan Origin
  const expected = (TRUST_PROXY && req.headers['x-forwarded-host']) || req.headers.host;
  return Boolean(expected) && host === expected;
}

function send(res, status, body, type = 'application/json; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...extraHeaders });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readBody(req, limit) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > limit) throw new AiError('too_long', 413, `Matn juda uzun (ko'pi bilan ${MAX_CHARS} belgi).`);
  }
  return data;
}

async function handleAi(req, res) {
  if (!originAllowed(req)) return send(res, 403, { error: "Ruxsat yo'q: so'rov boshqa saytdan yuborilgan.", code: 'forbidden_origin' });
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') return send(res, 415, { error: "Faqat Content-Type: application/json qabul qilinadi.", code: 'unsupported_media_type' });
  if (!aiEnabled) return send(res, 503, { error: aiDisabledReason, code: 'disabled' });
  if (!perIp.take(clientIp(req))) {
    return send(res, 429, { error: "Juda ko'p so'rov: bir daqiqadan keyin urinib ko'ring.", code: 'rate_limit' }, undefined, { 'Retry-After': '60' });
  }
  try {
    let text;
    try { ({ text } = JSON.parse(await readBody(req, MAX_CHARS * 4 + 1000))); }
    catch (e) { if (e instanceof AiError) throw e; return send(res, 400, { error: "Noto'g'ri so'rov (JSON kutilgan).", code: 'bad_request' }); }
    validateText(text); // bo'sh yoki uzun matn kunlik limitni sarflamaydi
    if (!daily.take()) {
      return send(res, 429, { error: `Bugungi AI tahlil limiti (${daily.limit} ta) tugadi. Ertaga qayta urinib ko'ring — qoidalar tizimi esa ishlashda davom etadi.`, code: 'daily_limit' });
    }
    return send(res, 200, await aiAnalyze(text));
  } catch (e) {
    if (e instanceof AiError) return send(res, e.status, { error: e.message, code: e.code });
    logError('server', e);
    return send(res, 500, { error: 'Serverda kutilmagan xato.', code: 'internal' });
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/health') {
    const left = daily.remaining();
    return send(res, 200, { ok: true, ai: aiEnabled && left > 0, reason: aiEnabled && !left ? `Bugungi AI tahlil limiti (${daily.limit} ta) tugagan.` : aiDisabledReason, maxChars: MAX_CHARS });
  }
  if (url.pathname === '/api/ai') {
    if (req.method !== 'POST') return send(res, 405, { error: 'Faqat POST', code: 'method' });
    return handleAi(req, res);
  }
  if (url.pathname === '/config/currency.js') {
    const body = await readFile(path.join(ROOT, 'config/currency.js'), 'utf8');
    return send(res, 200, `window.IQ_CURRENCY_OVERRIDE = ${JSON.stringify(CURRENCY)};\n${body}`, TYPES['.js']);
  }
  // Statik fayllar (faqat ruxsat etilgan papkalardan)
  try {
    const rel = decodeURIComponent(url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
    const file = path.normalize(rel);
    if (file.startsWith('..') || path.isAbsolute(file) || !PUBLIC.some(p => file === p || file.startsWith(p))) return send(res, 404, 'Not found', 'text/plain');
    const body = await readFile(path.join(ROOT, file));
    send(res, 200, body, TYPES[path.extname(file)] || 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
}).on('error', e => {
  logError('server', e.code === 'EADDRINUSE' ? { code: e.code, message: `${HOST}:${PORT} band — boshqa PORT tanlang` } : e);
  process.exit(1);
}).listen(PORT, HOST, () => {
  console.log(`IshQalqon: http://${HOST}:${PORT}  (AI: ${aiEnabled ? `yoqilgan, kunlik limit ${daily.limit}, qolgan ${daily.remaining()}` : aiDisabledReason})`);
  if (HOST !== '127.0.0.1' && HOST !== 'localhost' && HOST !== '::1') console.warn(`Diqqat: server tarmoqqa ochiq (HOST=${HOST}). AI kunlik limiti: ${daily.limit}.`);
  if (RATES_OVERRIDDEN) {
    console.warn(`Kurslar .env dan: 1$=${CURRENCY.USD}, 1€=${CURRENCY.EUR}, 1₽=${CURRENCY.RUB} (${CURRENCY.updated}). Diqqat: js/analyzer.js hali config'ga ulanmagan — maosh hisobi standart kurslar bilan (README → Kutilayotgan ishlar).`);
  }
});
