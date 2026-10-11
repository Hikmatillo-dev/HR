// Umumiy yordamchilar: barcha UI modullari window.IQ orqali foydalanadi
(function () {
  'use strict';
  const IQ = window.IQ = window.IQ || {};

  IQ.$ = s => document.querySelector(s);
  IQ.$$ = s => Array.from(document.querySelectorAll(s));
  IQ.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  IQ.DOT = { high: '🔴', medium: '🟡', low: '🟢' };
  IQ.pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
  IQ.round1 = v => Math.round(v * 10) / 10;
  IQ.avg = list => (list.length ? list.reduce((s, x) => s + x, 0) / list.length : 0);
  IQ.salaryText = s => (!s ? '—' : s.min === s.max ? `${s.max}` : `${s.min}–${s.max}`);

  // Mavzu ranglari CSS o'zgaruvchilaridan olinadi (yorug'/qorong'i rejimga mos)
  IQ.color = name => getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
  IQ.levelColor = lvl => IQ.color({ high: 'critical', medium: 'warning', low: 'good' }[lvl]);

  // Valyuta kurslari holati (config/currency.js)
  IQ.rateInfo = () => {
    const C = window.IQCurrency;
    if (!C) return null;
    const r = C.rates, st = C.status();
    const fmt = n => Number(n).toLocaleString('ru-RU').replace(/,/g, ' ');
    return {
      approximate: st.approximate,
      text: `1 $ = ${fmt(r.USD)}, 1 € = ${fmt(r.EUR)}, 1 ₽ = ${fmt(r.RUB)} so'm (${r.updated}; ${r.source})`
    };
  };

  IQ.toast = msg => {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  };

  IQ.copy = async (text, msg) => {
    try { await navigator.clipboard.writeText(text); IQ.toast(msg || 'Nusxalandi'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove(); IQ.toast(msg || 'Nusxalandi');
    }
  };

  IQ.store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* xususiy rejim */ } }
  };

  // Topilgan iboralarni asl matnda belgilash (registr va tutuq belgisi farqiga chidamli)
  IQ.highlight = (text, marks) => {
    const ranges = [];
    for (const { phrase, cls } of marks) {
      if (!phrase || phrase.length < 2) continue;
      const pattern = phrase.trim().split('').map(ch => {
        if (/\s/.test(ch)) return '\\s+';
        if (ch === "'") return "['‘’ʻʼ`´]";
        return ch.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
      }).join('');
      let re;
      try { re = new RegExp(pattern, 'giu'); } catch (e) { continue; }
      let m;
      while ((m = re.exec(text))) {
        ranges.push([m.index, m.index + m[0].length, cls]);
        if (!m[0].length) re.lastIndex++;
      }
    }
    ranges.sort((a, b) => a[0] - b[0]);
    let out = '', pos = 0;
    for (const [s, e, cls] of ranges) {
      if (s < pos) continue; // ustma-ust tushganlarni tashlab ketamiz
      out += IQ.esc(text.slice(pos, s)) + `<mark class="${cls}">` + IQ.esc(text.slice(s, e)) + '</mark>';
      pos = e;
    }
    return out + IQ.esc(text.slice(pos));
  };
})();
