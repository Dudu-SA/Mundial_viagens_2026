/* admin-importar.js: cadastro de viagens a partir de planilha ou foto.
   - Planilha (xlsx, xls ou csv): lê as colunas pelo nome (aceita variações), monta uma lista
     para conferir e publica tudo de uma vez. Há um modelo para baixar.
   - Foto (arte da promoção, print do Instagram): o Google AI (Gemini) lê lugar, datas, preço
     e o que está incluso. A chave da API fica no Firestore (config/ia), só o admin lê.
   Lê e grava a coleção "promocoes" com os mesmos campos do formulário do painel. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL } from "./conexao.js";

const app = getApps()[0] || initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const br = s => s ? s.split("-").reverse().join("/") : "";
const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const CATS = { promocao: "Promoção", grupo: "Grupo", pacote: "Pacote" };
const MODELO_IA = "gemini-2.5-flash";

/* ---------- utilidades de texto ---------- */
const limpo = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/* ---------- datas: aceita número do Excel, dd/mm/aaaa, aaaa-mm-dd, "12 de novembro de 2026", "12/11" ---------- */
export function lerData(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date && !isNaN(v)) return iso(v.getFullYear(), v.getMonth() + 1, v.getDate());
  if (typeof v === "number") {                       // número de série do Excel
    const d = new Date((Math.floor(v + 0.001) - 25569) * 864e5);   // ignora a hora; tolera 23:59:59 de arredondamento
    return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  const s = limpo(v);
  let m;
  if ((m = s.match(/^(\d{4})[ -](\d{1,2})[ -](\d{1,2})$/))) return iso(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{1,2})[ -](\d{1,2})(?:[ -](\d{2,4}))?$/))) return iso(ano(m[3], +m[2], +m[1]), +m[2], +m[1]);
  if ((m = s.match(/^(\d{1,2}) de ([a-z]+)(?: de (\d{4}))?$/))) {
    const mes = MESES.findIndex(x => x.startsWith(m[2].slice(0, 3))) + 1;
    if (mes) return iso(ano(m[3], mes, +m[1]), mes, +m[1]);
  }
  if ((m = s.match(/^(\d{1,2}) ([a-z]{3})[a-z]*(?: (\d{4}))?$/))) {
    const mes = MESES.findIndex(x => x.startsWith(m[2])) + 1;
    if (mes) return iso(ano(m[3], mes, +m[1]), mes, +m[1]);
  }
  return "";
}
function ano(a, mes, dia) {
  if (a) return a.length === 2 ? 2000 + +a : +a;
  // sem ano: o próximo em que essa data ainda não passou
  const h = new Date(), y = h.getFullYear();
  return iso(y, mes, dia) >= hoje() ? y : y + 1;
}
function iso(y, m, d) {
  if (!(y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/* ---------- preço: "R$ 8.640,00", "8640", "a partir de 1.290" ---------- */
export function lerPreco(v) {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[^\d.,]/g, "");
  if (!s) return NaN;
  const temVirg = s.includes(","), temPonto = s.includes(".");
  let n;
  if (temVirg) n = s.replace(/\./g, "").replace(",", ".");                       // 8.640,50
  else if (temPonto && /\.\d{3}(\.|$)/.test(s)) n = s.replace(/\./g, "");       // 8.640
  else n = s;                                                                    // 8640.5
  const x = parseFloat(n);
  return isNaN(x) ? NaN : Math.round(x * 100) / 100;
}

const lerBool = v => /^(s|sim|x|1|true|verdadeiro|yes|ok)$/.test(limpo(v));
const lerCategoria = v => { const s = limpo(v); return s.startsWith("grup") ? "grupo" : s.startsWith("pac") ? "pacote" : "promocao"; };
const linhas = v => String(v ?? "").split(/\r?\n|;|•|\|/).map(x => x.replace(/^[-*✓]\s*/, "").trim()).filter(Boolean);

/* ---------- colunas da planilha: nome na planilha → campo ---------- */
const COLUNAS = {
  lugar: ["lugar", "destino", "viagem", "nome", "titulo", "pacote"],
  categoria: ["secao", "secao do site", "categoria", "tipo"],
  etiqueta: ["etiqueta", "continente", "regiao", "pais", "tag"],
  descricao: ["detalhes", "detalhes do pacote", "descricao", "resumo", "subtitulo"],
  sobre: ["apresentacao", "sobre", "texto", "apresentacao do pacote", "sobre a viagem"],
  dataSaida: ["saida", "data de saida", "ida", "data", "embarque", "partida"],
  dataVolta: ["volta", "data de volta", "retorno", "chegada"],
  exibirAte: ["exibir ate", "exibir no site ate", "valido ate", "validade", "mostrar ate", "ate"],
  preco: ["preco", "valor", "a partir de", "valor a partir de", "preco a partir de", "r"],
  destaque: ["destaque", "destacar"],
  incluso: ["o que esta incluso", "incluso", "inclui", "o que inclui", "itens inclusos"],
  roteiro: ["roteiro", "roteiro dia a dia", "programacao", "itinerario"],
  hotel: ["hospedagem", "hotel", "hoteis"],
  dicas: ["dicas", "observacoes", "obs", "informacoes", "importante"]
};
function mapear(cabecalho) {
  const mapa = {};
  cabecalho.forEach((h, i) => {
    const k = limpo(String(h ?? "").replace(/\(.*?\)/g, "").replace(/\*/g, ""));
    if (!k) return;
    for (const [campo, nomes] of Object.entries(COLUNAS)) if (!(campo in mapa) && nomes.includes(k)) { mapa[campo] = i; return; }
  });
  return mapa;
}

/* ---------- uma linha → viagem no formato do banco, mais avisos ---------- */
export function montarViagem(d) {
  const v = {
    categoria: lerCategoria(d.categoria), lugar: String(d.lugar ?? "").trim(), etiqueta: String(d.etiqueta ?? "").trim(),
    descricao: String(d.descricao ?? "").trim(), sobre: String(d.sobre ?? "").trim(),
    dataSaida: lerData(d.dataSaida), dataVolta: lerData(d.dataVolta), exibirAte: lerData(d.exibirAte),
    preco: lerPreco(d.preco), destaque: lerBool(d.destaque), fotos: [], blocos: []
  };
  const bloco = (tipo, icone, titulo, texto) => { if (texto) v.blocos.push({ tipo, icone, titulo, texto, foto: "" }); };
  bloco("texto", "🗺️", "Roteiro", String(d.roteiro ?? "").trim());
  const inc = linhas(d.incluso); if (inc.length) v.blocos.push({ tipo: "lista", icone: "✅", titulo: "O que está incluso", texto: inc.join("\n"), foto: "" });
  bloco("texto", "🏨", "Hospedagem", String(d.hotel ?? "").trim());
  bloco("texto", "💡", "Dicas", String(d.dicas ?? "").trim());
  if (!v.exibirAte) v.exibirAte = v.dataSaida;
  const avisos = [];
  if (!v.lugar) avisos.push("Sem lugar/destino.");
  if (!v.dataSaida) avisos.push(d.dataSaida ? `Não entendi a data de saída "${d.dataSaida}".` : "Sem data de saída.");
  else if (v.dataSaida < hoje()) avisos.push("A data de saída já passou.");
  if (d.dataVolta && !v.dataVolta) avisos.push(`Não entendi a data de volta "${d.dataVolta}".`);
  if (v.dataVolta && v.dataSaida && v.dataVolta < v.dataSaida) avisos.push("A volta está antes da saída.");
  if (!(v.preco >= 0)) avisos.push(d.preco ? `Não entendi o preço "${d.preco}".` : "Sem preço.");
  if (v.exibirAte && v.exibirAte < hoje()) avisos.push("A data de exibição já passou: não apareceria no site.");
  return { v, avisos };
}

/* ---------- planilha ---------- */
async function lerPlanilha(file) {
  const XLSX = window.XLSX; if (!XLSX) throw new Error("A biblioteca de planilhas não carregou. Verifique a internet e recarregue a página.");
  // datas ficam como número de série do Excel (cellDates:false): evita o erro de um dia por fuso horário
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
  // procura, em todas as abas, a primeira linha que pareça cabeçalho (tem "lugar" e "preco"/"saida")
  for (const nome of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[nome], { header: 1, defval: "", raw: true });
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const mapa = mapear(rows[i]);
      if ("lugar" in mapa && ("preco" in mapa || "dataSaida" in mapa)) {
        const itens = [];
        for (let r = i + 1; r < rows.length; r++) {
          const row = rows[r]; if (!row.some(c => String(c).trim())) continue;
          const d = {}; for (const [campo, col] of Object.entries(mapa)) d[campo] = row[col];
          itens.push({ ...montarViagem(d), origem: `linha ${r + 1}` });
        }
        return { itens, aba: nome, faltam: ["lugar", "dataSaida", "preco"].filter(c => !(c in mapa)) };
      }
    }
  }
  throw new Error("Não achei o cabeçalho. A planilha precisa de uma linha com os nomes das colunas (ex.: Lugar, Saída, Preço). Baixe o modelo para ver o formato.");
}

