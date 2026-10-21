/* motion.js: o movimento ligado à rolagem (GSAP + ScrollTrigger + Lenis, via CDN).
   Se as bibliotecas não carregarem ou a pessoa pedir "reduzir movimento",
   este arquivo só libera a página e sai: tudo continua funcionando parado.

   O que tem aqui:
   1. rolagem suave (Lenis)          6. galeria de saídas que anda de lado
   2. abertura com contador          7. manifesto: fundo escuro → claro e palavras acendendo
   3. cursor e botões magnéticos     8. faixa de destinos que acelera com a rolagem
   4. letras do topo que reagem      9. avião que percorre a rota dos 4 passos
      ao mouse                      10. depoimentos que se empilham
   5. destaques que crescem até     11. nomes gigantes que se esticam (contato e rodapé)
      a tela cheia                  12. página da promoção: capa com profundidade */
(() => {
  const H = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fino = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsap = window.gsap, ST = window.ScrollTrigger;

  const liberar = () => {
    H.classList.add("mv-pronto"); H.classList.remove("mv-abre");
    try { sessionStorage.setItem("mv-abriu", "1"); } catch (e) {}
    document.dispatchEvent(new Event("mv:abriu"));
  };
  if (!gsap || !ST || reduz) { liberar(); return; }

  gsap.registerPlugin(ST);
  H.classList.add("mv-anim");
  const mm = gsap.matchMedia();
  const COMPUTADOR = "(min-width: 901px)";

  /* ---------- 1) rolagem suave ---------- */
  let lenis = null;
  if (window.Lenis) {
    const topoH = () => ($(".topo")?.offsetHeight || 76) + 12;
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1, anchors: { offset: -topoH() } });
    lenis.on("scroll", ST.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.mvLenis = lenis;
  }
  const velocidade = () => lenis ? lenis.velocity : 0;

  /* ---------- 2) abertura: contador de 0 a 100 e a cortina sobe (uma vez por visita) ---------- */
  if (H.classList.contains("mv-abre")) {
    const ab = document.createElement("div");
    ab.className = "abertura"; ab.setAttribute("aria-hidden", "true");
    ab.innerHTML = '<div class="abertura__in"><img src="imgs/logo-branco.png" alt=""><div class="abertura__num">0</div><p class="abertura__txt">Preparando o seu embarque</p></div><i class="abertura__barra"></i>';
    document.body.append(ab);
    H.classList.remove("mv-abre");
    lenis?.stop();
    const num = $(".abertura__num", ab), cont = { v: 0 };
    gsap.timeline()
      .from(".abertura__in > *", { y: 30, opacity: 0, duration: .8, stagger: .08, ease: "power3.out" })
      .to(cont, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => num.textContent = Math.round(cont.v) }, 0)
      .to(".abertura__barra", { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0)
      .to(".abertura__in", { y: -40, opacity: 0, duration: .5, ease: "power2.in" }, "+=.1")
      .to(ab, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "-=.15")
      .add(() => { lenis?.start(); liberar(); }, "-=.55")
      .add(() => ab.remove());
  } else liberar();

  /* ---------- 3) cursor e botões magnéticos (só com mouse) ---------- */
  if (fino) {
    const c = document.createElement("div"); c.className = "cursor"; c.setAttribute("aria-hidden", "true");
    const rot = document.createElement("span"); c.append(rot); document.body.append(c);
    const vx = gsap.quickTo(c, "x", { duration: .45, ease: "power3" }), vy = gsap.quickTo(c, "y", { duration: .45, ease: "power3" });
    addEventListener("pointermove", e => { vx(e.clientX); vy(e.clientY); c.classList.add("on"); }, { passive: true });
    document.addEventListener("pointerleave", () => c.classList.remove("on"));
    document.addEventListener("pointerover", e => {
      const alvo = e.target.closest?.("[data-cursor]");
      const clicavel = e.target.closest?.("a,button,summary,label,input,textarea");
      c.classList.toggle("grande", !!alvo && !clicavel);
      c.classList.toggle("mira", !!clicavel);
      rot.textContent = alvo && !clicavel ? alvo.dataset.cursor : "";
    });

    let ima = null;
    document.addEventListener("pointermove", e => {
      const b = e.target.closest?.("[data-ima], .seta, .sc__ir");
      if (ima && ima !== b) { gsap.to(ima, { x: 0, y: 0, duration: .9, ease: "elastic.out(1, .45)" }); ima = null; }
      if (!b) return;
      ima = b;
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .5, ease: "power3.out" });
    }, { passive: true });
  }

  /* ---------- 4) topo: as letras engordam e se esticam perto do mouse ---------- */
  const tituloTopo = $(".hero h1");
  if (tituloTopo && fino) {
    let mx = -1e4, my = -1e4, ativo = true, centros = [];
    const chs = () => $$(".ch", tituloTopo);
    const medir = () => { centros = chs().map(ch => { ch.style.removeProperty("--wd"); const r = ch.getBoundingClientRect(); return [r.left + r.width / 2, r.top + scrollY + r.height / 2]; }); };
    const atual = [];
    addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY + scrollY; }, { passive: true });
    ST.create({ trigger: ".hero", start: "top bottom", end: "bottom top", onToggle: s => ativo = s.isActive });
    addEventListener("resize", () => setTimeout(medir, 100));
    document.fonts?.ready.then(() => setTimeout(medir, 1500));
    gsap.ticker.add(() => {
      if (!ativo || !centros.length) return;
      chs().forEach((ch, i) => {
        const [cx, cy] = centros[i] || [0, 0];
        const t = Math.max(0, 1 - Math.hypot(mx - cx, my - cy) / 300);
        const alvo = t * t * (3 - 2 * t);
        atual[i] = (atual[i] || 0) + (alvo - (atual[i] || 0)) * .12;
        if (Math.abs(atual[i]) < .001 && !alvo) return;
        ch.style.setProperty("--wd", (100 + 25 * atual[i]).toFixed(1));
        ch.style.setProperty("--wg", (820 + 80 * atual[i]).toFixed(0));
      });
    });
  }

  /* topo: ao rolar, o texto de apoio sobe e some; o anel do globo gira junto */
  if ($(".hero")) {
    gsap.to(".hero__lead, .hero__acoes, .hero__onde, .rolar", { y: -60, opacity: 0, ease: "none", stagger: .04,
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 35%", scrub: true } });
    gsap.to(".hero h1", { yPercent: -22, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".globo__stage .roseta", { rotate: 160, ease: "none", scrollTrigger: { trigger: ".viagem", start: "top top", end: "bottom bottom", scrub: 1 } });
  }
  /* capítulos: o texto entra de leve quando chega no meio da tela */
  $$(".cap").forEach(c => {
    gsap.fromTo($$(".cap__km, .cap__lugares, .cap .btn", c), { y: 40 }, { y: 0, ease: "none", scrollTrigger: { trigger: c, start: "top 90%", end: "top 35%", scrub: true } });
  });

  /* ---------- 5) destaques: a moldura cresce até ocupar a largura ---------- */
  function destaques(sec) {
    const m = $(".destaques__moldura", sec); if (!m || m.dataset.mv) return; m.dataset.mv = 1;
    gsap.fromTo(m, { clipPath: "inset(10% 9% 10% 9% round 32px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
      scrollTrigger: { trigger: m, start: "top 92%", end: "top 18%", scrub: true } });
    gsap.fromTo($(".destaques__slides", m), { scale: 1.18 }, { scale: 1, ease: "none",
      scrollTrigger: { trigger: m, start: "top 92%", end: "top 18%", scrub: true } });
  }

  /* ---------- 6) próximas saídas: a seção fica presa e as fotos passam de lado ---------- */
  function saidas(sec) {
    const tr = $(".saidas__trilho", sec), prog = $(".saidas__prog i", sec);
    if (!tr || sec.dataset.mv || tr.querySelectorAll(".sc").length < 2) return; sec.dataset.mv = 1;
    mm.add(COMPUTADOR, () => {
      sec.classList.add("anda");
      const dist = () => Math.max(0, tr.scrollWidth - sec.clientWidth);
      const ajustar = () => { sec.style.height = (innerHeight + dist()) + "px"; };
      ajustar();
      const tw = gsap.to(tr, { x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: .7, invalidateOnRefresh: true, onRefreshInit: ajustar,
          onUpdate: s => { if (prog) prog.style.transform = `scaleX(${s.progress})`; } } });
      // dentro de cada foto, a imagem anda um pouco mais devagar (profundidade)
      $$(".sc", tr).forEach(card => {
        const img = $(".sc__img img", card);
        if (img) gsap.fromTo(img, { xPercent: 7 }, { xPercent: -7, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
        gsap.fromTo(card, { rotate: 3, y: 50 }, { rotate: 0, y: 0, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tw, start: "left right", end: "left 60%", scrub: true } });
      });
      return () => { sec.classList.remove("anda"); sec.style.height = ""; gsap.set(tr, { clearProps: "transform" }); };
    });
    ST.sort(); ST.refresh();
  }

  /* ---------- 7) manifesto: o fundo clareia e as palavras acendem uma a uma ---------- */
  const man = $(".manifesto");
  if (man) {
    gsap.fromTo(man, { backgroundColor: "#0a1c44", color: "#ffffff" }, { backgroundColor: "#ffffff", color: "#0a1c44", ease: "none",
      scrollTrigger: { trigger: man, start: "top 70%", end: "top 30%", scrub: true } });
    const ws = $$(".manifesto__texto .w", man);
    if (ws.length) gsap.fromTo(ws, { opacity: .12 }, { opacity: 1, ease: "none", stagger: .1,
      scrollTrigger: { trigger: ".manifesto__texto", start: "top 78%", end: "bottom 42%", scrub: true } });
  }

  /* ---------- 8) faixa de destinos: corre sozinha, acelera e entorta com a rolagem ---------- */
  const faixa = $(".faixa");
  if (faixa) {
    const linhas = $$(".faixa__trilho", faixa).map(t => ({ t, x: 0, dir: +t.dataset.dir || -1, w: t.scrollWidth / 2 }));
    let visivel = false, sentido = 1;
    ST.create({ trigger: faixa, start: "top bottom", end: "bottom top", onToggle: s => visivel = s.isActive });
    addEventListener("resize", () => linhas.forEach(l => l.w = l.t.scrollWidth / 2));
    document.fonts?.ready.then(() => linhas.forEach(l => l.w = l.t.scrollWidth / 2));
    gsap.ticker.add((tempo, dt) => {
      if (!visivel) return;
      const v = velocidade();
      if (Math.abs(v) > .5) sentido = v > 0 ? 1 : -1;
      const extra = Math.min(Math.abs(v) * 1.4, 40), inclina = gsap.utils.clamp(-10, 10, -v * .35);
      linhas.forEach(l => {
        l.x += l.dir * sentido * (1.1 + extra) * dt / 16.7;
        const m = ((l.x % l.w) + l.w) % l.w;
        l.t.style.transform = `translate3d(${(m - l.w).toFixed(1)}px,0,0) skewX(${inclina.toFixed(2)}deg)`;
      });
    });
  }

  /* ---------- 9) como funciona: o avião voa pela rota e acende cada passo ---------- */
  const passos = $(".passos");
  if (passos) mm.add(COMPUTADOR, () => {
    const linha = $(".voo__linha", passos), aviao = $(".voo__aviao", passos);
    const lis = $$(".voo__passos li", passos), pontos = $$(".voo__ponto", passos);
    const fs = lis.map(li => +li.dataset.f || 0), L = linha.getTotalLength();
    linha.style.strokeDasharray = L;
    const desenhar = p => {
      const q = Math.min(1, p / .9);                      // termina um pouco antes, para o último passo respirar
      linha.style.strokeDashoffset = L * (1 - q);
      const a = linha.getPointAtLength(L * q), b = linha.getPointAtLength(Math.min(L, L * q + 3)), c = q > .998 ? linha.getPointAtLength(L * q - 3) : null;
      const ang = c ? Math.atan2(a.y - c.y, a.x - c.x) : Math.atan2(b.y - a.y, b.x - a.x);
      aviao.setAttribute("transform", `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${(ang * 180 / Math.PI).toFixed(1)})`);
      lis.forEach((li, i) => { const on = q >= fs[i] - .002; li.classList.toggle("chegou", on); pontos[i]?.classList.toggle("chegou", on); });
    };
    const prox = { p: 0 };
    desenhar(0);
    gsap.to(prox, { p: 1, ease: "none", onUpdate: () => desenhar(prox.p),
      scrollTrigger: { trigger: passos, start: "top top", end: "bottom bottom", scrub: .6 } });
    return () => { linha.style.strokeDasharray = ""; linha.style.strokeDashoffset = ""; aviao.setAttribute("transform", "translate(1180 26) rotate(-20)"); };
  });

  /* ---------- 10) depoimentos: o de baixo empurra e o de cima encolhe ---------- */
  const cards = $$(".depo__card");
  cards.forEach((c, i) => {
    const prox = cards[i + 1]; if (!prox) return;
    gsap.fromTo(c, { scale: 1, filter: "brightness(1)" }, { scale: .9 + i * .025, filter: "brightness(.86)", ease: "none",
      scrollTrigger: { trigger: prox, start: "top 95%", end: "top 30%", scrub: true } });
  });

  /* ---------- 11) títulos gigantes que se esticam ao entrar ---------- */
  const esticar = (alvo, de, ate, gatilho) => {
    const el = typeof alvo === "string" ? $(alvo) : alvo; if (!el) return;
    gsap.fromTo(el, { "--wd": de + "%" }, { "--wd": ate + "%", ease: "none",
      scrollTrigger: { trigger: gatilho || el, start: "top bottom", end: "top 35%", scrub: true } });
  };
  esticar(".contato__tit", 70, 118);
  esticar(".rodape__nome", 62, 125, ".rodape");
  esticar(".vhero h1", 80, 118, ".vhero");

  /* imagens com profundidade (data-paralaxe) */
  const paralaxe = raiz => $$("[data-paralaxe] img", raiz).forEach(img => {
    if (img.dataset.mv) return; img.dataset.mv = 1;
    gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- 12) página da promoção ---------- */
  function promocao(lp) {
    const capa = $(".lp__capa", lp); if (!capa || capa.dataset.mv) return; capa.dataset.mv = 1;
    gsap.to($(".lp__fotos", capa), { yPercent: 16, ease: "none", scrollTrigger: { trigger: capa, start: "top top", end: "bottom top", scrub: true } });
    gsap.to($(".lp__capa-in", capa), { yPercent: -10, opacity: .15, ease: "none", scrollTrigger: { trigger: capa, start: "30% top", end: "bottom top", scrub: true } });
    esticar($(".lp__fim h2", lp), 74, 116);
    paralaxe(lp);
  }

  /* conteúdo que chega do Firebase depois (destaques, saídas, vendas, promoção) */
  const novo = raiz => {
    if (!raiz || raiz === document) raiz = document.body;
    const d = raiz.matches?.("#novidades") ? raiz : $("#novidades", raiz); if (d && !d.hidden) destaques(d);
    const s = raiz.matches?.(".saidas") ? raiz : $(".saidas", raiz); if (s) saidas(s);
    const lp = raiz.matches?.("#lp") ? raiz : $("#lp", raiz); if (lp) promocao(lp);
    paralaxe(raiz);
    requestAnimationFrame(() => ST.refresh());
  };
  document.addEventListener("mv:conteudo", e => novo(e.detail));
  novo(document.body);

  // fontes e imagens mudam as alturas: recalcula tudo quando terminarem de chegar
  document.fonts?.ready.then(() => ST.refresh());
  addEventListener("load", () => ST.refresh());
})();
