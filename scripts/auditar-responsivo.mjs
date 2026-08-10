/**
 * Auditoria de responsividade: roda as páginas do site numa matriz de aparelhos
 * e reporta, com medida, três defeitos que dão para detectar sem olho humano:
 *
 *   1. estouro horizontal  — a página rola de lado
 *   2. elemento vazando    — algo mais largo que a tela
 *   3. texto sobreposto    — duas caixas de texto ocupando o mesmo pixel
 *
 *   node scripts/auditar-responsivo.mjs [pasta-de-prints]
 *   ALVO=https://g5.prattsolutions.com.br node scripts/auditar-responsivo.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs/promises'

const saida = process.argv[2] ?? path.resolve('.auditoria')
const base = (process.env.ALVO ?? process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000').replace(/\/$/, '')

/** Larguras que realmente existem no bolso das pessoas hoje, do pior ao maior. */
const APARELHOS = [
  { nome: 'Galaxy Fold (fechado)', largura: 344, altura: 882, dpr: 3 },
  { nome: 'iPhone SE',             largura: 375, altura: 667, dpr: 2 },
  { nome: 'Galaxy S24',            largura: 360, altura: 780, dpr: 3 },
  { nome: 'Moto G / entrada',      largura: 360, altura: 800, dpr: 2 },
  { nome: 'iPhone 13 mini',        largura: 375, altura: 812, dpr: 3 },
  { nome: 'iPhone 15',             largura: 393, altura: 852, dpr: 3 },
  { nome: 'Pixel 8',               largura: 412, altura: 915, dpr: 2.6 },
  { nome: 'Galaxy S24 Ultra',      largura: 412, altura: 915, dpr: 3.5 },
  { nome: 'iPhone 15 Pro Max',     largura: 430, altura: 932, dpr: 3 },
  { nome: 'iPad mini',             largura: 768, altura: 1024, dpr: 2 },
  { nome: 'iPad Pro 11',           largura: 834, altura: 1194, dpr: 2 },
  /*
   * De 1024 a 1400 é onde o menu de desktop aparece pela primeira vez, ainda
   * sem folga: o logo, as redes, cinco itens e o botão da Área do Aluno
   * disputam a mesma barra. Faltava essa faixa aqui — foi nela que "A G5"
   * quebrou em duas linhas sem a auditoria acusar.
   */
  { nome: 'Notebook pequeno',      largura: 1024, altura: 768, dpr: 2 },
  { nome: 'Notebook 13"',          largura: 1280, altura: 800, dpr: 2 },
  { nome: 'Notebook 15"',          largura: 1440, altura: 900, dpr: 1 },
  { nome: 'Monitor',               largura: 1920, altura: 1080, dpr: 1 },
]

const PAGINAS = [
  { nome: 'home', caminho: '/' },
  { nome: 'blog', caminho: '/blog' },
  { nome: 'post', caminho: '/blog/como-funcionam-os-treinos' },
  { nome: 'corridas', caminho: '/corridas' },
  { nome: 'horarios', caminho: '/horarios' },
  { nome: 'galeria', caminho: '/galeria' },
]

/**
 * Roda dentro da página. Devolve os defeitos geométricos encontrados.
 * A detecção de sobreposição compara só folhas de texto visíveis: elementos
 * que contêm texto direto, sem filhos-elemento, e que não são irmãos
 * intencionalmente empilhados (posicionados/absolutos ficam de fora).
 */
