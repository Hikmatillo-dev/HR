// IshQalqon Telegram boti: e'lon matnini (yoki kanaldan forward qilingan xabarni) yuboring — bot tekshiradi.
// Ishga tushirish: TELEGRAM_BOT_TOKEN=... node bot.mjs   (token @BotFather dan olinadi)
// AI xulosa uchun qo'shimcha: ANTHROPIC_API_KEY=...
import { aiEnabled, aiAnalyze } from './lib/ai.mjs';
import './js/analyzer.js';

const { analyze, LEVEL_TEXT } = globalThis.IshQalqon;
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN o\'rnatilmagan. @BotFather dan token oling.');
  process.exit(1);
}
const API = `https://api.telegram.org/bot${TOKEN}`;
const DOT = { high: '🔴', medium: '🟡', low: '🟢' };

async function tg(method, body) {
  const res = await fetch(`${API}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
}

const escHtml = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function report(a) {
  const lines = [
    `${DOT[a.level]} <b>${LEVEL_TEXT[a.level]}</b>: ${a.score}/100`,
    `📋 Shaffoflik: ${a.transparency.score}/100`,
    `📍 ${escHtml(a.region)} · 💼 ${escHtml(a.profession)}${a.salary ? ` · 💰 ${a.salary.min === a.salary.max ? a.salary.max : `${a.salary.min}–${a.salary.max}`} mln so'm` : ''}`
  ];
  if (a.scam.length) lines.push('', '<b>Xavf belgilari:</b>', ...a.scam.map(s => `⚠️ ${escHtml(s.label)}`));
  if (a.discrimination.length) lines.push('', '<b>Kamsitish:</b>', ...a.discrimination.map(d => `⚖️ ${escHtml(d.label)}`));
  if (a.trust.length) lines.push('', `✅ ${a.trust.map(t => escHtml(t.label)).join(' · ')}`);
  lines.push('', a.level === 'high'
    ? "❗ Pul to'lamang va shaxsiy ma'lumotlaringizni yubormang."
    : a.level === 'medium' ? "Ehtiyot bo'ling: kompaniyani va litsenziyani tekshiring." : "Jiddiy xavf topilmadi. Baribir oldindan pul to'lamang.");
  return lines.join('\n');
}

const HELP = "🛡️ <b>IshQalqon</b>\n\nVakansiya matnini yuboring yoki kanaldan forward qiling. Men uni firibgarlik va kamsitish belgilari bo'yicha tekshiraman.\n\nO'zbek (lotin/kirill) va rus tilidagi e'lonlarni tushunaman.";

async function handle(msg) {
  const text = msg.text || msg.caption || '';
  if (!text || text === '/start' || text === '/help') return tg('sendMessage', { chat_id: msg.chat.id, text: HELP, parse_mode: 'HTML' });
  if (text.length < 20) return tg('sendMessage', { chat_id: msg.chat.id, text: "Iltimos, vakansiyaning to'liq matnini yuboring." });

  const a = analyze(text);
  await tg('sendMessage', { chat_id: msg.chat.id, text: report(a), parse_mode: 'HTML', reply_to_message_id: msg.message_id });

  if (aiEnabled) {
    try {
      const ai = await aiAnalyze(text);
      const extra = [`🤖 <b>AI xulosasi</b>\n${escHtml(ai.summary)}`, `💡 ${escHtml(ai.advice)}`];
      if (ai.neutral_rewrite) extra.push(`\n<b>Kamsitishsiz variant:</b>\n${escHtml(ai.neutral_rewrite)}`);
      await tg('sendMessage', { chat_id: msg.chat.id, text: extra.join('\n'), parse_mode: 'HTML' });
    } catch (e) {
      console.error('AI:', e.message);
    }
  }
}

let offset = 0;
console.log(`Bot ishga tushdi (AI: ${aiEnabled ? 'yoqilgan' : "o'chirilgan"})`);
for (;;) {
  try {
    const updates = await tg('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
    for (const u of updates) {
      offset = u.update_id + 1;
      if (u.message) handle(u.message).catch(e => console.error('Xabar:', e.message));
    }
  } catch (e) {
    console.error('Ulanish:', e.message);
    await new Promise(r => setTimeout(r, 3000));
  }
}
