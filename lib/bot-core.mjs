// Telegram bot mantig'i (tarmoqsiz, testlanadigan). Telegram bilan aloqa — bot.mjs da.
import '../js/analyzer.js';
import { createWindowLimiter } from './ai-quota.mjs';
import { logError } from './safe-log.mjs';

const A = globalThis.IshQalqon;

export const TG_LIMIT = 4096;          // Telegram bitta xabar chegarasi
export const POST_LIMIT = 4000;        // bundan uzun matn bo'laklarga bo'linadi
export const DISCLAIMER = "Bu avtomatik tahlil. Yakuniy qaror o'zingizda.";
const DISCLAIMER_HTML = `<i>${DISCLAIMER}</i>`;
const DOT = { high: '🔴', medium: '🟡', low: '🟢' };

export const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * Javobni Telegram chegarasiga (4096) bo'lish. Qatorlar butunligicha qoladi, shuning uchun
 * bir qatorda ochilgan HTML teg o'sha qatorda yopiladi va hech qachon o'rtasidan kesilmaydi.
 * Juda uzun bitta qator HTML entity'ni (&amp;) buzmasdan kesiladi. Teglar faqat qisqa qatorlarda ishlatiladi
 * (sarlavha, sabab), uzun qator esa doim escape qilingan foydalanuvchi yoki AI matni bo'ladi.
 */
