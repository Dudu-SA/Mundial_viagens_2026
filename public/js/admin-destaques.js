import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL } from "./conexao.js";

const app = getApps()[0] || initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
const $ = id => document.getElementById(id);
const ROTULO = { promocao: "Promoção", grupo: "Grupo", pacote: "Pacote", peregrinacao: "Peregrinação", novidade: "Novidade" };
let imagem = "", editId = null, promos = [];

const reduzir = (file, max = 1200, q = 0.72) => new Promise((res, rej) => {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", q));
  };
  img.onerror = rej; img.src = url;
});
const aviso = (t, c = "") => { $("dMsg").textContent = t; $("dMsg").className = "msg " + c; };
const thumb = () => { $("dThumb").replaceChildren(); if (!imagem) return;
  const d = document.createElement("div"), i = document.createElement("img"), b = document.createElement("button");
  i.src = imagem; b.type = "button"; b.textContent = "×"; b.onclick = () => { imagem = ""; thumb(); };
  d.append(i, b); $("dThumb").append(d); };

$("dImg").onchange = async e => {
  try { imagem = await reduzir(e.target.files[0]); thumb(); } catch { aviso("Não consegui ler a imagem. Use JPG ou PNG.", "err"); }
  e.target.value = "";
};

// escolher uma promoção já cadastrada preenche o card sozinho
$("dPromo").onchange = () => {
  const p = promos.find(x => x.id === $("dPromo").value); if (!p) return;
  $("dTipo").value = p.categoria || "promocao";
  $("dTitulo").value = p.lugar || "";
  $("dTexto").value = [p.descricao, p.preco != null ? "a partir de R$ " + Number(p.preco).toLocaleString("pt-BR") : ""].filter(Boolean).join(" · ");
  $("dLink").value = "promo.html?id=" + p.id;
  $("dBotao").value = "Ver promoção";
  imagem = p.fotos?.[0] || ""; thumb();
};

function limpar() {
  $("dForm").reset(); imagem = ""; editId = null; thumb();
  $("dFormTitulo").textContent = "Novo item do bloco"; $("dSalvar").textContent = "Publicar item"; $("dCancelar").hidden = true;
}
$("dCancelar").onclick = () => { limpar(); aviso(""); };

function editar(x) {
  editId = x.id;
  $("dTipo").value = x.tipo || "novidade"; $("dEtiqueta").value = x.etiqueta || ""; $("dTitulo").value = x.titulo || "";
  $("dTexto").value = x.texto || ""; $("dBotao").value = x.botao || ""; $("dLink").value = x.link || "";
  $("dOrdem").value = x.ordem ?? 1; $("dAte").value = x.exibirAte || ""; $("dAtivo").checked = x.ativo !== false;
  imagem = x.imagem || ""; thumb();
  $("dFormTitulo").textContent = "Editando: " + x.titulo; $("dSalvar").textContent = "Salvar alterações"; $("dCancelar").hidden = false;
  $("dForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("dForm").onsubmit = async e => {
  e.preventDefault();
  const dados = {
    tipo: $("dTipo").value, etiqueta: $("dEtiqueta").value.trim(), titulo: $("dTitulo").value.trim(),
    texto: $("dTexto").value.trim(), botao: $("dBotao").value.trim(), link: $("dLink").value.trim(),
    ordem: parseInt($("dOrdem").value) || 1, exibirAte: $("dAte").value, ativo: $("dAtivo").checked, imagem
  };
  if (imagem.length > 700000) return aviso("A imagem ficou pesada demais. Use uma menor.", "err");
  $("dSalvar").disabled = true; aviso("Salvando…");
  try {
    if (editId) await updateDoc(doc(db, "destaques", editId), dados);
    else await addDoc(collection(db, "destaques"), { ...dados, criadoEm: serverTimestamp() });
    aviso(editId ? "Item atualizado." : "Item publicado no bloco da página inicial.", "ok");
    limpar(); carregar();
  } catch (err) {
    aviso(err.code === "permission-denied" ? "Sem permissão: libere a coleção \"destaques\" nas regras do Firestore." : "Erro ao salvar: " + (err.code || err.message), "err");
  } finally { $("dSalvar").disabled = false; }
};

async function carregar() {
  try {
    const ps = await getDocs(query(collection(db, "promocoes"), orderBy("exibirAte", "desc")));
    promos = ps.docs.map(d => ({ id: d.id, ...d.data() }));
    $("dPromo").replaceChildren(new Option("— escolher promoção (opcional) —", ""), ...promos.map(p => new Option(p.lugar, p.id)));
  } catch {}
  const l = $("dLista");
  try {
    const snap = await getDocs(query(collection(db, "destaques"), orderBy("ordem", "asc")));
    if (snap.empty) { l.textContent = "Nenhum item cadastrado. Enquanto estiver vazio, o bloco não aparece no site."; return; }
    l.replaceChildren(...snap.docs.map(d => {
      const x = { id: d.id, ...d.data() };
      const row = document.createElement("div"); row.className = "item";
      let t; if (x.imagem) { t = document.createElement("img"); t.src = x.imagem; t.alt = ""; } else { t = document.createElement("div"); t.className = "ph"; }
      const info = document.createElement("div"); info.className = "item__info";
      const s = document.createElement("strong"); s.textContent = `${x.ordem ?? ""}. ${x.titulo}`;
      const on = x.ativo !== false;
      const tag = document.createElement("span"); tag.className = "tag " + (on ? "on" : "off"); tag.textContent = on ? "No site" : "Oculto"; s.append(tag);
      const sp = document.createElement("span"); sp.textContent = (x.etiqueta || ROTULO[x.tipo] || "") + (x.exibirAte ? " · até " + x.exibirAte.split("-").reverse().join("/") : "");
      info.append(s, sp);
      const ac = document.createElement("div"); ac.style.cssText = "display:flex;gap:.5rem;flex-wrap:wrap";
      const ed = document.createElement("button"); ed.type = "button"; ed.className = "del"; ed.style.cssText = "color:#1a7f4b;border-color:#1a7f4b"; ed.textContent = "Editar"; ed.onclick = () => editar(x);
      const del = document.createElement("button"); del.type = "button"; del.className = "del"; del.textContent = "Remover";
      del.onclick = async () => { if (!confirm(`Remover "${x.titulo}" do bloco?`)) return; await deleteDoc(doc(db, "destaques", x.id)); if (editId === x.id) limpar(); carregar(); };
      ac.append(ed, del); row.append(t, info, ac); return row;
    }));
  } catch (err) { l.textContent = "Não foi possível carregar: " + (err.code || err.message); }
}

onAuthStateChanged(auth, u => { if (u && u.email === ADMIN_EMAIL) carregar(); });