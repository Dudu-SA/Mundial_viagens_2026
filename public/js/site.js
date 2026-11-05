/* site.js: comportamento comum das páginas públicas (início, vendas e viagem).
   Script clássico com defer, sem bibliotecas. Não depende do Firebase: menu, abas-índice,
   aparecer ao rolar, botão do WhatsApp e formulário funcionam sozinhos.
   O único movimento "autoral" (as fotos caindo no álbum) é CSS puro, em css/site.css. */
(() => {
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ZAP = "558888870400";
  const ICONE_ZAP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.7-1.2A9.4 9.4 0 1 0 12 2.6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path transform="translate(7.1 7) scale(.42)" fill="currentColor" d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.98.98 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99Z"/></svg>';
  const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  /* ---------- 1) a foto impressa: peça usada pelos módulos (saídas, vendas, viagem) ----------
     foto({ src, alt, ar, legenda, sub, data, fita }) -> <figure class="foto"> com cantoneiras,
     fita laranja opcional e carimbo de data opcional. Sem src, mostra o papel em branco. */
  function foto(o = {}) {
    const f = el("figure", "foto");
    if (o.ar) f.style.setProperty("--ar", o.ar);
    f.append(el("span", "canto"));
    if (o.fita) { const t = el("span", "fita" + (o.fita === "dir" ? " fita--dir" : "")); t.setAttribute("aria-hidden", "true"); f.append(t); }
    const img = el("div", "foto__img");
    if (o.src) { const im = el("img"); im.src = o.src; im.alt = o.alt || ""; im.decoding = "async"; if (o.lazy) im.loading = "lazy"; img.append(im); }
    else {
      img.innerHTML = '<svg viewBox="0 0 400 300" aria-hidden="true"><rect width="400" height="300" fill="#e6ebf3"/><path d="M0 230q100-70 200-20t200-30V300H0Z" fill="#d4dcea"/><circle cx="320" cy="70" r="30" fill="#fff"/><text x="200" y="160" text-anchor="middle" font-family="Caveat,cursive" font-size="30" fill="#4f5f85">foto em breve</text></svg>';
    }
    f.append(img);
    if (o.data) {
      const [y, m, d] = o.data.split("-");
      const c = el("span", "carimbo"); c.setAttribute("aria-hidden", "true");
      c.append(el("i", "", "saída"), el("b", "", String(+d)), el("i", "", MES[+m - 1] + " " + y));
      f.append(c);
    }
    if (o.legenda) { const l = el("figcaption", "foto__leg", o.legenda); if (o.sub) l.append(el("small", "", o.sub)); f.append(l); }
    return f;
  }
  window.mv = { iconeZap: ICONE_ZAP, foto, el, ZAP };
  window.mvIconeZap = ICONE_ZAP;
  const H = document.documentElement;

  /* ---------- 1b) letras, palavras e contadores ----------
     [data-letras]   → cada letra sobe de dentro da linha quando o título aparece
     [data-palavras] → cada palavra vira <span class="w"> (o motion.js acende uma a uma)
     [data-conta]    → número que conta de 0 até o valor */
  function letras(t) {
    if (!t || t.classList.contains("letras")) return;
    const texto = t.textContent.replace(/\s+/g, " ").trim();
    const leitor = el("span", "sr", texto), vis = el("span"); vis.setAttribute("aria-hidden", "true");
    let i = 0;
    const palavra = p => { const w = el("span", "pal"); [...p].forEach(c => { const x = el("span", "ch", c); x.style.setProperty("--i", i++); w.append(x); }); return w; };
    [...t.childNodes].forEach(n => {
      if (n.nodeName === "BR") { vis.append(document.createElement("br")); return; }
      (n.textContent || "").split(/(\s+)/).forEach(part => { if (!part) return; /^\s+$/.test(part) ? vis.append(" ") : vis.append(palavra(part)); });
    });
    t.replaceChildren(leitor, vis); t.classList.add("letras");
  }
  function palavras(t) {
    if (!t || t.dataset.feito) return; t.dataset.feito = "1";
    t.replaceChildren(...t.textContent.trim().split(/\s+/).flatMap((w, i) => { const s = el("span", "w", w); return i ? [" ", s] : [s]; }));
  }
  function conta(t) {
    const fim = +t.dataset.conta; if (!fim || reduz) return;
    const t0 = performance.now(), dur = 1400;
    const passo = x => { const p = Math.min(1, (x - t0) / dur); t.textContent = Math.round(fim * (1 - Math.pow(1 - p, 4))).toLocaleString("pt-BR"); if (p < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  }
  window.mv.letras = letras;

  /* ---------- 2) menu ---------- */
  const burger = $(".burger"), menu = $("#menu");
  const abre = on => {
    document.body.classList.toggle("menu-aberto", on);
    burger?.setAttribute("aria-expanded", on);
    burger?.setAttribute("aria-label", on ? "Fechar menu" : "Abrir menu");
    on ? window.mvLenis?.stop() : window.mvLenis?.start();
  };
  burger?.addEventListener("click", () => abre(!document.body.classList.contains("menu-aberto")));
  menu?.addEventListener("click", e => { if (e.target.closest("a")) abre(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("menu-aberto")) { abre(false); burger?.focus(); } });
  matchMedia("(min-width: 901px)").addEventListener?.("change", e => e.matches && abre(false));
  // marca a página atual no menu
  const aqui = location.pathname.split("/").pop() || "index.html";
  $$("#menu a").forEach(a => { const h = a.getAttribute("href"); if (h === aqui || (aqui === "promocoes.html" && h.startsWith("promocoes"))) a.setAttribute("aria-current", "page"); });

  /* ---------- 3) abas-índice: acende a aba da seção visível ---------- */
  const abas = $$(".abas a");
  if (abas.length && "IntersectionObserver" in window) {
    const alvo = new Map(abas.map(a => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { abas.forEach(a => a.classList.remove("ativo")); alvo.get(e.target.id)?.classList.add("ativo"); } });
    }, { rootMargin: "-40% 0px -50% 0px" });
    alvo.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- 4) aparecer ao rolar, uma vez por bloco ---------- */
  let io;
  const marcar = x => { x.classList.add("visto"); if (x.matches("[data-letras]")) x.classList.add("entra"); if (x.matches("[data-conta]")) conta(x); };
  const revelar = (raiz = document) => {
    $$("[data-palavras]", raiz).forEach(palavras);
    $$("[data-letras]", raiz).forEach(letras);
    const itens = $$("[data-surge]:not(.visto), [data-letras]:not(.visto), [data-conta]:not(.visto)", raiz)
      .filter(x => !(x.closest(".album") && H.classList.contains("mv-abre")));   // o topo espera a capa abrir
    if (reduz || !("IntersectionObserver" in window)) { itens.forEach(marcar); return; }
    io ||= new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { marcar(e.target); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .1 });
    itens.forEach(x => io.observe(x));
  };
  revelar();
  document.addEventListener("mv:abriu", () => revelar(document));
  if (H.classList.contains("mv-abre")) setTimeout(() => revelar(document), 3600);
  // os módulos avisam quando o conteúdo do Firebase chegou
  document.addEventListener("mv:conteudo", e => revelar(e.detail || document));
  // nada fica escondido se algo falhar
  setTimeout(() => $$("[data-surge]:not(.visto), [data-letras]:not(.visto)").forEach(x => { if (x.getBoundingClientRect().top < innerHeight && !H.classList.contains("mv-abre")) marcar(x); }), 2500);

  /* ---------- 5) botão flutuante do WhatsApp ---------- */
  if (!$(".zap")) {
    const a = el("a", "zap"); a.target = "_blank"; a.rel = "noopener";
    a.href = `https://wa.me/${ZAP}?text=` + encodeURIComponent("Olá! Gostaria de mais informações sobre viagens.");
    a.setAttribute("aria-label", "Conversar no WhatsApp");
    a.innerHTML = ICONE_ZAP;
    document.body.append(a);
    let pedido = 0;
    const mostra = () => { pedido = 0; const on = scrollY > 500; a.classList.toggle("mostra", on); a.tabIndex = on ? 0 : -1; };
    addEventListener("scroll", () => { if (!pedido) pedido = requestAnimationFrame(mostra); }, { passive: true }); mostra();
  }

  /* ---------- 6) formulário de contato ----------
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
        const a = el("a", "", "envie pelo WhatsApp");
        a.href = `https://wa.me/${ZAP}?text=` + encodeURIComponent(t); a.target = "_blank"; a.rel = "noopener";
        ok.textContent = "A mensagem não saiu. Verifique a internet ou ";
        ok.append(a, ".");
        ok.classList.add("erro");
      }
      ok.hidden = false; btn.disabled = false; btn.textContent = txt;
    });
  }
})();
