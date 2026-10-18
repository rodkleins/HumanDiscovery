# A aceleração das descobertas humanas

Projeto de visualização que mostra, como uma linha acumulada, mais de 100 grandes descobertas da humanidade (127 hoje), da ferramenta de pedra (3,3 milhões de anos atrás) à Artemis II (2026). A tese visual: a linha fica quase plana por milênios e sobe como uma parede nos últimos dois séculos, enquanto as explosões sonoras ficam cada vez mais frequentes.

São duas páginas HTML que compartilham scripts em `js/`, sem build, sem dependências e sem backend. Basta abrir no navegador (funciona também via `file://`, por isso os scripts são clássicos e não módulos ES). Publicado no GitHub Pages a partir do repositório `rodkleins/HumanDiscovery`; o `index.html` redireciona para o interativo.

## Arquivos

`descobertas-interativo.html` é o site interativo: player com play/pausa, barra de tempo, velocidade, som liga/desliga, atalhos por época, zoom nos últimos 300 anos, clique nos pontos abre um cartão com descrição, navegação por teclado. É a versão para publicar.

`aceleracao.html` é a versão "vídeo": tela de início com botão, depois roda sozinha do começo ao fim em 16:9 (1, 1,5 ou 2 minutos). O botão "Gravar vídeo" exporta direto do navegador: `MediaRecorder` captura o canvas (`captureStream`) e a saída do compressor (`MediaStreamDestination`) e baixa um `.webm` (VP9 + Opus, 1920×1080) no fim. A gravação é em tempo real e a aba precisa ficar visível. Ainda dá para gravar a tela com OBS. Não tem controles durante a reprodução e o cursor some.

Código compartilhado, carregado nesta ordem (os nomes ficam no escopo global):

- `js/data.js`: o array `M` de marcos.
- `js/core.js`: `NOW` e constantes do eixo, funções de tempo (`prog`, `makePoints`, `retime`, `yearOfT`) e formatação de anos.
- `js/audio.js`: `createSound`, `boom`, `beat`, `beatGap` e `drone`.
- `js/render.js`: `geometry`, `scales` e as funções de desenho (`drawAxis`, `drawLine`, `drawLabels`, `drawBursts`, `drawHUD` etc.), que recebem o contexto `g` e a geometria `G`.

Cada página guarda só o que é dela: `PRE_T`, `MAIN`, `D`, a orquestração do tempo, os controles e, no vídeo, o agendamento do som e a gravação.

## Stack

HTML, CSS e JavaScript puro. Desenho todo em `<canvas>` 2D. Áudio todo sintetizado em Web Audio API (não há arquivos de som). Fontes do Google Fonts: Instrument Serif (títulos, ano, contador) e Archivo (textos). Visual escuro: fundo `#06080F`, linha `#E9E3D3`, dourado `#FFD27A` para revoluções, laranja `#FF8A3D` nas explosões comuns, cinza `#5E6678`/`#8A90A0` para eixos e anos.

## Dados

O array `M` em `js/data.js` guarda os marcos em ordem cronológica, cada item `[ano, nome, tipo, descrição, artigo, imagem]`. As duas páginas usam a mesma lista. `artigo` é a URL do artigo na Wikipédia (pt, ou en quando o pt não tem imagem) e `imagem` é a miniatura de 330px do Wikimedia Commons obtida pela API REST de resumo (`/api/rest_v1/page/summary/`). Os endereços ficam gravados nos dados de propósito: a página não chama a API da Wikipédia (que limita requisições), só carrega as imagens. Na página, `imgAt` troca o `330px-` por 500px e, se o Wikimedia recusar o tamanho, volta para a miniatura original.

O ano é negativo para a.C. Anos fracionários (por exemplo `1969.5`, `2020.5`) servem só para ordenar dois marcos do mesmo ano; na exibição o ano é arredondado para baixo.

