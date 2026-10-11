// Ilovani ishga tushirish: ma'lumot manbai, fayl yuklash, mavzu, AI, xavfsizlik ro'yxati, aniqlik
(function () {
  'use strict';
  const IQ = window.IQ, A = window.IshQalqon, { $, esc } = IQ;

  const withAnalysis = list => list.map((v, i) => Object.assign({ id: v.id ?? i + 1 }, v, { a: A.analyze(v.text) }));

  // ---------- Ma'lumot rejimlari ----------
  // real: Telegram eksportidan (fayl yuklash, saqlangan ma'lumot yoki js/real-data.js)
  // demo: sintetik namuna — faqat "DEMO" belgisi bilan ko'rsatiladi, hech qachon sukut bo'yicha emas
  const STORE_KEY = 'iq-real-data';
  const state = { mode: 'real', real: null }; // real: { items, stats, name, savedAt, source }

  function loadSavedReal() {
    const fromFile = window.REAL_VACANCIES || [];
    if (fromFile.length) return { items: fromFile, stats: null, name: 'js/real-data.js', source: 'file' };
    const saved = IQ.store.get(STORE_KEY, null);
    return saved && Array.isArray(saved.items) && saved.items.length ? Object.assign(saved, { source: 'storage' }) : null;
  }

  function levelCounts(data) {
    const c = { high: 0, medium: 0, low: 0, disc: 0 };
    data.forEach(d => { c[d.a.level]++; if (d.a.discrimination.length) c.disc++; });
    return c;
  }

  function renderImportReport(real, data) {
    const box = $('#importReport');
    if (!real || !real.stats) { box.hidden = true; return; }
    const s = real.stats, c = levelCounts(data);
    const kpi = (v, l) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`;
    box.hidden = false;
    box.innerHTML = `<b>📥 Import hisoboti</b> · ${esc(real.name)}${real.savedAt ? ` · ${esc(new Date(real.savedAt).toLocaleString('uz-UZ'))}` : ''}
      <div class="kpis">
        ${kpi(s.messages, "Fayldagi xabarlar")}
        ${kpi(s.vacancyLike, "Vakansiyaga o'xshash")}
        ${kpi(s.duplicates, 'Takroriy (olib tashlandi)')}
        ${kpi(data.length, "Tahlil qilingan noyob e'lonlar")}
        ${kpi(`${c.high} / ${c.medium} / ${c.low}`, '🔴 xavfli / 🟡 shubhali / 🟢 past xavf')}
        ${kpi(c.disc, '⚖️ Kamsituvchi')}
      </div>
      <p class="muted" style="margin:8px 0 0;font-size:.82rem">${s.notVacancy} ta xabar vakansiyaga o'xshamagani yoki juda qisqaligi uchun tahlilga kiritilmadi (reklama, salomlashish va h.k.).</p>`;
  }

  function render() {
    const demo = state.mode === 'demo';
    const real = state.real;
    const empty = !demo && !real;
    document.body.classList.toggle('demo-mode', demo);
    document.body.classList.toggle('no-data', empty);
    IQ.$$('.mode-switch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    $('#demoBadge').hidden = !demo;
    $('#btnClearReal').hidden = !(real && real.source === 'storage') || demo;

    if (empty) {
      $('#dataNote').textContent = '';
      $('#importReport').hidden = true;
      $('#heroStats').innerHTML = `<div><b>—</b>Real ma'lumot hali yuklanmagan</div><div><b>${A.SCAM_RULES.length + 1}</b>firibgarlik belgisi tekshiriladi</div><div><b>${A.DISCRIMINATION_RULES.length}</b>kamsitish turi aniqlanadi</div>`;
      IQ.clearDashboard();
      return;
    }
    const list = demo ? window.SAMPLE_VACANCIES : real.items;
    const data = withAnalysis(list);
    $('#dataNote').innerHTML = demo
      ? `⚠️ <b>Demo rejim:</b> ${data.length} ta <b>sintetik</b> e'lon. Bu raqamlar haqiqiy bozorni aks ettirmaydi va faqat interfeysni ko'rsatish uchun.`
      : `✅ <b>Real ma'lumot:</b> ${esc(real.name)} — ${data.length} ta noyob e'lon. ${real.source === 'storage' ? "Ma'lumot faqat shu brauzerda saqlangan, serverga yuborilmagan." : ''}`;
    renderImportReport(demo ? null : real, data);
    IQ.renderDashboard(data);
  }

  function setMode(mode) { state.mode = mode; render(); }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    try {
      const contents = await Promise.all(files.map(async f => ({ name: f.name, content: await f.text() })));
      const { items, stats } = window.IQImporter.importFiles(contents, A.fingerprint);
      if (!items.length) throw new Error(`${stats.messages} ta xabar o'qildi, lekin vakansiyaga o'xshash e'lon topilmadi`);
      const real = { items, stats, name: files.map(f => f.name).join(', '), savedAt: Date.now() };
      // Faqat shu brauzerda saqlanadi; hajm katta bo'lsa saqlanmaydi, lekin tahlil ishlayveradi
      let saved = false;
      try { localStorage.setItem(STORE_KEY, JSON.stringify(real)); saved = true; } catch (err) { /* hajm yoki xususiy rejim */ }
      state.real = Object.assign(real, { source: saved ? 'storage' : 'upload' });
      setMode('real');
      IQ.toast(`${items.length} ta noyob e'lon tahlil qilindi${saved ? '' : " (brauzerda saqlanmadi: hajm katta)"}`);
      $('#tahlil').scrollIntoView();
    } catch (err) {
      IQ.toast('Xatolik: ' + err.message);
    }
  }

  $('#btnUpload').addEventListener('click', () => $('#fileInput').click());
  $('#btnUploadEmpty').addEventListener('click', () => $('#fileInput').click());
  $('#btnDemoEmpty').addEventListener('click', () => setMode('demo'));
  $('#fileInput').addEventListener('change', async e => { await handleFiles(e.target.files); e.target.value = ''; });
  IQ.$$('.mode-switch button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('#btnClearReal').addEventListener('click', () => {
    if (!confirm("Brauzerda saqlangan real ma'lumot o'chirilsinmi?")) return;
    try { localStorage.removeItem(STORE_KEY); } catch (err) { /* e'tiborsiz */ }
    state.real = null; setMode('real');
  });
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

  // ---------- Boshlang'ich holat: faqat real ma'lumot, bo'lmasa — bo'sh holat ----------
  state.real = loadSavedReal();
  render();
})();
