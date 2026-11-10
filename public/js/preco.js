/* preco.js: o valor de uma viagem pode ser número (8640 → "a partir de R$ 8.640")
   ou texto livre ("A definir", "Sob consulta", "12x de R$ 350"). Usado pelo painel e pelo site. */

/* número no formato brasileiro ("8.640,50", "R$ 8640") → 8640.5; qualquer outra coisa → NaN */
export function lerNumero(v) {
  if (typeof v === "number") return v;
  const s = String(v ?? "").trim();
  if (!/^(r\$)?\s*[\d.,]+$/i.test(s)) return NaN;
  const d = s.replace(/[^\d.,]/g, "");
  let n;
  if (d.includes(",")) n = d.replace(/\./g, "").replace(",", ".");          // 8.640,50
  else if (/\.\d{3}(\.|$)/.test(d)) n = d.replace(/\./g, "");              // 8.640
  else n = d;                                                              // 8640.5
  return parseFloat(n);
}

/* o que o painel grava: número quando for número; texto quando for texto; vazio → "A definir" */
export function lerValor(v) {
  const n = lerNumero(v);
  if (n >= 0) return n;
  const t = String(v ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  return t || "A definir";
}

/* como o site mostra: { numero, rotulo, valor } */
export function precoDe(p) {
  const v = p?.preco;
  if (typeof v === "number" && isFinite(v)) {
    return { numero: true, rotulo: "a partir de", valor: "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }) };
  }
  return { numero: false, rotulo: "valor", valor: String(v ?? "").trim() || "A definir" };
}

/* trecho para frases (WhatsApp, compartilhar): ", a partir de R$ 8.640" ou ", valor: A definir" */
export function precoFrase(p) {
  const x = precoDe(p);
  return x.numero ? `, a partir de ${x.valor}` : `, valor: ${x.valor}`;
}

/* parcelas: só para mostrar ao lado do valor ("em até 10x"); não faz conta nenhuma.
   Aceita 10, "10", "10x", "10 vezes". Guarda 2 a 24; qualquer outra coisa vira 0 (não mostra). */
export function lerParcelas(v) {
  const n = parseInt(String(v ?? "").replace(/\D/g, ""), 10);
  return n >= 2 && n <= 24 ? n : 0;
}
export function parcelasDe(p) {
  const n = lerParcelas(p?.parcelas);
  return n ? `em até ${n}x` : "";
}