O tipo controla o destaque: `0` é descoberta comum (ponto pequeno, explosão comum), `1` é revolução (dourado, explosão grande, tremor de tela, clarão, rótulo fixo), `2` é marco histórico (branco, explosão grande, rótulo fixo). Há uma série de marcos da corrida espacial e dos foguetes (Goddard, V-2, NASA, Tereshkova, Leonov, Salyut, Apollo-Soyuz, Voyager, ônibus espacial, Mir, China, Marcos Pontes, SpaceX, Blue Origin, Starship, Artemis). Há também uma série de robótica (R.U.R., Unimate, WABOT-1, ASIMO, Roomba, BigDog, Atlas, Spot, Optimus, Atlas elétrico, Unitree); o WABOT-1 não tem imagem livre no Commons e mostra só o ano. Hoje são revoluções a agricultura e as quatro revoluções industriais; marcos históricos são Escrita, Imprensa, O homem pisa na Lua, Internet e IA generativa.

Os seis primeiros itens (anteriores a 10 mil a.C.) são a "pré-história" e têm tratamento próprio de tempo e eixo, descrito abaixo. Se adicionar ou remover itens pré-históricos, ajuste também o array `PRE_T` nas duas páginas, que precisa ter exatamente um tempo por item pré-histórico (`makePoints` avisa no console se não bater).

## Eixo horizontal (anos)

O eixo é dividido em duas partes, separadas por uma quebra visual (duas barrinhas no eixo):

1. Faixa da pré-história à esquerda, com largura `PW` (cerca de 18,5% da área do gráfico), em escala logarítmica de 3,4 milhões de anos até 10 mil a.C. Tem fundo levemente destacado.
2. Depois de um espaço `GAP`, escala linear de `Y0 = -10000` até `Y1 = 2026`.

A função `pxF(y)` faz esse mapeamento. No interativo existe também `pxZ(y)`, o modo zoom: tudo antes de 1700 é comprimido numa faixa estreita `ZW` à esquerda e de 1700 a 2026 ocupa o resto em escala linear. A posição final é `px(y) = lerp(pxF, pxZ, z)`, com `z` animado entre 0 e 1 pelo botão de zoom. O eixo vertical segue a mesma ideia com `pyF` e `pyZ` (no zoom, os pontos anteriores a 1700 ficam espremidos nos 16% de baixo).

O eixo vertical é simplesmente o índice acumulado da descoberta: `py(i) = B - (i+1)/N*(B-T)`.

## Tempo da animação (o "segredo" da aceleração)

O tempo da animação não é proporcional aos anos, senão os últimos 250 anos passariam em um segundo. A posição de cada marco no tempo usa uma escala logarítmica dos anos até hoje, deslocada pela constante `C = 100`:

```js
u(y)    = ln(NOW - y + C)
prog(y) = (u(Y0) - u(y)) / (u(Y0) - u(NOW))   // 0 em 10 mil a.C., 1 em NOW (2026)
tempo   = MAIN + prog(y) * D
```

Na prática, com duração de 1min30: agricultura aparece aos 15s, a imprensa aos 55s, a 1ª Revolução Industrial aos 63s e os 18 segundos finais concentram cerca de 60 descobertas, com explosões chegando a vários por segundo. Aumentar `C` deixa o final mais frenético e o começo mais lento; diminuir faz o contrário.

Constantes de tempo: `INTRO` (frase de abertura), `PRE_T` (instantes das explosões da pré-história, num prólogo enquanto o ano rola de "há 3,3 milhões de anos" até 12 mil anos atrás), `MAIN` (início da parte linear), `D` (duração da parte principal), `OUTRO`/`TOTAL` (fechamento). Na versão vídeo `D` é calculado a partir da duração escolhida (`total - MAIN - OUTRO`).

O ano grande no canto superior esquerdo é travado nas descobertas (`yearOfT`): no instante de cada explosão ele mostra exatamente o ano do marco, fica parado por `HOLD` (40%) do intervalo até o próximo e então rola, em escala logarítmica, chegando ao ano do próximo marco no momento da explosão dele. Depois do último marco ele vai até `NOW`. Vale também para a pré-história e para o ano ao lado da barra de tempo do interativo.

## Áudio

Tudo em Web Audio, passando por um `DynamicsCompressor` para não estourar.

