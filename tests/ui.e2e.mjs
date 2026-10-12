// Brauzer testlari (Playwright): npm run test:ui
// Accessibility, mobil ko'rinish va kontrast (WCAG AA) — yorug' va qorong'i rejimda.
// Playwright o'rnatilmagan bo'lsa test o'tkazib yuboriladi (npm test'ga kirmaydi).
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  try { ({ chromium } = await import(pathToFileURL(path.join(execSync('npm root -g').toString().trim(), 'playwright/index.mjs')).href)); }
  catch { console.log("Playwright topilmadi — UI testlari o'tkazib yuborildi (npm i -D playwright)."); process.exit(0); }
}

const PAGE = pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../index.html')).href;
const browser = await chromium.launch(process.env.PLAYWRIGHT_BROWSERS_PATH ? { executablePath: path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium') } : {}).catch(() => chromium.launch());
let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message.split('\n').slice(0, 6).join('\n    ')}`); process.exitCode = 1; }
}
async function open(opts = {}) {
  const page = await browser.newPage({ viewport: { width: opts.width || 1280, height: 900 }, colorScheme: opts.scheme || 'light' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(PAGE);
  if (opts.demo !== false) { await page.click('[data-mode="demo"]'); await page.waitForTimeout(500); }
  return { page, errors };
}

console.log('UI testlari (Playwright)');

await test('Xarita kataklari klaviatura bilan: Tab, Enter va Space, aria-pressed', async () => {
  const { page, errors } = await open();
  const tile = () => page.locator('.tile[data-region="Samarqand"]');
  assert.equal(await tile().evaluate(e => e.tagName), 'BUTTON');
  await page.locator('#mapCtrl button').last().focus();
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(() => document.activeElement.classList.contains('tile')), "Tab xarita katagiga o'tmadi");
  await tile().focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  assert.equal(await page.inputValue('#fRegion'), 'Samarqand');
  assert.equal(await tile().getAttribute('aria-pressed'), 'true');
  await tile().focus(); await page.keyboard.press('Space'); await page.waitForTimeout(200);
  assert.equal(await page.inputValue('#fRegion'), '');
  assert.deepEqual(errors, []);
  await page.close();
});

await test("Toast xabarlari aria-live=\"polite\" orqali e'lon qilinadi", async () => {
  const { page } = await open();
  assert.equal(await page.getAttribute('#liveRegion', 'aria-live'), 'polite');
  await page.evaluate(() => window.IQ.toast('Sinov xabari'));
  await page.waitForTimeout(150);
  assert.equal(await page.textContent('#liveRegion'), 'Sinov xabari');
  assert.equal(await page.getAttribute('.toast', 'aria-hidden'), 'true');
  await page.close();
});

await test("Jonli misol: 'Demo misol' belgisi, 8 soniyada tugaydi, sabablar va iqtiboslar, izoh; 'Boshqasini ko'rish' almashtiradi", async () => {
  const { page, errors } = await open({ demo: false });
  assert.equal((await page.textContent('#heroDemo .demo-badge')).trim(), 'Demo misol');
  const t0 = Date.now();
  await page.waitForSelector('#heroDemo[data-state="done"]', { timeout: 8000 });
  assert.ok(Date.now() - t0 < 8000);
  assert.match(await page.textContent('#heroDemo .demo-verdict'), /Firibgarlik xavfi: yuqori/);
  assert.equal(await page.locator('#heroDemo .demo-reasons li').count(), 3);
  assert.ok(await page.locator('#heroDemo .demo-text mark').count() >= 3, 'iqtiboslar matnda belgilanmagan');
  assert.match(await page.textContent('#heroDemo .demo-note'), /Bu avtomatik tahlil/);
  assert.match(await page.textContent('#heroDemo .demo-live'), /Demo misol/);
  const titles = [await page.textContent('#heroDemo .demo-title')];
  for (let i = 0; i < 2; i++) {
    await page.click('#heroDemo .demo-next');
    await page.waitForSelector('#heroDemo[data-state="done"]', { timeout: 8000 });
    titles.push(await page.textContent('#heroDemo .demo-title'));
  }
  assert.deepEqual(titles, ["Oldindan to'lov", 'Pasport olib qolish', 'Kamsitish']);
  assert.match(await page.textContent('#heroDemo .demo-verdict'), /Kamsitish: 3 ta talab/);
  assert.deepEqual(errors, []);
  await page.close();
});

await test("Jonli misol: 'harakatni kamaytirish' yoqilganda natija darhol chiqadi; 390px da gorizontal scroll yo'q", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto(PAGE);
  await page.waitForSelector('#heroDemo[data-state="done"]', { timeout: 1000 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.close();
});

// Kichik Telegram eksporti: 5 ta halol (past xavfli) e'lon — "Kasblar" uchun 30 tadan kam
const SMALL_EXPORT = JSON.stringify({
  name: 'Kichik kanal', type: 'public_channel', messages: [
    "Sotuvchi kerak. Do'konga, Toshkent, Chilonzor. Oylik 4 mln so'm, 5/2, 9:00-18:00.",
    "Haydovchi kerak, B toifa. Oylik 6 mln so'm, Samarqand, mehnat shartnomasi asosida.",
    "Hisobchi kerak, 1C bilishi shart. Oylik 7 mln so'm, Andijon, ish vaqti 9:00-18:00.",
    "Oshpaz kerak, restoranga. Oylik 5 mln so'm, Buxoro, 2/2 grafik, tushlik bepul.",
    "Farrosh kerak, ofisga. Oylik 3 mln so'm, Namangan, 5/2, rasmiy ishga joylashtirish."
  ].map((text, i) => ({ id: i + 1, type: 'message', date: `2026-10-0${i + 1}T10:00:00`, text }))
});

await test("Kasblar: kichik eksport (5 ta ishonchli e'lon) — grafik o'rniga 'Ma'lumot yetarli emas', N va M aniq, yuklash tugmasi ishlaydi", async () => {
  const { page, errors } = await open({ demo: false });
  await page.setInputFiles('#fileInput', { name: 'kichik.json', mimeType: 'application/json', buffer: Buffer.from(SMALL_EXPORT) });
  await page.waitForTimeout(600);
  assert.equal(await page.isVisible('#careersThin'), true);
  assert.equal(await page.isVisible('#chBubble'), false, 'grafik chizilmasligi kerak');
  assert.equal(await page.isVisible('#chSkills'), false);
  assert.match(await page.textContent('#careersThin'), /Ma'lumot yetarli emas/);
  assert.equal(await page.textContent('#careersThinCount'), "Hozirgi namunada 5 ta noyob e'lon bor, ulardan 5 tasi ishonchli.");
  assert.match(await page.textContent('#careersThin'), /Kasblar va ko'nikmalar tahlili ishonchli/);
  assert.equal(await page.evaluate(() => Chart.getChart('chBubble')), undefined, 'Chart obyekti qolmasligi kerak');
  const chooser = page.waitForEvent('filechooser', { timeout: 2000 });
  await page.click('#btnCareersUpload');
  await chooser;
  assert.deepEqual(errors, []);
  await page.close();
});

await test("Kasblar: real namuna (34 ta, ishonchlilari 30 dan kam) — yetarli emas; demo rejimda — grafik va jadval", async () => {
  const { page } = await open({ demo: false });
  await page.waitForTimeout(300);
  assert.equal(await page.isVisible('#careersThin'), true);
  assert.match(await page.textContent('#careersThinCount'), /^Hozirgi namunada 34 ta noyob e'lon bor, ulardan \d+ tasi ishonchli\.$/);
  await page.click('[data-mode="demo"]'); await page.waitForTimeout(500);
  assert.equal(await page.isVisible('#careersThin'), false);
  assert.equal(await page.isVisible('#chBubble'), true);
  assert.ok(await page.evaluate(() => Boolean(Chart.getChart('chBubble'))));
  assert.ok(await page.locator('#bubbleTable tr').count() > 0, "jadval ko'rinishi to'ldirilmagan");
  await page.close();
});

for (const scheme of ['light', 'dark']) {
  await test(`Kasblar 'yetarli emas' holati 390px ${scheme}: gorizontal scroll yo'q, tugma ekranga sig'adi`, async () => {
    const { page } = await open({ demo: false, width: 390, scheme });
    await page.waitForTimeout(300);
    assert.equal(await page.isVisible('#careersThin'), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    const box = await page.locator('#btnCareersUpload').boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 390, 'tugma ekrandan chiqib ketgan');
    await page.close();
  });
}

await test("Logotip: emoji yo'q, inline SVG qalqon, favicon assets/favicon.svg; qo'lda almashtirilgan rejimda rang o'zgaradi, kontrast ≥ 3:1", async () => {
  const { page, errors } = await open({ demo: false });
  assert.ok(!(await page.textContent('header .brand')).includes('🛡'), 'emoji logotip qolgan');
  assert.ok(!(await page.content()).includes('🛡️</text>'), 'emoji favicon qolgan');
  assert.equal(await page.locator('header .brand svg.brand-logo path').count(), 2, 'inline SVG (qalqon + belgi) yo\'q');
  assert.equal(await page.getAttribute('link[rel="icon"]', 'href'), 'assets/favicon.svg');
  const fs = await import('node:fs');
  const fav = fs.readFileSync(new URL('../assets/favicon.svg', import.meta.url), 'utf8');
  assert.match(fav, /^<svg[^>]+viewBox="0 0 32 32"/);
  assert.ok(fs.existsSync(new URL('../assets/logo.svg', import.meta.url)));
  assert.equal(await page.locator('img[src*="logo.svg"]').count(), 0, "logo.svg HTML'ga <img> orqali ulanmaydi");
  // Grafik element uchun WCAG 1.4.11: qalqon fonga, belgi qalqonga nisbatan ≥ 3:1
  const colors = () => page.evaluate(() => {
    const rgb = c => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const shield = getComputedStyle(document.querySelector('.logo-shield')).fill;
    const check = getComputedStyle(document.querySelector('.logo-check')).stroke;
    const bg = getComputedStyle(document.body).backgroundColor;
    return { shield, toBg: ratio(rgb(shield), rgb(bg)), toCheck: ratio(rgb(shield), rgb(check)) };
  });
  const light = await colors();
  await page.click('#themeBtn'); await page.waitForTimeout(100);
  const dark = await colors();
  assert.notEqual(light.shield, dark.shield, "qo'lda qorong'i rejimga o'tganda rang o'zgarmadi");
  for (const [name, c] of [['yorug\'', light], ['qorong\'i', dark]]) {
    assert.ok(c.toBg >= 3, `${name}: qalqon/fon ${c.toBg.toFixed(2)} < 3`);
    assert.ok(c.toCheck >= 3, `${name}: belgi/qalqon ${c.toCheck.toFixed(2)} < 3`);
  }
  assert.deepEqual(errors, []);
  await page.close();
});

await test("Logotip 390px: sarlavha bir qatorda, logotip ko'rinadi va menyu tugmasi bilan ustma-ust tushmaydi", async () => {
  const { page } = await open({ demo: false, width: 390 });
  const logo = await page.locator('.brand-logo').boundingBox();
  const brand = await page.locator('header .brand').boundingBox();
  const menu = await page.locator('#menuBtn').boundingBox();
  assert.ok(logo.width >= 24 && logo.height >= 24, 'logotip juda kichik');
  assert.ok(brand.height <= 40, 'sarlavha ikki qatorga bo\'lingan');
  assert.ok(brand.x + brand.width <= menu.x, 'logotip menyu tugmasi bilan ustma-ust');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.close();
});

for (const [width, height, menu] of [[320, 640, true], [768, 1024, true], [844, 390, true], [1280, 800, false]]) {
  await test(`${width}×${height}: gorizontal scroll yo'q; ☰ menyu ${menu ? "ko'rinadi" : "yashirin, havolalar sig'adi"}`, async () => {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(PAGE); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, 'gorizontal scroll bor');
    assert.equal(await page.isVisible('#menuBtn'), menu);
    if (!menu) {
      const last = await page.locator('#mainNav a').last().boundingBox();
      assert.ok(last.x + last.width <= width, 'oxirgi menyu havolasi ekrandan chiqib ketgan');
    }
    await page.close();
  });
}

