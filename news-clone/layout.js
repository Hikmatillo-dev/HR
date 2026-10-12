// Umumiy qismlar: til, tema, topbar, header, footer, kartochkalar
const params = new URLSearchParams(location.search);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ---------- Til ----------
const LANGS = [
  { id: "uz", label: "O'zb" }, { id: "kr", label: "Ўзб" }, { id: "ru", label: "Рус" }, { id: "en", label: "Eng" },
];
const lang = store.get("lang", "uz");
const T = {
  uz: { latest: "So'nggi yangiliklar", popular: "Ko'p o'qilgan", all: "Barchasi", more: "Ko'proq yuklash", search: "Qidirish...",
    found: "Qidiruv natijalari", nothing: "Hech narsa topilmadi", home: "Bosh sahifa", related: "Mavzuga oid", breaking: "Tezkor",
    video: "Video", minRead: "daqiqa o'qish", author: "Muallif", comments: "Izohlar", write: "Izoh yozing...", name: "Ismingiz",
    send: "Yuborish", noComments: "Hali izoh yo'q. Birinchi bo'ling!", copy: "Havolani nusxalash", copied: "Nusxalandi ✓",
    justNow: "hozirgina", minAgo: "daqiqa oldin", hAgo: "soat oldin", yesterday: "Kecha", tag: "Teg", notFound: "Maqola topilmadi",
    about: "O'quv loyihasi. Barcha yangiliklar to'qima, rasmlar picsum.photos'dan.", sections: "Bo'limlar", contact: "Aloqa",
    subscribe: "Telegram kanalimizga obuna bo'ling", textOnly: "Maqolalar matni faqat o'zbek tilida.", print: "Chop etish", font: "Shrift" },
  ru: { latest: "Последние новости", popular: "Популярное", all: "Все", more: "Загрузить ещё", search: "Поиск...",
    found: "Результаты поиска", nothing: "Ничего не найдено", home: "Главная", related: "По теме", breaking: "Срочно",
    video: "Видео", minRead: "мин чтения", author: "Автор", comments: "Комментарии", write: "Напишите комментарий...", name: "Ваше имя",
    send: "Отправить", noComments: "Пока нет комментариев. Будьте первым!", copy: "Скопировать ссылку", copied: "Скопировано ✓",
    justNow: "только что", minAgo: "мин назад", hAgo: "ч назад", yesterday: "Вчера", tag: "Тег", notFound: "Статья не найдена",
    about: "Учебный проект. Все новости вымышлены, фото с picsum.photos.", sections: "Разделы", contact: "Контакты",
    subscribe: "Подпишитесь на наш Telegram-канал", textOnly: "Тексты статей доступны только на узбекском.", print: "Печать", font: "Шрифт" },
  en: { latest: "Latest news", popular: "Most read", all: "See all", more: "Load more", search: "Search...",
    found: "Search results", nothing: "Nothing found", home: "Home", related: "Related", breaking: "Breaking",
    video: "Video", minRead: "min read", author: "Author", comments: "Comments", write: "Write a comment...", name: "Your name",
    send: "Send", noComments: "No comments yet. Be the first!", copy: "Copy link", copied: "Copied ✓",
    justNow: "just now", minAgo: "min ago", hAgo: "h ago", yesterday: "Yesterday", tag: "Tag", notFound: "Article not found",
    about: "Study project. All news is fictional, photos from picsum.photos.", sections: "Sections", contact: "Contact",
    subscribe: "Subscribe to our Telegram channel", textOnly: "Article texts are in Uzbek only.", print: "Print", font: "Font" },
};

