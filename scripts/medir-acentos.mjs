/**
 * Mede colisão de acentos entre linhas em títulos de caixa alta.
 *
 * O detector geométrico da auditoria não pega isto: a colisão acontece DENTRO
 * de um mesmo elemento de texto, entre glifos de linhas diferentes. Em
 * português é o caso mais comum de "texto batendo em texto", porque Ã Õ Ô Ç É
 * sobem (ou descem) além da caixa de maiúscula que a entrelinha assume.
 *
 *   node scripts/medir-acentos.mjs [largura...]
 */
import { chromium } from '@playwright/test'

const base = (process.env.ALVO ?? 'http://localhost:3000').replace(/\/$/, '')
const larguras = process.argv.slice(2).map(Number).filter(Boolean)
const LARGURAS = larguras.length ? larguras : [344, 360, 375, 393, 430, 768, 1440]

/**
 * Para cada linha renderizada de um título, compara a altura real dos glifos
 * (Range.getClientRects por linha) com o avanço de linha. Se a caixa da linha
 * de baixo invade a de cima, os acentos colidem.
 */
function medirTitulos() {
  const resultado = []

  for (const el of document.querySelectorAll('h1, h2, h3')) {
    const estilo = getComputedStyle(el)
    if (estilo.textTransform !== 'uppercase' && !/^[^a-z]*$/.test(el.textContent.trim())) continue

    const no = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim())
    if (!no) continue

    const faixa = document.createRange()
    faixa.selectNodeContents(no)
    const linhas = [...faixa.getClientRects()].filter((r) => r.width > 0 && r.height > 0)
    if (linhas.length < 2) continue

    const alturaLinha = parseFloat(estilo.lineHeight)
    const tamanhoFonte = parseFloat(estilo.fontSize)

    // Sobreposição entre a caixa de uma linha e a da linha seguinte.
    let pior = 0
    for (let i = 0; i < linhas.length - 1; i++) {
      const invasao = linhas[i].bottom - linhas[i + 1].top
      if (invasao > pior) pior = invasao
    }

    const texto = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 50)
    const temAcenteAlto = /[ÃÕÂÊÔÁÉÍÓÚÀÜ]/.test(el.textContent)
    const temDescendente = /[ÇÃ]/.test(el.textContent)

    resultado.push({
      texto,
      linhas: linhas.length,
      fonte: Math.round(tamanhoFonte),
      entrelinha: Math.round(alturaLinha),
      razao: +(alturaLinha / tamanhoFonte).toFixed(2),
      invasao: Math.round(pior),
      acentos: temAcenteAlto || temDescendente,
    })
  }

  return resultado
}

const navegador = await chromium.launch()

for (const largura of LARGURAS) {
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: 900 },
    deviceScaleFactor: 2,
  })
  const pagina = await contexto.newPage()
  await pagina.goto(base, { waitUntil: 'networkidle', timeout: 60_000 })
  await pagina.waitForTimeout(400)

  const titulos = await pagina.evaluate(medirTitulos)
  const arriscados = titulos.filter((t) => t.acentos && t.razao < 1.0)

  console.log(`\n─ ${largura}px`)
  if (!titulos.length) {
    console.log('  (nenhum título de múltiplas linhas)')
  }
  for (const t of titulos) {
    const alerta = t.acentos && t.razao < 1.0 ? ' <<< acento em entrelinha < 1.0' : ''
    console.log(
      `  razão ${t.razao}  (${t.fonte}px/${t.entrelinha}px)  ${t.linhas} linhas` +
        `${t.acentos ? '  COM acento' : '  sem acento'}${alerta}`,
    )
    console.log(`     "${t.texto}"`)
  }
  if (arriscados.length) console.log(`  → ${arriscados.length} título(s) em risco`)

  await contexto.close()
}

await navegador.close()
