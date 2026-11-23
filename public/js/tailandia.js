/* tailandia.js: página de destino da Tailândia (tailandia.html).
   Procura no painel (coleção "promocoes") as viagens ativas para a Tailândia e mostra em "Próximas saídas".
   Se alguma tiver foto, as fotos dela entram no lugar das ilustrações do topo. Sem nenhuma, a página
   mostra o convite para montar a viagem. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./conexao.js";
import { precoDe, parcelasDe } from "./preco.js";
import { selosEl } from "./selos.js";

/* o que conta como "Tailândia": o país e as cidades e ilhas mais vendidas */
const ALVO = /tail[aâ]ndia|thailand|bangkok|banguecoque|chiang ?mai|chiang ?rai|phuket|krabi|phi ?phi|pattaya|ayutthaya|koh ?samui|ko ?samui|koh ?phangan|koh ?tao|ao ?nang|railay/;
const sem = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ehTailandia = p => ALVO.test(sem([p.lugar, p.etiqueta, p.descricao, p.sobre].join(" ")));
const TIPO = { promocao: "Promoção", grupo: "Saída em grupo", pacote: "Pacote", peregrinacao: "Peregrinação" };
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const noites = p => p.dataSaida && p.dataVolta ? Math.round((Date.parse(p.dataVolta) - Date.parse(p.dataSaida)) / 864e5) : 0;
const fotoOk = u => /^(data:image\/|https:\/\/)/i.test(u || "");
const { el, foto } = window.mv;

const sec = document.getElementById("saidas"), lista = document.getElementById("tai-lista"), vazio = document.getElementById("tai-vazio");

function cartao(p, i) {
  const a = el("a", "saida"); a.href = "promo.html?id=" + encodeURIComponent(p.id); a.dataset.surge = "";
  a.style.setProperty("--atraso", (i % 4) * .08 + "s");
  const pr = precoDe(p), nt = noites(p);
  const quando = p.dataSaida ? (() => { const [, m, d] = p.dataSaida.split("-"); return `, saída em ${+d} de ${MESES[+m - 1]}`; })() : "";
  a.setAttribute("aria-label", `${p.lugar}${quando}, ${pr.rotulo} ${pr.valor}`);
  a.append(foto({ src: (p.fotos || []).find(fotoOk), ar: "4/5", data: p.dataSaida || "", lazy: i > 3 }));
  const selos = selosEl(p); if (selos) a.querySelector(".foto").append(selos);
  const info = el("div", "saida__info saida__info--empilhada"), txt = el("div");
  txt.append(el("span", "saida__tag", p.etiqueta || TIPO[p.categoria] || TIPO.promocao), el("h3", "", p.lugar || "Tailândia"));
  const meta = el("div", "saida__meta");
  meta.append(el("small", "", nt > 0 ? nt + (nt > 1 ? " noites" : " noite") : ""));
  const preco = el("div", "saida__preco" + (pr.numero ? "" : " saida__preco--texto"));
  preco.append(el("span", "", pr.rotulo), el("b", "", pr.valor));
  if (parcelasDe(p)) preco.append(el("small", "parc", parcelasDe(p)));
  meta.append(preco); info.append(txt, meta); a.append(info);
  return a;
}

/* as fotos das viagens cadastradas tomam o lugar das ilustrações do topo, na ordem */
function fotosNoTopo(viagens) {
  const comFoto = viagens.filter(p => (p.fotos || []).some(fotoOk));
  const prints = [...document.querySelectorAll("#tai-fotos .foto")];
  comFoto.slice(0, prints.length).forEach((p, i) => {
    const f = prints[i], img = f.querySelector(".foto__img img"), leg = f.querySelector(".foto__leg");
    img.src = p.fotos.find(fotoOk); img.alt = "Foto da viagem " + (p.lugar || "Tailândia");
    const pr = precoDe(p);
    leg.replaceChildren(p.lugar || "Tailândia", el("small", "", `${pr.rotulo} ${pr.valor}`.replace(/^valor /, "") + (parcelasDe(p) ? " · " + parcelasDe(p) : "")));
    const a = el("a", f.className); a.href = "promo.html?id=" + encodeURIComponent(p.id);
    a.append(...f.childNodes); f.replaceWith(a);
  });
}

try {
  const db = getFirestore(getApps()[0] || initializeApp(firebaseConfig));
  const snap = await getDocs(query(collection(db, "promocoes"), where("exibirAte", ">=", hoje()), orderBy("exibirAte", "asc")));
  const viagens = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(ehTailandia)
    .sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0) || (a.dataSaida || "9").localeCompare(b.dataSaida || "9"));
  if (!viagens.length) throw new Error("vazio");
  lista.replaceChildren(...viagens.map(cartao));
  fotosNoTopo(viagens);
  document.getElementById("saidas-tit").textContent = viagens.length > 1 ? "Viagens para a Tailândia à venda" : "Viagem para a Tailândia à venda";
} catch (e) {
  if (e.message !== "vazio") console.warn("[tailandia]", e);
  lista.hidden = true; vazio.hidden = false;
}
document.dispatchEvent(new CustomEvent("mv:conteudo", { detail: sec }));
