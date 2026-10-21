/* saidas.js: "Próximas saídas" na página inicial.
   Mostra as viagens ativas (coleção "promocoes") em ordem de data de saída, como
   cartões de foto grande. No computador, o motion.js faz a galeria andar de lado
   com a rolagem; no celular, ela desliza com o dedo. Usa o que já está no painel. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./conexao.js";

const QUANTAS = 8;
const sec = document.getElementById("saidas"), trilho = document.getElementById("saidas-trilho"), vazio = document.getElementById("saidas-vazio");
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const TIPO = { promocao: "Promoção", grupo: "Saída em grupo", pacote: "Pacote" };
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const brl = n => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const noites = p => p.dataVolta ? Math.round((Date.parse(p.dataVolta) - Date.parse(p.dataSaida)) / 864e5) : 0;
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const SETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';

function cartao(p, i) {
  const [ano, m, d] = p.dataSaida.split("-");
  const a = el("a", "sc"); a.href = "promo.html?id=" + encodeURIComponent(p.id); a.dataset.cursor = "Ver";
  const nt = noites(p);
  a.setAttribute("aria-label", `${p.lugar}, saída em ${+d} de ${MES[+m - 1]}, a partir de ${brl(p.preco)}`);

  const img = el("div", "sc__img");
  const foto = (p.fotos || []).find(Boolean);
  if (foto) { const im = el("img"); im.src = foto; im.alt = ""; im.decoding = "async"; if (i > 2) im.loading = "lazy"; img.append(im); }
  else { const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.dataset.roseta = "cheio"; img.append(svg); }

  const data = el("time", "sc__data"); data.dateTime = p.dataSaida;
  const rot = el("span"); rot.append(MES[+m - 1] + (+ano !== new Date().getFullYear() ? " " + ano : ""), el("small", "", nt > 0 ? nt + (nt > 1 ? " noites" : " noite") : "saída"));
  data.append(el("b", "", String(+d)), rot);

  const baixo = el("div");
  baixo.append(el("span", "sc__tag", p.etiqueta || TIPO[p.categoria] || TIPO.promocao), el("h3", "", p.lugar || "Viagem"));
  const preco = el("div", "sc__preco"), valor = el("div");
  valor.append(el("span", "", "a partir de"), el("strong", "", brl(p.preco)));
  const ir = el("span", "sc__ir"); ir.innerHTML = SETA;
  preco.append(valor, ir); baixo.append(preco);

  a.append(img, data, baixo);
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
  trilho.querySelectorAll(".saidas__carrega").forEach(x => x.remove());
  const fim = el("a", "saidas__fim"); fim.href = "promocoes.html"; fim.dataset.cursor = "Ver";
  const fimIr = el("span", "sc__ir"); fimIr.innerHTML = SETA;
  fim.append(el("strong", "", "Ver todas as viagens à venda"), fimIr);
  trilho.append(...itens.map(cartao), fim);
} catch (e) {
  if (e.message !== "vazio") {
    console.warn("[saidas]", e);
    vazio.querySelector("p").textContent = "Não foi possível carregar as saídas agora. Tente de novo em instantes ou fale com a gente no WhatsApp.";
  }
  trilho.querySelectorAll(".saidas__carrega").forEach(x => x.remove());
  vazio.hidden = false;
}
document.dispatchEvent(new CustomEvent("mv:conteudo", { detail: sec }));
