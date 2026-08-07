/**
 * Tira prints das principais páginas para conferência visual.
 *
 *   node scripts/screenshots.mjs [pasta-de-saida]
 *
 * Requer o dev server no ar e `npx playwright install chromium`.
 */
import { chromium } from '@playwright/test'
import path from 'path'

const saida = process.argv[2] ?? path.resolve('.screenshots')
const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

const PAGINAS = [
  { nome: 'home', caminho: '/', inteira: true },
  { nome: 'corridas', caminho: '/corridas' },
  { nome: 'blog', caminho: '/blog' },
  { nome: 'post', caminho: '/blog/como-funcionam-os-treinos' },
  { nome: 'pagina-cms', caminho: '/quem-somos' },
  { nome: 'mobile-home', caminho: '/', mobile: true, inteira: true },
]

const navegador = await chromium.launch()
let falhas = 0

for (const p of PAGINAS) {
  const contexto = await navegador.newContext(
    p.mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }
      : { viewport: { width: 1440, height: 1000 } },
  )
  const pagina = await contexto.newPage()

  const problemas = []
  pagina.on('console', (m) => m.type() === 'error' && problemas.push(m.text()))
  pagina.on('pageerror', (e) => problemas.push(String(e)))

  try {
    await pagina.goto(`${base}${p.caminho}`, { waitUntil: 'networkidle', timeout: 90_000 })
    await pagina.waitForTimeout(1000)
    await pagina.screenshot({ path: path.join(saida, `${p.nome}.png`), fullPage: Boolean(p.inteira) })
    console.log(`  ${problemas.length ? '!' : 'ok'}  ${p.nome}${problemas.length ? `  ${problemas.slice(0, 3).join(' | ')}` : ''}`)
    if (problemas.length) falhas++
  } catch (erro) {
    console.log(`  x   ${p.nome}: ${erro.message.split('\n')[0]}`)
    falhas++
  }

  await contexto.close()
}

await navegador.close()
console.log(`\nprints em ${saida}`)
process.exit(falhas > 0 ? 1 : 0)
