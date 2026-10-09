/* motion.js — movimentos com função. Funciona em qualquer página que tenha motion.css. */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* 1) faixa de continentes: corre sozinha e acelera/inverte conforme a rolagem */
const mq = document.querySelector(".marquee__track");
if (mq && !reduce) {
  mq.parentElement.classList.add("js-on");
  let x = 0, ult = scrollY, vel = 0, dir = -1, t0 = performance.now(), vis = true;
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) { t0 = performance.now(); passo(t0); } }).observe(mq.parentElement);
  const passo = t => {
    if (!vis) return; requestAnimationFrame(passo);
    const dt = Math.min(.05, (t - t0) / 1000); t0 = t;
    const d = scrollY - ult; ult = scrollY;
    vel += (Math.max(-40, Math.min(40, d)) - vel) * .12;                    // velocidade de rolagem, suavizada
    if (Math.abs(vel) > .5) dir = vel > 0 ? -1 : 1;
    x += dir * (60 + Math.abs(vel) * 14) * dt;
    const w = mq.scrollWidth / 4;                                           // o conteúdo se repete 4x
    x = ((x % w) - w) % w;
    mq.style.transform = `translate3d(${x}px,0,0)`;
  };
  requestAnimationFrame(passo);
}

/* 2) cards de destino: brilho segue o ponteiro (delegação, vale para os cards criados depois) */
document.addEventListener("pointermove", e => {
  const c = e.target.closest?.(".proj"); if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty("--gx", (e.clientX - r.left) / r.width * 100 + "%");
  c.style.setProperty("--gy", (e.clientY - r.top) / r.height * 100 + "%");
}, { passive: true });

/* 3) passos: a linha acompanha a rolagem e os números acendem em sequência */
const lista = document.querySelector(".steps__list");
if (lista) {
  const itens = [...lista.children];
  const med = () => {
    const r = lista.getBoundingClientRect(), p = Math.max(0, Math.min(1, (innerHeight * .8 - r.top) / (r.height + innerHeight * .3)));
    lista.style.setProperty("--p", p.toFixed(3));
    itens.forEach((li, i) => li.classList.toggle("on", p >= (i + .6) / itens.length * .9));
  };
  addEventListener("scroll", () => requestAnimationFrame(med), { passive: true }); med();
}

/* 4) globo 3D (só na página inicial) */
if (document.getElementById("globo")) import("./globo.js");