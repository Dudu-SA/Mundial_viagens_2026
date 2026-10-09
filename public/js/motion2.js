/* motion2.js — camada extra de motion design e 3D. Carregar depois de motion.js. */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fino = matchMedia("(hover:hover) and (pointer:fine)").matches;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const AVIAO = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 12 3 3.5l2.6 8.5L3 20.5 21.5 12Zm-13.7 1.3L6.7 16.7 15 12.9 6.7 9l1.1 3.7h5.7v.6H7.8Z" fill-rule="evenodd"/></svg>';

/* 1) intro: cortina com avião (uma vez por sessão, só na home) */
if (!reduce && document.getElementById("globo")) {
  let ja = false; try { ja = sessionStorage.getItem("m2intro"); sessionStorage.setItem("m2intro", "1"); } catch {}
  if (!ja) {
    const i = el("div", "intro", AVIAO + '<div class="intro__in"><span><b>Mundial Viagens</b></span></div><div class="intro__bar"><i></i></div>');
    i.setAttribute("aria-hidden", "true");
    i.insertBefore(i.querySelector("svg"), i.firstChild);
    document.body.append(i);
    setTimeout(() => i.remove(), 2400);
  }
}

/* 2) cursor com rastro suave */
if (fino && !reduce) {
  const d = el("i", "cur-dot"), r = el("i", "cur-ring"); document.body.append(d, r);
  let x = 0, y = 0, rx = 0, ry = 0;
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY; d.style.transform = `translate3d(${x}px,${y}px,0)`;
    document.documentElement.classList.add("cur-on");
    r.classList.toggle("big", !!e.target.closest?.("a,button,summary,input,textarea,.proj,.dest__slide"));
  }, { passive: true });
  addEventListener("pointerdown", () => r.classList.add("press"));
  addEventListener("pointerup", () => r.classList.remove("press"));
  document.documentElement.addEventListener("mouseleave", () => document.documentElement.classList.remove("cur-on"));
  const loop = () => { rx += (x - rx) * .18; ry += (y - ry) * .18; r.style.transform = `translate3d(${rx}px,${ry}px,0)`; requestAnimationFrame(loop); };
  loop();
}

