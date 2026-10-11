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
  if (opts.demo !== false) { await page.click('#btnDemoEmpty'); await page.waitForTimeout(500); }
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

const CONTRAST_SELECTORS = ['.lvl-high', '.lvl-medium', '.lvl-low', '#demoBadge', '.tag.high', '.tag.low', '.tag.disc', '.badge-warn',
  '.kpi span', '.data-note', '.muted', '.hint', '.reasons small', 'mark', '.grade', '.tile', '.mode-switch button[aria-pressed="true"]',
  'nav a', 'button.primary', '.map-ctrl button.on', '.src-text'];

for (const scheme of ['light', 'dark']) {
  await test(`Kontrast WCAG AA (${scheme}): matn ≥ 4.5:1, katta matn ≥ 3:1 — DEMO belgisi va xavf darajalari ham`, async () => {
    const { page } = await open({ scheme });
    const fails = [];
    const examples = ['scam', 'disc', 'ok', null];
    for (const ex of examples) {
      if (ex) await page.click(`[data-example="${ex}"]`);
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