A trilha é um drone grave de três osciladores dente de serra (41,2 Hz, 41,7 Hz e 61,8 Hz) atrás de um filtro passa-baixa que abre ao longo do vídeo (de 110 Hz a 1200 Hz), mais dois osciladores triangulares que sobem uma oitava na parte final para criar tensão, e uma batida de coração dupla cujo intervalo cai de 1,7s para cerca de 0,45s.

A explosão (`boom`) combina ruído marrom (gerado em `noiseBuf`, bem mais grave que ruído branco) passando por dois filtros passa-baixa com frequência caindo, mais duas camadas de sub-grave senoidal com o tom descendo. O parâmetro `big` deixa a explosão mais longa e profunda (revoluções e marcos). O som é posicionado no estéreo conforme a posição do ponto na tela. A versão anterior com ruído branco soava metálica e foi descartada de propósito; manter o caráter grave.

Na versão vídeo todos os sons são agendados de uma vez no início, sincronizados pelo relógio do `AudioContext`. No interativo, os sons são disparados ao vivo quando o tempo cruza um marco (para funcionar com pausa e arraste), com limite de 4 explosões por quadro.

O navegador exige um clique antes de tocar áudio; por isso tudo começa a partir de um botão.

## Rótulos

Só os itens de tipo 1 e 2 ganham rótulo fixo na linha, sempre com o ano em cinza ao lado (função `lab`). Antes de 1700, os rótulos ficam centralizados abaixo (revoluções) ou acima (marcos) do ponto; a imprensa fica acima e à esquerda para não colidir com a parede. Depois de 1700, revoluções vão à direita da parede e marcos à esquerda. No interativo há um ajuste simples de colisão que empurra rótulos para cima quando ficam próximos demais, e no celular todos vão para a esquerda.

A legenda grande embaixo mostra a descoberta mais recente com o ano.

## Cartão e imagens (interativo)

O cartão à direita acompanha a animação e mostra sempre a descoberta mais recente (`sel<0`). Quando a pessoa clica num ponto ou usa as setas, `sel` passa a valer o índice escolhido e o cartão fica fixo nele até o próximo play. Abaixo do cartão ficam a imagem da descoberta, com crédito para o Wikimedia Commons e link para o artigo, e quatro miniaturas das descobertas anteriores, que podem ser clicadas. As próximas três imagens são pré-carregadas.

## Layout responsivo (interativo)

Em telas largas (`min-width:1100px` e `min-height:600px`) a página cabe numa tela só: coluna da esquerda com gráfico, controles e épocas, e coluna da direita com cartão, imagem, miniaturas e rodapé. `fitPage()` aplica `zoom` em `main` (entre 1 e 3) para que a página se comporte como uma tela de cerca de 1440×800 em qualquer monitor, inclusive 4K, mantendo as proporções. `fitCanvas()` calcula o tamanho do canvas pela altura livre (descontando controles e épocas, que não encolhem) e pela largura livre ao lado da coluna do cartão; a coluna da esquerda tem a largura do gráfico e o conjunto fica centralizado. O canvas ganha resolução extra `RS` (até 2×) conforme a densidade da tela, e todo `setTransform` do desenho usa `RS`. Em telas menores tudo empilha e a página rola. Há um botão central "Começar" sobre o gráfico no início e no fim, e tela cheia pelo botão ou pela tecla F.

`layout()` escolhe entre dois tamanhos lógicos de canvas: 1920×1080 no desktop e 1080×1350 (mais vertical) quando o contêiner tem menos de 700px, com textos maiores (`FS`) e menos marcações no eixo. O canvas é redesenhado a cada quadro, então todas as posições são recalculadas.

## Ideias de melhoria já discutidas

Modo "rolagem" (scrollytelling), em que a linha se desenha conforme a pessoa desce a página. Zoom automático da câmera no clímax da versão vídeo. Permitir editar a lista de marcos por um JSON separado.

## Cuidados

As datas antigas são aproximações e a seleção é curadoria; o rodapé do interativo deixa isso claro. No avião, o texto cita os irmãos Wright (1903) e Santos-Dumont com o 14-Bis (1906), por ser um tema sensível para o público brasileiro; manter os dois. O público é brasileiro: textos em português do Brasil, números com separador de milhar em ponto (`toLocaleString('pt-BR')`).
