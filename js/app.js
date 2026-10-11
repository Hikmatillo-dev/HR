// Ilovani ishga tushirish: ma'lumot manbai, fayl yuklash, mavzu, AI, xavfsizlik ro'yxati, aniqlik
(function () {
  'use strict';
  const IQ = window.IQ, A = window.IshQalqon, { $, esc } = IQ;

  const withAnalysis = list => list.map((v, i) => Object.assign({ id: v.id ?? i + 1 }, v, { a: A.analyze(v.text) }));

  // ---------- Ma'lumot manbai ----------
  function useData(list, kind, name) {
    const bar = $('#sourceBar');
    bar.classList.toggle('sample', kind === 'sample');
    $('#btnSample').hidden = kind === 'sample' || !(window.REAL_VACANCIES || []).length && kind === 'real';
    $('#dataNote').innerHTML = {
      sample: `⚠️ Hozir <b>namunaviy (sintetik)</b> ma'lumot ko'rsatilmoqda (${list.length} ta e'lon). Haqiqiy tahlil uchun Telegram kanal eksportini (<code>result.json</code>) yuklang.`,
      real: `✅ Haqiqiy ma'lumot: Telegram kanallaridan yig'ilgan <b>${list.length}</b> ta e'lon.`,
      upload: `✅ Yuklangan fayl: <b>${esc(name)}</b> — ${list.length} ta e'lon tahlil qilindi.`
    }[kind];
    IQ.renderDashboard(withAnalysis(list));
  }

  const VACANCY_RE = /kerak|vakansiya|ishga\s+taklif|talab|maosh|oylik|ish\s+haqi|вакансия|требуется|зарплата|работа|керак|маош/i;

  function messageText(m) {
    return (Array.isArray(m.text) ? m.text.map(p => (typeof p === 'string' ? p : p.text || '')).join('') : String(m.text || '')).trim();
  }

  // Telegram Desktop JSON, CSV (matn ustuni bilan) yoki oddiy matn (bo'sh qator / --- bilan ajratilgan)
  function parseFile(name, content) {
    if (/\.json$/i.test(name)) {
      const data = JSON.parse(content);
      const chats = data.messages ? [data] : (data.chats?.list || []);
      const seen = new Set(), out = [];
      for (const chat of chats) {
        for (const m of chat.messages || []) {
          if (m.type !== 'message') continue;
          const text = messageText(m);
          const key = A.fingerprint(text);
          if (text.length < 40 || !VACANCY_RE.test(text) || seen.has(key)) continue;
          seen.add(key);
          out.push({ text, date: String(m.date || '').slice(0, 10), channel: chat.name || 'Telegram' });
        }
      }
      return out;
    }
    if (/\.csv$/i.test(name)) {
      const rows = parseCsv(content);
      const head = rows.shift().map(h => h.toLowerCase().trim());
      const ti = head.findIndex(h => /matn|text|текст/.test(h));
      const di = head.findIndex(h => /sana|date|дата/.test(h));
      const ci = head.findIndex(h => /kanal|channel|канал/.test(h));
      if (ti < 0) throw new Error("CSV faylda 'matn' yoki 'text' ustuni topilmadi");
      return rows.filter(r => r[ti] && r[ti].trim().length > 20)
        .map(r => ({ text: r[ti], date: di >= 0 ? r[di] : '', channel: ci >= 0 ? r[ci] : name }));
    }
    return content.split(/\n\s*(?:-{3,}\s*)?\n/).map(s => s.trim()).filter(s => s.length > 20)
      .map(text => ({ text, date: '', channel: name }));
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

  $('#btnUpload').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      let list = [];
      for (const f of files) list = list.concat(parseFile(f.name, await f.text()));
      if (!list.length) throw new Error("Faylda vakansiyaga o'xshash e'lon topilmadi");
      useData(list, 'upload', files.map(f => f.name).join(', '));
      $('#btnSample').hidden = false;
      IQ.toast(`${list.length} ta e'lon yuklandi`);
    } catch (err) {
      IQ.toast('Xatolik: ' + err.message);
    }
    e.target.value = '';
  });
  $('#btnSample').addEventListener('click', () => useData(window.SAMPLE_VACANCIES, 'sample'));
  $('#btnCsv').addEventListener('click', () => IQ.exportCsv());
  $('#btnPrint').addEventListener('click', () => window.print());

  // ---------- Mavzu ----------
  $('#themeBtn').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('iq-theme', root.dataset.theme); } catch (err) { /* e'tiborsiz */ }
    IQ.redrawCharts();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => IQ.redrawCharts());

  // ---------- Xorijga ketishdan oldin tekshiruv ro'yxati ----------
  const TODO = [
    "Agentlik litsenziyasini rasmiy manbadan tekshirdim",
    "Ish beruvchi kompaniya nomi va manzilini bilaman",
    "Mehnat shartnomasini o'z tilimda o'qib chiqdim",
    "Maosh, ish vaqti va yashash sharoiti shartnomada yozilgan",
    "Hech kimga oldindan pul to'lamadim",
    "Pasportimni hech kimga topshirmayman",
    "Vizam turini bilaman (ishchi viza, turistik emas)",
    "Konsullik va favqulodda telefon raqamlarini yozib oldim",
    "Yaqinlarimga manzil va aloqa ma'lumotlarini qoldirdim",
    "Pasport va shartnomaning nusxasini yaqinlarimda qoldirdim"
  ];
  const done = IQ.store.get('iq-todo', []);
  function renderTodo() {
    $('#todo').innerHTML = TODO.map((t, i) => `<li><label><input type="checkbox" data-i="${i}" ${done.includes(i) ? 'checked' : ''}> ${esc(t)}</label></li>`).join('');
    $('#todoBar').style.width = `${(done.length / TODO.length) * 100}%`;
  }
  $('#todo').addEventListener('change', e => {
    const i = Number(e.target.dataset.i);
    const k = done.indexOf(i);
    if (e.target.checked && k < 0) done.push(i); else if (!e.target.checked && k >= 0) done.splice(k, 1);
    IQ.store.set('iq-todo', done);
    $('#todoBar').style.width = `${(done.length / TODO.length) * 100}%`;
  });
  renderTodo();

  // ---------- Aniqlik (test to'plami asosida, brauzerda jonli hisoblanadi) ----------
  function renderMetrics() {
    const cases = window.TEST_SET || [];
    if (!cases.length) return;
    const m = (pred, truth) => {
      let tp = 0, fp = 0, fn = 0, tn = 0;
      pred.forEach((p, i) => { if (p && truth[i]) tp++; else if (p) fp++; else if (truth[i]) fn++; else tn++; });
      const pr = tp / (tp + fp || 1), rc = tp / (tp + fn || 1);
      return { pr, rc, f1: 2 * pr * rc / (pr + rc || 1), acc: (tp + tn) / pred.length };
    };
    const res = cases.map(c => A.analyze(c.text));
    const s = m(res.map(a => a.level !== 'low'), cases.map(c => c.scam));
    const d = m(res.map(a => a.discrimination.length > 0), cases.map(c => c.disc));
    const p = x => Math.round(x * 100) + '%';
    $('#metricsNote').innerHTML = `Ko'rsatkichlar qo'lda belgilangan <b>${cases.length}</b> ta test e'loni bo'yicha hozir, brauzerning o'zida hisoblandi (<code>js/test-set.js</code>). Haqiqiy ma'lumotda natija farq qilishi mumkin, shuning uchun test to'plami doimiy kengaytiriladi.`;
    $('#metrics').innerHTML = [
      [p(s.pr), 'Firibgarlik: aniqlik (precision)'], [p(s.rc), "Firibgarlik: to'liqlik (recall)"],
      [p(d.pr), 'Kamsitish: aniqlik'], [p(d.rc), "Kamsitish: to'liqlik"],
      [A.SCAM_RULES.length + 1, 'Firibgarlik belgilari'], [A.DISCRIMINATION_RULES.length, 'Kamsitish turlari']
    ].map(([v, l]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join('');
  }
  renderMetrics();

  // ---------- AI (faqat server.mjs orqali ishga tushirilganda) ----------
  if (location.protocol.startsWith('http')) {
    fetch('/api/health').then(r => (r.ok ? r.json() : null)).then(h => {
      if (h && h.ai) { IQ.aiAvailable = true; IQ.onAiReady(); }
    }).catch(() => { /* statik rejim: AI yo'q */ });
  }

  // ---------- Boshlang'ich ma'lumot ----------
  const real = window.REAL_VACANCIES || [];
  useData(real.length ? real : window.SAMPLE_VACANCIES, real.length ? 'real' : 'sample');
})();
