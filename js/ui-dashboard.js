// 2–5-bo'limlar: bozor tahlili, kasblar, kanallar reytingi, vakansiyalar bazasi
(function () {
  'use strict';
  const IQ = window.IQ, A = window.IshQalqon, { $, esc, pct, avg, round1 } = IQ;

  let DATA = [];
  const charts = {};
  let mapMetric = 'count';
  let limit = 25;

  // Xarita uchun hududlarning taxminiy geografik joylashuvi [ustun, qator]
  const TILE_POS = {
    "Qoraqalpog'iston": [1, 1], 'Xorazm': [2, 2], 'Navoiy': [3, 1], 'Buxoro': [3, 2], 'Samarqand': [4, 2],
    'Jizzax': [5, 2], 'Toshkent shahri': [6, 1], 'Toshkent viloyati': [7, 1], 'Sirdaryo': [6, 2], 'Namangan': [8, 1],
    "Farg'ona": [8, 2], 'Andijon': [9, 2], 'Qashqadaryo': [4, 3], 'Surxondaryo': [5, 4], 'Xorij': [9, 4]
  };

  const by = (list, key) => list.reduce((m, x) => { const k = key(x); (m[k] = m[k] || []).push(x); return m; }, {});
  const count = (list, f) => list.reduce((n, x) => n + (f(x) ? 1 : 0), 0);
  const sortedEntries = obj => Object.entries(obj).sort((x, y) => y[1] - x[1]);
  const midSalary = d => (d.a.salary.min + d.a.salary.max) / 2;
  const reliable = list => list.filter(d => d.a.level === 'low');
  // "Kasblar" bo'limi ishonchli e'lonlardan quriladi: ular shundan kam bo'lsa, grafik o'rniga tushuntirish chiqadi
  const CAREERS_MIN = 30;

  function chart(id, config) {
    if (charts[id]) charts[id].destroy();
    if (!window.Chart) return;
    charts[id] = new Chart($('#' + id), config);
  }

  function baseOptions(extra) {
    const grid = IQ.color('grid'), ink = IQ.color('text-2');
    const axis = { grid: { color: grid }, border: { color: grid }, ticks: { color: ink } };
    return Object.assign({
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false, labels: { color: ink, usePointStyle: true, boxWidth: 8 } } },
      scales: { x: Object.assign({}, axis), y: Object.assign({}, axis) }
    }, extra || {});
  }

  // Tor ekranda uzun nomlarni qisqartiramiz (to'liq nomi tooltipda ko'rinadi)
  function shortLabel(value) {
    const label = this.getLabelForValue(value);
    const max = window.innerWidth < 600 ? 16 : 36;
    return label.length > max ? label.slice(0, max - 1) + '…' : label;
  }

  function hbar(id, labels, values, color, unit) {
    chart(id, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: color, borderRadius: 4, maxBarThickness: 18 }] },
      options: baseOptions({
        indexAxis: 'y',
        scales: {
          x: { beginAtZero: true, grid: { color: IQ.color('grid') }, border: { display: false }, ticks: { color: IQ.color('text-2') } },
          y: { grid: { display: false }, border: { color: IQ.color('grid') }, ticks: { color: IQ.color('text-2'), callback: shortLabel } }
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.x}${unit || ''}` } } }
      })
    });
  }

  // ---------- 2. Bozor tahlili ----------
  function renderMarket() {
    const total = DATA.length;
    const high = count(DATA, d => d.a.level === 'high');
    const medium = count(DATA, d => d.a.level === 'medium');
    const disc = count(DATA, d => d.a.discrimination.length);
    const noSalary = count(DATA, d => !d.a.salary);
    const transp = Math.round(avg(DATA.map(d => d.a.transparency.score)));
    const dupes = count(DATA, d => d.dupes > 1);

    // Bosh sahifa demo raqamlarini ko'rsatmaydi; nomi manbaga mos: real namuna, sintetik namuna yoki yuklangan eksport
    const heroLabel = { sample: "tahlil qilingan real e'lon", synthetic: "sintetik namunadagi e'lon", upload: "yuklangan e'lon tahlil qilindi" }[document.body.dataset.source] || "tahlil qilingan e'lon";
    if (!document.body.classList.contains('demo-mode')) $('#heroStats').innerHTML = `
      <div><b>${total}</b>${heroLabel}</div>
      <div><b>${pct(high + medium, total)}%</b>xavfli yoki shubhali</div>
      <div><b>${pct(disc, total)}%</b>kamsituvchi talab bilan</div>
      <div><b>${transp}/100</b>o'rtacha shaffoflik</div>`;

    $('#kpis').innerHTML = [
      [total, "Jami e'lonlar"],
      [high, `🔴 Yuqori xavfli · ${pct(high, total)}%`],
      [medium, `🟡 O'rtacha xavfli · ${pct(medium, total)}%`],
      [disc, `⚖️ Kamsituvchi · ${pct(disc, total)}%`],
      [`${pct(noSalary, total)}%`, "Maosh ko'rsatilmagan"],
      [`${transp}`, "O'rtacha shaffoflik (0–100)"],
      [dupes, "Takroriy tarqatilgan e'lonlar"]
    ].map(([v, l]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join('');

    chart('chLevels', {
      type: 'doughnut',
      data: {
        labels: ['Yuqori xavf', "O'rtacha xavf", 'Past xavf'],
        datasets: [{ data: [high, medium, total - high - medium], backgroundColor: ['high', 'medium', 'low'].map(IQ.levelColor), borderColor: IQ.color('surface'), borderWidth: 2 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { color: IQ.color('text-2'), usePointStyle: true, boxWidth: 8 } },
          tooltip: { callbacks: { label: c => ` ${c.parsed} ta (${pct(c.parsed, total)}%)` } }
        }
      }
    });

    const signals = {};
    DATA.forEach(d => d.a.scam.forEach(s => { signals[s.label] = (signals[s.label] || 0) + 1; }));
    const sig = sortedEntries(signals);
    hbar('chSignals', sig.map(x => x[0]), sig.map(x => x[1]), IQ.color('critical'), " ta e'lon");

    const days = [...new Set(DATA.map(d => d.date).filter(Boolean))].sort().slice(-30);
    const byDay = by(DATA, d => d.date);
    chart('chDaily', {
      type: 'line',
      data: {
        labels: days, datasets: [
          { label: "Jami e'lonlar", data: days.map(x => (byDay[x] || []).length), borderColor: IQ.color('primary'), backgroundColor: IQ.color('primary'), borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: .3 },
          { label: 'Yuqori xavfli', data: days.map(x => count(byDay[x] || [], d => d.a.level === 'high')), borderColor: IQ.color('critical'), backgroundColor: IQ.color('critical'), borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: .3 }
        ]
      },
      options: baseOptions({
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { display: false }, border: { color: IQ.color('grid') }, ticks: { color: IQ.color('text-2'), maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
          y: { beginAtZero: true, grid: { color: IQ.color('grid') }, border: { display: false }, ticks: { color: IQ.color('text-2') } }
        },
        plugins: { legend: { display: true, position: 'bottom', labels: { color: IQ.color('text-2'), usePointStyle: true, boxWidth: 8 } } }
      })
    });

    const discTypes = {};
    DATA.forEach(d => d.a.discrimination.forEach(x => { discTypes[x.label] = (discTypes[x.label] || 0) + 1; }));
    const dt = sortedEntries(discTypes);
    hbar('chDisc', dt.map(x => x[0]), dt.map(x => x[1]), IQ.color('violet'), " ta e'lon");

    const missing = {};
    DATA.forEach(d => d.a.transparency.checks.forEach(c => { if (!c.ok) missing[c.label] = (missing[c.label] || 0) + 1; }));
    const ms = sortedEntries(missing).map(([k, v]) => [k.replace(" ko'rsatilgan", '').replace(' bor', '').replace(' aniq yozilgan', ''), pct(v, total)]);
    hbar('chTransp', ms.map(x => x[0] + ' yo\'q'), ms.map(x => x[1]), IQ.color('primary'), "% e'lonlarda");

    renderMap();
    renderInsights({ total, high, disc, noSalary });
  }

  function renderMap() {
    const groups = by(DATA, d => d.a.region);
    const metrics = {};
    for (const region of Object.keys(TILE_POS)) {
      const list = groups[region] || [];
      const paid = reliable(list).filter(d => d.a.salary);
      metrics[region] = {
        n: list.length,
        count: list.length,
        // Hero va avtomatik xulosalar bilan bir xil ta'rif: "xavfli yoki shubhali" = yuqori + o'rtacha xavf
        risk: list.length ? pct(count(list, d => d.a.level !== 'low'), list.length) : null,
        disc: list.length ? pct(count(list, d => d.a.discrimination.length), list.length) : null,
        salary: paid.length ? round1(avg(paid.map(midSalary))) : null
      };
    }
    const values = Object.values(metrics).map(m => m[mapMetric]).filter(v => v !== null);
    const max = Math.max(1, ...values), min = Math.min(...values, max);
    const steps = [0, 1, 2, 3, 4, 5].map(i => IQ.color('seq-' + i));
    const unit = { count: " ta", risk: '%', disc: '%', salary: ' mln' }[mapMetric];
    const ink = hex => {
      const h = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
      return (0.299 * r + 0.587 * g + 0.114 * b) < 140;
    };
    const active = $('#fRegion').value;

    $('#tilemap').innerHTML = Object.entries(TILE_POS).map(([region, [c, r]]) => {
      const m = metrics[region], v = m[mapMetric];
      const bg = v === null ? IQ.color('surface-2') : steps[Math.min(5, Math.floor(((v - min) / (max - min || 1)) * 5.999))];
      const label = `${region}: ${v === null ? "ma'lumot yo'q" : v + unit}, ${m.n} ta e'lon. ${active === region ? 'Filtrni olib tashlash' : 'Bazani shu hudud bo\'yicha filtrlash'}`;
      return `<button type="button" class="tile ${ink(bg) ? 'dark-ink' : ''} ${active === region ? 'active' : ''}" data-region="${esc(region)}"
        aria-pressed="${active === region}" aria-label="${esc(label)}" title="${esc(label)}"
        style="grid-column:${c};grid-row:${r};background:${bg}">
        ${esc(region)}<b>${v === null ? '—' : v + unit}</b></button>`;
    }).join('');
    $('#mapLegend').innerHTML = `<span>${min}${unit}</span>${steps.map(s => `<i style="background:${s}"></i>`).join('')}<span>${max}${unit}</span>`;
  }

  function renderInsights({ total, high, disc, noSalary }) {
    const groups = by(DATA, d => d.a.region);
    const riskByRegion = Object.entries(groups).filter(([r, l]) => l.length >= 8 && r !== "Noma'lum" && r !== 'Xorij')
      .map(([r, l]) => [r, count(l, d => d.a.level !== 'low') / l.length]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]);
    const signals = {};
    DATA.forEach(d => d.a.scam.forEach(s => { signals[s.label] = (signals[s.label] || 0) + 1; }));
    const topSignal = sortedEntries(signals)[0];
    const abroad = groups['Xorij'] || [];
    const prepay = count(DATA, d => d.a.scam.some(s => s.id === 'prepay'));
    const ins = [];
    if (high) ins.push(`Har <b>${Math.max(1, Math.round(total / high))}</b> ta e'londan taxminan bittasi yuqori xavfli.`);
    if (prepay) ins.push(`<b>${prepay}</b> ta e'londa ishga olish uchun pul so'ralgan. Bu firibgarlikning eng aniq belgisi.`);
    if (topSignal) ins.push(`Eng ko'p uchraydigan firibgarlik belgisi: <b>${esc(topSignal[0])}</b> (${topSignal[1]} ta e'lon).`);
    const abroadRisky = count(abroad, d => d.a.level !== 'low');
    if (abroad.length >= 5 && abroadRisky) ins.push(`Xorijga ish takliflarining <b>${pct(abroadRisky, abroad.length)}%</b>ida firibgarlik yoki odam savdosi belgisi bor (yuqori yoki o'rtacha xavf).`);
    if (riskByRegion.length) ins.push(`O'zbekiston ichida xavfli yoki shubhali e'lonlar ulushi eng yuqori hudud: <b>${esc(riskByRegion[0][0])}</b> (${Math.round(riskByRegion[0][1] * 100)}%).`);
    if (disc) ins.push(`E'lonlarning <b>${pct(disc, total)}%</b>ida kamsituvchi talab bor.`);
    ins.push(`E'lonlarning <b>${pct(noSalary, total)}%</b>ida maosh ko'rsatilmagan.`);
    $('#insights').innerHTML = `<h3>🔎 Avtomatik xulosalar</h3><ul>${ins.map(x => `<li>${x}</li>`).join('')}</ul>`;
  }

  // ---------- 3. Kasblar va ko'nikmalar ----------
  // Kasb nomlari: tor ekranda qisqartiriladi va 2 qatorga bo'linadi; boshqa yozuv yoki grafik chegarasi
  // bilan ustma-ust tushadigan yozuv chizilmaydi (to'liq nom — tooltip va pastdagi jadvalda)
  function labelLines(name, narrow) {
    if (!narrow) return [name];
    const max = 12;
    const words = name.split(/\s+/);
    if (words.length > 1 && words[0].length <= max) {
      const second = words.slice(1).join(' ');
      return [words[0], second.length > max ? second.slice(0, max - 1) + '…' : second];
    }
    return [name.length > max ? name.slice(0, max - 1) + '…' : name];
  }

  const labelPlugin = {
    id: 'bubbleLabels',
    afterDatasetsDraw(ch) {
      const { ctx, chartArea } = ch;
      const meta = ch.getDatasetMeta(0);
      const narrow = ch.width < 520;
      const lineH = narrow ? 11 : 13;
      ctx.save();
      ctx.font = `${narrow ? 10 : 11}px system-ui, sans-serif`;
      ctx.fillStyle = IQ.color('text');
      const placed = [];
      const overlaps = b => placed.some(p => b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y);
      // Avval kattaroq (ko'proq e'lonli) pufakchalar yoziladi
      const order = meta.data.map((pt, i) => i).sort((a, b) => ch.data.datasets[0].data[b].x - ch.data.datasets[0].data[a].x);
      for (const i of order) {
        const d = ch.data.datasets[0].data[i];
        const pt = meta.data[i];
        if (!d.label) continue;
        const lines = labelLines(d.label, narrow);
        const w = Math.max(...lines.map(l => ctx.measureText(l).width));
        const h = lines.length * lineH;
        // O'ngga sig'masa — chapga
        let x = pt.x + d.r + 3;
        if (x + w > chartArea.right) x = pt.x - d.r - 3 - w;
        const box = { x, y: pt.y - h / 2, w, h };
        if (x < chartArea.left || box.y < chartArea.top || box.y + h > chartArea.bottom || overlaps(box)) continue;
        placed.push(box);
        lines.forEach((l, k) => ctx.fillText(l, x, box.y + (k + 1) * lineH - 3));
      }
      ctx.restore();
    }
  };

  function renderProfessions() {
    const ok = reliable(DATA);
    const thin = ok.length < CAREERS_MIN;
    $('#careersThin').hidden = !thin;
    $('#kasblar').classList.toggle('careers-is-thin', thin);
    if (thin) {
      $('#careersThinCount').textContent = `Hozirgi namunada ${DATA.length} ta noyob e'lon bor, ulardan ${ok.length} tasi ishonchli.`;
      $('#careersThinMin').textContent = CAREERS_MIN;
      ['chBubble', 'chSkills', 'chSalary'].forEach(id => { if (charts[id]) { charts[id].destroy(); delete charts[id]; } });
      $('#bubbleTable').innerHTML = '';
      $('#skillInsights').innerHTML = '';
      return;
    }
    const groups = by(ok.filter(d => d.a.profession !== 'Boshqa'), d => d.a.profession);
    const points = Object.entries(groups).map(([name, list]) => {
      const paid = list.filter(d => d.a.salary);
      return { name, n: list.length, salary: paid.length ? round1(avg(paid.map(midSalary))) : null };
    }).filter(p => p.salary !== null && p.n >= 2);
    const maxN = Math.max(1, ...points.map(p => p.n));
    chart('chBubble', {
      type: 'bubble',
      data: {
        datasets: [{
          label: 'Kasblar',
          data: points.map(p => ({ x: p.n, y: p.salary, r: 5 + 12 * Math.sqrt(p.n / maxN), name: p.name, label: p.name })),
          backgroundColor: IQ.color('primary') + '99', borderColor: IQ.color('primary'), borderWidth: 1.5
        }]
      },
      options: baseOptions({
        layout: { padding: { right: 70 } },
        scales: {
          x: { beginAtZero: true, title: { display: true, text: "E'lonlar soni (talab)", color: IQ.color('text-2') }, grid: { color: IQ.color('grid') }, ticks: { color: IQ.color('text-2'), precision: 0 } },
          y: { beginAtZero: true, title: { display: true, text: "O'rtacha maosh, mln so'm", color: IQ.color('text-2') }, grid: { color: IQ.color('grid') }, ticks: { color: IQ.color('text-2') } }
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.raw.name}: ${c.raw.x} ta e'lon, ~${c.raw.y} mln so'm` } } }
      }),
      plugins: [labelPlugin]
    });

    $('#bubbleTable').innerHTML = points.slice().sort((x, y) => y.n - x.n)
      .map(p => `<tr><td>${esc(p.name)}</td><td class="num">${p.n}</td><td class="num">${p.salary}</td></tr>`).join('');

    const skills = {};
    ok.forEach(d => d.a.skills.forEach(s => { skills[s.name] = skills[s.name] || { n: 0, digital: s.digital }; skills[s.name].n++; }));
    const top = Object.entries(skills).sort((x, y) => y[1].n - x[1].n).slice(0, 15);
    chart('chSkills', {
      type: 'bar',
      data: {
        labels: top.map(x => x[0]),
        datasets: [
          { label: 'Raqamli', data: top.map(x => (x[1].digital ? x[1].n : null)), backgroundColor: IQ.color('primary'), borderRadius: 4, maxBarThickness: 16 },
          { label: "An'anaviy", data: top.map(x => (x[1].digital ? null : x[1].n)), backgroundColor: IQ.color('series-2'), borderRadius: 4, maxBarThickness: 16 }
        ]
      },
      options: baseOptions({
        indexAxis: 'y', skipNull: true,
        datasets: { bar: { grouped: false } },
        scales: {
          x: { beginAtZero: true, grid: { color: IQ.color('grid') }, border: { display: false }, ticks: { color: IQ.color('text-2') } },
          y: { grid: { display: false }, border: { color: IQ.color('grid') }, ticks: { color: IQ.color('text-2'), callback: shortLabel } }
        },
        plugins: { legend: { display: true, position: 'bottom', labels: { color: IQ.color('text-2'), usePointStyle: true, boxWidth: 8 } } }
      })
    });

    const cats = by(ok.filter(d => d.a.salary && d.a.category !== 'Boshqa'), d => d.a.category);
    const sal = Object.entries(cats).map(([c, l]) => [c, round1(avg(l.map(midSalary)))]).sort((x, y) => y[1] - x[1]);
    hbar('chSalary', sal.map(x => x[0]), sal.map(x => x[1]), IQ.color('primary'), " mln so'm");

    const paid = ok.filter(d => d.a.salary);
    const digitalPaid = paid.filter(d => d.a.skills.some(s => s.digital));
    const otherPaid = paid.filter(d => !d.a.skills.some(s => s.digital));
    const dAvg = avg(digitalPaid.map(midSalary)), oAvg = avg(otherPaid.map(midSalary));
    const byDemand = points.slice().sort((x, y) => y.n - x.n);
    const bySalary = points.slice().sort((x, y) => y.salary - x.salary);
    const ins = [];
    if (byDemand.length) ins.push(`Eng ko'p talab qilinadigan kasblar: <b>${byDemand.slice(0, 3).map(p => esc(p.name)).join(', ')}</b>.`);
    if (bySalary.length) ins.push(`Eng yuqori o'rtacha maosh: <b>${esc(bySalary[0].name)}</b> (~${bySalary[0].salary} mln so'm).`);
    if (digitalPaid.length && otherPaid.length && oAvg) {
      ins.push(`Raqamli ko'nikma talab qilinadigan e'lonlarda o'rtacha maosh <b>${Math.round((dAvg / oAvg - 1) * 100)}%</b> yuqori (${round1(dAvg)} va ${round1(oAvg)} mln so'm).`);
    }
    const withDigital = count(ok, d => d.a.skills.some(s => s.digital));
    if (ok.length) ins.push(`Ishonchli e'lonlarning <b>${pct(withDigital, ok.length)}%</b>ida kamida bitta raqamli ko'nikma so'ralgan.`);
    $('#skillInsights').innerHTML = `<h3>🎓 Kasb tanlayotganlar uchun xulosa</h3><ul>${ins.map(x => `<li>${x}</li>`).join('')}</ul>`;
  }

  // ---------- 4. Kanallar reytingi ----------
  // Yuqori xavf to'liq, o'rtacha (shubhali) va kamsitish yarim og'irlik bilan: faqat "oson pul"
  // e'lonlaridan iborat kanal ham "ishonchli" bo'lib qolmasligi uchun
  function grade(highShare, mediumShare, discShare) {
    const p = highShare + mediumShare * 0.5 + discShare * 0.5;
    return p < 5 ? 'A' : p < 12 ? 'B' : p < 22 ? 'C' : p < 35 ? 'D' : 'F';
  }

  function renderChannels() {
    // E'lon chiqqan har bir kanal hisoblanadi (importda takror bitta e'lon bo'lsa ham)
    const groups = {};
    DATA.forEach(d => (d.channels && d.channels.length ? d.channels : [d.channel || "Noma'lum"]).forEach(ch => { (groups[ch] = groups[ch] || []).push(d); }));
    const rows = Object.entries(groups).map(([ch, l]) => {
      const highOnly = pct(count(l, d => d.a.level === 'high'), l.length);
      const medium = pct(count(l, d => d.a.level === 'medium'), l.length);
      const high = pct(count(l, d => d.a.level !== 'low'), l.length); // jadvalda: xavfli yoki shubhali
      const disc = pct(count(l, d => d.a.discrimination.length), l.length);
      return { ch, n: l.length, high, disc, transp: Math.round(avg(l.map(d => d.a.transparency.score))), dupes: count(l, d => d.dupes > 1), g: grade(highOnly, medium, disc) };
    }).sort((x, y) => x.g.localeCompare(y.g) || x.high - y.high);
    $('#channelRows').innerHTML = rows.map(r => `
      <tr>
        <td><span class="grade ${r.g}">${r.g}</span></td>
        <td>${esc(r.ch)}</td>
        <td class="num">${r.n}</td>
        <td><div class="bar-cell"><i style="width:${Math.max(2, r.high)}px"></i>${r.high}%</div></td>
        <td class="num">${r.disc}%</td>
        <td class="num">${r.transp}</td>
        <td class="num">${r.dupes}</td>
      </tr>`).join('');
  }

  // ---------- 5. Jadval ----------
  function renderRows() {
    const q = $('#fSearch').value.trim().toLowerCase();
    const lvl = $('#fLevel').value, reg = $('#fRegion').value, cat = $('#fCategory').value, onlyDisc = $('#fDisc').checked;
    const list = DATA.filter(d =>
      (!lvl || d.a.level === lvl) && (!reg || d.a.region === reg) && (!cat || d.a.category === cat) &&
      (!onlyDisc || d.a.discrimination.length) &&
      (!q || (d.text + ' ' + (d.channel || '') + ' ' + d.a.profession).toLowerCase().includes(q))
    ).sort((x, y) => (y.date || '').localeCompare(x.date || '') || y.a.score - x.a.score);
    $('#rows').innerHTML = list.slice(0, limit).map(d => `
      <tr class="click" data-id="${esc(d.id)}" tabindex="0" title="E'lonni tekshirish (Enter)">
        <td>${esc(d.date || '')}</td><td>${esc(d.channel || '')}</td>
        <td class="text"><div>${esc(d.text)}</div></td>
        <td>${esc(d.a.region)}</td><td>${esc(d.a.profession)}</td>
        <td class="num">${IQ.salaryText(d.a.salary)}</td>
        <td><span class="tag ${d.a.level}">${IQ.DOT[d.a.level]} ${d.a.score}</span>${d.a.discrimination.length ? ' <span class="tag disc" title="Kamsituvchi">⚖️</span>' : ''}</td>
        <td class="num">${d.a.transparency.score}</td>
      </tr>`).join('') || '<tr><td colspan="8" class="muted">Hech narsa topilmadi</td></tr>';
    $('#count').textContent = `${Math.min(limit, list.length)} / ${list.length} ta ko'rsatilmoqda`;
    $('#btnMore').style.display = list.length > limit ? '' : 'none';
  }

  function fillSelect(sel, values, allLabel) {
    const cur = sel.value;
    sel.innerHTML = `<option value="">${allLabel}</option>` + values.map(v => `<option>${esc(v)}</option>`).join('');
    if (values.includes(cur)) sel.value = cur;
  }

  // ---------- Eksport ----------
  IQ.exportCsv = () => {
    if (!DATA.length) return;
    const head = ['id', 'sana', 'kanal', 'hudud', 'kasb', 'soha', 'maosh_min', 'maosh_max', 'xavf_ball', 'xavf_daraja', 'shaffoflik', 'kamsitish', 'firibgarlik_belgilari', 'matn'];
    // Formula injection himoyasi: = + - @ bilan boshlangan qiymat Excel'da formula bo'lib bajarilmasligi uchun
    const cell = v => {
      let t = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
      return `"${t.replace(/"/g, '""')}"`;
    };
    const lines = DATA.map(d => [d.id, d.date, d.channel, d.a.region, d.a.profession, d.a.category, d.a.salary?.min, d.a.salary?.max,
      d.a.score, A.LEVEL_TEXT[d.a.level], d.a.transparency.score, d.a.discrimination.map(x => x.label).join('; '),
      d.a.scam.map(x => x.label).join('; '), d.text].map(cell).join(','));
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `ishqalqon-tahlil-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  IQ.renderDashboard = data => {
    // Takroriy e'lonlarni aniqlash (bir xil matn bir necha kanalda yoki qayta-qayta)
    const fp = {};
    data.forEach(d => { d.fp = d.fp || A.fingerprint(d.text); fp[d.fp] = (fp[d.fp] || 0) + 1; });
    // Takroriy: bir xil matn ro'yxatda bir necha marta yoki import paytida bir necha kanalda uchragan
    data.forEach(d => { d.dupes = Math.max(fp[d.fp], (d.channels || []).length); });
    DATA = data;
    limit = 25;
    fillSelect($('#fRegion'), A.REGION_NAMES.concat(["Noma'lum"]).filter(r => DATA.some(d => d.a.region === r)), 'Barcha hududlar');
    fillSelect($('#fCategory'), [...new Set(DATA.map(d => d.a.category))].sort(), 'Barcha sohalar');
    IQ.redrawCharts();
    renderChannels();
    renderRows();
  };

  IQ.clearDashboard = () => {
    DATA = [];
    Object.keys(charts).forEach(id => { charts[id].destroy(); delete charts[id]; });
  };

  IQ.redrawCharts = () => {
    if (!DATA.length) return;
    if (window.Chart) {
      Chart.defaults.font.family = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      Chart.defaults.color = IQ.color('text-2');
    }
    renderMarket();
    renderProfessions();
  };

  ['#fSearch', '#fLevel', '#fRegion', '#fCategory', '#fDisc'].forEach(s => $(s).addEventListener('input', () => { limit = 25; renderRows(); if (s === '#fRegion') renderMap(); }));
  $('#btnMore').addEventListener('click', () => { limit += 25; renderRows(); });
  // Qator sichqoncha bilan ham, klaviatura bilan ham (Tab → Enter yoki Space) tekshiruvga ochiladi
  function openRow(tr) {
    const d = DATA.find(x => String(x.id) === tr.dataset.id); if (!d) return;
    IQ.check(d.text);
    $('#tekshir').focus({ preventScroll: true });
    $('#tekshir').scrollIntoView();
  }
  $('#rows').addEventListener('click', e => { const tr = e.target.closest('tr.click'); if (tr) openRow(tr); });
  $('#rows').addEventListener('keydown', e => {
    const tr = e.target.closest('tr.click');
    if (!tr || e.target !== tr || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault(); openRow(tr);
  });
  $('#mapCtrl').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    mapMetric = b.dataset.metric;
    IQ.$$('#mapCtrl button').forEach(x => x.classList.toggle('on', x === b));
    renderMap();
  });
  $('#tilemap').addEventListener('click', e => {
    const t = e.target.closest('.tile[data-region]'); if (!t) return;
    const sel = $('#fRegion');
    const region = t.dataset.region;
    if (![...sel.options].some(o => o.value === region)) return;
    sel.value = sel.value === region ? '' : region;
    limit = 25; renderRows(); renderMap();
    if (sel.value) $('#vakansiyalar').scrollIntoView();
  });
})();