// Lotin -> kirill (Ўзб tugmasi uchun butun matn avtomatik o'giriladi)
function toCyrillic(s) {
  const pairs = [["O'", "Ў"], ["o'", "ў"], ["G'", "Ғ"], ["g'", "ғ"], ["O‘", "Ў"], ["o‘", "ў"], ["G‘", "Ғ"], ["g‘", "ғ"],
    ["Sh", "Ш"], ["sh", "ш"], ["SH", "Ш"], ["Ch", "Ч"], ["ch", "ч"], ["CH", "Ч"], ["Yo", "Ё"], ["yo", "ё"], ["Yu", "Ю"], ["yu", "ю"],
    ["Ya", "Я"], ["ya", "я"], ["Ye", "Е"], ["ye", "е"], ["ng", "нг"], ["'", "ъ"], ["’", "ъ"]];
  const map = { a: "а", b: "б", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п",
    q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з", c: "ц", w: "в" };
  s = s.replace(/(^|[\s«"(])E/g, "$1Э").replace(/(^|[\s«"(])e/g, "$1э");
  for (const [a, b] of pairs) s = s.split(a).join(b);
  return s.replace(/[a-zA-Z]/g, (ch) => { const c = map[ch.toLowerCase()]; return c ? (ch === ch.toLowerCase() ? c : c.toUpperCase()) : ch; });
}
const uiLang = lang === "kr" ? "uz" : lang;
const t = (k) => (lang === "kr" ? toCyrillic(T.uz[k]) : T[uiLang][k]);
const tx = (s) => (lang === "kr" ? toCyrillic(s) : s); // maqola matni
const catName = (id) => { const c = CATEGORIES.find((x) => x.id === id); return c ? tx(c.name[uiLang]) : ""; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- Vaqt va ko'rishlar ----------
const NOW = Date.now();
NEWS.forEach((n) => (n.ts = NOW - n.ago * 60000));
const pad = (x) => String(x).padStart(2, "0");
function when(n) {
  const d = new Date(n.ts), m = Math.round((NOW - n.ts) / 60000);
  if (m < 2) return t("justNow");
  if (m < 60) return `${m} ${t("minAgo")}`;
  const today = new Date(NOW).toDateString() === d.toDateString();
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (today) return hm;
  const y = new Date(NOW - 864e5).toDateString() === d.toDateString();
  return y ? `${t("yesterday")}, ${hm}` : `${hm} / ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}
const views = (n) => n.views + (store.get("views", {})[n.id] || 0);
const fmt = (x) => x.toLocaleString("ru-RU");
const readMin = (n) => Math.max(1, Math.round((n.lead + n.body.join(" ")).split(/\s+/).length / 180));
const author = (n) => AUTHORS[n.id % AUTHORS.length];
const byTime = [...NEWS].sort((a, b) => b.ts - a.ts);

// ---------- Rasmlar ----------
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const img = (id, w = 800, h = 450) => `https://picsum.photos/seed/xabar${id}/${w}/${h}`;
const imgTag = (id, w, h, cls = "") =>
  `<span class="ph ${cls}" style="--h:${(id * 47) % 360}"><img loading="lazy" src="${img(id, w, h)}" alt="" onerror="this.onerror=null;this.src='${BLANK}'"></span>`;

// ---------- Kartochkalar ----------
const meta = (n) => `<div class="meta"><a class="badge" href="index.html?cat=${n.cat}">${catName(n.cat)}</a><span>${when(n)}</span><span>👁 ${fmt(views(n))}</span></div>`;
const playIcon = (n) => (n.video ? `<span class="play">▶</span>` : "");
const cardHTML = (n) => `<article class="card news"><a href="article.html?id=${n.id}" class="imgwrap">${imgTag(n.id, 640, 400)}${playIcon(n)}</a>
  <div class="txt">${meta(n)}<h3><a href="article.html?id=${n.id}">${esc(tx(n.title))}</a></h3></div></article>`;
const rowHTML = (n) => `<article class="row"><a href="article.html?id=${n.id}" class="imgwrap">${imgTag(n.id, 320, 200)}${playIcon(n)}</a>
  <div>${meta(n)}<h3><a href="article.html?id=${n.id}">${esc(tx(n.title))}</a></h3><p>${esc(tx(n.lead))}</p></div></article>`;

// ---------- Topbar, header, footer ----------
function renderChrome() {
  document.documentElement.lang = lang === "kr" ? "uz-Cyrl" : uiLang;
  const theme = store.get("theme", null);
  if (theme) document.documentElement.dataset.theme = theme;
  const MONTHS = { uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
    ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] };
  const d = new Date(NOW);
  const today = uiLang === "en" ? `${MONTHS.en[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    : uiLang === "ru" ? `${d.getDate()} ${MONTHS.ru[d.getMonth()]} ${d.getFullYear()}` : tx(`${d.getDate()}-${MONTHS.uz[d.getMonth()]}, ${d.getFullYear()}`);
  const breaking = byTime.filter((n) => n.breaking);

  document.body.insertAdjacentHTML("afterbegin", `
    <a class="skip" href="#app">${t("home")}</a>
    <div class="topbar"><div class="wrap">
      <span>📅 ${today}</span><span id="weather">${tx("Toshkent")} ☀️ …</span><span id="rates"></span>
      <div class="right">${LANGS.map((l) => `<button class="${l.id === lang ? "active" : ""}" data-lang="${l.id}">${l.label}</button>`).join("")}</div>
    </div></div>
    <header class="main"><div class="wrap">
      <button class="iconbtn menu-btn" id="menuBtn" aria-label="Menu">☰</button>
      <a href="index.html" class="logo">${tx("xabar")}<span>${tx("noma")}</span></a>
      <nav id="nav">${CATEGORIES.map((c) => `<a href="index.html?cat=${c.id}" class="${params.get("cat") === c.id ? "active" : ""}">${catName(c.id)}</a>`).join("")}
        <a href="index.html?video=1" class="${params.get("video") ? "active" : ""}">▶ ${t("video")}</a></nav>
      <form class="search" action="index.html" role="search"><input name="q" placeholder="${t("search")}" value="${esc(params.get("q") || "")}" aria-label="${t("search")}"></form>
      <button class="iconbtn" id="themeBtn" aria-label="Theme">${document.documentElement.dataset.theme === "dark" ? "☀️" : "🌙"}</button>
    </div></header>
    ${breaking.length ? `<div class="ticker"><div class="wrap"><b>⚡ ${t("breaking")}</b><div class="track"><div class="move">
      ${[...breaking, ...breaking].map((n) => `<a href="article.html?id=${n.id}">${esc(tx(n.title))}</a>`).join("")}</div></div></div></div>` : ""}`);

  document.body.insertAdjacentHTML("beforeend", `
    <footer><div class="wrap">
      <div class="fcol"><a href="index.html" class="logo light">${tx("xabar")}<span>${tx("noma")}</span></a><p>${t("about")}</p>
        <a class="tg" href="#">✈️ ${t("subscribe")}</a></div>
      <div class="fcol"><h4>${t("sections")}</h4>${CATEGORIES.map((c) => `<a href="index.html?cat=${c.id}">${catName(c.id)}</a>`).join("")}</div>
      <div class="fcol"><h4>${t("contact")}</h4><span>📍 ${tx("Toshkent shahri")}</span><span>✉️ info@xabarnoma.example</span><span>☎️ +998 00 000 00 00</span></div>
    </div><div class="wrap copy">© ${d.getFullYear()} ${tx("Xabarnoma")}. ${lang !== "uz" && lang !== "kr" ? t("textOnly") : ""}</div></footer>
    <button id="toTop" class="totop" aria-label="Top">↑</button>`);

  document.getElementById("themeBtn").onclick = (e) => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next; store.set("theme", next);
    e.currentTarget.textContent = next === "dark" ? "☀️" : "🌙";
  };
  document.getElementById("menuBtn").onclick = () => document.getElementById("nav").classList.toggle("open");
  document.querySelectorAll("[data-lang]").forEach((b) => (b.onclick = () => { store.set("lang", b.dataset.lang); location.reload(); }));
  const top = document.getElementById("toTop");
  addEventListener("scroll", () => top.classList.toggle("show", scrollY > 600), { passive: true });
  top.onclick = () => scrollTo({ top: 0, behavior: "smooth" });

  loadRates(); loadWeather();
}

// Valyuta kursi: Markaziy bank API, ishlamasa zaxira qiymatlar
async function loadRates() {
  const show = (list) => (document.getElementById("rates").innerHTML = list.map((r) =>
    `<span class="rate">${r.code} ${fmt(+r.value)} <b class="${r.diff < 0 ? "down" : "up"}">${r.diff < 0 ? "▼" : "▲"}${Math.abs(r.diff).toFixed(2)}</b></span>`).join(""));
  show(store.get("rates", RATES_FALLBACK));
  try {
    const res = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const list = ["USD", "EUR", "RUB"].map((c) => data.find((x) => x.Ccy === c)).filter(Boolean)
      .map((x) => ({ code: x.Ccy, value: parseFloat(x.Rate), diff: parseFloat(x.Diff) }));
    if (list.length) { show(list); store.set("rates", list); }
  } catch {}
}

// Ob-havo: Open-Meteo (kalitsiz bepul API)
async function loadWeather() {
  const el = document.getElementById("weather");
  const icon = (c) => (c === 0 ? "☀️" : c < 4 ? "⛅" : c < 50 ? "🌫️" : c < 70 ? "🌧️" : c < 80 ? "❄️" : "⛈️");
  const show = (w) => (el.textContent = `${tx("Toshkent")} ${icon(w.code)} ${w.temp > 0 ? "+" : ""}${Math.round(w.temp)}°`);
  const cached = store.get("weather", null);
  if (cached) show(cached); else el.textContent = `${tx("Toshkent")} ☀️ +21°`;
  try {
    const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=41.31&longitude=69.28&current=temperature_2m,weather_code", { signal: AbortSignal.timeout(5000) });
    const j = await r.json();
    const w = { temp: j.current.temperature_2m, code: j.current.weather_code };
    show(w); store.set("weather", w);
  } catch {}
}

function sidebar(exclude) {
  const feed = byTime.filter((n) => n.id !== exclude).slice(0, 10)
    .map((n) => `<a href="article.html?id=${n.id}"><span class="t">${when(n)}</span><span class="h">${esc(tx(n.title))}</span></a>`).join("");
  const pop = [...NEWS].sort((a, b) => views(b) - views(a)).slice(0, 5)
    .map((n, i) => `<li><span class="n">${i + 1}</span><div><a href="article.html?id=${n.id}">${esc(tx(n.title))}</a><small>👁 ${fmt(views(n))}</small></div></li>`).join("");
  return `<aside><div class="sticky">
    <div class="card side"><h2>${t("latest")}</h2><div class="feed">${feed}</div></div>
    <div class="card side"><h2>${t("popular")}</h2><ol class="popular">${pop}</ol></div>
  </div></aside>`;
}