/* 3) botões magnéticos com retorno elástico */
if (fino && !reduce) {
  const MAG = ".btn,.fab,.lp__cta,.globo__sel button,.dest__ctrl button,.vtabs button";
  let m = null;
  const solta = e => {
    if (!e) return;
    const de = e.style.translate || "0 0"; e.style.translate = "";
    e.animate([{ translate: de }, { translate: "0 0" }], { duration: 650, easing: "cubic-bezier(.3,1.7,.5,1)" });
  };
  document.addEventListener("pointermove", ev => {
    if (ev.pointerType !== "mouse") return;
    const t = ev.target.closest?.(MAG);
    if (t !== m) { solta(m); m = t; }
    if (!m) return;
    const b = m.getBoundingClientRect();
    m.style.translate = `${(ev.clientX - b.left - b.width / 2) * .28}px ${(ev.clientY - b.top - b.height / 2) * .38}px`;
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { solta(m); m = null; });
}

/* 4) inclinação 3D com profundidade nos cards */
if (fino && !reduce) {
  const TILT = ".card,blockquote,.stats div,.steps__list li,.bk,.lp__book";
  let cur = null;
  const off = e => {
    if (!e) return;
    e.classList.remove("is-tilt"); e.style.transition = "transform .7s cubic-bezier(.2,.7,.2,1),box-shadow .5s"; e.style.transform = "";
    setTimeout(() => { if (!e.classList.contains("is-tilt")) e.style.transition = ""; }, 740);
  };
  document.addEventListener("pointermove", ev => {
    if (ev.pointerType !== "mouse") return;
    const t = ev.target.closest?.(TILT), ok = t && !t.hasAttribute("data-reveal") ? t : null;
    if (ok !== cur) { off(cur); cur = ok; }
    if (!cur) return;
    const b = cur.getBoundingClientRect(), px = (ev.clientX - b.left) / b.width - .5, py = (ev.clientY - b.top) / b.height - .5;
    cur.classList.add("is-tilt"); cur.style.transition = "transform .12s ease-out,box-shadow .4s";
    cur.style.transform = `perspective(900px) rotateX(${-py * 11}deg) rotateY(${px * 13}deg) translateY(-6px)`;
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { off(cur); cur = null; });

  /* cards de destino criados depois (página de vendas) também inclinam */
  document.addEventListener("pointermove", ev => {
    const c = ev.target.closest?.(".proj"); if (!c || ev.pointerType !== "mouse") return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--ry", ((ev.clientX - r.left) / r.width - .5) * 8 + "deg");
    c.style.setProperty("--rx", -((ev.clientY - r.top) / r.height - .5) * 8 + "deg");
  }, { passive: true });
  document.addEventListener("pointerout", ev => {
    const c = ev.target.closest?.(".proj"); if (c && !c.contains(ev.relatedTarget)) { c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); }
  });
}

/* 5) parallax de profundidade: hero, destaques e hero da promoção */
{
  const ALVO = ".hero,.lp__hero,.dest__slide";
  addEventListener("pointermove", ev => {
    if (reduce || ev.pointerType !== "mouse") return;
    const a = ev.target.closest?.(ALVO); if (!a) return;
    const b = a.getBoundingClientRect(), nx = ((ev.clientX - b.left) / b.width - .5) * 2, ny = ((ev.clientY - b.top) / b.height - .5) * 2;
    if (a.classList.contains("dest__slide")) { a.style.setProperty("--px", nx.toFixed(3)); a.style.setProperty("--py", ny.toFixed(3)); }
    else { a.style.setProperty("--hx", nx.toFixed(3)); a.style.setProperty("--hy", ny.toFixed(3)); }
  }, { passive: true });
  document.addEventListener("pointerout", ev => {
    const a = ev.target.closest?.(ALVO); if (!a || a.contains(ev.relatedTarget)) return;
    ["--px", "--py", "--hx", "--hy"].forEach(p => a.style.removeProperty(p));
  });
}

/* 6) ripple + confete nos cliques */
{
  const RIP = ".btn,.lp__cta,.vtabs button,.globo__sel button,.dest__ctrl button";
  const BURST = ".btn,.lp__cta,.fab,.vtabs button,.globo__sel button";
  const cores = ["#f2a33a", "#ff7a59", "#6b4bd8", "#1d4a9f", "#fff"], formas = ["✦", "✈", "●", "★"];
  document.addEventListener("click", ev => {
    if (reduce) return;
    const r = ev.target.closest?.(RIP);
    if (r) { const b = r.getBoundingClientRect(), w = Math.max(b.width, b.height) * 2.4, s = el("i", "rip");
      s.style.cssText = `left:${ev.clientX - b.left}px;top:${ev.clientY - b.top}px;width:${w}px;height:${w}px`; r.append(s); setTimeout(() => s.remove(), 800); }
    if (!ev.target.closest?.(BURST)) return;
    for (let i = 0; i < 16; i++) {
      const p = el("i", "cf", formas[i % 4]);
      p.style.cssText = `left:${ev.clientX}px;top:${ev.clientY}px;color:${cores[i % 5]};font-size:${10 + Math.random() * 12}px;text-shadow:0 1px 3px rgba(0,0,0,.25)`;
      document.body.append(p);
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 100;
      p.animate([
        { transform: "translate(-50%,-50%) scale(.4)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d + 50}px)) rotate(${Math.random() * 540}deg) scale(1)`, opacity: 0 }
      ], { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.2,1)" }).onfinish = () => p.remove();
    }
  });
}

/* 7) palavras que sobem nos textos de apresentação */
if (!reduce && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .3 });
  document.querySelectorAll(".section-head .lead").forEach(p => {
    if (p.closest("#lista-promos") || p.children.length) return;
    const palavras = p.textContent.trim().split(/\s+/);
    p.textContent = "";
    palavras.forEach((w, i) => { const s = el("span", "w"); s.textContent = w; s.style.setProperty("--i", i); p.append(s, " "); });
    p.classList.add("wsplit"); io.observe(p);
  });
}

/* 8) cards de vendas entram um a um em 3D (eles são criados depois pelo promos.js) */
{
  const lista = document.getElementById("lista-promos");
  if (lista && !reduce) {
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1 || !n.classList.contains("proj")) return;
      n.style.setProperty("--i", [...lista.children].indexOf(n)); n.classList.add("proj-in");
      setTimeout(() => n.classList.remove("proj-in"), 1800);
    }))).observe(lista, { childList: true });
  }
}

