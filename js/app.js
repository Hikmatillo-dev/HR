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

  // Shaxsiy ma'lumot (telefon, karta, JSHSHIR, pasport, email, t.me, @username) tahlil va saqlashdan OLDIN yashiriladi
  function redactItems(items) {
    const totals = {};
    const out = items.map(it => {
      const { text, counts } = window.IQPII.redact(it.text);
      Object.entries(counts).forEach(([k, n]) => { totals[k] = (totals[k] || 0) + n; });
      return Object.assign({}, it, { text });
    });
    return { items: out, totals };
  }
  const redactedSummary = t => Object.entries(t || {}).filter(([, n]) => n).map(([k, n]) => `${n} ${window.IQPII.LABELS[k]}`).join(', ');

  function loadSavedReal() {
    const fromFile = window.REAL_VACANCIES || [];
    if (fromFile.length) return { items: redactItems(fromFile).items, stats: null, name: 'js/real-data.js', source: 'file' };
    const saved = IQ.store.get(STORE_KEY, null);
    if (!(saved && Array.isArray(saved.items) && saved.items.length)) return null;
    // Eski versiya tozalanmagan matn saqlagan bo'lishi mumkin — yuklashda tozalab, qayta yozamiz
    const clean = redactItems(saved.items);
    if (Object.values(clean.totals).some(Boolean)) {
      saved.items = clean.items;
      saved.redacted = Object.assign({}, saved.redacted);
      Object.entries(clean.totals).forEach(([k, n]) => { saved.redacted[k] = (saved.redacted[k] || 0) + n; });
      IQ.store.set(STORE_KEY, saved);
    }
    return Object.assign(saved, { source: 'storage' });
  }

  // Real namuna: js/test-set-v3.js dagi qo'lda belgilangan real Telegram e'lonlari (shaxsiy ma'lumot yashirilgan).
  // Foydalanuvchi o'z eksportini yuklamaguncha "Real ma'lumot" rejimi shu namunani ko'rsatadi.
  function loadSample() {
    const v3 = window.TEST_SET_V3 || [];
    if (!v3.length) return null;
    const items = v3.map(c => ({
      id: c.id, text: c.text,
      channel: String(c.source_channel || '').replace(/^https?:\/\/t\.me\//, '@'),
      date: ((c.reviewer_notes || '').match(/\d{4}-\d{2}-\d{2}/) || [''])[0]
    }));
    const channels = new Set(items.map(i => i.channel)).size;
    return { items, stats: null, name: `real namuna: ${items.length} ta e'lon, ${channels} ta kanal`, source: 'sample', channels };
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
      ${redactedSummary(real.redacted) ? `<p class="muted" style="margin:8px 0 0;font-size:.82rem">🔒 Shaxsiy ma'lumot yashirildi: ${esc(redactedSummary(real.redacted))}. Brauzerda faqat yashirilgan matn saqlanadi.</p>` : ''}
      <p class="muted" style="margin:8px 0 0;font-size:.82rem">${s.notVacancy} ta xabar vakansiyaga o'xshamagani yoki juda qisqaligi uchun tahlilga kiritilmadi (reklama, salomlashish va h.k.).</p>`;
  }

  function render() {
    const demo = state.mode === 'demo';
    const real = state.real || state.sample;
    const empty = !demo && !real;
    document.body.classList.toggle('demo-mode', demo);
    document.body.classList.toggle('no-data', empty);
    IQ.$$('.mode-switch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    $('#demoBadge').hidden = !demo;
    $('#btnClearReal').hidden = !(real && real.source === 'storage') || demo;
    document.body.classList.toggle('sample-mode', !demo && !!real && real.source === 'sample');

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
      : real.source === 'sample'
        ? `📌 <b>Real namuna:</b> ${real.channels} ta Telegram kanalidan qo'lda tekshirilgan ${data.length} ta haqiqiy e'lon (telefon va shaxsiy ma'lumotlar yashirilgan). Namuna kichik — o'z kanalingiz eksportini yuklasangiz, tahlil shu ma'lumotda qayta quriladi.`
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
      const imported = window.IQImporter.importFiles(contents, A.fingerprint);
      const { stats } = imported;
      if (!imported.items.length) throw new Error(`${stats.messages} ta xabar o'qildi, lekin vakansiyaga o'xshash e'lon topilmadi`);
      const { items, totals } = redactItems(imported.items);
      const real = { items, stats, redacted: totals, name: files.map(f => f.name).join(', '), savedAt: Date.now() };
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
  $('#btnSampleUpload').addEventListener('click', () => $('#fileInput').click());
  $('#btnCareersUpload').addEventListener('click', () => $('#fileInput').click());
  $('#btnCsv').addEventListener('click', () => IQ.exportCsv());
  $('#btnPrint').addEventListener('click', () => window.print());

  // ---------- Telefon menyusi ----------
  const topbar = document.querySelector('.topbar');
  const setMenu = open => { topbar.classList.toggle('open', open); $('#menuBtn').setAttribute('aria-expanded', String(open)); };
  $('#menuBtn').addEventListener('click', () => setMenu(!topbar.classList.contains('open')));
  IQ.$$('#mainNav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // ---------- Mavzu ----------
  $('#themeBtn').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('iq-theme', root.dataset.theme); } catch (err) { /* e'tiborsiz */ }
    IQ.redrawCharts();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => IQ.redrawCharts());

  // ---------- Kurslar va rasmiy manbalar (config/) ----------
  const rate = IQ.rateInfo();
  if (rate) {
    $('#rateNote').innerHTML = `💱 Xorijiy valyutadagi maosh so'mga o'girilgan: ${esc(rate.text)}${rate.approximate ? ' <span class="badge-warn">Kurslar taxminiy</span>' : ''}`;
  }
  $('#officialSources').innerHTML = (window.IQ_OFFICIAL_SOURCES || []).map(s => `<li>
    <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a>${s.verified ? '<span class="badge-ok">tasdiqlangan</span>' : `<span class="badge-warn" title="${esc(s.evidence)}">tekshirilmagan</span>`}
    <br><span class="muted" style="font-size:.85rem">${esc(s.purpose)}${s.former_name ? ` (avvalgi nomi: ${esc(s.former_name)})` : ''}</span></li>`).join('');

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

  // ---------- Aniqlik: v2 (qo'lda) → v3 (real) → izoh ----------
  const pctx = x => (x === null || x === undefined ? '—' : Math.round(x * 100) + '%');
  const kpi = (v, l) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`;
  // Bir xil to'rtta asosiy ko'rsatkich: boshlang'ich va hozirgi natijani yonma-yon solishtirish uchun
  const kpis = m => [
    kpi(pctx(m.accuracy), 'Umumiy aniqlik'),
    kpi(pctx(m.risk_recall), "Xavfli e'lonlarni topish"),
    kpi(pctx(m.false_positive_rate), "Halol e'lonni xavfli deyish (FPR)"),
    kpi(pctx(m.discrimination_recall), 'Kamsitishni topish'),
    kpi(pctx(m.trafficking_recall), 'Odam savdosini topish'),
    kpi(pctx(m.reason_accuracy), 'Sabablar aniqligi')
  ].join('');
  const fromEval = r => ({
    accuracy: r.risk.accuracy, risk_recall: r.risk.recall, false_positive_rate: r.risk.fpr,
    discrimination_recall: r.discrimination.recall, trafficking_recall: r.trafficking.recall, reason_accuracy: r.flagRecall
  });

  function renderMetrics() {
    if (!window.IQEval) return;
    const E = window.IQEval;
    const v2 = (window.TEST_SET || []).filter(c => c.id.startsWith('v2'));
    const b = window.TEST_BASELINE;
    $('#v2Note').innerHTML = `${v2.length} ta e'lon: kirill, rus, aralash yozuv, odam savdosi va xato signal tuzoqlari. Loyiha muallifi yozgan, <b>real ma'lumot emas</b>.`;
    $('#v2Baseline').innerHTML = b ? kpis({
      accuracy: b.accuracy, risk_recall: b.riskRecall, false_positive_rate: b.fpr,
      discrimination_recall: b.discRecall, trafficking_recall: b.traffRecall, reason_accuracy: b.flagRecall
    }) : '';
    if (v2.length) $('#v2Current').innerHTML = kpis(fromEval(E.evaluate(v2, A.analyze)));

    const v3 = window.TEST_SET_V3 || [];
    const v3b = window.V3_BASELINE;
    const box = $('#v3Block');
    if (!v3.length) {
      box.innerHTML = `<div class="v3-empty">📭 <b>Real e'lonlar hali qo'shilmagan.</b> 50 ta real Telegram e'loni qo'lda belgilanib <code>js/test-set-v3.js</code> ga qo'shilgach, birinchi natija qoidalar o'zgartirilmasdan qayd qilinadi va shu yerda ko'rsatiladi.</div>`;
      return;
    }
    const current = E.evaluate(v3, A.analyze);
    const channels = new Set(v3.map(c => c.source_channel)).size;
    box.innerHTML = `<p class="muted metrics-note">${v3.length} ta real e'lon, ${channels} ta kanaldan. Telefon va shaxsiy ma'lumotlar yashirilgan.</p>
      <div class="metrics-pair">
        <div><h5>Boshlang'ich: qoidalar o'zgartirilmasdan${v3b ? ` (${esc(v3b.created_at.slice(0, 10))}, ${v3b.n} ta)` : ''}</h5>
          <div class="metrics">${v3b ? kpis(v3b.metrics) : `<p class="muted" style="grid-column:1/-1;margin:0">Hali qayd qilinmagan: <code>npm run eval:v3-baseline</code></p>`}</div></div>
        <div><h5>Hozirgi (jonli hisoblanadi)</h5><div class="metrics">${kpis(fromEval(current))}</div></div>
      </div>`;
  }
  renderMetrics();

  // ---------- AI holati: faqat server.mjs orqali va kalit sozlangan bo'lsa ----------
  IQ.ai = { state: 'checking' };
  if (location.protocol.startsWith('http')) {
    fetch('/api/health').then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status)))).then(h => {
      IQ.ai = h.ai ? { state: 'on', maxChars: h.maxChars } : { state: 'off', reason: h.reason || "AI tahlil faollashtirilmagan: ANTHROPIC_API_KEY yoki GEMINI_API_KEY sozlanmagan." };
    }).catch(() => {
      // Statik hosting (GitHub Pages): qoidalar tahlili to'liq ishlaydi, AI uchun server kerak
      IQ.ai = { state: 'off', reason: location.hostname.endsWith('github.io')
        ? "Bu onlayn versiya: qoidalar asosidagi tahlil to'liq ishlaydi. AI chuqur tahlil uchun loyiha serveri (npm run start:env + API kalit) kerak."
        : "AI tahlil mavjud emas: sayt AI serverisiz ishlayapti (npm start bilan ishga tushiring)." };
    }).finally(() => IQ.onAiStatus());
  } else {
    IQ.ai = { state: 'off', reason: "AI tahlil mavjud emas: sayt fayl sifatida ochilgan. AI uchun `npm start` bilan ishga tushiring va .env ga ANTHROPIC_API_KEY yoki GEMINI_API_KEY yozing." };
  }

  // ---------- Boshlang'ich holat: faqat real ma'lumot, bo'lmasa — bo'sh holat ----------
  state.real = loadSavedReal();
  state.sample = loadSample();
  render();
})();
