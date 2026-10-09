/* motion3.js — polimento e fluidez. Carregar depois de motion2.js (type="module"). */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fino = matchMedia("(hover:hover) and (pointer:fine)").matches;
const EASE = "cubic-bezier(.2,.7,.2,1)";
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* 1) vendas: esqueleto no lugar do "Carregando…" (o promos.js limpa a caixa quando termina) */
{
  const box = document.getElementById("lista-promos");
  if (box && /^Carregando/.test(box.textContent.trim())) {
    box.replaceChildren(...Array.from({ length: 6 }, () => mk("div", "m3-skel", "<i></i><i></i><i></i>")));
  }
}

/* 2) header some ao rolar para baixo e volta ao rolar para cima */
{
  const header = document.querySelector(".header");
  if (header && !reduce) {
    let ult = scrollY, oculto = false, anim = null;
    const set = h => {
      if (h === oculto) return; oculto = h;
      const n = header.animate({ translate: h ? ["0 0", "0 -110%"] : ["0 -110%", "0 0"] }, { duration: 450, easing: EASE, fill: "forwards" });
      anim?.cancel(); anim = n;
    };
    addEventListener("scroll", () => {
      const y = scrollY, d = y - ult; if (Math.abs(d) < 6) return; ult = y;
      set(d > 0 && y > 240 && !document.body.classList.contains("menu-open"));
    }, { passive: true });
    header.addEventListener("focusin", () => set(false));
  }
}

/* 3) menu: pílula que desliza até o link sob o mouse e volta para o link ativo */
{
  const nav = document.querySelector(".nav");
  if (nav && fino) {
    const pill = mk("i", "nav-pill"); nav.prepend(pill);
    let pronto = false;
    const to = a => {
      if (!a || innerWidth <= 860) { pill.style.opacity = 0; pronto = false; return; }
      if (!pronto) { pill.style.transition = "none"; }
      pill.style.opacity = 1; pill.style.width = a.offsetWidth + "px"; pill.style.height = a.offsetHeight + "px";
      pill.style.translate = `${a.offsetLeft}px ${a.offsetTop}px`;
      if (!pronto) { void pill.offsetWidth; pill.style.transition = ""; pronto = true; }
    };
    const rest = () => to(nav.querySelector("a.active"));
    $$("a", nav).forEach(a => { a.addEventListener("pointerenter", () => to(a)); a.addEventListener("focus", () => to(a)); });
    nav.addEventListener("pointerleave", rest); nav.addEventListener("focusout", rest);
    new MutationObserver(rest).observe(nav, { subtree: true, attributes: true, attributeFilter: ["class"] });
    addEventListener("resize", rest); rest();
  }
}

/* 4) entradas: traço dos títulos de seção e colunas do rodapé */
if (!reduce && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("m3-in"); io.unobserve(e.target); }
  }), { threshold: .2 });
  $$(".section-head,.contact__side").forEach(el => io.observe(el));
  $$(".footer__in>*,.footer__legal").forEach((el, i) => { el.classList.add("m3-r"); el.style.setProperty("--i", i); io.observe(el); });
} else {
  $$(".section-head,.contact__side").forEach(el => el.classList.add("m3-in"));
}

/* 5) dúvidas: abrir e fechar com altura animada */
$$("details").forEach(d => {
  const s = d.querySelector("summary"); if (!s) return;
  let a = null, fechando = false;
  s.addEventListener("click", e => {
    e.preventDefault();
    if (reduce) { d.open = !d.open; return; }
    const de = d.offsetHeight; a?.cancel();
    const abrir = !d.open || fechando; fechando = !abrir;
    const cs = getComputedStyle(d);
    const extra = ["paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth"].reduce((t, k) => t + (parseFloat(cs[k]) || 0), 0);
    d.style.overflow = "hidden";
    if (abrir) d.open = true;
    const alvo = abrir ? d.offsetHeight : s.offsetHeight + extra;
    $$("summary ~ *", d).forEach(c => c.animate(
      abrir ? [{ opacity: 0, translate: "0 -10px" }, { opacity: 1, translate: "0 0" }] : [{ opacity: 1 }, { opacity: 0 }],
      { duration: abrir ? 520 : 260, easing: EASE, fill: abrir ? "backwards" : "forwards" }));
    const x = a = d.animate({ height: [de + "px", alvo + "px"] }, { duration: abrir ? 520 : 380, easing: EASE });
    x.onfinish = () => { if (fechando) d.open = false; d.style.overflow = ""; a = null; fechando = false; };
  });
});