/* modelo para baixar */
function baixarModelo() {
  const XLSX = window.XLSX; if (!XLSX) return aviso("A biblioteca de planilhas não carregou. Recarregue a página.", "err");
  const cab = ["Lugar", "Seção", "Etiqueta", "Detalhes", "Saída", "Volta", "Exibir até", "Preço", "Destaque", "Apresentação", "O que está incluso", "Roteiro", "Hospedagem", "Dicas"];
  const ex = [
    ["Lisboa e Porto", "Promoção", "Europa", "9 noites · Aéreo, hotel e traslados", "12/11/2026", "21/11/2026", "10/11/2026", 8640, "sim",
      "Duas cidades à beira do rio, bondes amarelos e pastéis de nata.", "Passagem aérea ida e volta; Hospedagem com café da manhã; Traslados; Seguro viagem", "Dia 1: chegada em Lisboa...", "Hotéis 4 estrelas no centro", "Leve casaco: em novembro faz frio à noite."],
    ["Peregrinação a Fátima", "Grupo", "Portugal", "Grupo com guia da agência", "08/05/2027", "18/05/2027", "", 12490, "", "", "Aéreo; Hotel; Missas no Santuário", "", "", ""],
    ["Jericoacoara", "Pacote", "Ceará", "3 noites · Transfer 4x4", "20/11/2026", "23/11/2026", "", 1290, "", "", "", "", "", ""]
  ];
  const ws = XLSX.utils.aoa_to_sheet([cab, ...ex]);
  ws["!cols"] = cab.map((c, i) => ({ wch: [18, 10, 12, 30, 12, 12, 12, 10, 9, 40, 40, 40, 24, 30][i] }));
  const ajuda = XLSX.utils.aoa_to_sheet([
    ["Como preencher"], [""],
    ["Lugar", "Obrigatório. Nome da viagem como aparece no site."],
    ["Seção", "Promoção, Grupo ou Pacote (vazio = Promoção)."],
    ["Etiqueta", "Continente, país ou tipo (ex.: Europa)."],
    ["Detalhes", "Uma linha curta (ex.: 9 noites · Aéreo e hotel)."],
    ["Saída / Volta", "Obrigatória a saída. Datas como 12/11/2026 ou 12/11."],
    ["Exibir até", "Até quando aparece no site. Vazio = data de saída."],
    ["Preço", "Obrigatório. Valor a partir de, por pessoa. Só número (8640) ou R$ 8.640,00."],
    ["Destaque", "sim = card grande, aparece primeiro."],
    ["Apresentação", "Texto de abertura da página da viagem."],
    ["O que está incluso", "Itens separados por ; ou por linha (vira lista com ✓)."],
    ["Roteiro / Hospedagem / Dicas", "Viram blocos de texto na página da viagem."],
    [""], ["Fotos", "Não vão na planilha: você escolhe na tela de conferência, depois de enviar."]
  ]);
  ajuda["!cols"] = [{ wch: 28 }, { wch: 80 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Viagens"); XLSX.utils.book_append_sheet(wb, ajuda, "Como preencher");
  XLSX.writeFile(wb, "modelo-viagens-mundial.xlsx");
}

/* ---------- foto: Google AI (Gemini) ---------- */
const PROMPT = `Esta imagem é a divulgação de uma ou mais viagens de uma agência brasileira (Mundial Viagens, Crateús-CE).
Extraia os dados e responda SOMENTE com JSON: um array de objetos, um por viagem, com as chaves:
lugar (nome do destino/viagem), categoria ("promocao", "grupo" ou "pacote"; grupo quando for saída em grupo/excursão/peregrinação),
etiqueta (continente, país ou região), descricao (uma linha curta, ex.: "7 noites · Aéreo e hotel"),
dataSaida e dataVolta (formato AAAA-MM-DD; se só houver dia e mês, use o próximo ano em que a data ainda não passou; hoje é ${hoje()}),
preco (número, valor "a partir de" por pessoa em reais, sem texto; se houver parcelas e total, use o total),
incluso (array de strings com o que está incluso), roteiro (texto, se houver), hotel (texto, se houver), dicas (texto com condições, parcelamento, observações).
Use "" ou [] quando não houver a informação. Não invente dados.`;

async function lerFoto(file, chave) {
  const dataUrl = await reduzir(file, 1600, 0.85);
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)[1];
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO_IA}:generateContent?key=${encodeURIComponent(chave)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime, data: b64 } }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
    })
  });
  if (!r.ok) {
    const t = await r.text();
    if (r.status === 400 && /API key/i.test(t)) throw new Error("A chave do Google AI não foi aceita. Confira em Configurações da importação.");
    if (r.status === 429) throw new Error("O Google AI está ocupado (limite gratuito atingido). Espere um minuto e tente de novo.");
    throw new Error("O Google AI respondeu com erro " + r.status + ".");
  }
  const j = await r.json();
  const texto = j.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "[]";
  let lista; try { lista = JSON.parse(texto); } catch { throw new Error("Não consegui entender a resposta do Google AI. Tente outra foto."); }
  if (!Array.isArray(lista)) lista = [lista];
  const foto = await reduzir(file, 1100, 0.72);
  return lista.map(x => {
    const { v, avisos } = montarViagem({ ...x, incluso: Array.isArray(x.incluso) ? x.incluso.join("\n") : x.incluso });
    v.fotos = [foto];
    return { v, avisos, origem: "foto" };
  });
}

