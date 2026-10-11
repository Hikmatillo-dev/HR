// Sayt + AI API serveri: node server.mjs  (http://localhost:3000)
// AI uchun: ANTHROPIC_API_KEY=... node server.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aiEnabled, aiDisabledReason, aiAnalyze, AiError, MAX_CHARS } from './lib/ai.mjs';
import './config/currency.js';

// .env dagi IQ_RATE_* kurslari brauzerga config/currency.js orqali uzatiladi
const CURRENCY = globalThis.IQCurrency.rates;
const RATES_OVERRIDDEN = ['USD', 'EUR', 'RUB'].some(k => process.env['IQ_RATE_' + k]);

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const PUBLIC = ['index.html', 'css/', 'js/', 'vendor/', 'namuna/', 'config/'];

// Oddiy cheklov: bir IP dan daqiqasiga 10 ta AI so'rov. Eski yozuvlar har daqiqada tozalanadi.
const RATE_LIMIT = 10;
const hits = new Map();
function allowed(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  return list.length <= RATE_LIMIT;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) if (list.every(t => now - t >= 60_000)) hits.delete(ip);
}, 60_000).unref();

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
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
  if (!aiEnabled) return send(res, 503, { error: aiDisabledReason, code: 'disabled' });
  if (!allowed(req.socket.remoteAddress)) return send(res, 429, { error: "Juda ko'p so'rov: bir daqiqadan keyin urinib ko'ring.", code: 'rate_limit' });
  try {
    let text;
    try { ({ text } = JSON.parse(await readBody(req, MAX_CHARS * 4 + 1000))); }
    catch (e) { if (e instanceof AiError) throw e; return send(res, 400, { error: "Noto'g'ri so'rov (JSON kutilgan).", code: 'bad_request' }); }
    return send(res, 200, await aiAnalyze(text));
  } catch (e) {
    if (e instanceof AiError) return send(res, e.status, { error: e.message, code: e.code });
    console.error('[server] kutilmagan xato:', e);
    return send(res, 500, { error: 'Serverda kutilmagan xato.', code: 'internal' });
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/health') return send(res, 200, { ok: true, ai: aiEnabled, reason: aiDisabledReason, maxChars: MAX_CHARS });
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
}).listen(PORT, () => {
  console.log(`IshQalqon: http://localhost:${PORT}  (AI: ${aiEnabled ? 'yoqilgan' : aiDisabledReason})`);
  if (RATES_OVERRIDDEN) {
    console.warn(`Kurslar .env dan: 1$=${CURRENCY.USD}, 1€=${CURRENCY.EUR}, 1₽=${CURRENCY.RUB} (${CURRENCY.updated}). Diqqat: js/analyzer.js hali config'ga ulanmagan — maosh hisobi standart kurslar bilan (README → Kutilayotgan ishlar).`);
  }
});
