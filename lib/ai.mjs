// Ixtiyoriy AI chuqur tahlil. Kalit bo'lmasa sayt va bot qoidalar tizimi bilan ishlayveradi.
// Provayderlar: Anthropic Claude (ANTHROPIC_API_KEY) yoki Google Gemini (GEMINI_API_KEY).
// IQ_AI_PROVIDER=anthropic|gemini aniq tanlaydi; berilmasa — qaysi kalit bor bo'lsa shu (ikkalasi bo'lsa Claude).
// Ikkala yo'lda ham javob bir xil qat'iy sxema bilan tekshiriladi va iqtiboslar e'lon matnidan qidiriladi.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { AnalysisSchema, GEMINI_RESPONSE_SCHEMA, SYSTEM_PROMPT, buildUserMessage, verifyQuotes } from '../prompts/analysis.mjs';
import '../js/analyzer.js';

const { analyze } = globalThis.IshQalqon;

export const MIN_CHARS = 20;
export const MAX_CHARS = 6000;
const TIMEOUT_MS = Number(process.env.IQ_AI_TIMEOUT_MS) || 45_000;
const MAX_RETRIES = process.env.IQ_AI_RETRIES !== undefined ? Number(process.env.IQ_AI_RETRIES) : 2;

const ANTHROPIC_KEY = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const CHOSEN = (process.env.IQ_AI_PROVIDER || '').trim().toLowerCase();

export const aiProvider = CHOSEN === 'gemini' || CHOSEN === 'anthropic' ? CHOSEN
  : ANTHROPIC_KEY ? 'anthropic' : GEMINI_KEY ? 'gemini' : 'anthropic';
export const aiModel = aiProvider === 'gemini' ? (process.env.IQ_GEMINI_MODEL || 'gemini-flash-latest').trim() : 'claude-opus-5-5';

// Faqat tanlangan provayderning haqiqiy kaliti bo'lsa yoqiladi
export const aiEnabled = aiProvider === 'gemini' ? Boolean(GEMINI_KEY) : ANTHROPIC_KEY;
export const aiDisabledReason = aiEnabled ? null
  : CHOSEN === 'gemini' ? 'AI tahlil faollashtirilmagan: GEMINI_API_KEY sozlanmagan.'
  : CHOSEN === 'anthropic' ? 'AI tahlil faollashtirilmagan: ANTHROPIC_API_KEY sozlanmagan.'
  : 'AI tahlil faollashtirilmagan: ANTHROPIC_API_KEY yoki GEMINI_API_KEY sozlanmagan.';

// SDK 429, 5xx, ulanish va timeout xatolarini MAX_RETRIES marta o'zi qayta urinadi
const client = aiEnabled && aiProvider === 'anthropic' ? new Anthropic({ timeout: TIMEOUT_MS, maxRetries: MAX_RETRIES }) : null;

export class AiError extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;     // empty | too_long | disabled | auth | rate_limit | timeout | connection | refused | bad_json | api
    this.status = status; // serverning HTTP javob kodi
  }
}

const ERR = {
  auth: () => new AiError('auth', 502, "API kaliti noto'g'ri yoki ruxsat yo'q."),
  rate: () => new AiError('rate_limit', 429, "AI so'rovlari limiti tugadi, birozdan keyin urinib ko'ring."),
  timeout: () => new AiError('timeout', 504, `AI ${Math.round(TIMEOUT_MS / 1000)} soniyada javob bermadi.`),
  connection: () => new AiError('connection', 502, "AI serveriga ulanib bo'lmadi."),
  api: status => new AiError('api', 502, `AI xizmati xatosi (${status ?? "noma'lum"}).`),
  refused: () => new AiError('refused', 422, "AI bu matnni tahlil qilishdan bosh tortdi."),
  truncated: () => new AiError('bad_json', 502, 'AI javobi chala qoldi.'),
  badJson: () => new AiError('bad_json', 502, "AI javobini o'qib bo'lmadi (kutilgan formatda emas).")
};

export function validateText(text) {
  if (typeof text !== 'string' || text.trim().length < MIN_CHARS) {
    throw new AiError('empty', 400, `Matn bo'sh yoki juda qisqa (kamida ${MIN_CHARS} belgi kerak).`);
  }
  if (text.length > MAX_CHARS) {
    // Jimgina kesib tashlamaymiz: e'lonning oxiridagi muhim qism (to'lov, pasport) yo'qolishi mumkin
    throw new AiError('too_long', 413, `Matn juda uzun: ${text.length} belgi (ko'pi bilan ${MAX_CHARS}). Bitta e'lonni yuboring.`);
  }
  return text.trim();
}

