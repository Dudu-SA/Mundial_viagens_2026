/* selos.js: etiquetas automáticas nos cartões, só com dados reais do painel.
   "Últimos dias" quando o "exibir até" está a 7 dias ou menos;
   "Novo" quando a viagem foi cadastrada há 7 dias ou menos. */
const DIA = 864e5;
const data = s => { const [y, m, d] = String(s || "").split("-").map(Number); return y ? new Date(y, m - 1, d) : null; };
const criado = v => v?.toDate ? v.toDate() : v?.seconds ? new Date(v.seconds * 1000) : v ? new Date(v) : null;

export function selosDe(p) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const out = [];
  const ate = data(p.exibirAte);
  if (ate) {
    const faltam = Math.round((ate - hoje) / DIA);
    if (faltam >= 0 && faltam <= 7) out.push({ tipo: "urgente", texto: faltam === 0 ? "Último dia" : faltam === 1 ? "Termina amanhã" : `Últimos ${faltam} dias` });
  }
  const c = criado(p.criadoEm);
  if (c && !isNaN(c) && (Date.now() - c) / DIA <= 7) out.push({ tipo: "novo", texto: "Novo" });
  return out;
}

export function selosEl(p) {
  const s = selosDe(p); if (!s.length) return null;
  const w = document.createElement("span"); w.className = "selos";
  s.forEach(x => { const e = document.createElement("span"); e.className = "selo selo--" + x.tipo; e.textContent = x.texto; w.append(e); });
  return w;
}
