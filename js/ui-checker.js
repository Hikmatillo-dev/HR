// 1-bo'lim: bitta vakansiyani tekshirish
(function () {
  'use strict';
  const IQ = window.IQ, A = window.IshQalqon, { $, esc } = IQ;

  const EXAMPLES = {
    scam: "🇰🇷 KOREYAGA ISH! Viza 100% kafolat! Oyiga $2500 dan. Tajriba shart emas.\nHujjatlarni rasmiylashtirish uchun to'lov 500$. Joylar cheklangan, shoshiling!\nBatafsil lichkada.",
    traffic: "Rossiyaga qurilishga ishchilar kerak! Oyiga 150 000 rubl. Yo'l va yotoqxona bepul.\nPasportlar ish beruvchida turadi. Hujjat uchun to'lov 1 mln so'm.\nShoshiling, faqat bugun!",
    disc: "Ofisga menejer kerak. Toshkent, Chilonzor.\nTalablar: faqat qizlar, 20-27 yosh, ko'rinishi chiroyli, turmushga chiqmagan.\nMaosh: 4 mln so'm\n📞 +998 90 123 45 67",
    cyrl: "Кореяга иш! Виза 100% кафолат. Ойига $2500. Тажриба шарт эмас.\nҲужжат учун тўлов 500$. Шошилинг!",
    ok: "📢 «Smart Code» MChJ Samarqanddagi filialiga Frontend dasturchi kerak.\nSTIR: 305123456\n\nTalablar: React, TypeScript, Git, 1 yillik tajriba.\nMaosh: 10–15 mln so'm\nIsh vaqti: 9:00–18:00, rasmiy ishga joylashtirish.\nManzil: Samarqand sh., Registon ko'chasi 5\n\n📞 +998 91 555 44 33"
  };

  let last = null; // oxirgi tahlil (nusxalash va AI uchun)

  function gauge(value, color, label) {
    return `<div class="gauge" style="--p:${value};--c:${color}"><span>${value}<small>${label}</small></span></div>`;
  }

  function render(text) {
    const box = $('#result');
    if (!text.trim()) {
      box.className = 'result empty';
      box.innerHTML = 'Natija shu yerda chiqadi.<br>Matn yozilishi bilan tahlil avtomatik yangilanadi.';
      last = null; return;
    }
    const a = A.analyze(text);
    last = { text, a };

    const items = [];
    a.scam.slice().sort((x, y) => y.weight - x.weight).forEach(r => items.push(
      `<li><b>⚠️ ${esc(r.label)} <small>(+${r.weight})</small></b>${esc(r.detail)}</li>`));
    a.discrimination.forEach(d => items.push(
      `<li class="disc"><b>⚖️ Kamsitish: ${esc(d.label)}</b><small>Mehnat qonunchiligi ishga qabul qilishda kamsitishni taqiqlaydi. <b>Qanday tuzatish kerak:</b> ${esc(d.fix)}</small></li>`));
    if (a.trust.length) items.push(`<li class="trust"><b>✅ Ishonch belgilari</b><small>${a.trust.map(t => esc(t.label)).join(' · ')}</small></li>`);
    if (!a.scam.length && !a.discrimination.length) items.push('<li class="ok"><b>✅ Firibgarlik va kamsitish belgilari topilmadi</b><small>Baribir kompaniyani tekshiring va hech qachon oldindan pul to\'lamang.</small></li>');

    const advice = a.level === 'high'
      ? "Bu e'longa pul to'lamang va shaxsiy ma'lumotlaringizni yubormang."
      : a.level === 'medium' ? "Ehtiyot bo'ling: kompaniya nomi, manzili va litsenziyasini tekshiring." : "Jiddiy xavf belgisi topilmadi.";
    const tScore = a.transparency.score;
    const tColor = tScore >= 70 ? IQ.color('good') : tScore >= 40 ? IQ.color('warning') : IQ.color('critical');

    const marks = [
      ...a.scam.map(r => ({ phrase: r.match, cls: '' })),
      ...a.discrimination.map(d => ({ phrase: d.match, cls: 'm-disc' })),
      ...a.trust.map(t => ({ phrase: t.match, cls: 'm-trust' }))
    ];

    box.className = 'result';
    box.innerHTML = `
      <div class="verdict">
        <div class="gauges">${gauge(a.score, IQ.levelColor(a.level), 'xavf')}${gauge(tScore, tColor, 'shaffoflik')}</div>
        <div style="flex:1;min-width:200px">
          <div class="lvl lvl-${a.level}">${IQ.DOT[a.level]} ${A.LEVEL_TEXT[a.level]}</div>
          <div class="sub">${advice}</div>
          <div class="facts">
            <span class="tag">📍 ${esc(a.region)}</span>
            <span class="tag">💼 ${esc(a.profession)}</span>
            ${a.salary ? `<span class="tag">💰 ${IQ.salaryText(a.salary)} mln so'm/oy</span>` : ''}
            ${a.script !== 'uz-latn' ? `<span class="tag">🔤 ${a.script === 'ru' ? 'rus tili' : 'kirill'}</span>` : ''}
            ${a.discrimination.length ? `<span class="tag disc">⚖️ ${a.discrimination.length} ta kamsitish belgisi</span>` : ''}
            ${a.trafficking ? '<span class="tag high">🚨 Odam savdosi belgisi</span>' : ''}
          </div>
        </div>
      </div>
      <ul class="reasons">${items.join('')}</ul>
      <div class="src-text">${IQ.highlight(text, marks)}</div>
      ${a.skills.length ? `<div class="facts">${a.skills.map(s => `<span class="tag ${s.digital ? 'digital' : ''}">${s.digital ? '💻' : '🧩'} ${esc(s.name)}</span>`).join('')}</div>` : ''}
      <details class="block"><summary>Shaffoflik indeksi: ${tScore}/100</summary>
        <ul class="checklist" style="margin-top:8px">${a.transparency.checks.map(c => `<li class="${c.ok ? '' : 'no'}">${c.ok ? '✅' : '⬜'} ${esc(c.label)} <small class="muted">(${c.weight})</small></li>`).join('')}</ul>
      </details>
      <div class="btns">
        <button class="small" id="btnShare">📋 Natijani nusxalash</button>
        ${a.level !== 'low' || a.discrimination.length ? '<button class="small" id="btnReport">🚩 Shikoyat matni</button>' : ''}
        <button class="small" id="btnAi" ${IQ.aiAvailable ? '' : 'hidden'}>🤖 AI chuqur tahlil</button>
      </div>
      <div id="aiOut"></div>`;
  }

  function summary() {
    const { a } = last;
    const lines = [
      `🛡️ IshQalqon tahlili: ${IQ.DOT[a.level]} ${A.LEVEL_TEXT[a.level]} (${a.score}/100), shaffoflik ${a.transparency.score}/100`,
      ...a.scam.map(r => `⚠️ ${r.label}`),
      ...a.discrimination.map(d => `⚖️ Kamsitish: ${d.label}`),
      "Eslatma: ish uchun hech qachon oldindan pul to'lamang."
    ];
    return lines.join('\n');
  }

  function complaint() {
    const { text, a } = last;
    const today = new Date().toLocaleDateString('uz-UZ');
    return [
      'Hurmatli kanal administratori / mas\'ul tashkilot!',
      '',
      `${today} kuni Telegram'da quyidagi vakansiya e'loniga duch keldim. Unda firibgarlik va/yoki kamsitish belgilari bor:`,
      ...a.scam.map(r => `- ${r.label} ("${r.match}")`),
      ...a.discrimination.map(d => `- Kamsituvchi talab: ${d.label} ("${d.match}")`),
      '',
      "E'lon matni:",
      '"""', text.trim(), '"""',
      '',
      "Ushbu e'lonni tekshirishingiz va zarur choralar ko'rishingizni so'rayman.",
      '',
      "Manba: kanal nomi va e'lon havolasini qo'shing."
    ].join('\n');
  }

  async function runAi() {
    const out = $('#aiOut'), btn = $('#btnAi');
    btn.disabled = true; btn.textContent = '🤖 Tahlil qilinmoqda...';
    out.innerHTML = '';
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: last.text }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      const lvl = { high: '🔴 Yuqori xavf', medium: "🟡 O'rtacha xavf", low: '🟢 Past xavf' }[data.risk_level] || data.risk_level;
      out.innerHTML = `<div class="ai-box">
        <h4>🤖 AI xulosasi: ${esc(lvl)}</h4>
        <p>${esc(data.summary)}</p>
        ${data.red_flags.length ? `<ul>${data.red_flags.map(f => `<li><b>${esc(f.flag)}:</b> ${esc(f.explanation)}</li>`).join('')}</ul>` : ''}
        <p><b>Maslahat:</b> ${esc(data.advice)}</p>
        ${data.neutral_rewrite ? `<details class="block"><summary>Kamsitishsiz, shaffof variant</summary><div class="src-text">${esc(data.neutral_rewrite)}</div></details>` : ''}
      </div>`;
    } catch (e) {
      out.innerHTML = `<div class="ai-box">AI tahlili ishlamadi: ${esc(e.message)}. Qoidalar tizimi natijasi yuqorida.</div>`;
    } finally {
      btn.disabled = false; btn.textContent = '🤖 AI chuqur tahlil';
    }
  }

  IQ.check = text => { $('#input').value = text; render(text); };

  let timer;
  $('#input').addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => render(e.target.value), 250); });
  $('#btnCheck').addEventListener('click', () => render($('#input').value));
  $('#btnClear').addEventListener('click', () => IQ.check(''));
  IQ.$$('[data-example]').forEach(b => b.addEventListener('click', () => IQ.check(EXAMPLES[b.dataset.example])));
  $('#result').addEventListener('click', e => {
    if (!last) return;
    if (e.target.id === 'btnShare') IQ.copy(summary(), 'Natija nusxalandi');
    if (e.target.id === 'btnReport') IQ.copy(complaint(), 'Shikoyat matni nusxalandi');
    if (e.target.id === 'btnAi') runAi();
  });
  IQ.onAiReady = () => { const b = $('#btnAi'); if (b) b.hidden = false; };
})();