// ---------- Anthropic Claude ----------
async function callAnthropic(text, ruleCheck) {
  let response;
  try {
    response = await client.beta.messages.parse({
      model: aiModel,
      max_tokens: 4000,
      // Xavfsizlik filtri so'rovni rad etsa, server uni boshqa modelda qayta ishlaydi
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(AnalysisSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(text, ruleCheck) }]
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) throw ERR.auth();
    if (err instanceof Anthropic.RateLimitError) throw ERR.rate();
    if (err instanceof Anthropic.APIConnectionTimeoutError) throw ERR.timeout();
    if (err instanceof Anthropic.APIConnectionError) throw ERR.connection();
    if (err instanceof Anthropic.APIError) throw ERR.api(err.status);
    // SDK javobni sxema bo'yicha o'qiy olmasa (buzilgan JSON) shu yerga tushadi
    // Xabar ichida model javobining bo'lagi (e'lon matni, PII) bo'lishi mumkin — faqat xato turi yoziladi
    console.error(`[ai] javobni o'qishda xato: ${err && err.name ? err.name : 'Error'}`);
    throw ERR.badJson();
  }
  if (response.stop_reason === 'refusal') throw ERR.refused();
  if (response.stop_reason === 'max_tokens') throw ERR.truncated();
  return response.parsed_output;
}

// ---------- Google Gemini (REST, qo'shimcha kutubxonasiz) ----------
const GEMINI_BASE = (process.env.IQ_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
const BLOCKED = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION', 'IMAGE_SAFETY']);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function readGemini(data) {
  if (data?.promptFeedback?.blockReason) throw ERR.refused();
  const cand = data?.candidates?.[0];
  if (!cand) throw ERR.refused();
  if (BLOCKED.has(cand.finishReason)) throw ERR.refused();
  if (cand.finishReason === 'MAX_TOKENS') throw ERR.truncated();
  // "Fikrlash" qismlari (thought: true) javobga kirmaydi
  const out = (cand.content?.parts || []).filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('');
  try { return JSON.parse(out); }
  catch (e) {
    // Javob matnini logga yozmaymiz (unda e'lon matni bo'lishi mumkin) — faqat xato turi
    console.error(`[ai] javobni o'qishda xato: ${e.name}`);
    throw ERR.badJson();
  }
}

async function callGemini(text, ruleCheck) {
  // Kalit URL'da emas, sarlavhada yuboriladi: server yoki proksi loglariga tushmaydi
  const url = `${GEMINI_BASE}/v1beta/models/${encodeURIComponent(aiModel)}:generateContent`;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildUserMessage(text, ruleCheck) }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_RESPONSE_SCHEMA, temperature: 0.2, maxOutputTokens: 8192 }
  });
  for (let attempt = 0; ; attempt++) {
    const retry = attempt < MAX_RETRIES;
    let res;
    try {
      res = await fetch(url, {
        method: 'POST', body, signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI_KEY }
      });
    } catch (e) {
      if (retry) { await sleep(300 * 2 ** attempt); continue; }
      throw e.name === 'TimeoutError' || e.name === 'AbortError' ? ERR.timeout() : ERR.connection();
    }
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (!data) throw ERR.badJson();
      return readGemini(data);
    }
    const detail = JSON.stringify(await res.json().catch(() => ({})));
    if ((res.status === 429 || res.status >= 500) && retry) {
      const after = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(after) && after > 0 ? Math.min(after * 1000, 10_000) : 500 * 2 ** attempt);
      continue;
    }
    if (res.status === 401 || res.status === 403 || (res.status === 400 && /API_KEY_INVALID|API key not valid/i.test(detail))) throw ERR.auth();
    if (res.status === 429) throw ERR.rate();
    throw ERR.api(res.status);
  }
}

export async function aiAnalyze(rawText) {
  if (!aiEnabled) throw new AiError('disabled', 503, aiDisabledReason);
  const text = validateText(rawText);
  const pre = analyze(text);
  const ruleCheck = {
    score: pre.score, level: pre.level, trafficking: pre.trafficking,
    signals: pre.scam.map(s => s.label), discrimination: pre.discrimination.map(d => d.label),
    transparency: pre.transparency.score
  };

  const out = aiProvider === 'gemini' ? await callGemini(text, ruleCheck) : await callAnthropic(text, ruleCheck);
  const check = AnalysisSchema.safeParse(out);
  if (!check.success) throw ERR.badJson();
  // Iqtiboslar e'lon matnida bormi — to'qib chiqarilganlari olib tashlanadi va warnings ga yoziladi
  const { data, warnings } = verifyQuotes(check.data, text);
  if (warnings.length) console.warn(`[ai] ${warnings.length} ta iqtibos e'lon matnida topilmadi`);
  return data;
}
