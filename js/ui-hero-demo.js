// Bosh sahifadagi "Jonli misol": demo e'lon va uning oldindan yozilgan tahlili qisqa animatsiya bilan ko'rsatiladi.
// Ma'lumot: js/demo-examples.js (sintetik). analyzer.js chaqirilmaydi. Animatsiya ~4 soniyada tugaydi;
// "harakatni kamaytirish" yoqilgan bo'lsa, natija darhol ko'rsatiladi.
(function () {
  'use strict';
  const EXAMPLES = window.IQ_DEMO_EXAMPLES || [];
  const root = document.getElementById('heroDemo');
  if (!root || !EXAMPLES.length) return;

  const $ = sel => root.querySelector(sel);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LEVEL = { high: ['🔴', 'yuqori'], medium: ['🟡', "o'rtacha"], low: ['🟢', 'past'] };

  let index = 0, run = 0;
  const wait = (ms, id) => new Promise((res, rej) => setTimeout(() => (id === run ? res() : rej(new Error('bekor'))), ms));

  // E'lon matni: birinchi `count` ta sababning iqtibosi belgilanadi
  function renderText(ex, count) {
    const box = $('.demo-text');
    box.textContent = '';
    const quotes = ex.reasons.slice(0, count).map(r => r.quote);
    const ranges = quotes.map(q => [ex.text.indexOf(q), q.length]).filter(([i]) => i >= 0).sort((a, b) => a[0] - b[0]);
    let pos = 0;
    for (const [i, len] of ranges) {
      if (i < pos) continue;
      box.append(ex.text.slice(pos, i), el('mark', ex.reasons.find(r => r.quote === ex.text.slice(i, i + len)).flag.startsWith('disc:') ? 'm-disc' : '', ex.text.slice(i, i + len)));
      pos = i + len;
    }
    box.append(ex.text.slice(pos));
  }

  function verdictNode(ex) {
    const [dot, word] = LEVEL[ex.level];
    const wrap = el('div', 'demo-verdict');
    wrap.append(el('div', `lvl lvl-${ex.level}`, `${dot} Firibgarlik xavfi: ${word}`));
    const disc = ex.reasons.filter(r => r.flag.startsWith('disc:')).length;
    if (disc) wrap.append(el('div', 'lvl lvl-disc', `⚖️ Kamsitish: ${disc} ta talab`));
    if (ex.trafficking) wrap.append(el('span', 'tag high', '🚨 Odam savdosi belgisi'));
    return wrap;
  }

  function reasonNode(r) {
    const li = el('li', r.flag.startsWith('disc:') ? 'disc' : '');
    li.append(el('b', '', `${r.flag.startsWith('disc:') ? '⚖️' : '⚠️'} ${r.label}`), el('q', '', r.quote));
    return li;
  }

  async function show(i) {
    const id = ++run;
    const ex = EXAMPLES[i];
    root.dataset.state = 'running';
    root.setAttribute('aria-busy', 'true');
    $('.demo-title').textContent = ex.title;
    $('.demo-result').textContent = '';
    $('.demo-note').hidden = true;
    const box = $('.demo-text');
    try {
      if (reduced()) {
        renderText(ex, ex.reasons.length);
      } else {
        // Matn tez "yoziladi" (~1 s), keyin natija va sabablar birma-bir chiqadi
        const step = Math.max(2, Math.ceil(ex.text.length / 40));
        for (let n = 0; n < ex.text.length; n += step) { box.textContent = ex.text.slice(0, n) + '▍'; await wait(25, id); }
        box.textContent = ex.text;
        $('.demo-result').append(el('p', 'demo-loading', '⏳ Tahlil qilinmoqda…'));
        await wait(500, id);
        $('.demo-result').textContent = '';
      }
      $('.demo-result').append(verdictNode(ex));
      const list = el('ul', 'reasons demo-reasons');
      $('.demo-result').append(list);
      for (let k = 0; k < ex.reasons.length; k++) {
        if (!reduced()) await wait(450, id);
        list.append(reasonNode(ex.reasons[k]));
        renderText(ex, k + 1);
      }
      $('.demo-note').hidden = false;
      root.dataset.state = 'done';
      root.setAttribute('aria-busy', 'false');
      $('.demo-live').textContent = `Demo misol, ${ex.title}: firibgarlik xavfi ${LEVEL[ex.level][1]}. ${ex.reasons.map(r => r.label).join('; ')}.`;
    } catch (e) { /* yangi misol boshlandi — eski animatsiya to'xtatildi */ }
  }

  $('.demo-next').addEventListener('click', () => { index = (index + 1) % EXAMPLES.length; show(index); });
  show(index);
})();