await test("Chop etish (PDF hisobot): sarlavha, sana va manba; tekshiruv va hero chiqmaydi", async () => {
  const { page } = await open({ demo: false });
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.isVisible('.print-head'), true);
  assert.match(await page.textContent('#printMeta'), /Real namuna/);
  assert.equal(await page.isVisible('#tekshir'), false);
  assert.equal(await page.isVisible('.hero'), false);
  await page.close();
});

for (const [width, scheme] of [[390, 'light'], [390, 'dark'], [1280, 'light']]) {
  await test(`Kasblar grafigi ${width}px ${scheme}: yozuvlar ustma-ust tushmaydi, qisqa, jadval bor, gorizontal scroll yo'q`, async () => {
    const { page, errors } = await open({ width, scheme });
    const r = await page.evaluate(() => {
      const ch = Chart.getChart('chBubble'); const ctx = ch.ctx; const boxes = []; const orig = ctx.fillText.bind(ctx);
      const names = new Set(ch.data.datasets[0].data.map(d => d.name));
      ctx.fillText = (t, x, y) => { boxes.push({ t, x, y, w: ctx.measureText(t).width }); orig(t, x, y); };
      ch.draw(); ctx.fillText = orig;
      // Kasb nomi yoki uning qisqartirilgan bo'lagi bo'lgan yozuvlar
      const lab = boxes.filter(b => [...names].some(n => n.includes(b.t.replace('…', '')) && b.t.length > 2));
      let overlaps = 0;
      for (let i = 0; i < lab.length; i++) for (let j = i + 1; j < lab.length; j++) {
        const a = lab[i], c = lab[j];
        if (Math.abs(a.y - c.y) < 10 && a.x < c.x + c.w && c.x < a.x + a.w) overlaps++;
      }
      return { n: lab.length, overlaps, maxLen: Math.max(...lab.map(b => b.t.length)), rows: document.querySelectorAll('#bubbleTable tr').length, sw: document.documentElement.scrollWidth, w: window.innerWidth };
    });
    assert.ok(r.n >= 5, `faqat ${r.n} ta yozuv`);
    assert.equal(r.overlaps, 0);
    if (width < 600) assert.ok(r.maxLen <= 12, `yozuv ${r.maxLen} belgi`);
    assert.ok(r.rows >= 10, 'jadval ko\'rinishi bo\'sh');
    assert.ok(r.sw <= r.w, `gorizontal scroll: ${r.sw} > ${r.w}`);
    assert.deepEqual(errors, []);
    await page.close();
  });
}

