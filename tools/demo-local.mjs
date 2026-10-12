// Lokal oflayn demo: npm run demo:local  →  http://127.0.0.1:3000 (PORT bilan o'zgartiriladi)
// API kalit kerak emas va ishlatilmaydi: .env o'qilmaydi, muhitdagi AI kalitlari va bot tokeni serverga berilmaydi.
// Natija: qoidaviy tahlil, import, bozor tahlili va grafiklar to'liq ishlaydi; "🤖 AI chuqur tahlil" tugmasi o'chiq,
// yonida sababi yoziladi. Server faqat shu kompyuterdan (127.0.0.1) ochiladi. Internet kerak emas.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env, IQ_SKIP_DOTENV: '1', HOST: '127.0.0.1' };
for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'GEMINI_API_KEY', 'IQ_AI_PROVIDER', 'TELEGRAM_BOT_TOKEN']) delete env[k];

console.log([
  'IshQalqon — lokal oflayn demo (AI kalitsiz)',
  `  Brauzerda oching: http://127.0.0.1:${Number(env.PORT) || 3000}`,
  "  AI tugmasi ataylab o'chiq: asosiy tahlil qoidalar bilan, internetsiz ishlaydi.",
  "  Demo eksport: namuna/telegram-export-namuna.json — SINTETIK fayl, real kanal emas.",
  "  To'xtatish: Ctrl+C",
  ''
].join('\n'));

const child = spawn(process.execPath, ['server.mjs'], { cwd: ROOT, env, stdio: 'inherit' });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code, signal) => process.exit(signal ? 0 : code ?? 0));
