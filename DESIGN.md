# DESIGN.md — Mundial Viagens (site público)

<!-- impeccable:design-schema 1 · seed:7d958103a6429443 · direção "O álbum de grupos" -->

## Tese
O site é o álbum de fotos de quem viajou com a Mundial. Cada viagem é uma página do álbum: uma foto impressa com borda branca, cantoneiras azuis, fita laranja, carimbo de data e legenda à mão. Recusa o padrão "herói de tela cheia + busca + grade de cartões iguais".

## Cores (css/site.css, `:root`)
| Token | Valor | Uso |
|---|---|---|
| `--capa` | `#1b468f` | azul da marca: cabeçalho, bordas da página, abas-índice, rodapé, botões, cantoneiras |
| `--tinta` | `#12326a` | texto |
| `--tinta-2` | `#4f5f85` | texto de apoio |
| `--papel` | `#fbfbf8` | a página do álbum (fundo) |
| `--papel-2` | `#f1f3f6` | página virada: destaques, contato |
| `--fita` | `#ff914d` | fita adesiva, aba ativa, numeração dos passos (nunca texto pequeno) |
| `--fita-tinta` | `#b84d14` | laranja para texto (legendas à mão, etiquetas, carimbo) — 4,9:1 sobre papel |
| `--zap` / `--zap-2` | `#13783f` / `#0f6132` | só o WhatsApp (CTA principal e botão flutuante) — 5,5:1 com branco |
| `--linha` | `#dde3ee` | divisórias |

## Tipografia
- **Archivo** (variável, Google Fonts). Títulos: 800, `font-stretch:112%`, `line-height:.98`, `letter-spacing:-.03em`. Corpo 17px/1.6.
- **Caveat** 500: legendas das fotos, "sobretítulos" (`.mao`), assinatura. Nunca para números nem para informação essencial.
- Números (preço, carimbo) em Archivo com `lining-nums`.
- Escala: h1 `clamp(2.6rem,5.6vw,5rem)`, h2 `clamp(2rem,4.6vw,3.6rem)`, h3 1.35–1.6rem.

## Peças
- **`.foto`** (window.mv.foto no site.js): borda branca 10px, sombra `--sombra-foto`, rotação `--rot` (−4° a +3°), `.canto` = 4 cantoneiras azuis, `.fita` (opcional, `--dir` no canto), `.carimbo` (data de saída), `.foto__leg` manuscrita. Hover/foco: endireita (`rotate:0`), sobe 6px, sombra maior.
- **Álbum aberto** (`.album`): 45/55, risco central da lombada, três fotos sobrepostas na página direita. Celular: fotos primeiro, texto e botão ainda na primeira tela.
- **Abas-índice** (`.abas`): fixas na borda direita, só no computador; a seção visível fica laranja.
- **Botões**: pílula, 3.3rem de altura mínima. `.btn` azul, `.btn--zap` verde (só WhatsApp), `.btn--linha`, `.btn--claro`, `.btn--linha-clara` (sobre azul).
- **Formulário de contato**: folha branca com fita no topo, campos só com linha inferior.

## Movimento
- Único momento autoral: na abertura da página inicial as três fotos caem uma a uma (`@keyframes cai`, 0.9s, ease-out expo, atrasos 0/.18/.36s) e a fita cola por último (1s).
- Um `data-surge` por bloco: aparece uma vez ao entrar na tela (IntersectionObserver), 0.7s.
- Nada por quadro: sem Lenis, GSAP, três.js ou cursor. Rolagem nativa. `prefers-reduced-motion` desliga tudo.
- Transição entre páginas: View Transitions (fade + 14px).

## Regras
1. Nenhum cartão igual ao vizinho: rotações alternam pelo `nth-child`.
2. Verde é só WhatsApp; laranja é só marca física (fita, carimbo, aba ativa, etiqueta).
3. Sem depoimentos inventados: a seção só entra com nomes reais.
4. Sem hover obrigatório: tudo que o hover mostra também está visível sem ele.
5. Texto nunca abaixo de 0.82rem; contraste AA em todo texto (verificado com o detector impeccable).

## Dados
As páginas são alimentadas pelo painel (`admin.html`): `saidas.js`, `destaques.js`, `promos.js` e o módulo de `promo.html` montam as `.foto` a partir do Firestore. Fotos de exemplo (`imgs/exemplo-*.svg`) marcam onde entram as fotos reais dos grupos.