/* 6) destaques: arrastar com o mouse (o snap volta sozinho ao soltar) */
if (fino) {
  let dr = null, moveu = false, fim = 0;
  document.addEventListener("pointerdown", e => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const t = e.target.closest?.(".dest__track"); if (!t) return;
    dr = { t, x: e.clientX, l: t.scrollLeft }; moveu = false;
  });
  addEventListener("pointermove", e => {
    if (!dr) return;
    const dx = e.clientX - dr.x;
    if (!moveu && Math.abs(dx) > 6) { moveu = true; dr.t.style.scrollSnapType = "none"; dr.t.style.scrollBehavior = "auto"; dr.t.classList.add("grabbing"); }
    if (moveu) dr.t.scrollLeft = dr.l - dx;
  }, { passive: true });
  const solta = () => {
    if (!dr) return;
    if (moveu) { fim = performance.now(); dr.t.classList.remove("grabbing"); dr.t.style.scrollSnapType = ""; dr.t.style.scrollBehavior = ""; }
    dr = null;
  };
  addEventListener("pointerup", solta); addEventListener("pointercancel", solta);
  document.addEventListener("click", e => { if (performance.now() - fim < 250) { e.preventDefault(); e.stopPropagation(); } }, true);
}

/* 7) vendas: pílula deslizante nas abas (as abas são criadas pelo promos.js) */
{
  const iniciar = v => {
    if (v.classList.contains("m3-pilled")) return;
    const p = mk("i", "vtabs-pill"); v.prepend(p); v.classList.add("m3-pilled");
    const mv = () => { const b = v.querySelector("button.on"); if (!b) return;
      p.style.width = b.offsetWidth + "px"; p.style.height = b.offsetHeight + "px"; p.style.translate = `${b.offsetLeft}px ${b.offsetTop}px`; };
    p.style.transition = "none"; mv(); void p.offsetWidth; p.style.transition = "";
    new MutationObserver(mv).observe(v, { subtree: true, attributes: true, attributeFilter: ["class"] });
    addEventListener("resize", mv);
  };
  const box = document.getElementById("lista-promos");
  if (box) {
    const procura = () => { const v = box.parentElement.querySelector(".vtabs"); if (v) iniciar(v); };
    new MutationObserver(procura).observe(box.parentElement, { childList: true });
    procura();
  }
}

/* 8) formulário: mensagem de sucesso/erro entra com movimento */
{
  const ok = document.querySelector(".form__ok");
  if (ok && !reduce) new MutationObserver(() => {
    if (!ok.hidden) ok.animate([{ opacity: 0, translate: "0 12px", scale: .96 }, { opacity: 1, translate: "0 0", scale: 1 }], { duration: 650, easing: EASE });
  }).observe(ok, { attributes: true, attributeFilter: ["hidden"] });
}

/* 9) voltar ao topo, com anel que mostra quanto da página já foi lida */
{
  const b = mk("button", "totop",
    '<svg viewBox="0 0 52 52" aria-hidden="true"><circle class="tr" cx="26" cy="26" r="24"/><circle class="pr" cx="26" cy="26" r="24"/></svg><span aria-hidden="true">↑</span>');
  b.type = "button"; b.setAttribute("aria-label", "Voltar ao topo");
  document.body.append(b);
  const anel = b.querySelector(".pr");
  let t = false;
  const med = () => {
    const max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, scrollY / max) : 0;
    anel.style.strokeDashoffset = 150.8 * (1 - p);
    b.classList.toggle("show", scrollY > 700); t = false;
  };
  addEventListener("scroll", () => { if (!t) { t = true; requestAnimationFrame(med); } }, { passive: true });
  b.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
  med();
}

/* 10) imagens que demoram a carregar aparecem com fade e desfoque leve */
if (!reduce) {
  $$("img").forEach(i => {
    if (i.complete) return;
    i.addEventListener("load", () => i.animate([{ opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 700, easing: EASE }), { once: true });
  });
}