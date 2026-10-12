// Umumiy qismlar: topbar, header, footer, tema, til
const LANGS = ["O'zb", "Ўзб", "Рус", "Eng"];
const img = (id, w = 800, h = 450) => `https://picsum.photos/seed/xabar${id}/${w}/${h}`;
const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || "";
const imgTag = (id, w, h) => `<img loading="lazy" src="${img(id, w, h)}" alt="" style="--h:${(id * 47) % 360}" onerror="this.onerror=null;this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'">`;
const params = new URLSearchParams(location.search);

function renderChrome() {
  const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  const d = new Date(), today = `${d.getDate()}-${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
  const rates = RATES.map((r) => `<span>${r.code} ${r.value} <b class="${r.diff.startsWith("-") ? "down" : "up"}">${r.diff}</b></span>`).join("");
  const lang = localStorage.getItem("lang") || LANGS[0];
  document.body.insertAdjacentHTML("afterbegin", `
    <div class="topbar"><div class="wrap">
      <span>${today}</span><span>Toshkent ☀️ +21°</span>${rates}
      <div class="right">${LANGS.map((l) => `<button class="${l === lang ? "active" : ""}" data-lang="${l}">${l}</button>`).join("")}</div>
    </div></div>
    <header class="main"><div class="wrap">
      <button class="iconbtn menu-btn" id="menuBtn">☰</button>
      <a href="index.html" class="logo">xabar<span>noma</span></a>
      <nav id="nav">${CATEGORIES.map((c) => `<a href="index.html?cat=${c.id}" class="${params.get("cat") === c.id ? "active" : ""}">${c.name}</a>`).join("")}</nav>
      <form class="search" action="index.html"><input name="q" placeholder="Qidirish..." value="${params.get("q") || ""}"></form>
      <button class="iconbtn" id="themeBtn" title="Tema">🌙</button>
    </div></header>`);
  document.body.insertAdjacentHTML("beforeend", `
    <footer><div class="wrap">
      <div><div class="logo" style="color:#fff">xabar<span>noma</span></div><p>O'quv loyihasi. Yangiliklar to'qima, rasmlar picsum.photos'dan.</p></div>
      <div>${CATEGORIES.slice(0, 4).map((c) => `<div><a href="index.html?cat=${c.id}">${c.name}</a></div>`).join("")}</div>
      <div>© 2026 Xabarnoma</div>
    </div></footer>`);

  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.dataset.theme = saved;
  document.getElementById("themeBtn").onclick = () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
  };
  document.getElementById("menuBtn").onclick = () => document.getElementById("nav").classList.toggle("open");
  document.querySelectorAll("[data-lang]").forEach((b) => (b.onclick = () => {
    localStorage.setItem("lang", b.dataset.lang);
    document.querySelectorAll("[data-lang]").forEach((x) => x.classList.toggle("active", x === b));
  }));
}

function sidebar() {
  const feed = NEWS.map((n) => `<a href="article.html?id=${n.id}"><span class="t">${n.time}</span><span class="h">${n.title}</span></a>`).join("");
  const pop = [...NEWS].sort((a, b) => b.views - a.views).slice(0, 5)
    .map((n, i) => `<li><span class="n">${i + 1}</span><a href="article.html?id=${n.id}">${n.title}</a></li>`).join("");
  return `<aside><div class="sticky">
    <div class="card"><h2>So'nggi yangiliklar</h2><div class="feed">${feed}</div></div>
    <div class="card"><h2>Ko'p o'qilgan</h2><ul class="popular">${pop}</ul></div>
  </div></aside>`;
}

const meta = (n) => `<div class="meta"><span class="badge">${catName(n.cat)}</span><span>${n.time} / ${n.date}</span><span>👁 ${n.views.toLocaleString("ru")}</span></div>`;
const cardHTML = (n) => `<a class="card" href="article.html?id=${n.id}">${imgTag(n.id, 640, 400)}<div class="txt">${meta(n)}<h3>${n.title}</h3></div></a>`;