function medir() {
  const larguraTela = document.documentElement.clientWidth
  const problemas = []

  const estouro = document.documentElement.scrollWidth - larguraTela
  if (estouro > 1) problemas.push({ tipo: 'estouro-horizontal', detalhe: `${estouro}px além da tela` })

  const descrever = (el) => {
    const tag = el.tagName.toLowerCase()
    const cls = (el.className && typeof el.className === 'string' ? el.className : '').split(/\s+/).slice(0, 3).join('.')
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 45)
    return `${tag}${cls ? '.' + cls : ''}${txt ? ` "${txt}"` : ''}`
  }

  /*
   * Item de menu quebrado em duas linhas. Não é estouro nem sobreposição — a
   * barra continua íntegra, só fica feia. `getClientRects()` devolve uma caixa
   * POR LINHA, então mais de uma caixa significa que o rótulo quebrou.
   */
  for (const link of document.querySelectorAll('header nav a, footer nav a')) {
    const caixas = [...link.getClientRects()].filter((r) => r.width > 0 && r.height > 0)
    if (caixas.length > 1) {
      problemas.push({
        tipo: 'item-de-menu-quebrado',
        detalhe: `"${(link.textContent || '').trim().slice(0, 30)}" ocupa ${caixas.length} linhas`,
        alvo: descrever(link),
      })
    }
  }

  const folhasDeTexto = []
  for (const el of document.querySelectorAll('body *')) {
    const estilo = getComputedStyle(el)
    if (estilo.display === 'none' || estilo.visibility === 'hidden' || estilo.opacity === '0') continue
    if (estilo.position === 'fixed' || estilo.position === 'absolute') continue

    const caixa = el.getBoundingClientRect()
    if (caixa.width === 0 || caixa.height === 0) continue

    // Elemento mais largo que a tela (a causa mais comum de rolagem lateral).
    if (caixa.width > larguraTela + 1 && estilo.overflowX !== 'auto' && estilo.overflowX !== 'scroll') {
      problemas.push({
        tipo: 'elemento-vazando',
        detalhe: `${Math.round(caixa.width)}px de largura numa tela de ${larguraTela}px`,
        alvo: descrever(el),
      })
    }

    const temTextoProprio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    const temFilhoElemento = el.children.length > 0
    if (temTextoProprio && !temFilhoElemento) {
      /*
       * getClientRects() e não getBoundingClientRect(): um elemento inline que
       * quebra em duas linhas tem uma caixa POR LINHA, mas uma única caixa-união
       * que cobre a largura toda. Comparando pela união, dois <strong> vizinhos
       * numa frase quebrada aparecem como sobrepostos sem estarem — foi
       * exatamente o falso positivo que este detector deu na primeira rodada.
       */
      folhasDeTexto.push({ el, linhas: [...el.getClientRects()] })
    }
  }

  // Sobreposição: compara linha a linha, ignorando ancestral/descendente.
  for (let i = 0; i < folhasDeTexto.length; i++) {
    for (let j = i + 1; j < folhasDeTexto.length; j++) {
      const a = folhasDeTexto[i]
      const b = folhasDeTexto[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue

      let pior = null
      for (const ra of a.linhas) {
        for (const rb of b.linhas) {
          const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
          const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
          // Tolerância de 2px absorve arredondamento de subpixel.
          if (x > 2 && y > 2 && (!pior || x * y > pior.x * pior.y)) pior = { x, y }
        }
      }

      if (pior) {
        problemas.push({
          tipo: 'texto-sobreposto',
          detalhe: `${Math.round(pior.x)}x${Math.round(pior.y)}px de sobreposição`,
          alvo: `${descrever(a.el)}  <->  ${descrever(b.el)}`,
        })
      }
    }
  }

  return problemas
}

const navegador = await chromium.launch()
const achados = []

for (const ap of APARELHOS) {
  const contexto = await navegador.newContext({
    viewport: { width: ap.largura, height: ap.altura },
    deviceScaleFactor: ap.dpr,
    isMobile: ap.largura < 768,
    hasTouch: ap.largura < 1024,
  })

  for (const pg of PAGINAS) {
    const pagina = await contexto.newPage()
    try {
      /*
       * `domcontentloaded` e não `networkidle`: com o iframe do YouTube na
       * home, a rede nunca fica ociosa — o player mantém conexões abertas e a
       * navegação estourava o tempo limite, virando falso "falha ao carregar".
       * A espera fixa depois cobre fontes e imagens, que é o que a medida
       * geométrica precisa.
       */
      await pagina.goto(`${base}${pg.caminho}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await pagina.evaluate(() => document.fonts.ready)
      await pagina.waitForTimeout(1200)

      const problemas = await pagina.evaluate(medir)
      if (problemas.length) {
        achados.push({ aparelho: ap.nome, largura: ap.largura, pagina: pg.nome, problemas })
        const arquivo = `${ap.largura}-${ap.nome.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${pg.nome}.png`
        await pagina.screenshot({ path: path.join(saida, arquivo), fullPage: true })
      }
    } catch (erro) {
      achados.push({
        aparelho: ap.nome,
        largura: ap.largura,
        pagina: pg.nome,
        problemas: [{ tipo: 'falha-ao-carregar', detalhe: erro.message.split('\n')[0] }],
      })
    }
    await pagina.close()
  }
  await contexto.close()
}

await navegador.close()

// ── Relatório ───────────────────────────────────────────────────────────────
const total = achados.reduce((s, a) => s + a.problemas.length, 0)
console.log(`\n${APARELHOS.length} aparelhos x ${PAGINAS.length} páginas = ${APARELHOS.length * PAGINAS.length} combinações\n`)

if (total === 0) {
  console.log('Nenhum estouro horizontal, elemento vazando ou texto sobreposto.')
} else {
  // Agrupa por tipo+alvo: o mesmo defeito costuma aparecer em vários aparelhos.
  const porDefeito = new Map()
  for (const a of achados) {
    for (const p of a.problemas) {
      const chave = `${p.tipo}|${p.alvo ?? ''}`
      if (!porDefeito.has(chave)) porDefeito.set(chave, { ...p, ocorrencias: [] })
      porDefeito.get(chave).ocorrencias.push(`${a.aparelho}(${a.largura})/${a.pagina}`)
    }
  }

  console.log(`${total} ocorrências de ${porDefeito.size} defeitos distintos:\n`)
  for (const d of [...porDefeito.values()].sort((a, b) => b.ocorrencias.length - a.ocorrencias.length)) {
    console.log(`  [${d.tipo}] ${d.detalhe}`)
    if (d.alvo) console.log(`     ${d.alvo}`)
    console.log(`     em ${d.ocorrencias.length}x: ${[...new Set(d.ocorrencias)].slice(0, 6).join(', ')}`)
    console.log()
  }
}

await fs.mkdir(saida, { recursive: true })
await fs.writeFile(path.join(saida, 'relatorio.json'), JSON.stringify(achados, null, 2), 'utf8')
console.log(`prints e relatorio.json em ${saida}`)
process.exit(total > 0 ? 1 : 0)