const CONTRAST_SELECTORS = ['.lvl-high', '.lvl-medium', '.lvl-low', '.lvl-disc', '#demoBadge', '.tag.high', '.tag.low', '.tag.disc', '.badge-warn',
  '.kpi span', '.data-note', '.muted', '.hint', '.reasons small', 'mark', '.grade', '.tile', '.mode-switch button[aria-pressed="true"]',
  'nav a', 'button.primary', '.map-ctrl button.on', '.src-text',
  '.careers-thin h3', '.careers-thin p', '.careers-thin p b', '#btnCareersUpload',
  '.demo-card .demo-badge', '.demo-card h2', '.demo-text', '.demo-reasons b', '.demo-reasons q', '.demo-note', '.demo-foot .small-link'];

for (const scheme of ['light', 'dark']) {
  await test(`Kontrast WCAG AA (${scheme}): matn ≥ 4.5:1, katta matn ≥ 3:1 — DEMO belgisi va xavf darajalari ham`, async () => {
    const { page } = await open({ scheme });
    await page.waitForSelector('#heroDemo[data-state="done"]', { timeout: 8000 });
    const fails = [];
    // 'real' — real namuna: "Kasblar" bo'limida "ma'lumot yetarli emas" holati ko'rinadi
    const examples = ['scam', 'disc', 'ok', null, 'real'];
    for (const ex of examples) {
      if (ex === 'real') await page.click('[data-mode="real"]');
      else if (ex) await page.click(`[data-example="${ex}"]`);
      else { await page.fill('#input', "Ish bor! Kuniga 100$ to'lanadi. Faqat bugun ro'yxatdan o'ting: cutt.ly/rabota-uz"); await page.click('#btnCheck'); }
      await page.waitForTimeout(250);
      fails.push(...await page.evaluate(sel => {
        const parse = c => { const m = c.match(/[\d.]+/g).map(Number); const k = c.startsWith('color(') ? 255 : 1; return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m[3] ?? 1 }; };
        const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        const blend = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
        const bgOf = el => { const st = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0) st.push(c); if (c.a === 1) break; } let bg = { r: 255, g: 255, b: 255, a: 1 }; for (const c of st.reverse()) bg = blend(c, bg); return bg; };
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
        const out = [];
        for (const s of sel) for (const el of document.querySelectorAll(s)) {
          if (el.offsetParent === null && el.id !== 'demoBadge') continue;
          if (el.id === 'demoBadge' && el.hidden) continue;
          const cs = getComputedStyle(el), bg = bgOf(el), r = ratio(blend(parse(cs.color), bg), bg);
          const size = parseFloat(cs.fontSize), need = size >= 24 || (Number(cs.fontWeight) >= 700 && size >= 18.66) ? 3 : 4.5;
          if (r < need) out.push(`${s} «${el.textContent.trim().slice(0, 20)}» ${r.toFixed(2)} < ${need}`);
        }
        return out;
      }, CONTRAST_SELECTORS));
    }
    assert.deepEqual([...new Set(fails)], []);
    await page.close();
  });
}

await browser.close();
console.log(`\n${passed} ta UI testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
