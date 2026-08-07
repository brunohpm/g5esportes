/**
 * Abre uma amostra de páginas no navegador e reporta erros de console,
 * hidratação e HTML inválido. Serve de rede de segurança depois da migração.
 *
 *   node scripts/check-html.mjs [quantidade-de-posts]
 */
import { chromium } from '@playwright/test'

const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
const amostra = Number(process.argv[2] ?? 25)

const res = await fetch(`${base}/api/posts?limit=${amostra}&depth=0&sort=-publicadoEm`)
const { docs } = await res.json()

const caminhos = [
  '/',
  '/blog',
  '/corridas',
  '/galeria',
  '/quem-somos',
  '/professores',
  ...docs.map((d) => `/blog/${d.slug}`),
]

const navegador = await chromium.launch()
const contexto = await navegador.newContext({ viewport: { width: 1280, height: 900 } })
const problemas = []

for (const caminho of caminhos) {
  const pagina = await contexto.newPage()
  const erros = []
  pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text().replace(/\s+/g, ' ').slice(0, 160)))
  pagina.on('pageerror', (e) => erros.push(String(e).replace(/\s+/g, ' ').slice(0, 160)))

  try {
    const resposta = await pagina.goto(`${base}${caminho}`, { waitUntil: 'networkidle', timeout: 60_000 })
    await pagina.waitForTimeout(400)
    const status = resposta?.status() ?? 0
    if (status >= 400) erros.push(`HTTP ${status}`)
  } catch (erro) {
    erros.push(erro.message.split('\n')[0])
  }

  if (erros.length) problemas.push({ caminho, erros: [...new Set(erros)] })
  await pagina.close()
}

await navegador.close()

console.log(`\nVerificadas ${caminhos.length} páginas.`)
if (problemas.length === 0) {
  console.log('Nenhum erro de console ou hidratação.')
  process.exit(0)
}

console.log(`${problemas.length} com problema:\n`)
for (const p of problemas) {
  console.log(`  ${p.caminho}`)
  for (const e of p.erros.slice(0, 3)) console.log(`      ${e}`)
}
process.exit(1)
