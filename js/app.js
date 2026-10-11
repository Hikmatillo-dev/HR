(function () {
  'use strict';
  const A = window.IshQalqon;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const COLORS = { high: '#dc2626', medium: '#d97706', low: '#16a34a', primary: '#2563eb', purple: '#7c3aed' };
  const DOT = { high: '🔴', medium: '🟡', low: '🟢' };

  const real = window.REAL_VACANCIES || [];
  const isReal = real.length > 0;
  const source = isReal ? real : window.SAMPLE_VACANCIES;
  const DATA = source.map(v => Object.assign({}, v, { a: A.analyze(v.text) }));

  // ---------- 1. Tekshirish ----------
  const EXAMPLES = {
    scam: "🇰🇷 KOREYAGA ISH! Viza 100% kafolat! Oyiga $2500 dan. Tajriba shart emas.\nHujjatlarni rasmiylashtirish uchun to'lov 500$. Joylar cheklangan, shoshiling!\nBatafsil lichkada.",
    disc: "Ofisga menejer kerak. Toshkent, Chilonzor.\nTalablar: faqat qizlar, 20-27 yosh, ko'rinishi chiroyli, turmushga chiqmagan.\nMaosh: 4 mln so'm\n📞 +998 90 123 45 67",
    ok: "📢 «Smart Code» IT kompaniyasi Samarqanddagi filialiga Frontend dasturchi kerak.\n\nTalablar: React, TypeScript, 1 yillik tajriba.\nMaosh: 10–15 mln so'm\nIsh vaqti: 9:00–18:00, rasmiy ishga joylashtirish.\n\n📞 +998 91 555 44 33"
  };

  function renderResult(text) {
    const box = $('#result');
    if (!text.trim()) { box.className = 'result empty'; box.textContent = 'Natija shu yerda chiqadi'; return; }
    const a = A.analyze(text);
    const items = [];
    a.scam.sort((x, y) => y.weight - x.weight).forEach(r => items.push(
      `<li><b>⚠️ ${esc(r.label)} <small>(+${r.weight})</small></b>${esc(r.detail)}<br><small>Topilgan ibora: <mark>${esc(r.match)}</mark></small></li>`));
    a.discrimination.forEach(d => items.push(
      `<li class="disc"><b>⚖️ Kamsitish: ${esc(d.label)}</b><small>Topilgan ibora: <mark>${esc(d.match)}</mark>. Mehnat kodeksi ishga qabul qilishda kamsitishni taqiqlaydi.</small></li>`));
    a.transparency.forEach(t => items.push(`<li class="info"><b>ℹ️ ${esc(t.label)}</b><small>Shaffof vakansiyada maosh va aloqa ma'lumoti ochiq ko'rsatiladi.</small></li>`));
    if (!items.length) items.push('<li class="ok"><b>✅ Shubhali belgilar topilmadi</b><small>Baribir kompaniyani tekshiring va hech qachon oldindan pul to\'lamang.</small></li>');

    const advice = a.level === 'high'
      ? "Bu e'longa pul to'lamang va shaxsiy ma'lumotlaringizni yubormang."
      : a.level === 'medium' ? "Ehtiyot bo'ling: kompaniya nomi, manzili va litsenziyasini tekshiring." : "Jiddiy xavf belgisi yo'q.";
    box.className = 'result';
    box.innerHTML = `
      <div class="verdict">
        <div class="gauge" style="--p:${a.score};--c:${COLORS[a.level]}"><span>${a.score}</span></div>
        <div>
          <div class="lvl lvl-${a.level}">${DOT[a.level]} ${A.LEVEL_TEXT[a.level]}</div>
          <div class="sub">${advice}</div>
          <div class="facts">
            <span class="tag">📍 ${esc(a.region)}</span>
            <span class="tag">💼 ${esc(a.category)}</span>
            ${a.salary ? `<span class="tag">💰 ${a.salary.min === a.salary.max ? a.salary.max : a.salary.min + '–' + a.salary.max} mln so'm/oy</span>` : ''}
            ${a.discrimination.length ? `<span class="tag disc">⚖️ ${a.discrimination.length} ta kamsitish belgisi</span>` : ''}
          </div>
        </div>
      </div>
      <ul class="reasons">${items.join('')}</ul>`;
  }

  let timer;
  $('#input').addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => renderResult(e.target.value), 250); });
  $('#btnCheck').addEventListener('click', () => renderResult($('#input').value));
  $('#btnClear').addEventListener('click', () => { $('#input').value = ''; renderResult(''); });
  document.querySelectorAll('[data-example]').forEach(b => b.addEventListener('click', () => {
    $('#input').value = EXAMPLES[b.dataset.example];
    renderResult($('#input').value);
  }));

  // ---------- 2. Statistika ----------
  const total = DATA.length;
  const count = f => DATA.filter(f).length;
  const pct = n => Math.round((n / total) * 100);
  const high = count(d => d.a.level === 'high');
  const medium = count(d => d.a.level === 'medium');
  const disc = count(d => d.a.discrimination.length);
  const noSalary = count(d => !d.a.salary);

  $('#heroStats').innerHTML = `
    <div><b>${total}</b>tahlil qilingan e'lon</div>
    <div><b>${pct(high)}%</b>yuqori xavfli</div>
    <div><b>${pct(disc)}%</b>kamsituvchi talab bilan</div>`;

  $('#dataNote').innerHTML = isReal
    ? `Haqiqiy ma'lumot: Telegram kanallaridan yig'ilgan <b>${total}</b> ta e'lon.`
    : `⚠️ Hozir <b>namunaviy (sintetik)</b> ma'lumot ko'rsatilmoqda (${total} ta e'lon). Haqiqiy ma'lumot uchun <code>tools/telegram_export.py</code> skriptini ishga tushiring.`;

  $('#kpis').innerHTML = [
    [total, "Jami e'lonlar"],
    [high, `🔴 Yuqori xavfli (${pct(high)}%)`],
    [medium, `🟡 O'rtacha xavfli (${pct(medium)}%)`],
    [disc, `⚖️ Kamsituvchi (${pct(disc)}%)`],
    [noSalary, `Maosh ko'rsatilmagan (${pct(noSalary)}%)`]
  ].map(([v, l]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join('');

  const tally = (list, key) => list.reduce((m, x) => { const k = key(x); m[k] = (m[k] || 0) + 1; return m; }, {});
  const signalCounts = {};
  DATA.forEach(d => d.a.scam.forEach(s => { signalCounts[s.label] = (signalCounts[s.label] || 0) + 1; }));
  const discCounts = {};
  DATA.forEach(d => d.a.discrimination.forEach(s => { discCounts[s.label] = (discCounts[s.label] || 0) + 1; }));

  const regions = A.REGION_NAMES.concat(["Noma'lum"]).filter(r => DATA.some(d => d.a.region === r));
  const byRegion = lvl => regions.map(r => count(d => d.a.region === r && d.a.level === lvl));

  const salaryByCat = {};
  DATA.filter(d => d.a.level === 'low' && d.a.salary).forEach(d => {
    const c = d.a.category; const avg = (d.a.salary.min + d.a.salary.max) / 2;
    (salaryByCat[c] = salaryByCat[c] || []).push(avg);
  });
  const salaryRows = Object.entries(salaryByCat)
    .map(([c, v]) => [c, Math.round(v.reduce((s, x) => s + x, 0) / v.length * 10) / 10])
    .sort((x, y) => y[1] - x[1]);

  const days = [...new Set(DATA.map(d => d.date).filter(Boolean))].sort().slice(-30);

  if (window.Chart) {
    Chart.defaults.font.family = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    Chart.defaults.color = '#475569';
    const sorted = obj => Object.entries(obj).sort((x, y) => y[1] - x[1]);
    const noLegend = { plugins: { legend: { display: false } } };

    new Chart($('#chLevels'), {
      type: 'doughnut',
      data: { labels: ['Yuqori xavf', "O'rtacha xavf", 'Past xavf'], datasets: [{ data: [high, medium, total - high - medium], backgroundColor: [COLORS.high, COLORS.medium, COLORS.low] }] },
      options: { plugins: { legend: { position: 'bottom' } } }
    });
    const sig = sorted(signalCounts);
    new Chart($('#chSignals'), {
      type: 'bar',
      data: { labels: sig.map(x => x[0]), datasets: [{ data: sig.map(x => x[1]), backgroundColor: COLORS.high }] },
      options: Object.assign({ indexAxis: 'y' }, noLegend)
    });
    new Chart($('#chRegions'), {
      type: 'bar',
      data: {
        labels: regions, datasets: [
          { label: 'Past xavf', data: byRegion('low'), backgroundColor: COLORS.low },
          { label: "O'rtacha", data: byRegion('medium'), backgroundColor: COLORS.medium },
          { label: 'Yuqori xavf', data: byRegion('high'), backgroundColor: COLORS.high }
        ]
      },
      options: { scales: { x: { stacked: true }, y: { stacked: true } }, plugins: { legend: { position: 'bottom' } } }
    });
    const dc = sorted(discCounts);
    new Chart($('#chDisc'), {
      type: 'bar',
      data: { labels: dc.map(x => x[0]), datasets: [{ data: dc.map(x => x[1]), backgroundColor: COLORS.purple }] },
      options: Object.assign({ indexAxis: 'y' }, noLegend)
    });
    new Chart($('#chSalary'), {
      type: 'bar',
      data: { labels: salaryRows.map(x => x[0]), datasets: [{ data: salaryRows.map(x => x[1]), backgroundColor: COLORS.primary }] },
      options: noLegend
    });
    new Chart($('#chDaily'), {
      type: 'line',
      data: {
        labels: days, datasets: [
          { label: "Jami e'lonlar", data: days.map(day => count(d => d.date === day)), borderColor: COLORS.primary, backgroundColor: COLORS.primary, tension: .3 },
          { label: 'Yuqori xavfli', data: days.map(day => count(d => d.date === day && d.a.level === 'high')), borderColor: COLORS.high, backgroundColor: COLORS.high, tension: .3 }
        ]
      },
      options: { plugins: { legend: { position: 'bottom' } } }
    });
  } else {
    document.querySelectorAll('.chart-box canvas').forEach(c => { c.outerHTML = '<p class="muted">Grafik kutubxonasi yuklanmadi.</p>'; });
  }

  // Avtomatik xulosalar
  const riskByRegion = regions.map(r => {
    const n = count(d => d.a.region === r);
    return [r, n, n ? count(d => d.a.region === r && d.a.level === 'high') / n : 0];
  }).filter(x => x[1] >= 5).sort((x, y) => y[2] - x[2]);
  const topSignal = Object.entries(signalCounts).sort((x, y) => y[1] - x[1])[0];
  const topDisc = Object.entries(discCounts).sort((x, y) => y[1] - x[1])[0];
  const abroad = DATA.filter(d => d.a.region === 'Xorij');
  const abroadHigh = abroad.filter(d => d.a.level === 'high').length;
  const ins = [];
  ins.push(`Har <b>${Math.max(1, Math.round(total / Math.max(high, 1)))}</b> ta e'londan taxminan bittasi yuqori xavfli.`);
  if (topSignal) ins.push(`Eng ko'p uchraydigan firibgarlik belgisi: <b>${esc(topSignal[0])}</b> (${topSignal[1]} ta e'londa).`);
  if (abroad.length) ins.push(`Xorijga ish takliflarining <b>${Math.round(abroadHigh / abroad.length * 100)}%</b>i yuqori xavfli.`);
  if (riskByRegion.length) ins.push(`Xavfli e'lonlar ulushi eng yuqori hudud: <b>${esc(riskByRegion[0][0])}</b> (${Math.round(riskByRegion[0][2] * 100)}%).`);
  if (topDisc) ins.push(`Eng keng tarqalgan kamsitish turi: <b>${esc(topDisc[0])}</b> (${topDisc[1]} ta e'londa).`);
  ins.push(`E'lonlarning <b>${pct(noSalary)}%</b>ida maosh ko'rsatilmagan.`);
  $('#insights').innerHTML = `<h3>🔎 Avtomatik xulosalar</h3><ul>${ins.map(x => `<li>${x}</li>`).join('')}</ul>`;

  // ---------- 3. Jadval ----------
  const fRegion = $('#fRegion');
  regions.forEach(r => fRegion.insertAdjacentHTML('beforeend', `<option>${esc(r)}</option>`));
  let limit = 25;
  function renderRows() {
    const q = $('#fSearch').value.trim().toLowerCase();
    const lvl = $('#fLevel').value, reg = fRegion.value, onlyDisc = $('#fDisc').checked;
    const list = DATA.filter(d =>
      (!lvl || d.a.level === lvl) && (!reg || d.a.region === reg) && (!onlyDisc || d.a.discrimination.length) &&
      (!q || (d.text + ' ' + (d.channel || '')).toLowerCase().includes(q))
    ).sort((x, y) => (y.date || '').localeCompare(x.date || '') || y.a.score - x.a.score);
    $('#rows').innerHTML = list.slice(0, limit).map(d => `
      <tr data-id="${d.id}">
        <td>${esc(d.date || '')}</td><td>${esc(d.channel || '')}</td>
        <td class="text"><div>${esc(d.text)}</div></td>
        <td>${esc(d.a.region)}</td><td>${esc(d.a.category)}</td>
        <td><span class="tag ${d.a.level}">${DOT[d.a.level]} ${d.a.score}</span>${d.a.discrimination.length ? ' <span class="tag disc">⚖️</span>' : ''}</td>
      </tr>`).join('');
    $('#count').textContent = `${Math.min(limit, list.length)} / ${list.length} ta ko'rsatilmoqda`;
    $('#btnMore').style.display = list.length > limit ? '' : 'none';
  }
  ['#fSearch', '#fLevel', '#fRegion', '#fDisc'].forEach(s => $(s).addEventListener('input', () => { limit = 25; renderRows(); }));
  $('#btnMore').addEventListener('click', () => { limit += 25; renderRows(); });
  $('#rows').addEventListener('click', e => {
    const tr = e.target.closest('tr'); if (!tr) return;
    const d = DATA.find(x => String(x.id) === tr.dataset.id); if (!d) return;
    $('#input').value = d.text; renderResult(d.text);
    $('#tekshir').scrollIntoView();
  });
  renderRows();
})();
