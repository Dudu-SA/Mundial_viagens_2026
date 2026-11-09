# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Famílias e casais de Crateús (CE) e região, comprando pacotes nacionais (Gramado, praias do Nordeste, Beto Carrero) e saídas em grupo a partir de Fortaleza.
- Peregrinos e grupos de igreja: excursões religiosas (Fátima, Aparecida, Terra Santa) com guia da agência.
- Viajantes internacionais da região: Europa, Caribe, Argentina e Chile, quase sempre parcelado.
- A maioria chega pelo celular, vindo do WhatsApp ou do Instagram da agência, e decide conversando com uma pessoa.

## Product Purpose
Site público da Mundial Viagens (mundialviagens.com; clientes.mundialviagens.com redireciona para lá): mostrar as viagens à venda (promoções, grupos, pacotes, peregrinações) cadastradas no painel pela equipe e levar a pessoa a pedir pelo WhatsApp. Sucesso = conversa iniciada no WhatsApp sobre uma viagem específica, ou cadastro nos alertas de promoção.

## Positioning
Atendimento humano no WhatsApp do orçamento ao retorno, parcelamento em até 12x com tarifas negociadas, e grupos com acompanhamento da agência saindo de Fortaleza. Agência física em Crateús desde 2014; não é um buscador nem uma OTA.

## Operating Context
- Conteúdo vem do Firestore (coleções `promocoes`, `destaques`), cadastrado em `admin.html` (manual, planilha ou foto lida por IA).
- Cada viagem tem: lugar, seção (promocao/grupo/pacote/peregrinacao), etiqueta, detalhes, apresentação, datas, exibir até, preço "a partir de", até 3 fotos (data URL), blocos (texto, lista, foto) e destaque.
- Páginas: `index.html` (início), `promocoes.html` (vendas com abas), `promo.html?id=` (uma viagem), `links.html` (links), `admin.html` (painel, visual do MVO).
- Hospedagem Firebase (estático, sem build). CDN permitido: jsDelivr, Google Fonts, gstatic.
- Sistema irmão: MVO (promo.mundialviagens.com) com identidade azul #1B468F + laranja #FF914D.

## Capabilities and Constraints
- Sem servidor: tudo roda no navegador; dados públicos só de leitura.
- WhatsApp: (88) 8887-0400 geral; (88) 8887-0800 nos continentes. E-mail mundialviagens2014@gmail.com. Endereço BR-404, 1646, São Vicente, Crateús (CE). Horário seg–sex 8h–18h, sáb 8h–12h.
- Desempenho no celular importa (diagnóstico apontou thread principal pesada): nada que rode em laço por quadro sem necessidade; 3D só com moderação.
- Deve funcionar parado se bibliotecas de animação falharem e com "reduzir movimento".
- Terminologia: "viagem" (genérico), "promoção", "saída em grupo", "pacote", "peregrinação", "a partir de R$ X por pessoa, em quarto duplo", "exibir até".

## Brand Commitments
- Nome: Mundial Viagens. Logo: "m" branco com aviãozinho decolando dentro de círculo (azul sobre branco ou branco sobre azul); o usuário tem o arquivo original em boa qualidade (a enviar).
- Azul é a cor da marca (#1B468F no MVO; #1D4A9F no site). O usuário quer "manter a cara da empresa".
- Voz: direta, calorosa, regional sem caricatura; "fale com a gente".

## Evidence on Hand
- 13 promoções reais da operadora Foco (Gramado, Bariloche, Santiago, Mendoza, Buenos Aires) em `/home/claude/entrega/promocoes-foco-out-2026.xlsx` e suas artes.
- O usuário tem fotos reais de viagens e grupos (não enviadas ainda).
- Depoimentos do site atual (Camila e Rafael, Marcos Andrade, Família Nogueira) NÃO são confirmados: não usar como reais; pedir depoimentos verdadeiros ou omitir a seção.
- Números "12+ anos, 50+ países, 5 mil viajantes" vêm do site antigo; Fundação confirmada pelo dono: 2014 (o site calcula os anos sozinho). Os demais números só se confirmados.

## Product Principles
1. A viagem é o produto: foto grande, preço claro, data e um botão de WhatsApp sempre à mão.
2. Confiança antes de impacto: agência real, pessoas reais, condições claras (parcelamento, o que inclui).
3. Celular primeiro: tudo deve ler bem com uma mão, em 4G.
4. O painel alimenta tudo: nada no site depende de edição manual de HTML.
5. Movimento com propósito: um momento marcante, o resto quieto e rápido.

## Accessibility & Inclusion
Público inclui pessoas mais velhas (peregrinações): texto grande, contraste alto, botões grandes, sem depender de hover.
