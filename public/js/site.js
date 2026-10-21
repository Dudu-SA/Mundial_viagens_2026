/* site.js: comportamento comum das páginas públicas (início, vendas e promoção).
   Script clássico com defer. Não depende do Firebase nem das bibliotecas de animação:
   menu, globo por capítulos, letras que sobem, contadores e formulário funcionam sozinhos.
   O movimento ligado à rolagem fica no js/motion.js. */
(() => {
  const H = document.documentElement;
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const celular = () => matchMedia("(max-width: 900px)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ZAP = "558888870400";
  const ICONE_ZAP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.7-1.2A9.4 9.4 0 1 0 12 2.6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path transform="translate(7.1 7) scale(.42)" fill="currentColor" d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.98.98 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99Z"/></svg>';
  const AVIAO = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z"/></svg>';
  const mv = window.mv = { iconeZap: ICONE_ZAP };
  window.mvIconeZap = ICONE_ZAP;

  /* ---------- 1) menu ---------- */
  const burger = $(".burger"), menu = $("#menu");
  $$("#menu a").forEach((a, i) => a.style.setProperty("--i", i));
  const abre = on => {
    document.body.classList.toggle("menu-aberto", on);
    burger?.setAttribute("aria-expanded", on);
    burger?.setAttribute("aria-label", on ? "Fechar menu" : "Abrir menu");
    on ? window.mvLenis?.stop() : window.mvLenis?.start();
  };
  burger?.addEventListener("click", () => abre(!document.body.classList.contains("menu-aberto")));
  menu?.addEventListener("click", e => { if (e.target.closest("a")) abre(false); });
  addEventListener("keydown", e => {
    if (e.key === "Escape" && document.body.classList.contains("menu-aberto")) { abre(false); burger?.focus(); }
  });
  matchMedia("(min-width: 901px)").addEventListener?.("change", e => e.matches && abre(false));

  /* ---------- 2) cabeçalho: muda de cor sobre fundo claro e se esconde ao descer ---------- */
  const topo = $(".topo");
  let ultY = scrollY, pedidoTopo = 0;
  const lerTopo = () => {
    pedidoTopo = 0;
    if (!topo) return;
    const y = scrollY, h = topo.offsetHeight;
    topo.classList.toggle("rolou", y > 10);
    // o que está embaixo do cabeçalho é escuro ou claro?
    const pilha = document.elementsFromPoint(innerWidth / 2, h + 2);
    const baixo = pilha.find(el => el !== document.body && el !== H && !el.closest(".topo,.cursor,.zap,.abertura"));
    topo.classList.toggle("claro", !!baixo && !baixo.closest(".escuro"));
    if (!document.body.classList.contains("menu-aberto")) {
      if (y > 320 && y > ultY + 6) topo.classList.add("some");
      else if (y < ultY - 6 || y < 320) topo.classList.remove("some");
    }
    ultY = y;
  };
  const agendaTopo = () => { if (!pedidoTopo) pedidoTopo = requestAnimationFrame(lerTopo); };
  addEventListener("scroll", agendaTopo, { passive: true });
  addEventListener("resize", agendaTopo);
  topo?.addEventListener("focusin", () => topo.classList.remove("some"));
  document.addEventListener("mv:abriu", agendaTopo);
  document.addEventListener("mv:conteudo", agendaTopo);
  addEventListener("load", agendaTopo);
  lerTopo();

  /* link do menu acompanha a seção visível (página inicial) */
  const ancoras = $$('.menu a[href^="#"]');
  if (ancoras.length && "IntersectionObserver" in window) {
    const mapa = new Map(ancoras.map(a => [a.hash.slice(1), a]));
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      ancoras.forEach(a => a.classList.remove("ativo"));
      mapa.get(e.target.id)?.classList.add("ativo");
    }), { rootMargin: "-45% 0px -50% 0px" });
    mapa.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- 3) guilhoché: anéis ondulados como no papel de passaporte ----------
     <svg data-roseta="anel">  = moldura em volta do globo
     <svg data-roseta="cheio"> = desenho inteiro (no lugar de fotos que faltam)
     data-desenha             = as linhas se desenham ao aparecer */
  const NS = "http://www.w3.org/2000/svg";
  const DESENHOS = {
    anel: [
      { n: 10, r0: 220, a: 15, k: 18, seg: 14 },   // corda trançada
      { n: 1, r0: 197, a: 0, k: 1, seg: 180 },     // filete de dentro
      { n: 1, r0: 243, a: 0, k: 1, seg: 180 }      // filete de fora
    ],
    cheio: [
      { n: 10, r0: 205, a: 16, k: 18, seg: 14 },
      { n: 1, r0: 182, a: 0, k: 1, seg: 180 },
      { n: 1, r0: 230, a: 0, k: 1, seg: 180 },
      { n: 14, r0: 110, a: 48, k: 9, seg: 16 },    // renda do meio
      { n: 1, r0: 40, a: 0, k: 1, seg: 120 }
    ]
  };
  function roseta(svg) {
    if (!svg || svg.dataset.feita) return;
    svg.dataset.feita = "1";
    svg.setAttribute("viewBox", "-250 -250 500 500");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.classList.add("roseta");
    let idx = 0;
    (DESENHOS[svg.dataset.roseta] || DESENHOS.cheio).forEach(c => {
      const passos = c.k * c.seg;
      for (let j = 0; j < c.n; j++) {
        const fase = j / c.n * Math.PI * 2, R = c.r0 + j * (c.dr || 0);
        let d = "";
        for (let s = 0; s < passos; s++) {
          const t = s / passos * Math.PI * 2, r = R + c.a * Math.sin(c.k * t + fase);
          d += (s ? "L" : "M") + (r * Math.cos(t)).toFixed(1) + " " + (r * Math.sin(t)).toFixed(1);
        }
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d + "Z");
        p.setAttribute("pathLength", "1");
        p.style.setProperty("--i", idx++);
        svg.append(p);
      }
    });
  }
  mv.roseta = window.mvRoseta = roseta;

  /* ---------- 4) letras e palavras ----------
     [data-letras]  → cada letra sobe de dentro da linha quando o título aparece
     [data-palavras] → cada palavra vira um <span class="w"> (o motion.js acende uma a uma) */
  function letras(el) {
    if (!el || el.classList.contains("letras")) return;
    const texto = el.textContent.replace(/\s+/g, " ").trim();
    const leitor = document.createElement("span"); leitor.className = "sr"; leitor.textContent = texto;
    const vis = document.createElement("span"); vis.setAttribute("aria-hidden", "true");
    let i = 0;
    const palavra = p => {
      const w = document.createElement("span"); w.className = "pal";
      [...p].forEach(c => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; s.style.setProperty("--i", i++); w.append(s); });
      return w;
    };
    [...el.childNodes].forEach(n => {
      if (n.nodeName === "BR") { vis.append(document.createElement("br")); return; }
      const t = n.textContent; if (!t) return;
      t.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) vis.append(" "); else vis.append(palavra(part));
      });
    });
    el.replaceChildren(leitor, vis);
    el.classList.add("letras");
  }
  function palavras(el) {
    if (!el || el.dataset.feito) return;
    el.dataset.feito = "1";
    const t = el.textContent.trim();
    el.replaceChildren(...t.split(/\s+/).flatMap((w, i) => {
      const s = document.createElement("span"); s.className = "w"; s.textContent = w;
      return i ? [" ", s] : [s];
    }));
  }
  mv.letras = letras;

  /* entrar: quando o elemento aparece na tela (uma vez só) */
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    if (el.matches("[data-letras]")) el.classList.add("entra");
    if (el.matches("[data-surge]")) el.classList.add("visto");
    if (el.matches("[data-conta]")) conta(el);
    if (el.matches("svg[data-desenha]") && !reduz) el.classList.add("desenha");
  }), { threshold: .2, rootMargin: "0px 0px -6% 0px" }) : null;
  const observar = el => io ? io.observe(el) : el.classList.add("entra", "visto");

  /* contadores: 0 → valor, no formato brasileiro */
  function conta(el) {
    const fim = +el.dataset.conta; if (!fim || reduz) return;
    const t0 = performance.now(), dur = 1500;
    const passo = t => {
      const p = Math.min(1, (t - t0) / dur), v = Math.round(fim * (1 - Math.pow(1 - p, 4)));
      el.textContent = v.toLocaleString("pt-BR");
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  /* prepara um pedaço da página (no carregamento e quando o Firebase traz conteúdo novo) */
  const esperaAbertura = H.classList.contains("mv-abre");
  function preparar(raiz = document) {
    $$("svg[data-roseta]", raiz).forEach(roseta);
    $$("[data-palavras]", raiz).forEach(palavras);
    $$("[data-letras]", raiz).forEach(el => {
      letras(el);
      if (el.closest(".cap, .dsl")) return;                  // capítulos e destaques: entram quando ficam ativos
      if (el.closest(".hero") && esperaAbertura && !mv.abriu) return;
      observar(el);
    });
    $$("[data-surge]", raiz).forEach(observar);
    $$("[data-conta]", raiz).forEach(el => { if (!el.closest(".cap")) observar(el); });
    $$("svg[data-desenha]", raiz).forEach(el => { if (!(el.closest(".viagem") && esperaAbertura && !mv.abriu)) observar(el); });
  }
  mv.preparar = preparar;
  document.addEventListener("mv:conteudo", e => preparar(e.detail || document));

  /* o topo espera a cortina de abertura sair (motion.js avisa com "mv:abriu") */
  const soltarTopo = () => {
    if (mv.abriu) return; mv.abriu = true;
    $$(".hero [data-letras], .viagem svg[data-desenha]").forEach(observar);
  };
  if (esperaAbertura) { document.addEventListener("mv:abriu", soltarTopo); setTimeout(soltarTopo, 3600); }
  else mv.abriu = true;
  preparar();

  /* ---------- 5) a viagem: cada capítulo leva o globo a um continente ---------- */
  const globo = $("#globo"), caps = $$(".cap");
  if (globo && caps.length && "IntersectionObserver" in window) {
    let agora = -2;
    const marcar = i => {
      if (i === agora) return; agora = i;
      caps.forEach((c, k) => {
        const on = k === i;
        c.classList.toggle("agora", on);
        // com movimento, o nome some quando o capítulo sai; sem movimento, fica visível depois de lido
        $(".cap__nome", c)?.classList.toggle("entra", on || (!H.classList.contains("mv-anim") && k < i));
        if (on) { const b = $("[data-conta]", c); if (b) conta(b); }
      });
      globo.dispatchEvent(new CustomEvent(i < 0 ? "mv:auto" : "mv:ir", { detail: i }));
    };
    let obs;
    const criar = () => {
      obs?.disconnect();
      // a "linha de leitura": meio da tela no computador; abaixo do globo no celular
      const margem = celular() ? "-64% 0px -35% 0px" : "-49% 0px -50% 0px";
      obs = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        marcar(e.target.classList.contains("cap") ? +e.target.dataset.i : -1);
      }), { rootMargin: margem });
      [$(".hero"), $(".viagem__pergunta"), ...caps].forEach(el => el && obs.observe(el));
    };
    criar();
    matchMedia("(max-width: 900px)").addEventListener?.("change", criar);
    // tocar num continente do seletor rola até o capítulo dele
    globo.addEventListener("mv:clique", e => {
      const c = caps[e.detail]; if (!c) return;
      e.preventDefault();
      const alvo = c.getBoundingClientRect().top + scrollY - innerHeight * (celular() ? .45 : .25);
      window.mvLenis ? window.mvLenis.scrollTo(alvo, { duration: 1.4 }) : scrollTo({ top: alvo, behavior: reduz ? "auto" : "smooth" });
    });
  }

  /* ---------- 6) faixa de destinos: monta os itens (duas vezes, para girar sem emenda) ---------- */
  $$(".faixa__trilho[data-itens]").forEach(t => {
    const itens = t.dataset.itens.split(",").map(x => x.trim()).filter(Boolean);
    const um = () => itens.flatMap(x => {
      const s = document.createElement("span"); s.textContent = x;
      const a = document.createElement("i"); a.innerHTML = AVIAO;
      return [s, a.firstChild];
    });
    t.append(...um(), ...um());
  });

  /* ---------- 7) nome gigante do rodapé: ocupa a largura exata da tela ---------- */
  const nome = $(".rodape__nome"), nomeTxt = $(".rodape__nome span");
  if (nome && nomeTxt) {
    const caber = () => {
      const pad = parseFloat(getComputedStyle(nome).paddingLeft) || 0;
      nome.style.setProperty("--wd", "125%");                 // mede na largura máxima da fonte
      nome.style.fontSize = "100px";
      const livre = nome.clientWidth - pad * 2, usado = nomeTxt.getBoundingClientRect().width;
      nome.style.fontSize = Math.max(16, Math.floor(100 * livre / Math.max(1, usado) * 10) / 10) + "px";
      nome.style.removeProperty("--wd");
      window.ScrollTrigger?.refresh();
    };
    caber(); addEventListener("resize", caber); document.fonts?.ready.then(caber);
  }

  /* ---------- 8) como funciona no celular: a linha desce com a rolagem ---------- */
  const listaPassos = $(".voo__passos");
  if (listaPassos) {
    const itens = [...listaPassos.children];
    let pedido = 0;
    const medir = () => {
      pedido = 0;
      if (!celular()) { if (!H.classList.contains("mv-anim")) itens.forEach(li => li.classList.add("chegou")); return; }
      const r = listaPassos.getBoundingClientRect(), vh = innerHeight;
      const p = reduz ? 1 : Math.max(0, Math.min(1, (vh * .7 - r.top) / r.height));
      listaPassos.style.setProperty("--rota", p.toFixed(3));
      itens.forEach(li => li.classList.toggle("chegou", reduz || li.getBoundingClientRect().top < vh * .72));
    };
    addEventListener("scroll", () => { if (!pedido) pedido = requestAnimationFrame(medir); }, { passive: true });
    addEventListener("resize", medir); medir();
  }

  /* ---------- 9) botão do WhatsApp (some na página da promoção, que tem o seu) ---------- */
  if (!document.body.hasAttribute("data-sem-zap")) {
    const a = document.createElement("a");
    a.className = "zap"; a.target = "_blank"; a.rel = "noopener";
    a.href = `https://wa.me/${ZAP}?text=` + encodeURIComponent("Olá! Gostaria de mais informações sobre viagens.");
    a.setAttribute("aria-label", "Conversar no WhatsApp");
    a.innerHTML = ICONE_ZAP;
    document.body.append(a);
    const mostra = () => { const on = scrollY > 600; a.classList.toggle("mostra", on); a.tabIndex = on ? 0 : -1; };
    addEventListener("scroll", mostra, { passive: true }); mostra();
  }

  /* ---------- 10) formulário de contato ----------
     Envia e-mail para mundialviagens2014@gmail.com (FormSubmit), guarda uma cópia
     no Firestore (coleção "contatos") e, se o e-mail falhar, oferece o WhatsApp. */
  const f = $(".contato__form");
  if (f) {
    const EMAIL_DESTINO = "mundialviagens2014@gmail.com";
    const ok = $(".form__ok", f), btn = $('button[type="submit"]', f);

    const enviarEmail = async d => {
      // FormData + no-cors: sem preflight de CORS. A resposta é opaca; só sabemos que saiu sem erro de rede.
      const fd = new FormData();
      fd.append("_subject", "Novo contato do site: " + (d.destino || "viagem") + " - " + d.nome);
      fd.append("_template", "table");
      fd.append("_captcha", "false");
      fd.append("_replyto", d.email);
      fd.append("email", d.email);
      fd.append("Nome", d.nome);
      fd.append("Telefone", d.tel || "-");
      fd.append("Destino desejado", d.destino || "-");
      fd.append("Mês da viagem", d.mes || "-");
      fd.append("Mensagem", d.msg || "-");
      await fetch("https://formsubmit.co/ajax/" + EMAIL_DESTINO, { method: "POST", mode: "no-cors", body: fd });
    };

    const salvarCopia = async d => {
      const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const { getFirestore, collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const { firebaseConfig } = await import("./conexao.js");
      // getApps(): a página inicial já abriu o Firebase para os destaques; abrir de novo dava erro e a cópia se perdia
      const db = getFirestore(getApps()[0] || initializeApp(firebaseConfig));
      await addDoc(collection(db, "contatos"), {
        nome: d.nome, telefone: d.tel, email: d.email, destino: d.destino, mes: d.mes, mensagem: d.msg,
        criadoEm: serverTimestamp()
      });
    };

    f.addEventListener("submit", async e => {
      e.preventDefault();
      if (!f.reportValidity()) return;
      const v = id => f.querySelector("#" + id).value.trim();
      const d = { nome: v("nome"), tel: v("tel"), email: v("email"), destino: v("destino"), mes: v("data"), msg: v("msg") };
      const txt = btn.textContent;
      ok.hidden = true; ok.classList.remove("erro");
      btn.disabled = true; btn.textContent = "Enviando…";

      const [email, copia] = await Promise.allSettled([enviarEmail(d), salvarCopia(d)]);
      if (email.status === "rejected") console.error("[contato] e-mail falhou:", email.reason);
      if (copia.status === "rejected") console.warn("[contato] cópia no Firestore falhou:", copia.reason);

      if (email.status === "fulfilled") {
        ok.textContent = "Mensagem enviada. Respondemos em até 24 horas.";
        f.reset();
      } else {
        const t = `Olá! Meu nome é ${d.nome}. Destino: ${d.destino || "a definir"}${d.mes ? " (" + d.mes + ")" : ""}. ${d.msg}${d.tel ? " Telefone: " + d.tel : ""}`;
        const a = document.createElement("a");
        a.href = `https://wa.me/${ZAP}?text=` + encodeURIComponent(t);
        a.target = "_blank"; a.rel = "noopener"; a.textContent = "envie pelo WhatsApp";
        ok.textContent = "A mensagem não saiu. Verifique a internet ou ";
        ok.append(a, ".");
        ok.classList.add("erro");
      }
      ok.hidden = false; btn.disabled = false; btn.textContent = txt;
    });
  }
})();
