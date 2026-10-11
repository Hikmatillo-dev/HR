// AI chaqiruvlari uchun limitlar.
//   createDailyQuota — jarayon bo'yicha kunlik umumiy limit (UTC sana). Hisob faylda saqlanadi, shuning uchun
//                      qayta ishga tushirish limitni nolga tushirmaydi.
//   createWindowLimiter — kalit (IP yoki foydalanuvchi) bo'yicha sirpanuvchi oyna limiti, xotirada.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_DAILY_LIMIT = 200;

/** IQ_AI_DAILY_LIMIT: butun son ≥ 0 (0 — AI to'liq o'chiq). Noto'g'ri qiymat → standart. */
export function parseLimit(value, fallback) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

export function createDailyQuota({ limit, file, now = () => new Date() }) {
  let state = { date: '', count: 0 };
  if (file && existsSync(file)) {
    try { state = JSON.parse(readFileSync(file, 'utf8')); } catch { /* buzilgan fayl — noldan */ }
  }
  const today = () => now().toISOString().slice(0, 10);
  const save = () => {
    if (!file) return;
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file + '.tmp', JSON.stringify(state));
    renameSync(file + '.tmp', file);
  };
  const roll = () => { if (state.date !== today()) state = { date: today(), count: 0 }; };
  return {
    limit,
    /** Bitta AI chaqiruvini band qilish. Limit tugagan bo'lsa false. */
    take() {
      roll();
      if (state.count >= limit) return false;
      state.count++;
      save();
      return true;
    },
    remaining() { roll(); return Math.max(0, limit - state.count); }
  };
}

export function createWindowLimiter({ max, windowMs, now = () => Date.now() }) {
  const hits = new Map();
  const prune = key => {
    const t = now();
    const list = (hits.get(key) || []).filter(x => t - x < windowMs);
    if (list.length) hits.set(key, list); else hits.delete(key);
    return list;
  };
  return {
    max, windowMs,
    /** Joy bo'lsa band qiladi va true qaytaradi; bo'lmasa false. */
    take(key) {
      const list = prune(key);
      if (list.length >= max) return false;
      list.push(now()); hits.set(key, list);
      return true;
    },
    /** Keyingi joy qachon bo'shashi (ms). */
    retryAfterMs(key) {
      const list = prune(key);
      return list.length < max ? 0 : Math.max(0, windowMs - (now() - list[0]));
    },
    cleanup() { for (const key of [...hits.keys()]) prune(key); },
    size() { return hits.size; }
  };
}
