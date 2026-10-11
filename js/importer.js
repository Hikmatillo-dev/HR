// Telegram eksporti (JSON), CSV va TXT fayllarini vakansiyalar ro'yxatiga aylantirish.
// Brauzerda (fayl yuklash) va Node.js'da (testlar) bir xil ishlaydi. Tarmoqqa hech narsa yubormaydi.
(function (global) {
  'use strict';

  // Vakansiyaga o'xshash xabar. Kengroq olingan: firibgar e'lonlar ko'pincha "kerak" demaydi,
  // balki "ish", "daromad", "viza", "oyiga $..." kabi so'zlar bilan yoziladi — ularni tashlab yubormaslik kerak.
  const VACANCY_RE = new RegExp([
    'kerak', 'vakansiya', 'ish(ga|chi|lar|i)?\\b', 'ish\\s+haqi', 'talab', 'maosh', 'oylik', 'oyiga', 'kuniga', 'daromad',
    'viza', 'xorij', 'tajriba', 'smena',
    'вакансия', 'требуется', 'зарплат', 'работ', 'доход', 'заработ', 'опыт', 'виза',
    'керак', 'маош', 'иш(га|чи|лар)?(?![\\p{L}])', 'ойига', 'даромад', 'тажриба'
  ].join('|'), 'iu');
  const MIN_LENGTH = 40;

  function messageText(m) {
    const t = Array.isArray(m.text)
      ? m.text.map(p => (typeof p === 'string' ? p : (p && p.text) || '')).join('')
      : String(m.text || '');
    return t.trim();
  }

  function parseCsv(s) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) { if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',' || c === ';') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c !== '\r') cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  // Bitta fayldan "xom" yozuvlar: { text, date, channel }
  function rawRecords(name, content) {
    if (/\.json$/i.test(name)) {
      let data;
      try { data = JSON.parse(content); } catch (e) { throw new Error(`${name}: JSON fayl buzilgan yoki Telegram eksporti emas`); }
      const chats = data.messages ? [data] : ((data.chats && data.chats.list) || []);
      if (!chats.length) throw new Error(`${name}: ichida xabarlar topilmadi (Telegram Desktop → Export chat history → JSON kerak)`);
      const out = [];
      for (const chat of chats) {
        for (const m of chat.messages || []) {
          if (m.type !== 'message') continue;
          out.push({ text: messageText(m), date: String(m.date || '').slice(0, 10), channel: chat.name || 'Telegram' });
        }
      }
      return out;
    }
    if (/\.csv$/i.test(name)) {
      const rows = parseCsv(content);
      const head = (rows.shift() || []).map(h => h.toLowerCase().trim());
      const ti = head.findIndex(h => /matn|text|текст/.test(h));
      const di = head.findIndex(h => /sana|date|дата/.test(h));
      const ci = head.findIndex(h => /kanal|channel|канал/.test(h));
      if (ti < 0) throw new Error(`${name}: CSV faylda 'matn' yoki 'text' ustuni topilmadi`);
      return rows.map(r => ({ text: (r[ti] || '').trim(), date: di >= 0 ? r[di] || '' : '', channel: ci >= 0 ? r[ci] || name : name }));
    }
    // Oddiy matn: e'lonlar bo'sh qator yoki "---" bilan ajratilgan
    return content.split(/\n\s*(?:-{3,}\s*)?\n/).map(text => ({ text: text.trim(), date: '', channel: name }));
  }

  /**
   * files: [{ name, content }]
   * Natija: { items: [{id, text, date, channel}], stats }
   * stats.messages     — fayllardagi barcha matnli xabarlar
   * stats.notVacancy   — qisqa yoki vakansiyaga o'xshamagan xabarlar (reklama, e'lon emas)
   * stats.vacancyLike  — vakansiyaga o'xshash xabarlar
   * stats.duplicates   — takroriy (bir xil matn qayta joylangan) e'lonlar
   * stats.unique       — tahlilga kiradigan noyob vakansiyalar
   */
  function importFiles(files, fingerprint) {
    fingerprint = fingerprint || (global.IshQalqon && global.IshQalqon.fingerprint);
    if (!fingerprint) throw new Error('analyzer.js yuklanmagan');
    const seen = new Set(), items = [];
    const stats = { files: files.length, messages: 0, notVacancy: 0, vacancyLike: 0, duplicates: 0, unique: 0 };
    for (const f of files) {
      for (const r of rawRecords(f.name, f.content)) {
        if (!r.text) continue;
        stats.messages++;
        if (r.text.length < MIN_LENGTH || !VACANCY_RE.test(r.text)) { stats.notVacancy++; continue; }
        stats.vacancyLike++;
        const key = fingerprint(r.text);
        if (seen.has(key)) { stats.duplicates++; continue; }
        seen.add(key);
        items.push({ id: items.length + 1, text: r.text, date: r.date, channel: r.channel });
      }
    }
    stats.unique = items.length;
    return { items, stats };
  }

  global.IQImporter = { importFiles, parseCsv, VACANCY_RE, MIN_LENGTH };
})(typeof window !== 'undefined' ? window : globalThis);
