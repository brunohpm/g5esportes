/**
 * Print do painel logado, para conferir as traduções e a organização dos menus.
 *
 *   ADMIN_EMAIL=... ADMIN_SENHA=... node scripts/shot-admin.mjs [pasta]
 */
import { chromium } from '@playwright/test'
import path from 'path'

const saida = process.argv[2] ?? path.resolve('.screenshots')
const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
const email = process.env.ADMIN_EMAIL
const senha = process.env.ADMIN_SENHA

if (!email || !senha) {
  console.error('Defina ADMIN_EMAIL e ADMIN_SENHA.')
  process.exit(1)
}

const navegador = await chromium.launch()
const pagina = await (await navegador.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()

await pagina.goto(`${base}/admin/login`, { waitUntil: 'networkidle', timeout: 60_000 })
await pagina.fill('#field-email', email)
await pagina.fill('#field-password', senha)
await pagina.click('button[type="submit"], form button:has-text("Entrar"), form button:has-text("Login")')
await pagina.waitForURL(/\/admin(?!\/login)/, { timeout: 60_000 })
await pagina.waitForTimeout(1500)
await pagina.screenshot({ path: path.join(saida, 'admin-inicio.png') })

// Pega um post existente pela API. Abrir a tela de "criar novo" não serve:
// com autosave ligado, o Payload grava um rascunho vazio só de abrir.
const { docs } = await fetch(`${base}/api/posts?limit=1&depth=0&select[id]=true`).then((r) => r.json())
const idDeExemplo = docs?.[0]?.id

for (const [nome, rota] of [
  ['admin-posts', '/admin/collections/posts'],
  ['admin-post-editor', idDeExemplo ? `/admin/collections/posts/${idDeExemplo}` : null],
  ['admin-provas', '/admin/collections/provas'],
  ['admin-configuracoes', '/admin/globals/configuracoes'],
]) {
  if (!rota) continue
  await pagina.goto(`${base}${rota}`, { waitUntil: 'networkidle', timeout: 60_000 })
  await pagina.waitForTimeout(1200)
  await pagina.screenshot({ path: path.join(saida, `${nome}.png`) })
  console.log(`  ok  ${nome}`)
}

await navegador.close()
console.log(`\nprints em ${saida}`)
