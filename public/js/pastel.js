/* pastel.js — efeitos novos do tema pastel. Carregar por último (type="module").
   1) fundo que troca de cor pastel a cada seção   2) palavras gigantes que deslizam com a rolagem
   3) esferas de vidro com parallax               4) selo circular girando
   5) grades que "entortam" com a velocidade da rolagem   6) rastro pastel do mouse */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fino = matchMedia("(hover:hover) and (pointer:fine)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ---------- 1) cor de fundo por seção ---------- */
const TONES = {
  lilac: ["#f1e9ff", "#dfe6ff"], peach: ["#fff1e8", "#ffe2ee"], mint: ["#e6fbf2", "#e1f0ff"],
  sky: ["#e6f1ff", "#efe6ff"], butter: ["#fff8df", "#ffece0"], pink: ["#ffe9f4", "#f0e8ff"]
};
const setTone = n => { const [a, b] = TONES[n]; document.body.style.setProperty("--bg1", a); document.body.style.setProperty("--bg2", b); };
const toneIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setTone(e.target.dataset.pt); }), { rootMargin: "-45% 0px -45% 0px" });
const track = (el, t) => { if (!el || el.dataset.pt) return; el.dataset.pt = t; toneIO.observe(el); };
[[".hero", "lilac"], ["#novidades", "peach"], [".stats", "mint"], ["#sobre", "sky"], ["#destinos", "pink"], [".next", "butter"],
 ["#como-funciona", "mint"], ["#depoimentos", "lilac"], ["#duvidas", "sky"], ["#contato", "peach"], [".promos-page", "lilac"]]
  .forEach(([s, t]) => track($(s), t));
setTone("lilac");
const lp = document.getElementById("lp");           // página da promoção: os blocos são criados depois
if (lp) {
  const f = () => { track($(".lp__hero", lp), "lilac"); track($(".lp__body", lp), "sky"); track($(".lp__end", lp), "pink"); };
  new MutationObserver(f).observe(lp, { childList: true }); f();
}

/* ---------- 2) palavras gigantes ---------- */
const bigs = [];
[["#sobre", "Descubra"], ["#destinos", "Explore"], ["#como-funciona", "Embarque"], ["#depoimentos", "Histórias"],
 ["#duvidas", "Pergunte"], ["#contato", "Vamos?"], [".promos-page", "Ofertas"], ["#novidades", "Novidades"]]
  .forEach(([s, w]) => {
    const sec = $(s); if (!sec) return;
    const e = mk("span", "p-big"); e.textContent = w; e.setAttribute("aria-hidden", "true"); sec.prepend(e);
    bigs.push({ sec, e });
  });

/* ---------- 3) esferas de vidro ---------- */
const orbs = [];
const addOrbs = (sec, list) => {
  if (!sec) return;
  list.forEach(o => {
    const e = mk("i", "p-orb" + (o.x2 ? " p-orb--x" : "")); e.setAttribute("aria-hidden", "true");
    Object.assign(e.style, { width: o.s + "px", height: o.s + "px", left: o.x, top: o.y });
    e.style.setProperty("--c1", o.c1); e.style.setProperty("--c2", o.c2);
    sec.append(e); orbs.push({ e, sec, k: o.k, sp: o.sp });
  });
};
addOrbs($(".hero"), [
  { s: 120, x: "44%", y: "58%", c1: "#d9c8ff", c2: "#ffc9dc", k: 34, sp: -.14 },
  { s: 60, x: "4%", y: "80%", c1: "#c4f0de", c2: "#c6dcff", k: -22, sp: -.22, x2: 1 },
  { s: 84, x: "90%", y: "-2%", c1: "#ffd5c4", c2: "#fff1b8", k: 26, sp: -.1 },
  { s: 34, x: "30%", y: "6%", c1: "#c6dcff", c2: "#d9c8ff", k: -30, sp: -.3, x2: 1 }
]);
addOrbs($(".next"), [{ s: 90, x: "46%", y: "10%", c1: "#ffcfe4", c2: "#fff1b8", k: 22, sp: .12 }, { s: 50, x: "92%", y: "70%", c1: "#c4f0de", c2: "#c6dcff", k: -18, sp: .2, x2: 1 }]);
addOrbs($(".promos-page"), [{ s: 96, x: "86%", y: "2%", c1: "#d9c8ff", c2: "#ffc9dc", k: 24, sp: -.12 }, { s: 46, x: "70%", y: "14%", c1: "#ffd5c4", c2: "#fff1b8", k: -20, sp: -.25, x2: 1 }]);

