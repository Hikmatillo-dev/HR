// 6-bo'lim: ish beruvchilar uchun halol vakansiya yaratuvchi
(function () {
  'use strict';
  const IQ = window.IQ, A = window.IshQalqon, { $, esc } = IQ;
  const form = $('#empForm');

  function build() {
    const f = Object.fromEntries(new FormData(form).entries());
    const official = form.official.checked;
    const lines = [`📢 ${f.title || 'Lavozim'} kerak`, ''];
    if (f.company) lines.push(`🏢 Kompaniya: ${f.company}`);
    if (/^\d{9}$/.test(f.stir || '')) lines.push(`STIR: ${f.stir}`);
    if (f.address) lines.push(`📍 Manzil: ${f.address}`);
    const smin = parseFloat(f.smin), smax = parseFloat(f.smax);
    if (smin && smax) lines.push(`💰 Maosh: ${Math.min(smin, smax)}–${Math.max(smin, smax)} mln so'm`);
    else if (smin || smax) lines.push(`💰 Maosh: ${smin || smax} mln so'm`);
    if (f.schedule) lines.push(`🕘 Ish vaqti: ${f.schedule}`);
    if (f.req) lines.push('', `✅ Talablar: ${f.req}`);
    if (f.offer || official) lines.push(`🎁 Biz taklif qilamiz: ${[official ? 'rasmiy ishga joylashtirish (mehnat shartnomasi)' : '', f.offer].filter(Boolean).join(', ')}`);
    lines.push('', "Ishga qabul bepul: biz nomzodlardan hech qanday to'lov olmaymiz.");
    if (f.contact) lines.push(`📞 Aloqa: ${f.contact}`);
    return lines.join('\n');
  }

  function update() {
    const text = build();
    const a = A.analyze(text);
    const t = a.transparency.score;
    const color = t >= 70 ? IQ.color('good') : t >= 40 ? IQ.color('warning') : IQ.color('critical');
    $('#empScore').innerHTML = `
      <div class="gauge" style="--p:${t};--c:${color}"><span>${t}<small>shaffoflik</small></span></div>
      <div><b>${t >= 85 ? "A'lo! Juda shaffof e'lon" : t >= 60 ? "Yaxshi, lekin yaxshilash mumkin" : "Ma'lumot yetarli emas"}</b>
      <div class="muted" style="font-size:.88rem">${a.transparency.checks.filter(c => !c.ok).map(c => '⬜ ' + esc(c.label)).join('<br>') || "Barcha mezonlar bajarilgan ✅"}</div></div>`;
    $('#empPreview').textContent = text;
    const warn = [
      ...a.discrimination.map(d => `<li class="disc"><b>⚖️ ${esc(d.label)}:</b> <small>"${esc(d.match)}" — ${esc(d.fix)}</small></li>`),
      ...a.scam.map(s => `<li><b>⚠️ ${esc(s.label)}</b><small>${esc(s.detail)}</small></li>`)
    ];
    $('#empWarn').innerHTML = warn.length ? `<ul class="reasons" style="margin-top:12px">${warn.join('')}</ul>` : '';
  }

  form.addEventListener('input', update);
  form.addEventListener('submit', e => e.preventDefault());
  $('#empCopy').addEventListener('click', () => IQ.copy(build(), "E'lon matni nusxalandi"));
  update();
})();
