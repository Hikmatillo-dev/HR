// Brauzer testlari (Playwright): npm run test:ui
// Accessibility, mobil ko'rinish va kontrast (WCAG AA) — yorug' va qorong'i rejimda.
// Playwright o'rnatilmagan bo'lsa test o'tkazib yuboriladi (npm test'ga kirmaydi).
import assert from 'node:assert/strict';
import { execSync, spawn } from 'node:child_process';
import net from 'node:net';
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

// Regressiya (79a07f7, 6f70853): CSV formula injection va "oson pul" kanalining reytingi
const exportOf = (name, texts) => JSON.stringify({
  name, type: 'public_channel',
  messages: texts.map((text, i) => ({ id: i + 1, type: 'message', date: `2026-10-0${i + 1}T10:00:00`, text }))
});
const EASY_MONEY = [
  "Uydan turib kuniga 500 000 so'm daromad! Telefon bo'lsa yetarli, tajriba shart emas. Lichkaga yozing.",
  "Oson pul! Kuniga 2-3 soat ishlab oyiga 10 mln. Faqat telefon kerak, batafsil lichkada.",
  "Onlayn ish, uyda o'tirib kuniga 300 000 so'm topish mumkin. Yoshi 18+ hamma uchun, batafsil lichkada."
];

await test("CSV eksport: = + - @ bilan boshlangan katak formula bo'lib bajarilmaydi (oldiga ' qo'yiladi), UTF-8 BOM bor", async () => {
  const { page, errors } = await open({ demo: false });
  await page.setInputFiles('#fileInput', { name: 'csv.json', mimeType: 'application/json', buffer: Buffer.from(exportOf('=Kanal', [
    "=HYPERLINK(\"http://x.uz\",\"bos\") Sotuvchi kerak, Toshkent, oylik 4 mln so'm, 5/2 grafik.",
    "@kanal: Haydovchi kerak, B toifa. Oylik 6 mln so'm, Samarqand, mehnat shartnomasi asosida."
  ])) });
  await page.waitForTimeout(600);
  const csv = await page.evaluate(async () => {
    let blob; const orig = URL.createObjectURL;
    URL.createObjectURL = b => { blob = b; return orig.call(URL, b); };
    window.IQ.exportCsv();
    URL.createObjectURL = orig;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return { bom: [...bytes.slice(0, 3)], text: new TextDecoder().decode(bytes) };
  }).then(r => { assert.deepEqual(r.bom, [0xEF, 0xBB, 0xBF], "UTF-8 BOM yo'q"); return r.text; });
  assert.ok(csv.includes(`"'=HYPERLINK(""http://x.uz"",""bos"")`), "formula katagi himoyalanmagan");
  assert.ok(csv.includes(`"'=Kanal"`), "kanal nomi himoyalanmagan");
  assert.ok(!/(^|,)"[=+\-@]/m.test(csv), "himoyasiz formula katagi qoldi");
  assert.deepEqual(errors, []);
  await page.close();
});

await test("Kanallar reytingi: faqat o'rtacha xavfli ('oson pul') e'lonlardan iborat kanal 'A' emas, 'F' oladi", async () => {
  const { page, errors } = await open({ demo: false });
  await page.setInputFiles('#fileInput', { name: 'oson.json', mimeType: 'application/json', buffer: Buffer.from(exportOf('Oson pul kanali', EASY_MONEY)) });
  await page.waitForTimeout(600);
  const row = page.locator('#channelRows tr', { hasText: 'Oson pul kanali' });
  assert.equal((await row.locator('.grade').textContent()).trim(), 'F');
  assert.match(await row.textContent(), /100%/);
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

for (const [width, height, menu] of [[320, 640, true], [390, 844, true], [768, 1024, true], [844, 390, true], [1280, 800, false], [1366, 768, false]]) {
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

await test("Accessibility: barcha ko'rinadigan input/select nomlangan, grafiklarda role=img va tavsif, sarlavhalar tartibi buzilmagan", async () => {
  const { page } = await open();
  const r = await page.evaluate(() => {
    const vis = e => e.offsetParent !== null;
    const unlabeled = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')]
      .filter(e => vis(e) && !(e.labels?.length || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby'))).map(e => e.id || e.name);
    const charts = [...document.querySelectorAll('canvas')].filter(c => c.getAttribute('role') !== 'img' || !c.getAttribute('aria-label')).map(c => c.id);
    const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis).map(h => +h.tagName[1]);
    const skips = heads.filter((l, i) => i && l > heads[i - 1] + 1);
    const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
    return { unlabeled, charts, skips, dup: Object.keys(ids).filter(k => ids[k] > 1), h1: document.querySelectorAll('h1').length };
  });
  assert.deepEqual(r, { unlabeled: [], charts: [], skips: [], dup: [], h1: 1 });
  await page.close();
});

for (const [width, scheme] of [[1366, 'light'], [390, 'dark']]) {
  await test(`Validatsiya ${width}px ${scheme}: bo'sh, 'abc', '12345 !!! ???' — baho yo'q, aniq xabar; haqiqiy e'lon — baho bor`, async () => {
    const { page, errors } = await open({ demo: false, width, scheme });
    const MSG = "E'lon matni juda qisqa yoki mazmunsiz. Kamida 20 belgi va harfli so'z kiriting.";
    for (const text of ['', 'abc', '12345 !!! ???']) {
      await page.fill('#input', text); await page.click('#btnCheck'); await page.waitForTimeout(150);
      assert.equal(await page.locator('#result .lvl, #result .gauge').count(), 0, `"${text}" uchun baho chiqmasligi kerak`);
      assert.equal(await page.locator('#btnAi').count(), 0, 'AI tugmasi chiqmasligi kerak');
      assert.equal((await page.textContent('#result .invalid-msg')).replace('⚠️', '').trim(), MSG);
      assert.equal(await page.getAttribute('#result .invalid-msg', 'role'), 'alert');
    }
    // Yozish paytida (avtomatik yangilanish) ham mazmunsiz matnga baho chiqmaydi
    await page.fill('#input', '1234567890 1234567890 ....'); await page.waitForTimeout(400);
    assert.equal(await page.locator('#result .lvl').count(), 0);
    // Haqiqiy qisqa e'lon bloklanmaydi
    await page.fill('#input', 'Ish bor. Batafsil lichkada.'); await page.click('#btnCheck'); await page.waitForTimeout(150);
    assert.equal(await page.locator('#result .lvl').count() > 0, true, "haqiqiy e'longa baho chiqishi kerak");
    // Tozalash — bo'sh holat (xabar emas)
    await page.click('#btnClear'); await page.waitForTimeout(100);
    assert.equal(await page.locator('#result .invalid-msg').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    assert.deepEqual(errors, []);
    await page.close();
  });
}

await test("Hero: 'Zamonaviy kasblar bozoriga xavfsiz kiring', asosiy matn, 3 qiymat, CTA nomlari, ma'lumot manbasi aniq", async () => {
  const { page } = await open({ demo: false });
  assert.equal((await page.textContent('.hero h1')).trim(), 'Zamonaviy kasblar bozoriga xavfsiz kiring');
  assert.equal((await page.textContent('.hero-lead')).trim(),
    "Kasblar va ko'nikmalar talabini ko'ring, hudud va maoshlarni tahlil qiling, Telegram'dagi xavfli yoki kamsituvchi e'lonlarni aniqlang.");
  assert.deepEqual(await page.locator('.hero-values b').allTextContents(), ["Kasblar va ko'nikmalar", 'Hudud va maosh', 'Xavfsiz vakansiyalar']);
  assert.deepEqual((await page.locator('.hero-values span').allTextContents()).map(s => s.trim()),
    ["Qaysi yo'nalishlarga talab borligini ko'ring", "Qayerda imkoniyat va maosh ko'proq ekanini tahlil qiling", "Firibgarlik, kamsitish va xavfli e'lonlarni aniqlang"]);
  assert.deepEqual(await page.locator('.hero-cta a').allTextContents(), ['Vakansiyani tekshirish', "Zamonaviy kasblarni ko'rish"]);
  assert.match(await page.textContent('#heroSource'), /^Manba: real namuna — 5 ta Telegram kanalidan qo'lda tekshirilgan 34 ta e'lon/);
  assert.equal(await page.isVisible('#heroDemo'), true, "jonli misol saqlanishi kerak");
  // Demo rejimda bosh sahifa raqamlari va manba yozuvi o'zgarmaydi (sintetik raqam bosh sahifaga chiqmaydi)
  const before = await page.textContent('#heroStats');
  await page.click('[data-mode="demo"]'); await page.waitForTimeout(400);
  assert.equal(await page.textContent('#heroStats'), before);
  assert.match(await page.textContent('#heroSource'), /real namuna/);
  await page.close();
});

await test("Hero CTA'lari: 'Vakansiyani tekshirish' → #tekshir, 'Zamonaviy kasblarni ko'rish' → #kasblar (smooth scroll)", async () => {
  const { page } = await open({ demo: false, width: 1366 });
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'smooth');
  for (const [text, id] of [['Vakansiyani tekshirish', 'tekshir'], ["Zamonaviy kasblarni ko'rish", 'kasblar']]) {
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
    await page.click(`.hero-cta a:has-text("${text}")`);
    await page.waitForFunction(id => { const t = document.getElementById(id).getBoundingClientRect().top; return t >= 0 && t < 120; }, id, { timeout: 4000 });
    assert.equal(await page.evaluate(() => location.hash), '#' + id);
  }
  await page.close();
});

await test("Menyu: 'Zamonaviy kasblar' kompyuterda ko'rinadi, ☰ mobil menyuda bor va #kasblar ga olib boradi; Tab bilan ham ochiladi", async () => {
  const { page } = await open({ demo: false, width: 1366 });
  const desk = page.locator('#mainNav a[href="#kasblar"]');
  assert.equal((await desk.textContent()).trim(), 'Zamonaviy kasblar');
  assert.equal(await desk.isVisible(), true);
  assert.equal(await page.locator('#mainNav a').nth(1).getAttribute('href'), '#kasblar', "menyuda 'Tekshirish' dan keyin turadi");
  await page.close();
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await m.goto(PAGE);
  await m.click('#menuBtn');
  const link = m.locator('#mainNav a[href="#kasblar"]');
  assert.equal(await link.isVisible(), true);
  assert.equal((await link.textContent()).trim(), 'Zamonaviy kasblar');
  await link.click(); await m.waitForTimeout(200);
  assert.equal(await m.evaluate(() => location.hash), '#kasblar');
  assert.equal(await m.getAttribute('#menuBtn', 'aria-expanded'), 'false', 'menyu yopiladi');
  await m.focus('#menuBtn'); await m.keyboard.press('Enter'); await m.waitForTimeout(100);
  assert.equal(await m.getAttribute('#menuBtn', 'aria-expanded'), 'true', 'klaviatura bilan ochiladi');
  await m.close();
});

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

const CONTRAST_SELECTORS = ['.skip-link', '.lvl-high', '.lvl-medium', '.lvl-low', '.lvl-disc', '#demoBadge', '.tag.high', '.tag.low', '.tag.disc', '.badge-warn',
  '.kpi span', '.data-note', '.muted', '.hint', '.reasons small', 'mark', '.grade', '.tile', '.mode-switch button[aria-pressed="true"]',
  'nav a', 'button.primary', '.map-ctrl button.on', '.src-text',
  '.hero h1', '.hero h1 span', '.hero-lead', '.hero-values b', '.hero-values span', '.hero-cta a', '.hero-source', '.hero-stats div',
  '.invalid-msg', '.careers-thin h3', '.careers-thin p', '.careers-thin p b', '#btnCareersUpload',
  '.demo-card .demo-badge', '.demo-card h2', '.demo-text', '.demo-reasons b', '.demo-reasons q', '.demo-note', '.demo-foot .small-link'];

for (const scheme of ['light', 'dark']) {
  await test(`Kontrast WCAG AA (${scheme}): matn ≥ 4.5:1, katta matn ≥ 3:1 — DEMO belgisi va xavf darajalari ham`, async () => {
    const { page } = await open({ scheme });
    await page.waitForSelector('#heroDemo[data-state="done"]', { timeout: 8000 });
    const fails = [];
    // 'real' — real namuna: "Kasblar" bo'limida "ma'lumot yetarli emas" holati ko'rinadi
    // 'invalid' — mazmunsiz matn uchun ogohlantirish
    const examples = ['scam', 'disc', 'ok', null, 'real', 'invalid'];
    for (const ex of examples) {
      if (ex === 'real') await page.click('[data-mode="real"]');
      else if (ex === 'invalid') { await page.fill('#input', 'abc'); await page.click('#btnCheck'); }
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

// M10 (bug-hunt): yozish paytida xato xabari (role="alert") chiqmasligi — faqat "Tekshirish" bosilganda
await test("Yozish paytida qisqa matn: xato xabari va role=alert chiqmaydi; 'Tekshirish' bosilganda chiqadi", async () => {
  const { page, errors } = await open({ demo: false });
  await page.focus('#input');
  await page.keyboard.type('ab', { delay: 40 }); await page.waitForTimeout(450);
  assert.equal(await page.locator('#result [role="alert"]').count(), 0, 'yozish paytida role=alert chiqdi');
  assert.equal(await page.locator('#result .lvl').count(), 0, 'qisqa matnga baho chiqmasligi kerak');
  assert.match(await page.textContent('#result'), /Natija shu yerda chiqadi/);
  // Avval to'g'ri natija bo'lsa ham, matn qisqartirilganda eski baho qolmaydi
  await page.fill('#input', "Koreyaga ish! Hujjat uchun to'lov 500$."); await page.waitForTimeout(400);
  assert.equal(await page.locator('#result .lvl').count(), 1);
  await page.fill('#input', 'Kor'); await page.waitForTimeout(400);
  assert.equal(await page.locator('#result .lvl').count(), 0, 'eski baho qolib ketdi');
  assert.equal(await page.locator('#result [role="alert"]').count(), 0);
  await page.click('#btnCheck'); await page.waitForTimeout(150);
  assert.equal(await page.locator('#result [role="alert"]').count(), 1, "'Tekshirish' bosilganda xabar chiqishi kerak");
  // Yozib bo'lgach darhol (250 ms ichida) bosilsa ham, kechikkan avtomatik yangilanish xabarni o'chirmaydi
  await page.fill('#input', 'abc'); await page.click('#btnCheck'); await page.waitForTimeout(500);
  assert.equal(await page.locator('#result [role="alert"]').count(), 1, 'kechikkan avtomatik yangilanish xabarni o\'chirdi');
  assert.deepEqual(errors, []);
  await page.close();
});

// ---------- H2: kirillcha iqtiboslar asl matnda ----------
const KIRILL_RISK = "Кореяга иш! Виза 100% кафолатланган. Ҳужжатлар учун олдиндан 500$ тўлов қиласиз, паспортингизни бизга топширасиз. Тез ёзинг, жойлар чекланган!";
async function checkText(page, text) {
  await page.evaluate(() => { window.__copied = []; IQ.copy = t => window.__copied.push(t); });
  if (text.startsWith('example:')) await page.click(`[data-example="${text.slice(8)}"]`); else { await page.fill('#input', text); await page.click('#btnCheck'); }
  await page.waitForTimeout(200);
  return page.$$eval('#result .src-text mark', m => m.map(x => x.textContent));
}
for (const [width, scheme] of [[1366, 'light'], [390, 'dark']]) {
  await test(`Kirill e'lon ${width}px ${scheme}: kamida 4 ta sabab asl kirill matnda belgilanadi (lotin transliteratsiya emas)`, async () => {
    const { page, errors } = await open({ demo: false, width, scheme });
    const m = await checkText(page, KIRILL_RISK);
    assert.ok(m.length >= 4, `belgilar: ${JSON.stringify(m)}`);
    for (const x of m) { assert.ok(KIRILL_RISK.includes(x), `"${x}" asl matnda yo'q`); assert.match(x, /[а-яёўқғҳ]/i, `"${x}" kirillcha emas`); }
    for (const x of ['олдиндан 500$', 'паспортингизни бизга топшир', 'Виза 100%', 'Корея']) assert.ok(m.includes(x), `"${x}" belgilanmagan: ${JSON.stringify(m)}`);
    assert.ok(await page.locator('#result .reasons li').count() >= 5, "sabablar ro'yxati to'liq emas");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    assert.deepEqual(errors, []);
    await page.close();
  });
}

await test("Kirill e'lon: shikoyat va 'Natijani nusxalash' matnida asl kirill fragment, lotincha transliteratsiya yo'q", async () => {
  const { page } = await open({ demo: false });
  await checkText(page, KIRILL_RISK);
  await page.click('#btnShare'); await page.click('#btnReport');
  const [share, complaint] = await page.evaluate(() => window.__copied);
  for (const f of ['олдиндан 500$', 'паспортингизни бизга топшир', 'Виза 100%']) {
    assert.ok(complaint.includes(`("${f}")`), `shikoyatda "${f}" yo'q:\n${complaint}`);
    assert.ok(share.includes(f), `nusxada "${f}" yo'q:\n${share}`);
  }
  for (const latin of ['oldindan 500$', 'pasportingizni', 'viza 100%', 'joylar cheklangan']) {
    assert.ok(!complaint.toLowerCase().includes(latin), `shikoyatda lotincha "${latin}"`);
    assert.ok(!share.toLowerCase().includes(latin), `nusxada lotincha "${latin}"`);
  }
  await page.close();
});

await test("Fallback: asl matnda yo'q hisoblangan iqtibos (maosh '31.5 mln so'm') — sabab ko'rinadi, lekin hech narsa noto'g'ri belgilanmaydi", async () => {
  const { page } = await open({ demo: false });
  const m = await checkText(page, 'example:cyrl');
  const text = await page.inputValue('#input');
  assert.ok(m.length >= 4, JSON.stringify(m));
  for (const x of m) assert.ok(text.includes(x), `"${x}" asl matnda yo'q`);
  assert.match(await page.textContent('#result .reasons'), /haddan tashqari yuqori maosh/);
  await page.click('#btnReport');
  const complaint = (await page.evaluate(() => window.__copied))[0];
  assert.match(complaint, /- Tajribasiz ish uchun haddan tashqari yuqori maosh\n/, "fallback: sabab iqtibossiz bo'lishi kerak");
  assert.ok(!complaint.includes("31.5 mln so'm"), complaint);
  await page.close();
});

await test("Lotin va rus e'lonlari: belgilangan iqtiboslar avvalgidek; shikoyatda asl fragment", async () => {
  const { page } = await open({ demo: false });
  const lat = "Koreyaga ish! Viza 100% kafolatlangan. Hujjatlar uchun oldindan 500$ to'lov qilasiz, pasportingizni bizga topshirasiz. Joylar cheklangan!";
  assert.deepEqual(await checkText(page, lat), ['Koreya', 'Viza 100%', 'oldindan 500$', 'pasportingizni bizga topshir', 'Joylar cheklangan']);
  const ru = 'Работа в Корее! Виза 100% гарантия. Оплата за оформление документов 500$ заранее. Паспорт оставляете у работодателя. Срочно, места ограничены!';
  assert.deepEqual(await checkText(page, ru), ['100% гарант', 'Оплата за оформлени', 'Паспорт оставл', 'Срочно']);
  await page.click('#btnReport');
  const complaint = (await page.evaluate(() => window.__copied))[0];
  for (const f of ['Оплата за оформлени', 'Паспорт оставл', '100% гарант', 'Срочно']) assert.ok(complaint.includes(`("${f}")`), `"${f}" yo'q:\n${complaint}`);
  assert.deepEqual(await checkText(page, 'example:disc'), ['faqat qizlar', '20-27 yosh', "ko'rinishi chiroyli", 'turmushga chiqmagan']);
  await page.close();
});

// ---------- P0-5: klaviatura va sensorli ekran ----------
// Bo'lim sarlavhasi yopishqoq yuqori panel ostida qolmay, ekran tepasida turganini kutadi
async function waitSectionTop(page, id, label) {
  try {
    await page.waitForFunction(id => { const t = document.getElementById(id).getBoundingClientRect().top; return t >= document.querySelector('.topbar').getBoundingClientRect().bottom - 1 && t < 140; }, id, { timeout: 5000 });
  } catch {
    const st = await page.evaluate(id => ({ top: Math.round(document.getElementById(id).getBoundingClientRect().top), bar: Math.round(document.querySelector('.topbar').getBoundingClientRect().bottom), y: Math.round(scrollY) }), id);
    throw new Error(`${label}: #${id} ${JSON.stringify(st)}`);
  }
}

for (const [width, scheme] of [[1366, 'light'], [390, 'dark']]) {
  await test(`Skip-link ${width}px ${scheme}: birinchi Tab — "Asosiy tarkibga o'tish" ko'rinadi va aniq ramkali; Enter — tekshiruv bo'limi, keyingi Tab — matn maydoni`, async () => {
    const { page, errors } = await open({ demo: false, width, scheme });
    const link = page.locator('.skip-link');
    const box0 = await link.boundingBox();
    assert.ok(box0.y + box0.height <= 0, 'fokussiz holatda ko\'rinib turibdi');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link', 'birinchi fokus skip-link emas');
    assert.equal((await link.textContent()).trim(), "Asosiy tarkibga o'tish");
    await page.waitForTimeout(250);
    const box = await link.boundingBox();
    assert.ok(box.y >= 0 && box.x >= 0 && box.x + box.width <= width, 'fokusda ekranda emas');
    assert.ok(box.height >= 44, `balandligi ${box.height}`);
    const style = await link.evaluate(e => { const c = getComputedStyle(e); return { w: parseFloat(c.outlineWidth), s: c.outlineStyle, z: +c.zIndex }; });
    assert.ok(style.w >= 2 && style.s === 'solid', 'fokus ramkasi yo\'q');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.id === 'tekshir', null, { timeout: 2000 });
    assert.equal(await page.evaluate(() => location.hash), '#tekshir');
    await waitSectionTop(page, 'tekshir', 'skip-link');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'input', 'Tab matn maydoniga o\'tmadi');
    assert.deepEqual(errors, []);
    await page.close();
  });
}

const PRIMARY_TARGETS = [['.hero-cta a[href="#tekshir"]', 'Vakansiyani tekshirish'], ['.hero-cta a[href="#kasblar"]', "Zamonaviy kasblarni ko'rish"],
  ['#btnCheck', 'Tekshirish'], ['#btnClear', 'Tozalash'], ['#btnUpload', 'Telegram eksportini yuklash'], ['#btnSampleUpload', "O'z kanalingiz eksportini yuklang"],
  ['#menuBtn', 'Menyu', true], ['#themeBtn', 'Rejim', true], ['#heroDemo .demo-next', "Boshqasini ko'rish"],
  ['[data-mode="real"]', "Real ma'lumot"], ['[data-mode="demo"]', 'Demo'],
  ['#fSearch', 'Qidirish'], ['#fLevel', 'Xavf filtri'], ['#fRegion', 'Hudud filtri'], ['#fCategory', 'Soha filtri']];
for (const [width, scheme] of [[390, 'light'], [390, 'dark'], [768, 'light']]) {
  await test(`Touch target ${width}px ${scheme}: asosiy amallar ≥ 44px (menyu va rejim tugmasi 44×44), mayda misol tugmalari o'zgarmagan, gorizontal scroll yo'q`, async () => {
    const { page } = await open({ demo: false, width, scheme });
    await page.waitForTimeout(300);
    const small = [];
    for (const [sel, name, square] of PRIMARY_TARGETS) {
      const box = await page.locator(sel).first().boundingBox();
      if (!box) { small.push(`${name}: ko'rinmaydi`); continue; }
      if (box.height < 44 || (square && box.width < 44)) small.push(`${name} ${Math.round(box.width)}×${Math.round(box.height)}`);
    }
    assert.deepEqual(small, []);
    if (width === 390) {
      const ex = await page.locator('#tekshir [data-example="disc"]').boundingBox();
      assert.ok(ex.height < 44, "misol tugmalari majburan 44px qilinmasligi kerak");
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.close();
  });
}

await test("390px: ☰ menyu, 🌓 rejim va ikkala CTA 44px bilan ham oldingidek ishlaydi; bo'lim sarlavhasi yuqori panel ostida qolmaydi", async () => {
  const { page, errors } = await open({ demo: false, width: 390 });
  // Telefonda jonli misol hero ichida: animatsiya (~4 s) davomida hero balandligi o'sadi, shuning uchun tugashini kutamiz
  await page.waitForSelector('#heroDemo[data-state="done"]', { timeout: 8000 });
  await page.click('#themeBtn');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await page.click('#themeBtn');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
  await page.click('#menuBtn');
  assert.equal(await page.getAttribute('#menuBtn', 'aria-expanded'), 'true');
  const nav = await page.locator('#mainNav').boundingBox(), bar = await page.locator('.topbar').boundingBox();
  assert.ok(Math.abs(nav.y - (bar.y + bar.height)) <= 2, 'menyu yuqori panelga yopishmagan');
  await page.click('#mainNav a[href="#kasblar"]');
  await waitSectionTop(page, 'kasblar', 'menyu');
  for (const [href, id] of [['#tekshir', 'tekshir'], ['#kasblar', 'kasblar']]) {
    // Tepaga darhol qaytamiz (smooth scroll tugashini kutmaslik uchun), keyin CTA bosiladi
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(200);
    await page.click(`.hero-cta a[href="${href}"]`);
    await waitSectionTop(page, id, `CTA ${href}`);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.deepEqual(errors, []);
  await page.close();
});

await test("npm run demo:local: kalitsiz server, e'lon tekshiriladi, '🤖 AI chuqur tahlil' o'chiq va sababi yozilgan", async () => {
  const port = await new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const child = spawn(process.execPath, ['tools/demo-local.mjs'], { cwd: ROOT, env: { PATH: process.env.PATH, PORT: String(port), GEMINI_API_KEY: 'AIza-test-NOT-REAL' } });
  try {
    let log = ''; child.stdout.on('data', d => { log += d; });
    for (let i = 0; i < 100 && !log.includes('IshQalqon: http'); i++) await new Promise(r => setTimeout(r, 50));
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.fill('#input', "Koreyaga ish! Viza 100% kafolatlangan. Hujjatlar uchun oldindan 500$ to'lov qilasiz.");
    await page.click('#btnCheck');
    await page.waitForFunction(() => /faollashtirilmagan/.test(document.querySelector('#aiStatus')?.textContent || ''), null, { timeout: 5000 });
    assert.match(await page.textContent('#result'), /Firibgarlik xavfi: yuqori/);
    assert.equal(await page.isDisabled('#btnAi'), true);
    assert.equal(await page.textContent('#aiStatus'), 'AI tahlil faollashtirilmagan: ANTHROPIC_API_KEY yoki GEMINI_API_KEY sozlanmagan.');
    assert.deepEqual(errors, []);
    await page.close();
  } finally { child.kill('SIGINT'); }
});

await browser.close();
console.log(`\n${passed} ta UI testi o'tdi${process.exitCode ? ', xatolar bor' : ''}\n`);
