# A aceleração das descobertas humanas

Projeto de visualização que mostra, como uma linha acumulada, quase 100 grandes descobertas da humanidade, da ferramenta de pedra (3,3 milhões de anos atrás) aos agentes de IA (2024). A tese visual: a linha fica quase plana por milênios e sobe como uma parede nos últimos dois séculos, enquanto as explosões sonoras ficam cada vez mais frequentes.

São duas páginas HTML independentes, cada uma num único arquivo, sem build, sem dependências e sem backend. Basta abrir no navegador.

## Arquivos

`descobertas-interativo.html` é o site interativo: player com play/pausa, barra de tempo, velocidade, som liga/desliga, atalhos por época, zoom nos últimos 300 anos, clique nos pontos abre um cartão com descrição, navegação por teclado. É a versão para publicar.

`aceleracao.html` é a versão "vídeo": tela de início com botão, depois roda sozinha do começo ao fim em 16:9 (1, 1,5 ou 2 minutos), pensada para gravar a tela com OBS capturando o áudio do sistema. Não tem controles durante a reprodução e o cursor some.

As duas compartilham a mesma lógica visual e sonora, mas o código está duplicado (não há módulo comum). Uma melhoria natural é extrair dados, mapeamentos e áudio para arquivos compartilhados.

## Stack

HTML, CSS e JavaScript puro. Desenho todo em `<canvas>` 2D. Áudio todo sintetizado em Web Audio API (não há arquivos de som). Fontes do Google Fonts: Instrument Serif (títulos, ano, contador) e Archivo (textos). Visual escuro: fundo `#06080F`, linha `#E9E3D3`, dourado `#FFD27A` para revoluções, laranja `#FF8A3D` nas explosões comuns, cinza `#5E6678`/`#8A90A0` para eixos e anos.

## Dados

O array `M` guarda os marcos em ordem cronológica. Na versão interativa cada item é `[ano, nome, tipo, descrição]`; na versão vídeo é `[ano, nome, tipo]`.

O ano é negativo para a.C. Anos fracionários (por exemplo `1969.5`, `2020.5`) servem só para ordenar dois marcos do mesmo ano; na exibição o ano é arredondado para baixo.

O tipo controla o destaque: `0` é descoberta comum (ponto pequeno, explosão comum), `1` é revolução (dourado, explosão grande, tremor de tela, clarão, rótulo fixo), `2` é marco histórico (branco, explosão grande, rótulo fixo). Hoje são revoluções a agricultura e as quatro revoluções industriais; marcos históricos são Escrita, Imprensa, O homem pisa na Lua, Internet e IA generativa.

Os seis primeiros itens (anteriores a 10 mil a.C.) são a "pré-história" e têm tratamento próprio de tempo e eixo, descrito abaixo. Se adicionar ou remover itens pré-históricos, ajuste também o array `PRE_T`, que precisa ter exatamente um tempo por item pré-histórico.

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
prog(y) = (u(Y0) - u(y)) / (u(Y0) - u(2025))   // 0 em 10 mil a.C., 1 em 2025
tempo   = MAIN + prog(y) * D
```

Na prática, com duração de 1min30: agricultura aparece aos 15s, a imprensa aos 55s, a 1ª Revolução Industrial aos 63s e os 18 segundos finais concentram cerca de 60 descobertas, com explosões chegando a vários por segundo. Aumentar `C` deixa o final mais frenético e o começo mais lento; diminuir faz o contrário.

Constantes de tempo: `INTRO` (frase de abertura), `PRE_T` (instantes das explosões da pré-história, num prólogo enquanto o ano rola de "há 3,3 milhões de anos" até 12 mil anos atrás), `MAIN` (início da parte linear), `D` (duração da parte principal), `OUTRO`/`TOTAL` (fechamento). Na versão vídeo `D` é calculado a partir da duração escolhida (`total - MAIN - OUTRO`).

O ano grande no canto superior esquerdo rola continuamente pela inversa da função de tempo (`yearAt`), então pode não bater exatamente com o ano da última descoberta exibida na legenda. Uma melhoria possível é "travar" o ano no momento de cada explosão.

## Áudio

Tudo em Web Audio, passando por um `DynamicsCompressor` para não estourar.

A trilha é um drone grave de três osciladores dente de serra (41,2 Hz, 41,7 Hz e 61,8 Hz) atrás de um filtro passa-baixa que abre ao longo do vídeo (de 110 Hz a 1200 Hz), mais dois osciladores triangulares que sobem uma oitava na parte final para criar tensão, e uma batida de coração dupla cujo intervalo cai de 1,7s para cerca de 0,45s.

A explosão (`boom`) combina ruído marrom (gerado em `noiseBuf`, bem mais grave que ruído branco) passando por dois filtros passa-baixa com frequência caindo, mais duas camadas de sub-grave senoidal com o tom descendo. O parâmetro `big` deixa a explosão mais longa e profunda (revoluções e marcos). O som é posicionado no estéreo conforme a posição do ponto na tela. A versão anterior com ruído branco soava metálica e foi descartada de propósito; manter o caráter grave.

Na versão vídeo todos os sons são agendados de uma vez no início, sincronizados pelo relógio do `AudioContext`. No interativo, os sons são disparados ao vivo quando o tempo cruza um marco (para funcionar com pausa e arraste), com limite de 4 explosões por quadro.

O navegador exige um clique antes de tocar áudio; por isso tudo começa a partir de um botão.

## Rótulos

Só os itens de tipo 1 e 2 ganham rótulo fixo na linha, sempre com o ano em cinza ao lado (função `lab`). Antes de 1700, os rótulos ficam centralizados abaixo (revoluções) ou acima (marcos) do ponto; a imprensa fica acima e à esquerda para não colidir com a parede. Depois de 1700, revoluções vão à direita da parede e marcos à esquerda. No interativo há um ajuste simples de colisão que empurra rótulos para cima quando ficam próximos demais, e no celular todos vão para a esquerda.

A legenda grande embaixo mostra a descoberta mais recente com o ano.

## Layout responsivo (interativo)

`layout()` escolhe entre dois tamanhos lógicos de canvas: 1920×1080 no desktop e 1080×1350 (mais vertical) quando o contêiner tem menos de 700px, com textos maiores (`FS`) e menos marcações no eixo. O canvas é redesenhado a cada quadro, então todas as posições são recalculadas.

## Ideias de melhoria já discutidas

Travar o ano do topo na data de cada descoberta. Modo "rolagem" (scrollytelling), em que a linha se desenha conforme a pessoa desce a página. Zoom automático da câmera no clímax da versão vídeo. Extrair código comum entre as duas versões. Exportar o vídeo direto do navegador (por exemplo com `MediaRecorder` capturando o canvas e o áudio) em vez de depender de gravação de tela. Permitir editar a lista de marcos por um JSON separado.

## Cuidados

As datas antigas são aproximações e a seleção é curadoria; o rodapé do interativo deixa isso claro. No avião, o texto cita os irmãos Wright (1903) e Santos-Dumont com o 14-Bis (1906), por ser um tema sensível para o público brasileiro; manter os dois. O público é brasileiro: textos em português do Brasil, números com separador de milhar em ponto (`toLocaleString('pt-BR')`).