const reduzir = (file, max, q) => new Promise((res, rej) => {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    res(c.toDataURL("image/jpeg", q));
  };
  img.onerror = rej; img.src = url;
});

/* ---------- chave do Google AI (Firestore: config/ia) ---------- */
let chaveIA = "";
async function carregarChave() {
  try { const s = await getDoc(doc(db, "config", "ia")); chaveIA = s.exists() ? (s.data().geminiKey || "") : ""; }
  catch (e) { console.warn("[importar] chave:", e); }
  $("iaChave").value = chaveIA; $("iaEstado").textContent = chaveIA ? "Chave salva. A leitura de fotos está ligada." : "Sem chave: a leitura de fotos está desligada (a planilha funciona sem ela).";
}
$("iaSalvar").onclick = async () => {
  const k = $("iaChave").value.trim();
  try { await setDoc(doc(db, "config", "ia"), { geminiKey: k, atualizadoEm: serverTimestamp() }); chaveIA = k; $("iaEstado").textContent = k ? "Chave salva. A leitura de fotos está ligada." : "Chave removida."; }
  catch (e) { $("iaEstado").textContent = e.code === "permission-denied" ? "Sem permissão: publique as regras do Firestore novas (config/ia)." : "Erro ao salvar: " + (e.code || e.message); }
};


