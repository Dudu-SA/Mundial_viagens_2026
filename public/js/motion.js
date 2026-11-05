/* motion.js: o movimento do álbum (GSAP + ScrollTrigger + Lenis, via CDN).
   Se as bibliotecas não carregarem ou a pessoa pedir "reduzir movimento",
   este arquivo só libera a página e sai: tudo continua funcionando parado.

   O que tem aqui:
   1. rolagem suave (Lenis)                 6. faixa de destinos que acelera com a rolagem
   2. abertura: a capa do álbum se abre     7. "por que": palavras que acendem
   3. cursor e botões magnéticos            8. como funciona: avião pela rota dos 4 passos
   4. topo: fotos reagem ao mouse e à rolagem   9. rodapé: nome gigante que se estica
   5. fotos que "pousam" na página ao rolar 10. página da viagem: foto com profundidade */
(() => {
  const H = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fino = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsap = window.gsap, ST = window.ScrollTrigger;

  const liberar = () => {
    H.classList.remove("mv-abre");
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
    const topoH = () => ($(".topo")?.offsetHeight || 72) + 12;
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1, anchors: { offset: -topoH() } });
    lenis.on("scroll", ST.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.mvLenis = lenis;
  }
  const velocidade = () => lenis ? lenis.velocity : 0;
  let refreshT = 0;
  const refresh = () => { clearTimeout(refreshT); refreshT = setTimeout(() => ST.refresh(), 120); };

  /* ---------- 2) abertura: a capa azul do álbum, com contador, que se abre como um livro ---------- */
  const album = $(".album");
  if (H.classList.contains("mv-abre") && album) {
    const ab = document.createElement("div");
    ab.className = "abertura"; ab.setAttribute("aria-hidden", "true");
    ab.innerHTML = '<div class="abertura__pagina"></div><div class="abertura__capa"><div class="abertura__in"><img src="imgs/logo-branco.png" alt=""><div class="abertura__titulo">Mundial Viagens</div><div class="abertura__mao">o álbum de quem viajou com a gente</div><div class="abertura__num">0</div></div><i class="abertura__barra"></i></div>';
    document.body.append(ab);
    H.classList.remove("mv-abre");
    lenis?.stop();
    const num = $(".abertura__num", ab), cont = { v: 0 };
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".abertura__in > *", { y: 30, opacity: 0, duration: .8, stagger: .08 })
      .to(cont, { v: 100, duration: 1.4, ease: "power2.inOut", onUpdate: () => num.textContent = Math.round(cont.v) }, 0)
      .to(".abertura__barra", { scaleX: 1, duration: 1.4, ease: "power2.inOut" }, 0)
      .to(".abertura__capa", { rotateY: -105, duration: 1.3, ease: "power3.inOut" }, "+=.1")   // a capa vira
      .add(() => { lenis?.start(); liberar(); }, "-=1.1")                                       // as fotos caem enquanto a capa abre
      .from(".album__txt > *", { y: 24, opacity: 0, duration: .9, stagger: .09, clearProps: "all" }, "-=.9")
      .add(() => ab.remove());
  } else {
    liberar();
    if (album) gsap.from(".album__txt > *", { y: 24, opacity: 0, duration: .9, stagger: .09, ease: "power3.out", clearProps: "all", delay: .15 });
  }

  /* ---------- 3) cursor e botões magnéticos (só com mouse) ---------- */
  if (fino) {
    const c = document.createElement("div"); c.className = "cursor"; c.setAttribute("aria-hidden", "true");
    const rot = document.createElement("span"); c.append(rot); document.body.append(c);
    const vx = gsap.quickTo(c, "x", { duration: .45, ease: "power3" }), vy = gsap.quickTo(c, "y", { duration: .45, ease: "power3" });
    addEventListener("pointermove", e => { vx(e.clientX); vy(e.clientY); c.classList.add("on"); }, { passive: true });
    document.addEventListener("pointerleave", () => c.classList.remove("on"));
    document.addEventListener("pointerover", e => {
      const alvo = e.target.closest?.("a.saida, a.destaque, .album__pag .foto");
      const clicavel = !alvo && e.target.closest?.("a,button,summary,label,input,textarea");
      c.classList.toggle("grande", !!alvo);
      c.classList.toggle("mira", !!clicavel);
      rot.textContent = alvo ? (alvo.matches("a") ? "ver" : "foto") : "";
    });

    let ima = null;
    document.addEventListener("pointermove", e => {
      const b = e.target.closest?.(".btn, .burger");
      if (ima && ima !== b) { gsap.to(ima, { x: 0, y: 0, duration: .9, ease: "elastic.out(1, .45)" }); ima = null; }
      if (!b) return;
      ima = b;
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .5, ease: "power3.out" });
    }, { passive: true });
  }

  /* ---------- 4) topo: as fotos se afastam um pouco do mouse e se espalham ao rolar ---------- */
  if (album) {
    const fotos = $$(".album__pag .foto", album);
    if (fino && fotos.length) {
      const movs = fotos.map((f, i) => ({ x: gsap.quickTo(f, "x", { duration: 1.2, ease: "power3" }), y: gsap.quickTo(f, "y", { duration: 1.2, ease: "power3" }), k: (i + 1) * 6 }));
      let dentro = false;
      ST.create({ trigger: album, start: "top bottom", end: "bottom top", onToggle: s => dentro = s.isActive });
      addEventListener("pointermove", e => {
        if (!dentro) return;
        const px = e.clientX / innerWidth - .5, py = e.clientY / innerHeight - .5;
        movs.forEach(m => { m.x(-px * m.k); m.y(-py * m.k); });
      }, { passive: true });
    }
    mm.add(COMPUTADOR, () => {
      fotos.forEach((f, i) => gsap.to(f, { yPercent: -10 - i * 12, rotate: `+=${i % 2 ? 4 : -4}`, ease: "none",
        scrollTrigger: { trigger: album, start: "top top", end: "bottom top", scrub: true } }));
      gsap.to(".album__txt", { yPercent: -8, opacity: .2, ease: "none", scrollTrigger: { trigger: album, start: "40% top", end: "bottom top", scrub: true } });
    });
  }

  /* ---------- 5) fotos que pousam na página: chegam mais inclinadas e assentam ao entrar ---------- */
  const pousar = raiz => $$(".saida .foto, .destaque .foto, .bloco--foto .foto", raiz).forEach(f => {
    if (f.dataset.mv) return; f.dataset.mv = 1;
    const rot = parseFloat(getComputedStyle(f).rotate) || 0;          // a inclinação de repouso fica no CSS (rotate:); o GSAP só soma o extra
    gsap.fromTo(f, { y: 60, rotate: rot < 0 ? -6 : 6 }, { y: 0, rotate: 0, ease: "none",
      scrollTrigger: { trigger: f, start: "top 98%", end: "top 55%", scrub: true } });
    const img = $(".foto__img img", f);
    if (img) gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- 6) faixa de destinos: corre sozinha, acelera e entorta com a rolagem ---------- */
  const faixa = $(".faixa");
  if (faixa) {
    const linhas = $$(".faixa__trilho", faixa).map(t => ({ t, x: 0, dir: +t.dataset.dir || -1, w: t.scrollWidth / 2 }));
    let visivel = false, sentido = 1;
    ST.create({ trigger: faixa, start: "top bottom", end: "bottom top", onToggle: s => visivel = s.isActive });
    const medir = () => linhas.forEach(l => l.w = l.t.scrollWidth / 2);
    addEventListener("resize", medir); document.fonts?.ready.then(medir);
    gsap.ticker.add((tempo, dt) => {
      if (!visivel) return;
      const v = velocidade();
      if (Math.abs(v) > .5) sentido = v > 0 ? 1 : -1;
      const extra = Math.min(Math.abs(v) * 1.2, 36), inclina = gsap.utils.clamp(-8, 8, -v * .3);
      linhas.forEach(l => {
        l.x += l.dir * sentido * (.9 + extra) * dt / 16.7;
        const m = ((l.x % l.w) + l.w) % l.w;
        l.t.style.transform = `translate3d(${(m - l.w).toFixed(1)}px,0,0) skewX(${inclina.toFixed(2)}deg)`;
      });
    });
  }

  /* ---------- 7) por que a Mundial: as palavras acendem uma a uma ---------- */
  const ws = $$(".porque .w");
  if (ws.length) gsap.fromTo(ws, { opacity: .3 }, { opacity: 1, ease: "none", stagger: .1,
    scrollTrigger: { trigger: ".porque", start: "top 70%", end: "top 20%", scrub: true } });

  /* ---------- 8) como funciona: o avião voa pela rota e acende cada passo ---------- */
  const passos = $("#como-funciona");
  if (passos && $(".voo__linha", passos)) mm.add(COMPUTADOR, () => {
    const linha = $(".voo__linha", passos), aviao = $(".voo__aviao", passos);
    const lis = $$(".passos__lista li", passos), pontos = $$(".voo__ponto", passos);
    const fs = lis.map(li => +li.dataset.f || 0), L = linha.getTotalLength();
    linha.style.strokeDasharray = L;
    const desenhar = p => {
      const q = Math.min(1, p / .92);
      linha.style.strokeDashoffset = L * (1 - q);
      const a = linha.getPointAtLength(L * q), b = linha.getPointAtLength(Math.min(L, L * q + 3)), c = q > .998 ? linha.getPointAtLength(L * q - 3) : null;
      const ang = c ? Math.atan2(a.y - c.y, a.x - c.x) : Math.atan2(b.y - a.y, b.x - a.x);
      aviao.setAttribute("transform", `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${(ang * 180 / Math.PI).toFixed(1)})`);
      lis.forEach((li, i) => { const on = q >= fs[i] - .002; li.classList.toggle("chegou", on); pontos[i]?.classList.toggle("chegou", on); });
    };
    const prox = { p: 0 };
    desenhar(0);
    gsap.to(prox, { p: 1, ease: "none", onUpdate: () => desenhar(prox.p),
      scrollTrigger: { trigger: passos, start: "top 60%", end: "bottom 70%", scrub: .6 } });
    return () => { linha.style.strokeDasharray = ""; linha.style.strokeDashoffset = ""; lis.forEach(li => li.classList.add("chegou")); };
  });

  /* ---------- 9) nomes gigantes que se esticam ao entrar ---------- */
  const esticar = (alvo, de, ate, gatilho) => {
    const t = typeof alvo === "string" ? $(alvo) : alvo; if (!t) return;
    gsap.fromTo(t, { "--wd": de + "%" }, { "--wd": ate + "%", ease: "none", scrollTrigger: { trigger: gatilho || t, start: "top bottom", end: "top 35%", scrub: true } });
  };
  esticar(".rodape__nome", 62, 118, ".rodape");

  /* ---------- 10) página da viagem: a foto principal ganha profundidade; o fechamento sobe ---------- */
  function promocao(lp) {
    const f = $(".lp__fotos .foto", lp); if (!f || f.dataset.mv) return; f.dataset.mv = 1;
    gsap.to(f, { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".lp__dupla", start: "top top", end: "bottom top", scrub: true } });
    gsap.from(".lp__fim", { yPercent: 20, ease: "none", scrollTrigger: { trigger: ".lp__fim", start: "top bottom", end: "top 60%", scrub: true } });
  }

  /* conteúdo que chega do Firebase depois (destaques, saídas, vendas, viagem) */
  const novo = raiz => {
    if (!raiz || raiz === document) raiz = document.body;
    pousar(raiz);
    const lp = raiz.matches?.("#lp") ? raiz : $("#lp", raiz); if (lp) promocao(lp);
    refresh();
  };
  document.addEventListener("mv:conteudo", e => novo(e.detail));
  novo(document.body);

  // fontes e imagens mudam as alturas: recalcula tudo quando terminarem de chegar
  document.fonts?.ready.then(refresh);
  addEventListener("load", refresh);
})();
