/* destaques.js: bloco "Em destaque" da página inicial.
   Lê a coleção "destaques" (cadastrada no painel admin) e monta um carrossel em tela cheia:
   foto grande com zoom lento, título que sobe letra por letra, troca sozinho a cada 7 s
   e pausa quando a pessoa passa o mouse, toca ou navega com o teclado. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./conexao.js";

const sec = document.getElementById("novidades");
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const linkSeguro = u => /^(https?:\/\/|[\w\-./]+\.html|#)/i.test(u || "") ? u : "";
const ROTULO = { promocao: "Promoção", grupo: "Saída em grupo", pacote: "Pacote", peregrinacao: "Peregrinação", novidade: "Novidade" };
const dois = n => String(n).padStart(2, "0");
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;

try {
  const db = getFirestore(getApps()[0] || initializeApp(firebaseConfig));
  const snap = await getDocs(query(collection(db, "destaques"), orderBy("ordem", "asc")));
  const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(x => x.ativo !== false && (!x.exibirAte || x.exibirAte >= hoje()));
  if (!lista.length) throw new Error("vazio");

  const caixa = sec.querySelector(".destaques__slides"), moldura = sec.querySelector(".destaques__moldura");
  const cont = sec.querySelector(".destaques__cont"), barra = sec.querySelector(".destaques__barra i");
  const n = lista.length;
  sec.classList.toggle("solo", n < 2);

  const slides = lista.map((x, i) => {
    const tipo = ROTULO[x.tipo] ? x.tipo : "novidade";
    const s = el("article", "dsl t-" + tipo + (x.imagem ? "" : " sem-foto"));
    s.setAttribute("aria-roledescription", "item");
    s.setAttribute("aria-label", `${i + 1} de ${n}`);
    const fig = el("div", "dsl__img");
    if (x.imagem) {
      const im = el("img"); im.src = x.imagem; im.alt = ""; im.decoding = "async"; if (i) im.loading = "lazy";
      fig.append(im);
    } else {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.dataset.roseta = "cheio"; fig.append(svg);
    }
    const t = el("div", "dsl__txt");
    const h = el("h3", "", x.titulo || ""); h.dataset.letras = "";
    t.append(el("span", "dsl__tag", x.etiqueta || ROTULO[tipo]), h);
    if (x.texto) t.append(el("p", "", x.texto));
    const href = linkSeguro(x.link);
    if (href) { const a = el("a", "btn btn--claro", x.botao || "Saiba mais"); a.href = href; a.dataset.ima = ""; t.append(a); }
    s.append(fig, t); caixa.append(s);
    return s;
  });

  sec.hidden = false;
  // divide os títulos em letras, desenha os guilhochés e avisa o motion.js (moldura que cresce)
  document.dispatchEvent(new CustomEvent("mv:conteudo", { detail: sec }));

  let atual = -1;
  const ir = i => {
    const k = (i + n) % n; if (k === atual) return; atual = k;
    slides.forEach((s, j) => {
      const on = j === k;
      s.classList.toggle("ativo", on); s.inert = !on;
      s.querySelector("[data-letras]")?.classList.toggle("entra", on);
    });
    cont.replaceChildren(el("b", "", dois(k + 1)), " / " + dois(n));
    // reinicia a barra de tempo: quando ela enche, passa para o próximo
    barra.classList.remove("corre"); void barra.offsetWidth; if (n > 1 && !reduz) barra.classList.add("corre");
  };
  sec.querySelector(".destaques__ant").onclick = () => ir(atual - 1);
  sec.querySelector(".destaques__prox").onclick = () => ir(atual + 1);
  barra.addEventListener("animationend", () => ir(atual + 1));
  moldura.addEventListener("keydown", e => { if (e.key === "ArrowRight") ir(atual + 1); if (e.key === "ArrowLeft") ir(atual - 1); });

  // arrastar com o dedo ou o mouse troca de item
  let x0 = null;
  moldura.addEventListener("pointerdown", e => { if (!e.target.closest("a,button")) x0 = e.clientX; });
  addEventListener("pointerup", e => {
    if (x0 == null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) ir(atual + (dx < 0 ? 1 : -1));
  });

  // pausa enquanto a pessoa lê, mexe ou quando o bloco sai da tela
  const motivos = new Set();
  const pausa = (m, on) => { on ? motivos.add(m) : motivos.delete(m); sec.classList.toggle("pausa", motivos.size > 0); };
  moldura.addEventListener("pointerenter", () => pausa("mouse", true));
  moldura.addEventListener("pointerleave", () => pausa("mouse", false));
  sec.addEventListener("focusin", () => pausa("foco", true));
  sec.addEventListener("focusout", () => pausa("foco", false));
  moldura.addEventListener("touchstart", () => pausa("toque", true), { passive: true });
  moldura.addEventListener("touchend", () => setTimeout(() => pausa("toque", false), 3000), { passive: true });
  new IntersectionObserver(([e]) => pausa("fora", !e.isIntersecting), { threshold: .25 }).observe(moldura);

  ir(0);
} catch (e) {
  if (e.message !== "vazio") console.warn("[destaques]", e);
}
