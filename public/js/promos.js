/* promos.js — página de vendas (promocoes.html).
   Lê as viagens ativas da coleção "promocoes", separa em abas (Promoções, Grupos, Pacotes)
   e monta cada viagem como um bilhete: foto, dados e canhoto com data e preço. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./conexao.js";

const box = document.getElementById("lista-promos");
const abas = document.querySelector(".abas"), marca = abas.querySelector(".abas__marca"), desc = document.getElementById("abas-desc");
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const CATS = [
  { id: "promocao", hash: "promocoes", nome: "Promoções", um: "Promoção", desc: "Ofertas por tempo limitado, com preço especial." },
  { id: "grupo", hash: "grupos", nome: "Grupos", um: "Saída em grupo", desc: "Saídas em grupo com data marcada e roteiro organizado." },
  { id: "pacote", hash: "pacotes", nome: "Pacotes", um: "Pacote", desc: "Roteiros completos, prontos para embarcar." },
  { id: "peregrinacao", hash: "peregrinacoes", nome: "Peregrinações", um: "Peregrinação", desc: "Viagens de fé, com missas, santuários e acompanhamento da agência." }
];
const ZAP = "https://wa.me/558888870400?text=" + encodeURIComponent("Olá! Quero montar um roteiro de viagem. Pode me ajudar?");
const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const dia = s => { const [y, m, d] = s.split("-"); return `${+d} de ${MESES[+m - 1]}` + (+y !== new Date().getFullYear() ? ` de ${y}` : ""); };
const brl = n => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const fotoOk = u => /^(data:image\/|https:\/\/)/i.test(u || "");
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
let timers = [];

function bilhete(p, cat, i) {
  const a = el("a", "bilhete" + (p.destaque ? " bilhete--destaque" : ""));
  a.href = "promo.html?id=" + encodeURIComponent(p.id);
  a.dataset.surge = ""; a.dataset.cursor = "Ver";
  a.style.setProperty("--atraso", (i % 3) * .12 + "s");

  /* foto: com mais de uma, elas se alternam devagar */
  const foto = el("div", "bilhete__foto");
  const fotos = (p.fotos || []).filter(fotoOk);
  if (fotos.length) {
    const imgs = fotos.map((src, k) => { const im = el("img"); im.src = src; im.alt = ""; im.decoding = "async"; if (i > 2) im.loading = "lazy"; if (!k) im.classList.add("on"); foto.append(im); return im; });
    if (imgs.length > 1 && !reduz) {
      let k = 0;
      timers.push(setInterval(() => { imgs[k].classList.remove("on"); k = (k + 1) % imgs.length; imgs[k].classList.add("on"); }, 5000 + i * 400));
    }
  } else {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.dataset.roseta = "cheio";
    foto.append(svg);
  }
  foto.append(el("span", "bilhete__selo", p.etiqueta || cat.um));

  const corpo = el("div", "bilhete__corpo");
  corpo.append(el("h2", "", p.lugar || "Viagem"));
  if (p.descricao) corpo.append(el("p", "bilhete__desc", p.descricao));

  const canhoto = el("div", "bilhete__canhoto");
  const saida = el("div");
  if (p.dataSaida) saida.append(el("span", "", "Saída"), el("strong", "", dia(p.dataSaida)));
  const preco = el("div", "bilhete__preco");
  preco.append(el("span", "", "a partir de"), el("strong", "", brl(p.preco)));
  canhoto.append(saida, preco);

  a.append(foto, corpo, canhoto);
  return a;
}

function vazio(texto) {
  const d = el("div", "vazio");
  d.append(el("p", "lead", texto));
  const b = el("a", "btn btn--azul", "Conversar no WhatsApp"); b.href = ZAP; b.target = "_blank"; b.rel = "noopener";
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

  const moverMarca = () => {
    const b = botoes.find(x => x.getAttribute("aria-selected") === "true"); if (!b) return;
    marca.style.width = b.offsetWidth + "px"; marca.style.translate = b.offsetLeft + "px 0";
  };
  addEventListener("resize", moverMarca);
  document.fonts?.ready.then(moverMarca);

  /* setas do teclado trocam de aba */
  abas.addEventListener("keydown", e => {
    const k = botoes.indexOf(document.activeElement); if (k < 0) return;
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
    e.preventDefault(); const nb = botoes[(k + d + botoes.length) % botoes.length]; nb.focus(); nb.click();
  });

  function mostrar(id, clicou) {
    const cat = CATS.find(c => c.id === id);
    timers.forEach(clearInterval); timers = [];
    botoes.forEach(b => { const on = b.dataset.id === id; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
    box.setAttribute("aria-labelledby", "aba-" + id);
    moverMarca();
    desc.textContent = cat.desc;
    const itens = por(id);
    box.replaceChildren(...(itens.length
      ? itens.map((p, i) => bilhete(p, cat, i))
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
