/* saidas.js: "Próximas saídas" na página inicial.
   Mostra as viagens ativas (coleção "promocoes") em ordem de data de saída, como fotos
   impressas no álbum: borda branca, cantoneiras, carimbo com a data e legenda à mão.
   A peça .foto vem do site.js (window.mv.foto). Usa o que já está no painel. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./conexao.js";
import { precoDe, parcelasDe } from "./preco.js";
import { selosEl } from "./selos.js";

const QUANTAS = 8;
const sec = document.getElementById("saidas"), lista = document.getElementById("saidas-lista"), vazio = document.getElementById("saidas-vazio");
const TIPO = { promocao: "Promoção", grupo: "Saída em grupo", pacote: "Pacote", peregrinacao: "Peregrinação" };
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const noites = p => p.dataVolta ? Math.round((Date.parse(p.dataVolta) - Date.parse(p.dataSaida)) / 864e5) : 0;
const fotoOk = u => /^(data:image\/|https:\/\/)/i.test(u || "");
const { el, foto } = window.mv;

function cartao(p, i) {
  const [, m, d] = p.dataSaida.split("-");
  const a = el("a", "saida"); a.href = "promo.html?id=" + encodeURIComponent(p.id); a.dataset.surge = "";
  a.style.setProperty("--atraso", (i % 4) * .08 + "s");
  const nt = noites(p);
  const pr = precoDe(p);
  a.setAttribute("aria-label", `${p.lugar}, saída em ${+d} de ${MESES[+m - 1]}, ${pr.rotulo} ${pr.valor}`);
  a.append(foto({ src: (p.fotos || []).find(fotoOk), ar: "4/5", data: p.dataSaida, lazy: i > 3 }));
  const selos = selosEl(p); if (selos) a.querySelector(".foto").append(selos);
  /* título em linha cheia; embaixo, duração à esquerda e preço à direita */
  const info = el("div", "saida__info saida__info--empilhada"), txt = el("div");
  txt.append(el("span", "saida__tag", p.etiqueta || TIPO[p.categoria] || TIPO.promocao), el("h3", "", p.lugar || "Viagem"));
  const meta = el("div", "saida__meta");
  meta.append(el("small", "", nt > 0 ? nt + (nt > 1 ? " noites" : " noite") : ""));
  const preco = el("div", "saida__preco" + (pr.numero ? "" : " saida__preco--texto"));
  preco.append(el("span", "", pr.rotulo), el("b", "", pr.valor));
  if (parcelasDe(p)) preco.append(el("small", "parc", parcelasDe(p)));
  meta.append(preco);
  info.append(txt, meta);
  a.append(info);
  return a;
}

/* topo do álbum: as três fotos viram as promoções à venda (destaques primeiro, depois as que saem antes) */
function topo(ativas) {
  const fotos = [...document.querySelectorAll("#album-fotos .foto")]; if (!fotos.length) return;
  const escolha = ativas.filter(p => (p.fotos || []).some(fotoOk))
    .sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0) || (a.dataSaida || "9").localeCompare(b.dataSaida || "9"))
    .slice(0, fotos.length);
  if (!escolha.length) {                                         // nada à venda com foto: uma foto da agência
    escolha.push({ lugar: "Aparecida do Norte", foto: "imgs/aparecida.jpg", sub: "peregrinações com a Mundial", href: "promocoes.html#peregrinacao" });
  }
  fotos.forEach((f, i) => {
    const p = escolha[i];
    if (!p) { f.hidden = true; return; }
    const pr = p.foto ? null : precoDe(p);
    f.href = p.href || "promo.html?id=" + encodeURIComponent(p.id);
    f.setAttribute("aria-label", p.lugar + (pr ? `, ${pr.rotulo} ${pr.valor}` : ""));
    const im = el("img"); im.alt = ""; im.decoding = "async"; if (!i) im.fetchPriority = "high";
    im.onload = () => im.classList.add("carregou"); im.src = p.foto || p.fotos.find(fotoOk);
    if (im.complete) im.classList.add("carregou");
    f.querySelector(".foto__img").replaceChildren(im);
    const leg = f.querySelector(".foto__leg");
    leg.replaceChildren(p.lugar || "Viagem", el("small", "", p.sub || `${pr.rotulo} ${pr.valor}`.replace(/^valor /, "") + (parcelasDe(p) ? " · " + parcelasDe(p) : "")));
  });
}

try {
  const db = getFirestore(getApps()[0] || initializeApp(firebaseConfig));
  const snap = await getDocs(query(collection(db, "promocoes"), where("exibirAte", ">=", hoje()), orderBy("exibirAte", "asc")));
  const ativas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  topo(ativas);
  const itens = ativas
    .filter(p => p.dataSaida && p.dataSaida >= hoje())
    .sort((a, b) => a.dataSaida.localeCompare(b.dataSaida))
    .slice(0, QUANTAS);
  if (!itens.length) throw new Error("vazio");
  lista.replaceChildren(...itens.map(cartao));
} catch (e) {
  if (!document.querySelector("#album-fotos img")) topo([]);
  if (e.message !== "vazio") {
    console.warn("[saidas]", e);
    vazio.querySelector("p").textContent = "Não foi possível carregar as saídas agora. Tente de novo em instantes ou fale com a gente no WhatsApp.";
  }
  lista.hidden = true;
  vazio.hidden = false;
}
document.dispatchEvent(new CustomEvent("mv:conteudo", { detail: sec }));