/* ---------- tela de conferência ---------- */
let itens = [];
const aviso = (t, c = "") => { $("impMsg").textContent = t; $("impMsg").className = "msg " + c; };

async function receber(files) {
  const lista = [...files]; if (!lista.length) return;
  aviso("Lendo…"); $("impLista").hidden = true;
  const novos = [], erros = [];
  for (const f of lista) {
    try {
      if (/\.(xlsx|xls|xlsm|csv|ods)$/i.test(f.name)) {
        const { itens: its, faltam } = await lerPlanilha(f);
        if (faltam.length) erros.push(`${f.name}: não achei a coluna ${faltam.map(c => ({ lugar: "Lugar", dataSaida: "Saída", preco: "Preço" })[c]).join(", ")}.`);
        novos.push(...its);
      } else if (f.type.startsWith("image/")) {
        if (!chaveIA) { erros.push(`${f.name}: para ler fotos, salve a chave do Google AI no menu "Leitura de fotos".`); continue; }
        novos.push(...await lerFoto(f, chaveIA));
      } else erros.push(`${f.name}: envie uma planilha (xlsx ou csv) ou uma imagem.`);
    } catch (e) { console.error("[importar]", e); erros.push(`${f.name}: ${e.message}`); }
  }
  itens.push(...novos);
  aviso((novos.length ? `${novos.length} viagem(ns) lida(s). Confira abaixo, escolha as fotos e publique. ` : "Nenhuma viagem lida. ") + erros.join(" "), erros.length && !novos.length ? "err" : "");
  desenhar();
}

