import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./conexao.js";

const box = document.getElementById("lista-promos");
const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const CATS = [
  { id: "promocao", hash: "promocoes", nome: "Promoções", desc: "Ofertas por tempo limitado, com preço especial." },
  { id: "grupo",    hash: "grupos",    nome: "Grupos",    desc: "Saídas em grupo com data marcada e roteiro organizado." },
  { id: "pacote",   hash: "pacotes",   nome: "Pacotes",   desc: "Roteiros completos, prontos para embarcar." }
];
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const dia = s => { const [, m, d] = s.split("-"); return `${+d} de ${MESES[+m-1]}`; };
const brl = n => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: n % 1 ? 2 : 0 });
let timers = [];

function card(p, cat) {
  const periodo = p.dataSaida ? (p.dataVolta ? `${dia(p.dataSaida)} a ${dia(p.dataVolta)}` : `Saída em ${dia(p.dataSaida)}`) : "";
  const linha = [p.descricao, periodo].filter(Boolean).join(" · ");
  const a = document.createElement("a");
  a.className = "proj img-" + (1 + Math.floor(Math.random() * 8)) + (p.destaque ? " proj--wide" : "");
  a.href = `promo.html?id=${encodeURIComponent(p.id)}`;
  const small = document.createElement("small"); small.textContent = p.etiqueta || cat.nome.replace(/s$/, "");
  const h3 = document.createElement("h3"); h3.textContent = p.lugar;
  const info = document.createElement("p"); info.textContent = linha;
  const strong = document.createElement("strong"); strong.textContent = "a partir de " + brl(p.preco);
  const view = document.createElement("span"); view.className = "view"; view.textContent = "Ver detalhes";
  a.append(small, h3, info, strong, view);
  const fotos = p.fotos || [];
  if (fotos.length) {
    a.classList.add("proj--photo");
    let i = 0;
    a.style.backgroundImage = `url(${fotos[0]})`;
    if (fotos.length > 1) timers.push(setInterval(() => { i = (i + 1) % fotos.length; a.style.backgroundImage = `url(${fotos[i]})`; }, 4500));
  }
  return a;
}

try {
  const db = getFirestore(getApps()[0] || initializeApp(firebaseConfig));
  const q = query(collection(db, "promocoes"), where("exibirAte", ">=", hoje()), orderBy("exibirAte", "asc"));
  const snap = await getDocs(q);
  box.replaceChildren();
  if (snap.empty) throw new Error("vazio");
  const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  lista.sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));
  const por = id => lista.filter(p => (p.categoria || "promocao") === id);

  const abas = document.createElement("div"); abas.className = "vtabs"; abas.setAttribute("role", "tablist");
  const desc = document.createElement("p"); desc.className = "vdesc";
  box.before(abas, desc);

  const mostrar = id => {
    const cat = CATS.find(c => c.id === id);
    timers.forEach(clearInterval); timers = [];
    [...abas.children].forEach(b => { const on = b.dataset.id === id; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    desc.textContent = cat.desc;
    box.replaceChildren();
    const itens = por(id);
    if (!itens.length) {
      const p = document.createElement("p"); p.className = "lead";
      p.textContent = `No momento não temos ${cat.nome.toLowerCase()} ativos. Fale com a gente no WhatsApp e monte seu roteiro.`;
      box.append(p);
    } else itens.forEach(p => box.append(card(p, cat)));
    box.classList.remove("fade"); void box.offsetWidth; box.classList.add("fade");
    history.replaceState(null, "", "#" + cat.hash);
  };

  CATS.forEach(c => {
    const b = document.createElement("button"); b.type = "button"; b.dataset.id = c.id; b.setAttribute("role", "tab");
    b.append(c.nome + " ");
    const n = document.createElement("b"); n.textContent = por(c.id).length; b.append(n);
    b.onclick = () => mostrar(c.id);
    abas.append(b);
  });

  const doHash = CATS.find(c => "#" + c.hash === location.hash)?.id;
  mostrar(doHash || (CATS.find(c => por(c.id).length) || CATS[0]).id);
} catch (e) {
  box.innerHTML = '<p class="lead">' + (e.message === "vazio"
    ? "No momento não temos viagens ativas. Fale com a gente no WhatsApp e monte seu roteiro."
    : "Não foi possível carregar as viagens agora. Tente novamente em instantes.") + "</p>";
}