// /stats uchun foydalanuvchi statistikasi. Telegram user_id ochiq saqlanmaydi: faqat SHA-256(tuz + ":" + user_id).
// Tuz (salt) bo'lmasa, oddiy SHA-256(user_id) ni barcha mumkin bo'lgan id'lar bo'yicha sanab qayta tiklash mumkin —
// shuning uchun tuz .env (IQ_BOT_HASH_SALT) dan olinadi yoki birinchi ishga tushishda tasodifiy yaratiladi.
// E'lon matni saqlanmaydi: faqat sana, xavf darajasi, ball va asosiy sabab.
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const HISTORY = 5;

export function hashUserId(userId, salt) {
  if (!salt) throw new Error('hashUserId: salt kerak');
  return createHash('sha256').update(`${salt}:${userId}`).digest('hex');
}

function loadSalt(dir) {
  if (process.env.IQ_BOT_HASH_SALT) return process.env.IQ_BOT_HASH_SALT;
  const file = path.join(dir, 'bot-salt');
  if (existsSync(file)) return readFileSync(file, 'utf8').trim();
  const salt = randomBytes(32).toString('hex');
  writeFileSync(file, salt + '\n', { mode: 0o600 });
  return salt;
}

export function createStore(dir) {
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'bot-stats.json');
  const salt = loadSalt(dir);
  let data = {};
  if (existsSync(file)) {
    try { data = JSON.parse(readFileSync(file, 'utf8')); } catch { data = {}; }
  }
  // Atomar yozish: avval vaqtinchalik fayl, keyin rename — jarayon uzilsa ham fayl buzilmaydi
  const save = () => {
    const tmp = file + '.tmp';
    writeFileSync(tmp, JSON.stringify(data, null, 1), { mode: 0o600 });
    renameSync(tmp, file);
  };

  return {
    file,
    record(userId, entry) {
      const key = hashUserId(userId, salt);
      const u = data[key] || (data[key] = { total: 0, risky: 0, last: [] });
      u.total++;
      if (entry.level !== 'low') u.risky++;
      u.last = [{ at: entry.at, level: entry.level, score: entry.score, reason: entry.reason || null }, ...u.last].slice(0, HISTORY);
      save();
    },
    get(userId) {
      return data[hashUserId(userId, salt)] || { total: 0, risky: 0, last: [] };
    }
  };
}