function desenhar() {
  const box = $("impItens"); box.replaceChildren();
  $("impLista").hidden = !itens.length;
  itens.forEach((it, i) => box.append(cartao(it, i)));
  $("impPublicar").textContent = `Publicar ${itens.filter(x => x.ok !== false).length} viagem(ns)`;
}

function cartao(it, i) {
  const v = it.v, w = el("div", "bloco imp"); w.dataset.i = i;
  const top = el("div", "bloco__top");
  const t = el("strong", "", `${i + 1}. ${v.lugar || "(sem lugar)"}`);
  const tag = el("span", "tag " + (it.avisos.length ? "off" : "on"), it.avisos.length ? "Conferir" : "Pronta"); t.append(" ", tag);
  const rem = el("button", "btn mini fantasma", "×"); rem.type = "button"; rem.title = "Tirar da lista"; rem.onclick = () => { itens.splice(i, 1); desenhar(); };
  top.append(t, rem); w.append(top);
  if (it.avisos.length) { const ul = el("ul", "imp__avisos"); it.avisos.forEach(a => ul.append(el("li", "", a))); w.append(ul); }

  const g = el("div", "grid imp__grid");
  const campo = (lab, k, tipo = "text", opts) => {
    const d = el("div"), l = el("label", "", lab); let e;
    if (opts) { e = el("select"); opts.forEach(([val, txt]) => e.append(new Option(txt, val))); e.value = v[k]; }
    else { e = el(tipo === "area" ? "textarea" : "input"); if (tipo !== "area") e.type = tipo; else e.rows = 3; e.value = v[k] ?? ""; }
    e.onchange = () => { v[k] = tipo === "number" ? parseFloat(e.value) : e.value; if (k === "dataSaida" && !$("imp-ate-" + i).dataset.manual) { v.exibirAte = v.dataSaida; $("imp-ate-" + i).value = v.dataSaida; } };
    if (k === "exibirAte") { e.id = "imp-ate-" + i; e.oninput = () => e.dataset.manual = "1"; }
    d.append(l, e); return d;
  };
  g.append(campo("Lugar", "lugar"), campo("Seção", "categoria", null, Object.entries(CATS)), campo("Etiqueta", "etiqueta"), campo("Detalhes", "descricao"),
    campo("Saída", "dataSaida", "date"), campo("Volta", "dataVolta", "date"), campo("Exibir até", "exibirAte", "date"), campo("Preço (R$)", "preco", "number"));
  const sobre = campo("Apresentação", "sobre", "area"); sobre.className = "full"; g.append(sobre);
  const dest = el("div", "chk full"); const cb = el("input"); cb.type = "checkbox"; cb.checked = !!v.destaque; cb.id = "imp-dest-" + i; cb.onchange = () => v.destaque = cb.checked;
  const cl = el("label", "", "Destacar (card em largura total)"); cl.htmlFor = cb.id; dest.append(cb, cl); g.append(dest);
  w.append(g);

  if (v.blocos.length) {
    const bl = el("p", "hint", "Blocos da página: " + v.blocos.map(b => b.titulo + (b.tipo === "lista" ? ` (${b.texto.split("\n").length} itens)` : "")).join(" · ") + ". Para editar os blocos, use \"Abrir no formulário\".");
    w.append(bl);
  }

  /* fotos */
  const fw = el("div", "full"); fw.append(el("label", "", "Fotos (até 3)"));
  const inp = el("input"); inp.type = "file"; inp.accept = "image/*"; inp.multiple = true;
  const thumbs = el("div", "thumbs");
  const desenharFotos = () => {
    thumbs.replaceChildren(...v.fotos.map((src, k) => {
      const d = el("div"), im = el("img"), b = el("button", "", "×"); im.src = src; b.type = "button"; b.onclick = () => { v.fotos.splice(k, 1); desenharFotos(); };
      d.append(im, b); return d;
    }));
  };
  inp.onchange = async () => { for (const f of inp.files) { if (v.fotos.length >= 3) break; try { v.fotos.push(await reduzir(f, 1100, 0.72)); } catch {} } inp.value = ""; desenharFotos(); };
  fw.append(inp, thumbs); desenharFotos(); w.append(fw);

  const acoes = el("div", "addrow");
  const abrir = el("button", "btn mini", "Abrir no formulário completo"); abrir.type = "button";
  abrir.onclick = () => { window.mvAdmin?.preencher(v); itens.splice(i, 1); desenhar(); window.mvAdmin?.irPara("nova"); };
  acoes.append(abrir); w.append(acoes);
  return w;
}

