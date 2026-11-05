/* destaques.js: bloco "Em destaque" da página inicial.
   Lê a coleção "destaques" (cadastrada no painel admin) e mostra cada item como uma página
   marcada do álbum: foto impressa com fita laranja, etiqueta, título, texto e link. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./conexao.js";

const sec = document.getElementById("novidades");
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const linkSeguro = u => /^(https?:\/\/|[\w\-./]+\.html|#)/i.test(u || "") ? u : "";
const ROTULO = { promocao: "Promoção", grupo: "Saída em grupo", pacote: "Pacote", peregrinacao: "Peregrinação", novidade: "Novidade" };
const fotoOk = u => /^(data:image\/|https:\/\/)/i.test(u || "");
const { el, foto } = window.mv;
const SETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';

try {
  const db = getFirestore(getApps()[0] || initializeApp(firebaseConfig));
  const snap = await getDocs(query(collection(db, "destaques"), orderBy("ordem", "asc")));
  const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(x => x.ativo !== false && (!x.exibirAte || x.exibirAte >= hoje()));
  if (!lista.length) throw new Error("vazio");

  const caixa = sec.querySelector(".destaques__lista");
  caixa.append(...lista.map((x, i) => {
    const tipo = ROTULO[x.tipo] ? x.tipo : "novidade";
    const href = linkSeguro(x.link);
    const art = el(href ? "a" : "article", "destaque"); art.dataset.surge = ""; art.style.setProperty("--atraso", (i % 3) * .1 + "s");
    if (href) art.href = href;
    art.append(foto({ src: fotoOk(x.imagem) ? x.imagem : "", ar: "5/4", fita: i % 2 ? "dir" : "topo", lazy: i > 1 }));
    const t = el("div", "destaque__txt");
    t.append(el("span", "destaque__tag", x.etiqueta || ROTULO[tipo]), el("h3", "", x.titulo || ""));
    if (x.texto) t.append(el("p", "", x.texto));
    if (href) { const l = el("span", "link", x.botao || "Saiba mais"); l.innerHTML += SETA; t.append(l); }
    art.append(t);
    return art;
  }));
  sec.hidden = false;
  document.dispatchEvent(new CustomEvent("mv:conteudo", { detail: sec }));
} catch (e) {
  if (e.message !== "vazio") console.warn("[destaques]", e);
}
