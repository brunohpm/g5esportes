/**
 * Desenha a assinatura "G5 ESPORTES" em vetor.
 *
 * Por que desenhar em vez de usar a fonte: a Conthrax é gratuita só para
 * desktop; embutir num site exige licença separada. Um SVG é ARTE, não
 * tipografia embutida — então a marca fica ortogonal como a original sem
 * pendência de licença. Todos os glifos são construídos aqui, à mão.
 *
 * Modelo: cada glifo é a UNIÃO de retângulos, mais um "anel" explícito quando
 * a letra tem contraforma fechada (G, O, P, R). Retângulos irmãos com a mesma
 * cor se unem sozinhos; a contraforma é o único lugar que precisa de furo, e
 * ali o path tem exatamente dois subcaminhos — sem surpresa de winding.
 *
 *   node scripts/gerar-logo.mjs
 *   node scripts/gerar-logo.mjs --escuro    # variante para fundo claro
 */
import fs from 'fs/promises'
import path from 'path'

// ── Grade ───────────────────────────────────────────────────────────────────
const A = 100 // altura de maiúscula
const L = 74 // largura do glifo
const T = 19 // espessura do traço
const C = 13 // chanfro — o corte de canto que dá o ar "eletrônico"

const r = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`

/** Contorno retangular com cantos chanfrados, no sentido horário. */
function contorno(x, y, w, h, c) {
  return (
    `M${x + c},${y} H${x + w - c} L${x + w},${y + c} V${y + h - c} ` +
    `L${x + w - c},${y + h} H${x + c} L${x},${y + h - c} V${y + c} Z`
  )
}

/** Contorno interno, no sentido ANTI-horário: é o que abre a contraforma. */
function furo(x, y, w, h, c) {
  return (
    `M${x + c},${y} V${y} L${x},${y + c} V${y + h - c} L${x + c},${y + h} ` +
    `H${x + w - c} L${x + w},${y + h - c} V${y + c} L${x + w - c},${y} Z`
  )
}

/** Anel: contorno externo com furo interno. */
const anel = (x, y, w, h, c = C, ci = 5) =>
  `<path fill-rule="evenodd" d="${contorno(x, y, w, h, c)} ${furo(x + T, y + T, w - 2 * T, h - 2 * T, ci)}"/>`

// ── Glifos ──────────────────────────────────────────────────────────────────
const glifos = {
  // Anel + tampa que fecha a abertura superior direita + barra do G.
  G: () =>
    [
      anel(0, 0, L, A),
      // Tampa: recobre o vão à direita, do topo até a barra.
      r(L - T, 0, T, A * 0.42),
      // Barra do G, da contraforma até a borda direita.
      r(L * 0.44, A * 0.42, L * 0.56, T),
    ].join(''),

  /*
   * Cinco barras, nenhuma contraforma fechada: topo, haste esquerda em cima,
   * barra do meio, haste direita embaixo e base. O "meio" um pouco acima do
   * centro é o que faz o algarismo não parecer pesado embaixo.
   */
  5: () => {
    const meio = A * 0.46
    return [
      // Barra do topo com os dois cantos externos chanfrados, para o algarismo
      // ficar no mesmo sistema do G — que também é chanfrado.
      `<path d="M${C},0 H${L - C} L${L},${C} V${T} H0 V${C} Z"/>`,
      r(0, C, T, meio - C),
      r(0, meio - T, L, T),
      /*
       * A haste desce até onde o chanfro da base começa (A - C), e não até
       * A - T: encostar exatamente na barra deixa uma costura de antialiasing
       * entre as duas formas. Sobrepondo alguns pixels, some — e parar em
       * A - C evita preencher de volta o canto chanfrado.
       */
      r(L - T, meio - T, T, A - C - (meio - T)),
      // Barra da base, idem.
      `<path d="M0,${A - T} H${L} V${A - C} L${L - C},${A} H${C} L0,${A - C} Z"/>`,
    ].join('')
  },

  E: () =>
    [
      r(0, 0, T, A),
      r(0, 0, L, T),
      r(0, (A - T) / 2, L - C, T),
      r(0, A - T, L, T),
    ].join(''),

  S: () =>
    [
      r(0, 0, L, T),
      r(0, 0, T, (A + T) / 2),
      r(0, (A - T) / 2, L, T),
      r(L - T, (A - T) / 2, T, (A + T) / 2),
      r(0, A - T, L, T),
    ].join(''),

  P: () => [anel(0, 0, L, A * 0.62, C, 4), r(0, 0, T, A)].join(''),

  O: () => anel(0, 0, L, A),

  R: () => {
    const bojo = A * 0.58
    return [
      anel(0, 0, L, bojo, C, 4),
      r(0, 0, T, A),
      /*
       * Perna DIAGONAL. Com perna vertical o R vira um "A": as duas hastes
       * ficam paralelas e o olho lê o bojo como travessão. A diagonal é o que
       * distingue as duas letras.
       */
      `<path d="M${T},${bojo - T} H${2 * T} L${L},${A} H${L - T} Z"/>`,
    ].join('')
  },

  T: () => [r(0, 0, L, T), r((L - T) / 2, 0, T, A)].join(''),
}

/** Monta uma palavra encaixando os glifos lado a lado. */
function palavra(texto, { escala = 1, espaco = 14 } = {}) {
  let x = 0
  const partes = []
  for (const ch of texto) {
    const desenho = glifos[ch]
    if (desenho) {
      partes.push(`<g transform="translate(${x} 0) scale(${escala})">${desenho()}</g>`)
    }
    x += (L + espaco) * escala
  }
  return { svg: partes.join(''), largura: x - espaco * escala }
}

// ── Composição ──────────────────────────────────────────────────────────────
const escuro = process.argv.includes('--escuro')
const corG5 = escuro ? '#0a3d1c' : '#b9fb9c'
const corEsportes = escuro ? '#0a3d1c' : '#ffffff'

const g5 = palavra('G5', { espaco: 16 })

/*
 * "ESPORTES" é escalado para terminar exatamente na mesma largura do "G5":
 * é o alinhamento das duas bordas que faz o conjunto ler como uma assinatura
 * só, e não como duas palavras empilhadas por acaso.
 */
const ESPACO_ESPORTES = 36
const avancoTotal = 'ESPORTES'.length * (L + ESPACO_ESPORTES) - ESPACO_ESPORTES
const escalaEsportes = g5.largura / avancoTotal
const esportes = palavra('ESPORTES', { escala: escalaEsportes, espaco: ESPACO_ESPORTES })

const respiro = A * 0.2
const altura = A + respiro + A * escalaEsportes

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g5.largura} ${altura}" role="img" aria-label="G5 Esportes">
  <title>G5 Esportes</title>
  <g fill="${corG5}">${g5.svg}</g>
  <g fill="${corEsportes}" transform="translate(0 ${A + respiro})">${esportes.svg}</g>
</svg>
`

const destino = path.resolve('public', escuro ? 'marca-g5-escura.svg' : 'marca-g5.svg')
await fs.mkdir(path.dirname(destino), { recursive: true })
await fs.writeFile(destino, svg, 'utf8')
console.log(`${destino}  (${(svg.length / 1024).toFixed(1)} KB)`)
