// Sayt + AI API serveri: node server.mjs  (http://localhost:3000)
// AI uchun: ANTHROPIC_API_KEY=... node server.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aiEnabled, aiAnalyze } from './lib/ai.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const PUBLIC = ['index.html', 'css/', 'js/', 'vendor/'];

// Oddiy cheklov: bir IP dan daqiqasiga 10 ta AI so'rov
const hits = new Map();
function allowed(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  return list.length <= 10;
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readBody(req, limit = 20_000) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > limit) throw new Error('too large');
  }
  return data;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, ai: aiEnabled });

    if (url.pathname === '/api/ai' && req.method === 'POST') {
      if (!aiEnabled) return send(res, 503, { error: "AI o'chirilgan" });
      if (!allowed(req.socket.remoteAddress)) return send(res, 429, { error: "Juda ko'p so'rov, bir daqiqadan keyin urinib ko'ring" });
      let text;
      try { ({ text } = JSON.parse(await readBody(req))); } catch { return send(res, 400, { error: "Noto'g'ri so'rov" }); }
      if (typeof text !== 'string' || text.trim().length < 10) return send(res, 400, { error: 'Matn juda qisqa' });
      try { return send(res, 200, await aiAnalyze(text)); } catch (e) { return send(res, 502, { error: e.message }); }
    }

    // Statik fayllar (faqat ruxsat etilgan papkalardan)
    const rel = decodeURIComponent(url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
    const file = path.normalize(rel);
    if (file.startsWith('..') || path.isAbsolute(file) || !PUBLIC.some(p => file === p || file.startsWith(p))) return send(res, 404, 'Not found', 'text/plain');
    const body = await readFile(path.join(ROOT, file));
    send(res, 200, body, TYPES[path.extname(file)] || 'application/octet-stream');
  } catch (e) {
    send(res, 404, 'Not found', 'text/plain');
  }
}).listen(PORT, () => {
  console.log(`IshQalqon: http://localhost:${PORT}  (AI: ${aiEnabled ? 'yoqilgan' : "o'chirilgan"})`);
});
