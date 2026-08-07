/**
 * Abre o menu no celular e mede se ele realmente cobre a tela.
 * Serve de regressão para o caso do `backdrop-filter` no cabeçalho, que fazia
 * o painel `fixed` se posicionar dentro da faixa do header em vez da viewport.
 *
 *   node scripts/shot-menu-mobile.mjs [pasta]
 */
import { chromium, devices } from '@playwright/test'
import path from 'path'

const saida = process.argv[2] ?? path.resolve('.screenshots')
const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

const navegador = await chromium.launch()
let falhas = 0

for (const nome of ['iPhone 13', 'Pixel 7']) {
  const contexto = await navegador.newContext({ ...devices[nome] })
  const pagina = await contexto.newPage()
  await pagina.goto(base, { waitUntil: 'networkidle', timeout: 60_000 })

  await pagina.getByRole('button', { name: 'Abrir menu' }).click()
  await pagina.waitForTimeout(400)

  const painel = pagina.locator('#menu-mobile')
  const caixa = await painel.boundingBox()
  const viewport = pagina.viewportSize()
  const cobertura = caixa ? Math.round((caixa.height / viewport.height) * 100) : 0

  // O painel tem que ocupar a tela inteira. Antes da correção ficava com a
  // altura do cabeçalho (~72px de 844 = 8%).
  const ok = cobertura >= 99
  if (!ok) falhas++

  // O CTA principal não pode exigir rolagem.
  const cta = painel.getByRole('link', { name: /Área do Aluno/i })
  const caixaCta = await cta.boundingBox()
  const ctaVisivel = Boolean(caixaCta && caixaCta.y + caixaCta.height <= viewport.height + 1)
  if (!ctaVisivel) falhas++

  // A lista pode rolar; o CTA não. Mede o excedente só da <nav>.
  const excedente = await pagina
    .locator('#menu-mobile nav')
    .evaluate((el) => el.scrollHeight - el.clientHeight)

  console.log(
    `  ${ok && ctaVisivel ? 'ok' : ' X'}  ${nome.padEnd(10)} painel ${caixa?.width ?? 0}x${caixa?.height ?? 0} ` +
      `(${cobertura}% da tela) · lista ${excedente > 0 ? `rola ${excedente}px` : 'cabe inteira'} · ` +
      `Área do Aluno ${ctaVisivel ? 'ancorada e visível' : 'ABAIXO DA DOBRA'}`,
  )

  await pagina.screenshot({ path: path.join(saida, `menu-${nome.replace(/\s+/g, '-').toLowerCase()}.png`) })
  await contexto.close()
}

await navegador.close()
process.exit(falhas > 0 ? 1 : 0)