export function splitMessage(html, limit = TG_LIMIT) {
  const lines = [];
  for (const line of html.split('\n')) {
    let rest = line;
    while (rest.length > limit) {
      let cut = limit;
      const amp = rest.lastIndexOf('&', cut);
      if (amp > cut - 8 && rest.indexOf(';', amp) >= cut) cut = amp; // &amp; o'rtasidan kesmaslik
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    lines.push(rest);
  }
  const out = [];
  let cur = '';
  for (const line of lines) {
    const next = cur ? cur + '\n' + line : line;
    if (next.length > limit) { if (cur) out.push(cur); cur = line; } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

/** 4000 belgidan uzun matnni e'lonlarga bo'lish: avval bo'sh qator / "---" bo'yicha, keyin qator bo'yicha. */
export function splitPosts(text, limit = POST_LIMIT) {
  const clean = String(text).trim();
  if (clean.length <= limit) return [clean];
  const blocks = clean.split(/\n\s*(?:-{3,}|_{3,}|={3,})?\s*\n/).map(s => s.trim()).filter(Boolean);
  const parts = [];
  let cur = '';
  const push = s => { if (s.trim()) parts.push(s.trim()); };
  for (const block of blocks) {
    if (block.length > limit) {
      push(cur); cur = '';
      for (const line of block.split('\n')) {
        if ((cur + '\n' + line).length > limit) { push(cur); cur = ''; }
        if (line.length > limit) { for (let i = 0; i < line.length; i += limit) push(line.slice(i, i + limit)); }
        else cur = cur ? cur + '\n' + line : line;
      }
      continue;
    }
    if (cur && (cur + '\n\n' + block).length > limit) { push(cur); cur = block; }
    else cur = cur ? cur + '\n\n' + block : block;
  }
  push(cur);
  return parts;
}

function advice(a) {
  if (a.level === 'high') return "❗ Pul to'lamang, karta raqami, SMS kod yoki pasportingizni bermang.";
  if (a.level === 'medium') return "Ehtiyot bo'ling: kompaniya nomi, STIR va litsenziyasini tekshiring.";
  return "Jiddiy xavf topilmadi. Baribir ish uchun oldindan pul to'lamang.";
}

/** Bitta e'lon tahlili — HTML qatorlar (disclaimer'siz). */
export function reportLines(a, title) {
  const lines = [];
  if (title) lines.push(`<b>${escapeHtml(title)}</b>`);
  lines.push(`${DOT[a.level]} <b>${escapeHtml(A.LEVEL_TEXT[a.level])}</b>: ${a.score}/100 · shaffoflik ${a.transparency.score}/100`);
  const facts = [`📍 ${escapeHtml(a.region)}`, `💼 ${escapeHtml(a.profession)}`];
  if (a.salary) facts.push(`💰 ${a.salary.min === a.salary.max ? a.salary.max : `${a.salary.min}–${a.salary.max}`} mln so'm`);
  lines.push(facts.join(' · '));
  if (a.trafficking) lines.push("🚨 <b>Odam savdosi belgisi bor</b>");
  const reasons = a.scam.slice().sort((x, y) => y.weight - x.weight).slice(0, 4);
  if (reasons.length) {
    lines.push('', '<b>Asosiy sabablar:</b>');
    reasons.forEach(r => lines.push(`⚠️ ${escapeHtml(r.label)} — «${escapeHtml(r.match)}»`));
  }
  if (a.discrimination.length) {
    lines.push('', '<b>Kamsitish:</b>');
    a.discrimination.forEach(d => lines.push(`⚖️ ${escapeHtml(d.label)} — «${escapeHtml(d.match)}»`));
  }
  lines.push('', `<b>Tavsiya:</b> ${escapeHtml(advice(a))}`);
  return lines;
}

export const COMMANDS = ['start', 'help', 'check', 'stats'];
export const AI_PER_HOUR_DEFAULT = 5;

export const HELP = [
  '🛡️ <b>IshQalqon</b> — ish e\'lonlarini firibgarlik, odam savdosi va kamsitish belgilariga tekshiradi.',
  '',
  '<b>Buyruqlar:</b>',
  '/check — e\'lonni tekshirish: <code>/check matn</code> yoki /check dan keyin matnni yuboring',
  '/stats — siz tekshirgan e\'lonlar statistikasi',
  '/help — yordam',
  '',
  'E\'lonni shunchaki yuborsangiz yoki kanaldan forward qilsangiz ham qoidalar bilan tekshiraman. AI chuqur tahlil faqat /check bilan ishlaydi.',
  'Guruhda: <code>/check matn</code> yoki e\'longa javob (reply) qilib /check yozing.',
  'O\'zbek (lotin, kirill) va rus tilini tushunaman.',
  'E\'lon matni saqlanmaydi. Statistikada faqat natija va anonim (xeshlangan) identifikator saqlanadi.'
].join('\n');

/**
 * deps: {
 *   send(chatId, html): Promise, store: { record, get },
 *   ai?: { enabled, analyze(text) },
 *   aiLimiter?: foydalanuvchi bo'yicha AI limiti (standart: soatiga 5 ta),
 *   aiDaily?: { take(), remaining(), limit } — umumiy kunlik AI limiti,
 *   botUsername?: guruhda "/check@BoshqaBot" ni e'tiborsiz qoldirish uchun,
 *   now?: () => Date
 * }
 * Natija: handle(message) — Telegram "message" obyektini qayta ishlaydi.
 */
export function createBot(deps) {
  const { send, store } = deps;
  const now = deps.now || (() => new Date());
  const aiLimiter = deps.aiLimiter || createWindowLimiter({ max: AI_PER_HOUR_DEFAULT, windowMs: 3600_000 });
  const awaiting = new Map(); // chatId -> vaqt: /check dan keyin matn kutilmoqda (faqat shaxsiy chatda)
  const AWAIT_MS = 10 * 60 * 1000;
  const aiOn = () => Boolean(deps.ai && deps.ai.enabled);

  // Har bir javob 4096 dan oshmaydigan bo'laklarda; disclaimer doim oxirgi bo'lakda
  async function reply(chatId, lines) {
    for (const chunk of splitMessage([...lines, '', DISCLAIMER_HTML].join('\n'))) await send(chatId, chunk);
  }

  // AI faqat /check orqali; foydalanuvchi va kunlik limitdan o'tsa. Qoidalar tahlili limitsiz.
  async function runAi(msg, text) {
    const chatId = msg.chat.id;
    const userId = msg.from ? msg.from.id : chatId;
    if (deps.aiDaily && deps.aiDaily.remaining() <= 0) {
      return reply(chatId, [`⏳ Bugungi AI tahlil limiti (${deps.aiDaily.limit} ta) tugadi. Qoidalar tahlili yuqorida — u limitsiz ishlaydi.`]);
    }
    if (!aiLimiter.take(userId)) {
      const mins = Math.max(1, Math.ceil(aiLimiter.retryAfterMs(userId) / 60000));
      return reply(chatId, [`⏳ AI tahlil limiti: soatiga ${aiLimiter.max} ta. Keyingisi taxminan ${mins} daqiqadan keyin. Qoidalar tahlili yuqorida — u limitsiz ishlaydi.`]);
    }
    if (deps.aiDaily) deps.aiDaily.take();
    try {
      const ai = await deps.ai.analyze(text);
      const extra = ['🤖 <b>AI xulosasi</b>', escapeHtml(ai.summary)];
      if (ai.recommended_questions_for_applicant.length) {
        extra.push('', "<b>Ish beruvchidan so'rang:</b>", ...ai.recommended_questions_for_applicant.map(q => `• ${escapeHtml(q)}`));
      }
      if (ai.improved_non_discriminatory_version) extra.push('', '<b>Kamsitishsiz variant:</b>', escapeHtml(ai.improved_non_discriminatory_version));
      await reply(chatId, extra);
    } catch (e) {
      logError('bot-ai', e);
      await reply(chatId, ['🤖 AI tahlil hozir bajarilmadi. Qoidalar tahlili yuqorida o\'z kuchida.']);
    }
  }

  async function check(msg, text, opts = {}) {
    const chatId = msg.chat.id;
    const clean = String(text || '').trim();
    if (clean.length < 20) return reply(chatId, ["Iltimos, vakansiyaning to'liq matnini yuboring (kamida 20 belgi)."]);
    const parts = splitPosts(clean);
    const analyses = parts.map(p => A.analyze(p));
    const lines = [];
    if (parts.length > 1) {
      const worst = analyses.reduce((w, a, i) => (a.score > analyses[w].score ? i : w), 0);
      lines.push(`📄 Matn uzun (${clean.length} belgi), ${parts.length} ta bo'lakka bo'lib tekshirildi. Eng xavflisi: ${worst + 1}-bo'lak.`, '');
      analyses.forEach((a, i) => lines.push(...reportLines(a, `${i + 1}-bo'lak`), ''));
    } else {
      lines.push(...reportLines(analyses[0]));
    }
    const top = analyses.reduce((w, a) => (a.score > w.score ? a : w));
    const reason = top.scam.slice().sort((x, y) => y.weight - x.weight)[0];
    store.record(msg.from ? msg.from.id : chatId, { at: now().toISOString(), level: top.level, score: top.score, reason: reason ? reason.label : (top.discrimination[0] ? 'Kamsitish: ' + top.discrimination[0].label : null) });
    if (!opts.viaCommand && aiOn()) lines.push('', "🤖 AI chuqur tahlil uchun e'lonni <code>/check</code> bilan yuboring.");
    await reply(chatId, lines);
    if (opts.viaCommand && aiOn()) {
      if (parts.length === 1) await runAi(msg, clean);
      else await reply(chatId, ["🤖 AI tahlil faqat bitta e'lon uchun ishlaydi — eng xavfli bo'lakni alohida /check bilan yuboring."]);
    }
  }

  async function stats(msg) {
    const s = store.get(msg.from ? msg.from.id : msg.chat.id);
    if (!s.total) return reply(msg.chat.id, ["Siz hali e'lon tekshirmadingiz. /check bilan boshlang."]);
    const lines = [
      '📊 <b>Sizning statistikangiz</b>',
      `Tekshirilgan e'lonlar: <b>${s.total}</b>`,
      `Xavfli deb topilgan (o'rtacha yoki yuqori): <b>${s.risky}</b>`,
      '',
      `<b>Oxirgi ${s.last.length} ta tekshiruv:</b>`,
      ...s.last.map(e => `${DOT[e.level] || '•'} ${escapeHtml(e.at.slice(0, 16).replace('T', ' '))} — ${escapeHtml(A.LEVEL_TEXT[e.level] || e.level)} (${e.score})${e.reason ? ': ' + escapeHtml(e.reason) : ''}`)
    ];
    return reply(msg.chat.id, lines);
  }

  return async function handle(msg) {
    if (!msg || !msg.chat) return;
    const chatId = msg.chat.id;
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
    const text = msg.text || msg.caption || '';
    const cmd = text.match(/^\/([a-z]+)(?:@(\w+))?(?:\s+([\s\S]*))?$/i);
    if (cmd) {
      const name = cmd[1].toLowerCase(), target = cmd[2], arg = (cmd[3] || '').trim();
      // Guruhda "/check@BoshqaBot" — boshqa botga yozilgan
      if (target && deps.botUsername && target.toLowerCase() !== deps.botUsername.toLowerCase()) return;
      if (!COMMANDS.includes(name)) return isGroup ? undefined : reply(chatId, ["Noma'lum buyruq.", '', HELP]);
      if (name === 'start' || name === 'help') return reply(chatId, [HELP]);
      if (name === 'stats') return stats(msg);
      // /check: matn buyruq bilan birga, yoki e'longa javob (reply) sifatida
      const replied = msg.reply_to_message && (msg.reply_to_message.text || msg.reply_to_message.caption);
      if (arg || replied) return check(msg, arg || replied, { viaCommand: true });
      if (isGroup) return reply(chatId, ["Guruhda: <code>/check e'lon matni</code> yoki e'longa javob (reply) qilib /check yozing."]);
      awaiting.set(chatId, Date.now());
      return reply(chatId, ["📝 E'lon matnini yuboring yoki kanaldan forward qiling."]);
    }
    // Guruhdagi oddiy xabarlarga javob berilmaydi (faqat buyruqlarga)
    if (isGroup) return;
    for (const [id, t] of awaiting) if (Date.now() - t > AWAIT_MS) awaiting.delete(id);
    const viaCommand = awaiting.delete(chatId); // /check dan keyingi xabar — AI ruxsat etiladi
    if (!text.trim()) return reply(chatId, ["Faqat matnli e'lonlarni tekshira olaman. Rasm bo'lsa, matnini nusxalab yuboring."]);
    return check(msg, text, { viaCommand });
  };
}