$("impPublicar").onclick = async () => {
  if (!auth.currentUser) return aviso("Sessão expirada. Saia e entre novamente.", "err");
  const prontos = [], problemas = [];
  itens.forEach((it, i) => {
    const v = it.v, { avisos } = montarViagem({ ...v, incluso: "", roteiro: "", hotel: "", dicas: "" });
    if (avisos.length) problemas.push(`${i + 1}. ${v.lugar || "(sem lugar)"}: ${avisos.join(" ")}`); else prontos.push(it);
  });
  if (problemas.length) return aviso("Corrija antes de publicar: " + problemas.join(" | "), "err");
  if (!prontos.length) return aviso("Nada para publicar.", "err");
  const semFoto = prontos.filter(it => !it.v.fotos.length).length;
  if (semFoto && !confirm(`${semFoto} viagem(ns) sem foto (vão aparecer com o desenho padrão). Publicar mesmo assim?`)) return;
  $("impPublicar").disabled = true; aviso("Publicando…");
  let ok = 0;
  for (const it of [...prontos]) {
    try {
      const dados = { ...it.v, preco: Number(it.v.preco), criadoEm: serverTimestamp() };
      await addDoc(collection(db, "promocoes"), dados); ok++; itens.splice(itens.indexOf(it), 1);
    } catch (e) { console.error("[importar] publicar:", e); aviso(`Erro ao publicar "${it.v.lugar}": ${e.code || e.message}. As anteriores foram publicadas.`, "err"); break; }
  }
  $("impPublicar").disabled = false; desenhar();
  if (ok) { aviso(`${ok} viagem(ns) publicada(s) no site.`, "ok"); window.mvAdmin?.carregar(); }
};

/* ---------- entrada: botão, arrastar e soltar ---------- */
$("impArquivo").onchange = e => { receber(e.target.files); e.target.value = ""; };
$("impModelo").onclick = baixarModelo;
const zona = $("impZona");
["dragenter", "dragover"].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.add("arrasta"); }));
["dragleave", "drop"].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.remove("arrasta"); }));
zona.addEventListener("drop", e => receber(e.dataTransfer.files));
document.addEventListener("paste", e => { const fs = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith("image/")); if (fs.length && !$("painel").hidden) receber(fs); });

onAuthStateChanged(auth, u => { if (u && u.email === ADMIN_EMAIL) carregarChave(); });