/* ---------- 4) selo girando ---------- */
let badge = null;
const hero = $(".hero");
if (hero) {
  badge = mk("div", "p-badge",
    '<svg viewBox="0 0 120 120"><defs><path id="pcirc" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"/></defs>' +
    '<text><textPath href="#pcirc" textLength="272" lengthAdjust="spacing">pacotes • promoções • grupos • roteiros • </textPath></text></svg><span>✈</span>');
  badge.setAttribute("aria-hidden", "true");
  hero.append(badge);
}

/* ---------- laço de animação (só roda enquanto algo está se movendo) ---------- */
const GRIDS = ".cards,.gallery,.reviews__grid,.steps__list,.lp__blocks";
let mx = 0, my = 0, tx = 0, ty = 0, sk = 0, last = scrollY, run = false;
function frame() {
  const v = scrollY - last; last = scrollY;
  sk += (Math.max(-4, Math.min(4, v * .12)) - sk) * .14;
  mx += (tx - mx) * .08; my += (ty - my) * .08;

  const sv = Math.abs(sk) > .02 ? `skewY(${sk.toFixed(2)}deg)` : "";
  $$(GRIDS).forEach(g => { if (g.dataset.sk !== sv) { g.dataset.sk = sv; g.style.transform = sv; } });

  bigs.forEach(({ sec, e }) => {
    const r = sec.getBoundingClientRect(); if (r.bottom < -300 || r.top > innerHeight + 300) return;
    e.style.translate = `calc(-50% + ${(-(r.top + r.height / 2 - innerHeight / 2) * .45).toFixed(1)}px) -50%`;
  });
  orbs.forEach(({ e, sec, k, sp }) => {
    const r = sec.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return;
    const off = r.top + r.height / 2 - innerHeight / 2;
    e.style.translate = `${(mx * k * 2).toFixed(1)}px ${(my * k * 2 + off * sp).toFixed(1)}px`;
  });
  if (badge) badge.style.rotate = (scrollY * .3).toFixed(1) + "deg";

  if (v !== 0 || Math.abs(sk) > .02 || Math.abs(tx - mx) > .002 || Math.abs(ty - my) > .002) requestAnimationFrame(frame);
  else run = false;
}
const kick = () => { if (!run) { run = true; requestAnimationFrame(frame); } };
if (!reduce) {
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", kick);
  if (fino) addEventListener("pointermove", e => { if (e.pointerType !== "mouse") return; tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; kick(); }, { passive: true });
}
frame();

/* ---------- 6) rastro pastel do mouse ---------- */
if (fino && !reduce) {
  const cols = ["#cdbcff", "#ffc9dc", "#bfe9ff", "#ffe3b0", "#c6f1de"];
  let lx = 0, ly = 0, lt = 0;
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    const t = performance.now();
    if (t - lt < 38 || Math.hypot(e.clientX - lx, e.clientY - ly) < 14) return;
    lt = t; lx = e.clientX; ly = e.clientY;
    const s = 10 + Math.random() * 16, d = mk("i", "p-trail");
    d.style.cssText = `left:${lx}px;top:${ly}px;width:${s}px;height:${s}px;background:${cols[(Math.random() * cols.length) | 0]}`;
    document.body.append(d);
    d.animate([
      { transform: "translate(-50%,-50%) scale(1)", opacity: .8 },
      { transform: `translate(-50%,calc(-50% + ${20 + Math.random() * 30}px)) scale(.1)`, opacity: 0 }
    ], { duration: 800 + Math.random() * 400, easing: "cubic-bezier(.2,.7,.2,1)" }).onfinish = () => d.remove();
  }, { passive: true });
}

/* ---------- formulário: a mensagem de erro do main.js era clara demais para o fundo pastel ---------- */
const ok = $(".form__ok");
if (ok) new MutationObserver(() => { if (ok.style.color === "rgb(255, 225, 218)") ok.style.color = "#b3412a"; })
  .observe(ok, { attributes: true, attributeFilter: ["style", "hidden"] });