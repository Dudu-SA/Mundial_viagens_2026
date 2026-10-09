import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./conexao.js";

const sec = document.getElementById("novidades");
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const linkSeguro = u => /^(https?:\/\/|[\w\-./]+\.html|#)/i.test(u || "") ? u : "";
const TIPOS = { promocao: ["Promoção", "✈️"], grupo: ["Grupo", "👥"], pacote: ["Pacote", "🧳"], peregrinacao: ["Peregrinação", "⛪"], novidade: ["Novidade", "✨"] };
const pad = n => String(n).padStart(2, "0");

try {
  const db = getFirestore(getApps()[0] || initializeApp(firebaseConfig));
  const snap = await getDocs(query(collection(db, "destaques"), orderBy("ordem", "asc")));
  const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(x => x.ativo !== false && (!x.exibirAte || x.exibirAte >= hoje()));
  if (!lista.length) throw new Error("vazio");

  const dest = sec.querySelector(".dest"), track = sec.querySelector(".dest__track"), dots = sec.querySelector(".dest__dots"), count = sec.querySelector(".dest__count");
  dest.classList.toggle("solo", lista.length < 2);

  lista.forEach((x, i) => {
    const tipo = TIPOS[x.tipo] ? x.tipo : "novidade", t = TIPOS[tipo];
    const s = document.createElement("article"); s.className = "dest__slide t-" + tipo;
    if (x.imagem) {
      const bg = document.createElement("div"); bg.className = "dest__bg"; bg.style.backgroundImage = `url("${x.imagem}")`; s.append(bg);
    } else {
      const g = document.createElement("span"); g.className = "dest__glyph"; g.setAttribute("aria-hidden", "true"); g.textContent = t[1]; s.append(g);
    }
    const b = document.createElement("div"); b.className = "dest__body";
    const tag = document.createElement("span"); tag.className = "dest__tag"; tag.textContent = x.etiqueta || t[0];
    const h = document.createElement("h3"); h.textContent = x.titulo || "";
    b.append(tag, h);
    if (x.texto) { const p = document.createElement("p"); p.textContent = x.texto; b.append(p); }
    const href = linkSeguro(x.link);
    if (href) { const a = document.createElement("a"); a.className = "btn btn--white btn--sm"; a.href = href; a.textContent = (x.botao || "Saiba mais") + "  →"; b.append(a); }
    s.append(b); track.append(s);
    const d = document.createElement("button"); d.type = "button"; d.setAttribute("aria-label", "Ir para o item " + (i + 1));
    d.onclick = () => ir(i);
    dots.append(d);
  });

  sec.hidden = false;                       // precisa estar visível para medir as posições
  const slides = [...track.querySelectorAll(".dest__slide")], bolas = [...dots.children], n = slides.length;
  count.innerHTML = "<b></b><span></span>";
  const alvo = s => s.offsetLeft + s.offsetWidth / 2 - track.clientWidth / 2;
  const atual = () => {
    const c = track.scrollLeft + track.clientWidth / 2; let k = 0, m = 1e9;
    slides.forEach((s, i) => { const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - c); if (d < m) { m = d; k = i; } });
    return k;
  };
  const ir = i => track.scrollTo({ left: alvo(slides[(i + n) % n]) });
  let ult = -1;
  const marcar = () => {
    const k = atual(); if (k === ult) return; ult = k;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === k));
    bolas.forEach((d, i) => d.classList.toggle("on", i === k));
    count.firstChild.textContent = pad(k + 1); count.lastChild.textContent = "/ " + pad(n);
  };
  let raf = 0;
  track.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(marcar); }, { passive: true });
  addEventListener("resize", () => { ult = -1; track.style.scrollBehavior = "auto"; ir(atual()); track.style.scrollBehavior = ""; marcar(); });
  marcar();
  sec.querySelector(".prev").onclick = () => ir(atual() - 1);
  sec.querySelector(".next-s").onclick = () => ir(atual() + 1);

  // o autoplay é a própria barra de progresso: quando ela enche, vai para o próximo
  dots.addEventListener("animationend", e => { if (e.animationName === "destfill") ir(atual() + 1); });
  const pausar = on => dest.classList.toggle("paused", on);
  dest.addEventListener("mouseenter", () => pausar(true));
  dest.addEventListener("mouseleave", () => pausar(false));
  dest.addEventListener("focusin", () => pausar(true));
  dest.addEventListener("focusout", () => pausar(false));
  dest.addEventListener("touchstart", () => pausar(true), { passive: true });
  dest.addEventListener("touchend", () => setTimeout(() => pausar(false), 2500), { passive: true });
} catch (e) {
  if (e.message !== "vazio") console.warn("[destaques]", e);
}