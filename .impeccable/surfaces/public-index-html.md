---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: ["public/promocoes.html","public/promo.html"]
---

# Surface: site público (index.html, promocoes.html, promo.html)

Mode: Persuade. Audience: famílias, casais e grupos de igreja de Crateús/Fortaleza, no celular, vindos do WhatsApp/Instagram. Job: escolher uma viagem e falar com a agência. Action: "Quero esta viagem" → WhatsApp com a viagem escrita. Proof: fotos reais de grupos que já viajaram (a enviar; placeholders rotulados até lá), 14 anos, condições claras. Constraints: dados do Firestore; estático; celular primeiro; funciona parado sem bibliotecas.

## Direction contract

THESIS: O site é o álbum de fotos dos grupos que viajaram com a Mundial, e cada viagem à venda é uma página ainda em branco com a foto do destino já colada. Recusa: foto de destino em tela cheia + busca + grade de cartões iguais.

OWN-WORLD: Fundo = página do álbum, branco quente de papel fotográfico (#FBFBF8) sobre uma capa azul da marca (#1B468F) que aparece nas bordas e nas abas-índice. Tinta azul #12326A; fita adesiva laranja #FF914D (acento) e carimbo de data em laranja; WhatsApp verde #168A4A só no botão de ação. Fotos impressas com borda branca de 10px, sombra suave deslocada, rotação leve (−2°/+1.5°), cantoneiras azuis nos cantos. Tipos: Archivo (largura variável, 800 wide para títulos, 400/500 texto) + Caveat (legendas manuscritas das fotos). Sem cartões iguais: as "unidades" são fotos coladas com legenda, fita e carimbo.

STORY: "Olha quem já foi com a gente" → "estas são as próximas páginas" → "a sua foto pode ser a próxima": a pessoa reconhece gente como ela, vê preço e data sem rodeio, e manda mensagem.

FIRST VIEWPORT: Álbum aberto. Página esquerda (45%): título "O álbum de quem viajou com a Mundial", uma linha de apoio, botão verde "Falar no WhatsApp" e link "Ver próximas saídas". Página direita (55%): três fotos impressas sobrepostas, inclinadas, com legenda manuscrita (grupo, destino, mês) e um pedaço de fita laranja; aba-índice azul na borda direita com as seções. No celular: fotos primeiro (empilhadas), texto e botão logo abaixo, dentro da primeira tela.

FORM: álbum de fotos de grupos (candidato 1 da lista ordenada; escolhido pelo usuário sobre o sorteado, o postal). seed:7d958103a6429443

MOTION: um momento: ao abrir, as três fotos caem no álbum uma a uma (translate+rotate, ease-out expo 700 ms) e a fita "cola" por último; ao passar o mouse, a foto se endireita e sobe 6 px. Rolagem: só reveal suave uma vez por bloco. Nada roda por quadro.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
