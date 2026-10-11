// Ixtiyoriy AI chuqur tahlil (Claude API). Kalit bo'lmasa sayt va bot qoidalar tizimi bilan ishlayveradi.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { AnalysisSchema, SYSTEM_PROMPT, buildUserMessage, verifyQuotes } from '../prompts/analysis.mjs';
import '../js/analyzer.js';

const { analyze } = globalThis.IshQalqon;

export const MIN_CHARS = 20;
export const MAX_CHARS = 6000;
const TIMEOUT_MS = Number(process.env.IQ_AI_TIMEOUT_MS) || 45_000;
const MAX_RETRIES = process.env.IQ_AI_RETRIES !== undefined ? Number(process.env.IQ_AI_RETRIES) : 2;

// Faqat haqiqiy kalit/token bo'lsa yoqiladi
export const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
export const aiDisabledReason = aiEnabled ? null : "AI tahlil faollashtirilmagan: ANTHROPIC_API_KEY sozlanmagan.";

// SDK 429, 5xx, ulanish va timeout xatolarini MAX_RETRIES marta o'zi qayta urinadi
const client = aiEnabled ? new Anthropic({ timeout: TIMEOUT_MS, maxRetries: MAX_RETRIES }) : null;

export class AiError extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;     // empty | too_long | disabled | auth | rate_limit | timeout | connection | refused | bad_json | api
    this.status = status; // serverning HTTP javob kodi
  }
}

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

export async function aiAnalyze(rawText) {
  if (!client) throw new AiError('disabled', 503, aiDisabledReason);
  const text = validateText(rawText);
  const pre = analyze(text);
  const ruleCheck = {
    score: pre.score, level: pre.level, trafficking: pre.trafficking,
    signals: pre.scam.map(s => s.label), discrimination: pre.discrimination.map(d => d.label),
    transparency: pre.transparency.score
  };

  let response;
  try {
    response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      // Xavfsizlik filtri so'rovni rad etsa, server uni boshqa modelda qayta ishlaydi
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(AnalysisSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(text, ruleCheck) }]
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      throw new AiError('auth', 502, "API kaliti noto'g'ri yoki ruxsat yo'q.");
    }
    if (err instanceof Anthropic.RateLimitError) throw new AiError('rate_limit', 429, "AI so'rovlari limiti tugadi, birozdan keyin urinib ko'ring.");
    if (err instanceof Anthropic.APIConnectionTimeoutError) throw new AiError('timeout', 504, `AI ${Math.round(TIMEOUT_MS / 1000)} soniyada javob bermadi.`);
    if (err instanceof Anthropic.APIConnectionError) throw new AiError('connection', 502, "AI serveriga ulanib bo'lmadi.");
    if (err instanceof Anthropic.APIError) throw new AiError('api', 502, `AI xizmati xatosi (${err.status ?? "noma'lum"}).`);
    // SDK javobni sxema bo'yicha o'qiy olmasa (buzilgan JSON) shu yerga tushadi
    // Xabar ichida model javobining bo'lagi (e'lon matni, PII) bo'lishi mumkin — faqat xato turi yoziladi
    console.error(`[ai] javobni o'qishda xato: ${err && err.name ? err.name : 'Error'}`);
    throw new AiError('bad_json', 502, "AI javobini o'qib bo'lmadi (kutilgan formatda emas).");
  }

  if (response.stop_reason === 'refusal') throw new AiError('refused', 422, "AI bu matnni tahlil qilishdan bosh tortdi.");
  if (response.stop_reason === 'max_tokens') throw new AiError('bad_json', 502, "AI javobi chala qoldi.");
  const out = response.parsed_output;
  const check = AnalysisSchema.safeParse(out);
  if (!check.success) throw new AiError('bad_json', 502, "AI javobini o'qib bo'lmadi (kutilgan formatda emas).");
  // Iqtiboslar e'lon matnida bormi — to'qib chiqarilganlari olib tashlanadi va warnings ga yoziladi
  const { data, warnings } = verifyQuotes(check.data, text);
  if (warnings.length) console.warn(`[ai] ${warnings.length} ta iqtibos e'lon matnida topilmadi`);
  return data;
}
