/* saidas.js: "Próximas saídas" na página inicial.
   Mostra as viagens ativas (coleção "promocoes") em ordem de data de saída, como fotos
   impressas no álbum: borda branca, cantoneiras, carimbo com a data e legenda à mão.
   A peça .foto vem do site.js (window.mv.foto). Usa o que já está no painel. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./conexao.js";

const QUANTAS = 8;
const sec = document.getElementById("saidas"), lista = document.getElementById("saidas-lista"), vazio = document.getElementById("saidas-vazio");
const TIPO = { promocao: "Promoção", grupo: "Saída em grupo", pacote: "Pacote", peregrinacao: "Peregrinação" };
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const brl = n => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const noites = p => p.dataVolta ? Math.round((Date.parse(p.dataVolta) - Date.parse(p.dataSaida)) / 864e5) : 0;
const fotoOk = u => /^(data:image\/|https:\/\/)/i.test(u || "");
const { el, foto } = window.mv;

function cartao(p, i) {
  const [, m, d] = p.dataSaida.split("-");
  const a = el("a", "saida"); a.href = "promo.html?id=" + encodeURIComponent(p.id); a.dataset.surge = "";
  a.style.setProperty("--atraso", (i % 4) * .08 + "s");
  const nt = noites(p);
  a.setAttribute("aria-label", `${p.lugar}, saída em ${+d} de ${MESES[+m - 1]}, a partir de ${brl(p.preco)}`);
  a.append(foto({ src: (p.fotos || []).find(fotoOk), ar: "4/5", data: p.dataSaida, lazy: i > 3 }));
  const info = el("div", "saida__info"), txt = el("div");
  txt.append(el("span", "saida__tag", p.etiqueta || TIPO[p.categoria] || TIPO.promocao), el("h3", "", p.lugar || "Viagem"));
  if (nt > 0) txt.append(el("small", "", nt + (nt > 1 ? " noites" : " noite")));
  const preco = el("div", "saida__preco");
  preco.append(el("span", "", "a partir de"), el("b", "", brl(p.preco)));
  info.append(txt, preco);
  a.append(info);
  return a;
}

try {
  const db = getFirestore(getApps()[0] || initializeApp(firebaseConfig));
  const snap = await getDocs(query(collection(db, "promocoes"), where("exibirAte", ">=", hoje()), orderBy("exibirAte", "asc")));
  const itens = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.dataSaida && p.dataSaida >= hoje())
    .sort((a, b) => a.dataSaida.localeCompare(b.dataSaida))
    .slice(0, QUANTAS);
  if (!itens.length) throw new Error("vazio");
  lista.replaceChildren(...itens.map(cartao));
} catch (e) {
  if (e.message !== "vazio") {
    console.warn("[saidas]", e);
    vazio.querySelector("p").textContent = "Não foi possível carregar as saídas agora. Tente de novo em instantes ou fale com a gente no WhatsApp.";
  }
  lista.hidden = true;
  vazio.hidden = false;
}
document.dispatchEvent(new CustomEvent("mv:conteudo", { detail: sec }));
