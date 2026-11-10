/* promos.js — página de vendas (promocoes.html).
   Lê as viagens ativas da coleção "promocoes", separa em abas (Promoções, Grupos, Pacotes,
   Peregrinações) e monta cada viagem como uma foto impressa do álbum, com carimbo de data e preço. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./conexao.js";
import { precoDe, parcelasDe } from "./preco.js";

const box = document.getElementById("lista-promos");
const abas = document.querySelector(".vtabs"), desc = document.getElementById("abas-desc");
const CATS = [
  { id: "promocao", hash: "promocoes", nome: "Promoções", um: "Promoção", desc: "Ofertas por tempo limitado, com preço especial." },
  { id: "grupo", hash: "grupos", nome: "Grupos", um: "Saída em grupo", desc: "Saídas em grupo com data marcada, roteiro organizado e acompanhamento da agência." },
  { id: "pacote", hash: "pacotes", nome: "Pacotes", um: "Pacote", desc: "Roteiros completos, prontos para embarcar." },
  { id: "peregrinacao", hash: "peregrinacao", nome: "Peregrinações", um: "Peregrinação", desc: "Viagens de fé, com missas, santuários e acompanhamento da agência." }
];
const ZAP = "https://wa.me/558888870400?text=" + encodeURIComponent("Olá! Quero montar um roteiro de viagem. Pode me ajudar?");
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const noites = p => p.dataSaida && p.dataVolta ? Math.round((Date.parse(p.dataVolta) - Date.parse(p.dataSaida)) / 864e5) : 0;
const fotoOk = u => /^(data:image\/|https:\/\/)/i.test(u || "");
const { el, foto } = window.mv;

function cartao(p, cat, i) {
  const a = el("a", "saida" + (p.destaque ? " saida--destaque" : ""));
  a.href = "promo.html?id=" + encodeURIComponent(p.id);
  a.dataset.surge = ""; a.style.setProperty("--atraso", (i % 4) * .08 + "s");
  a.append(foto({ src: (p.fotos || []).find(fotoOk), ar: p.destaque ? "3/2" : "4/5", data: p.dataSaida, fita: p.destaque ? "topo" : "", lazy: i > 3 }));
  const info = el("div", "saida__info"), txt = el("div");
  txt.append(el("span", "saida__tag", p.etiqueta || cat.um), el("h3", "", p.lugar || "Viagem"));
  const nt = noites(p);
  if (p.destaque && p.descricao) txt.append(el("p", "saida__desc", p.descricao));
  else if (nt > 0) txt.append(el("small", "", nt + (nt > 1 ? " noites" : " noite")));
  const pr = precoDe(p);
  const preco = el("div", "saida__preco" + (pr.numero ? "" : " saida__preco--texto"));
  preco.append(el("span", "", pr.rotulo + (p.destaque && pr.numero ? ", por pessoa" : "")), el("b", "", pr.valor));
  if (parcelasDe(p)) preco.append(el("small", "parc", parcelasDe(p)));
  if (p.destaque) { txt.append(preco, el("span", "btn", "Ver a viagem")); info.append(txt); }
  else {                                                  // título em linha cheia; duração e preço embaixo
    info.classList.add("saida__info--empilhada");
    const meta = el("div", "saida__meta"), dur = txt.querySelector("small");
    meta.append(dur || el("small", "", ""), preco);
    info.append(txt, meta);
  }
  a.append(info);
  return a;
}

function vazio(texto) {
  const d = el("div", "vazio");
  d.append(el("p", "lead", texto));
  const b = el("a", "btn btn--zap", "Conversar no WhatsApp"); b.href = ZAP; b.target = "_blank"; b.rel = "noopener";
  d.append(b);
  return d;
}

try {
  const db = getFirestore(getApps()[0] || initializeApp(firebaseConfig));
  const snap = await getDocs(query(collection(db, "promocoes"), where("exibirAte", ">=", hoje()), orderBy("exibirAte", "asc")));
  const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0) || (a.dataSaida || "").localeCompare(b.dataSaida || ""));
  if (!lista.length) throw new Error("vazio");
  const por = id => lista.filter(p => (p.categoria || "promocao") === id);

  const botoes = CATS.map(c => {
    const b = el("button"); b.type = "button"; b.id = "aba-" + c.id; b.dataset.id = c.id;
    b.setAttribute("role", "tab"); b.setAttribute("aria-controls", "lista-promos");
    b.append(c.nome, el("b", "", String(por(c.id).length)));
    b.onclick = () => mostrar(c.id, true);
    abas.append(b);
    return b;
  });
  abas.hidden = false;

  /* setas do teclado trocam de aba */
  abas.addEventListener("keydown", e => {
    const k = botoes.indexOf(document.activeElement); if (k < 0) return;
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
    e.preventDefault(); const nb = botoes[(k + d + botoes.length) % botoes.length]; nb.focus(); nb.click();
  });

  function mostrar(id, clicou) {
    const cat = CATS.find(c => c.id === id);
    botoes.forEach(b => { const on = b.dataset.id === id; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
    box.setAttribute("aria-labelledby", "aba-" + id);
    desc.textContent = cat.desc;
    const itens = por(id);
    box.replaceChildren(...(itens.length
      ? itens.map((p, i) => cartao(p, cat, i))
      : [vazio(`No momento não temos ${cat.nome.toLowerCase()} à venda. Conte para onde quer ir e montamos o seu roteiro.`)]));
    if (clicou) history.replaceState(null, "", "#" + cat.hash);
    document.dispatchEvent(new CustomEvent("mv:conteudo", { detail: box }));
  }

  const doHash = CATS.find(c => "#" + c.hash === location.hash)?.id;
  mostrar(doHash || (CATS.find(c => por(c.id).length) || CATS[0]).id, false);
} catch (e) {
  if (e.message !== "vazio") console.warn("[vendas]", e);
  abas.hidden = true;
  box.replaceChildren(vazio(e.message === "vazio"
    ? "No momento não temos viagens à venda. Conte para onde quer ir e montamos o seu roteiro."
    : "Não foi possível carregar as viagens agora. Tente de novo em instantes ou fale com a gente no WhatsApp."));
}
