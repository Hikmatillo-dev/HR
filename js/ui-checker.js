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

  const FOREIGN = /\$|€|usd|dollar|доллар|eur|yevro|евро|rubl|руб/i; // xorijiy valyutadagi maosh
  let last = null; // oxirgi tahlil (nusxalash va AI uchun)

  function gauge(value, color, label) {
    return `<div class="gauge" style="--p:${value};--c:${color}"><span>${value}<small>${label}</small></span></div>`;
  }

  // explicit: foydalanuvchi "Tekshirish" ni bosdi (yozish paytidagi avtomatik yangilanish emas)
  function render(text, explicit) {
    const box = $('#result');
    if (!text.trim() && !explicit) {
      box.className = 'result empty';
      box.innerHTML = 'Natija shu yerda chiqadi.<br>Matn yozilishi bilan tahlil avtomatik yangilanadi.';
      last = null; return;
    }
    // Bo'sh, juda qisqa yoki mazmunsiz matn — xavf bahosi chiqarilmaydi (js/validate-posting.js)
    const valid = window.IQValidate.check(text);
    if (!valid.ok) {
      box.className = 'result empty invalid';
      box.innerHTML = `<p class="invalid-msg" role="alert">⚠️ ${esc(valid.message)}</p>`;
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
      : a.level === 'medium' ? "Ehtiyot bo'ling: kompaniya nomi, manzili va litsenziyasini tekshiring."
      : a.discrimination.length ? "Firibgarlik belgisi topilmadi, lekin e'londa qonunga zid kamsituvchi talab bor."
      : "Jiddiy xavf belgisi topilmadi.";
    // Ikki alohida o'lchov: firibgarlik xavfi va kamsitish — yashil "past xavf" kamsitishni yashirmasligi uchun
    const verdict = `${IQ.DOT[a.level]} Firibgarlik xavfi: ${A.LEVEL_TEXT[a.level].replace(/ xavf$/, '').toLowerCase()}`;
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
          <div class="lvl lvl-${a.level}">${verdict}</div>
          ${a.discrimination.length ? `<div class="lvl lvl-disc">⚖️ Kamsitish: ${a.discrimination.length} ta talab</div>` : ''}
          <div class="sub">${advice}</div>
          <div class="facts">
            <span class="tag">📍 ${esc(a.region)}</span>
            <span class="tag">💼 ${esc(a.profession)}</span>
            ${a.salary ? `<span class="tag">💰 ${IQ.salaryText(a.salary)} mln so'm/oy</span>` : ''}
            ${a.salary && FOREIGN.test(text) && IQ.rateInfo() && IQ.rateInfo().approximate ? `<span class="tag" title="${esc(IQ.rateInfo().text)}">💱 Kurslar taxminiy</span>` : ''}
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
        <button class="small" id="btnAi">🤖 AI chuqur tahlil</button>
      </div>
      <p class="ai-status" id="aiStatus" role="status"></p>
      <div id="aiOut" aria-live="polite"></div>`;
    updateAiButton();
  }

  // Iqtibos asl e'londan olinadi (kirill e'londa lotincha transliteratsiya emas); topilmasa — iqtibossiz
  const quoteOf = (text, match) => {
    const f = window.IQQuote && window.IQQuote.locate(text, match);
    return f ? f.replace(/\s+/g, ' ').trim() : null;
  };
  const withQuote = (text, match, fmt) => { const q = quoteOf(text, match); return q ? fmt(q) : ''; };

  function summary() {
    const { text, a } = last;
    const lines = [
      `🛡️ IshQalqon tahlili: ${IQ.DOT[a.level]} ${A.LEVEL_TEXT[a.level]} (${a.score}/100), shaffoflik ${a.transparency.score}/100`,
      ...a.scam.map(r => `⚠️ ${r.label}${withQuote(text, r.match, q => `: "${q}"`)}`),
      ...a.discrimination.map(d => `⚖️ Kamsitish: ${d.label}${withQuote(text, d.match, q => `: "${q}"`)}`),
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
      ...a.scam.map(r => `- ${r.label}${withQuote(text, r.match, q => ` ("${q}")`)}`),
      ...a.discrimination.map(d => `- Kamsituvchi talab: ${d.label}${withQuote(text, d.match, q => ` ("${q}")`)}`),
      '',
      "E'lon matni:",
      '"""', text.trim(), '"""',
      '',
      "Ushbu e'lonni tekshirishingiz va zarur choralar ko'rishingizni so'rayman.",
      '',
      "Manba: kanal nomi va e'lon havolasini qo'shing."
    ].join('\n');
  }

  // ---------- AI chuqur tahlil ----------
  // IQ.ai = { state: 'checking' | 'on' | 'off', reason, maxChars } — app.js /api/health orqali to'ldiradi
  function updateAiButton() {
    const btn = $('#btnAi'), status = $('#aiStatus');
    if (!btn) return;
    const ai = IQ.ai || { state: 'checking' };
    btn.disabled = ai.state !== 'on';
    status.textContent = ai.state === 'on' ? '' : ai.state === 'checking' ? 'AI holati tekshirilmoqda...' : ai.reason;
  }

  // AI javobini DOM orqali quramiz: matn faqat textContent bilan qo'yiladi, HTML sifatida talqin qilinmaydi
  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    Object.assign(node, props || {});
    children.flat().forEach(c => { if (c !== null && c !== undefined && c !== false) node.append(c instanceof Node ? c : String(c)); });
    return node;
  }
  function listSection(title, items, render) {
    if (!items || !items.length) return null;
    return el('div', null, el('h5', { className: 'ai-h' }, title), el('ul', null, items.map(i => el('li', null, render(i)))));
  }
  const quoted = q => (q ? el('q', { className: 'ai-quote' }, q) : null);

  function renderAi(data) {
    const LV = { high: '🔴 Yuqori xavf', medium: "🟡 O'rtacha xavf", low: '🟢 Past xavf' };
    const box = el('div', { className: 'ai-box' },
      el('h4', null, '🤖 AI xulosasi: ', LV[data.risk_level] || data.risk_level),
      el('p', null, data.summary),
      listSection('Xavf sabablari', data.risk_reasons, r => [el('b', null, r.reason), ' ', quoted(r.quote)]),
      listSection("Odam savdosi belgilari", data.human_trafficking_flags, f => [el('b', null, f.indicator + ': '), f.explanation, ' ', quoted(f.quote)]),
      listSection('Kamsitish', data.discrimination_flags, f => [el('b', null, f.type + ': '), f.explanation, ' ', quoted(f.quote)]),
      listSection("Yetishmayotgan ma'lumotlar", data.missing_information, m => m),
      listSection("Ish beruvchiga beriladigan savollar", data.recommended_questions_for_applicant, q => q),
      data.improved_non_discriminatory_version
        ? el('details', { className: 'block' }, el('summary', null, 'Kamsitishsiz, shaffof variant'), el('div', { className: 'src-text' }, data.improved_non_discriminatory_version))
        : null,
      (data.warnings && data.warnings.length) ? el('p', { className: 'muted ai-note' }, `⚠️ ${data.warnings.length} ta AI iqtibosi e'lon matnida topilmadi, shuning uchun ko'rsatilmadi.`) : null,
      el('p', { className: 'muted ai-note' }, "Bu avtomatik tahlil. Yakuniy qaror sizda: kompaniyani mustaqil tekshiring.")
    );
    $('#aiOut').replaceChildren(box);
  }

  function renderAiError(message) {
    $('#aiOut').replaceChildren(el('div', { className: 'ai-box ai-error' }, el('b', null, 'AI tahlili bajarilmadi: '), message, el('br'), el('span', { className: 'muted' }, "Qoidalar tizimi natijasi yuqorida o'z kuchida.")));
  }

  async function runAi() {
    const btn = $('#btnAi');
    const max = (IQ.ai && IQ.ai.maxChars) || 6000;
    if (last.text.trim().length < 20) return renderAiError("Matn juda qisqa (kamida 20 belgi).");
    if (last.text.length > max) return renderAiError(`Matn juda uzun: ${last.text.length} belgi (ko'pi bilan ${max}). Bitta e'lonni yuboring.`);
    btn.disabled = true; btn.textContent = '🤖 Tahlil qilinmoqda...';
    $('#aiOut').replaceChildren();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120_000);
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: last.text }), signal: ctrl.signal });
      let data;
      try { data = await res.json(); } catch (e) { throw new Error(`Server javobi noto'g'ri (HTTP ${res.status}).`); }
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      renderAi(data);
    } catch (e) {
      renderAiError(e.name === 'AbortError' ? "Server juda uzoq javob bermadi." : e.message);
    } finally {
      clearTimeout(timer);
      btn.disabled = false; btn.textContent = '🤖 AI chuqur tahlil';
    }
  }

  IQ.check = text => { $('#input').value = text; render(text); };

  let timer;
  $('#input').addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => render(e.target.value), 250); });
  $('#btnCheck').addEventListener('click', () => render($('#input').value, true));
  $('#btnClear').addEventListener('click', () => IQ.check(''));
  IQ.$$('[data-example]').forEach(b => b.addEventListener('click', () => IQ.check(EXAMPLES[b.dataset.example])));
  $('#result').addEventListener('click', e => {
    if (!last) return;
    if (e.target.id === 'btnShare') IQ.copy(summary(), 'Natija nusxalandi');
    if (e.target.id === 'btnReport') IQ.copy(complaint(), 'Shikoyat matni nusxalandi');
    if (e.target.id === 'btnAi') runAi();
  });
  IQ.onAiStatus = updateAiButton;
})();