/* 9) fundo 3D: formas wireframe flutuando + avião de papel que voa com a rolagem */
async function fundo3d() {
  if (reduce || navigator.connection?.saveData) return;
  let T;
  try { T = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js"); } catch { return; }
  const cv = el("canvas", "bg3d"); cv.setAttribute("aria-hidden", "true"); document.body.prepend(cv);
  let r;
  try { r = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true }); } catch { cv.remove(); return; }
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const sc = new T.Scene(), cam = new T.PerspectiveCamera(50, 1, .1, 100); cam.position.z = 14;
  const cores = [0x1d4a9f, 0x6b4bd8, 0xff7a59, 0xf2a33a];
  const geos = [new T.IcosahedronGeometry(1, 0), new T.OctahedronGeometry(1, 0), new T.TorusGeometry(.8, .25, 12, 32), new T.TetrahedronGeometry(1, 0), new T.TorusKnotGeometry(.6, .18, 64, 8)];
  const pequeno = innerWidth < 700, N = pequeno ? 10 : 24, itens = [];
  for (let i = 0; i < N; i++) {
    const m = new T.Mesh(geos[i % geos.length], new T.MeshBasicMaterial({ color: cores[i % 4], wireframe: true, transparent: true, opacity: .3 }));
    const lado = i % 2 ? 1 : -1;
    m.position.set(lado * (pequeno ? 3 + Math.random() * 4 : 5 + Math.random() * 8), (Math.random() - .5) * 30, -Math.random() * 9);
    m.scale.setScalar(.5 + Math.random() * 1.1);
    m.userData = { vx: (Math.random() - .5) * .012, vy: (Math.random() - .5) * .012, f: Math.random() * 6, y0: m.position.y, prof: .4 + Math.random() };
    sc.add(m); itens.push(m);
  }

  // avião de papel
  const v = new Float32Array([0,0,2.2, -1.1,0,-1, 0,-.35,-.7, 0,0,2.2, 1.1,0,-1, 0,-.35,-.7, 0,0,2.2, -1.1,0,-1, 0,.05,-.6, 0,0,2.2, 1.1,0,-1, 0,.05,-.6]);
  const ag = new T.BufferGeometry(); ag.setAttribute("position", new T.BufferAttribute(v, 3)); ag.computeVertexNormals();
  const aviao = new T.Group();
  aviao.add(new T.Mesh(ag, new T.MeshBasicMaterial({ color: 0xf2a33a, side: T.DoubleSide, transparent: true, opacity: .92 })));
  aviao.add(new T.LineSegments(new T.EdgesGeometry(ag), new T.LineBasicMaterial({ color: 0x0e2452 })));
  aviao.scale.setScalar(.55); sc.add(aviao);
  const RASTRO = 46, hist = [], tg = new T.BufferGeometry();
  tg.setAttribute("position", new T.BufferAttribute(new Float32Array(RASTRO * 3), 3));
  const rastro = new T.Line(tg, new T.LineBasicMaterial({ color: 0xf2a33a, transparent: true, opacity: .55 })); sc.add(rastro);

  const ajustar = () => { r.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
  addEventListener("resize", ajustar); ajustar();
  let mx = 0, my = 0; addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  let alvoP = 0, p = 0, ant = 0, dir = 1, camX = 0, vis = !document.hidden, t0 = performance.now();
  const lerpP = () => { const max = document.documentElement.scrollHeight - innerHeight; alvoP = max > 0 ? scrollY / max : 0; };
  addEventListener("scroll", lerpP, { passive: true }); lerpP();
  document.addEventListener("visibilitychange", () => { vis = !document.hidden; if (vis) { t0 = performance.now(); loop(); } });
  const caminho = (q, out) => out.set(Math.sin(q * Math.PI * 5) * (pequeno ? 3 : 5.5), (.5 - q) * 22 - 1.5, 1.5 + Math.cos(q * Math.PI * 3) * 1.5);
  const a = new T.Vector3(), b = new T.Vector3();
  function loop() {
    if (!vis) return; requestAnimationFrame(loop);
    const t = performance.now(), dt = Math.min(.05, (t - t0) / 1000); t0 = t;
    p += (alvoP - p) * (1 - Math.pow(.004, dt));
    const dp = p - ant; ant = p; if (Math.abs(dp) > 1e-5) dir = dp > 0 ? 1 : -1;
    camX += (mx * 2.2 - camX) * .05;
    cam.position.set(camX, (.5 - p) * 22, 14); cam.lookAt(camX * .3, (.5 - p) * 22 - my * 1.2, 0);
    itens.forEach(m => {
      const u = m.userData;
      m.rotation.x += u.vx + dt * .15 * u.prof; m.rotation.y += u.vy + dt * .2 * u.prof;
      m.position.y = u.y0 + Math.sin(t / 1400 + u.f) * .5;
    });
    caminho(p, a); caminho(Math.min(1, Math.max(0, p + .015 * dir)), b);
    a.y += Math.sin(t / 700) * .15; aviao.position.copy(a); aviao.lookAt(b);
    aviao.rotation.z += Math.sin(t / 900) * .12 + (b.x - a.x) * -.6;
    hist.unshift(a.clone()); if (hist.length > RASTRO) hist.pop();
    const pos = tg.attributes.position;
    for (let i = 0; i < RASTRO; i++) { const h = hist[Math.min(i, hist.length - 1)] || a; pos.setXYZ(i, h.x, h.y, h.z - .6); }
    pos.needsUpdate = true;
    r.render(sc, cam);
  }
  loop(); requestAnimationFrame(() => cv.classList.add("on"));
}
fundo3d();