/**
 * Confere se cada URL antiga do WordPress responde 301 e chega em uma página
 * que existe. É a rede de segurança do SEO antes e depois do corte de DNS.
 *
 *   npm run check:redirects                    # testa uma amostra
 *   TODOS=1 npm run check:redirects            # testa as ~1.600
 *   ALVO=https://g5.prattsolutions.com.br npm run check:redirects
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ALVO = (process.env.ALVO ?? process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const TODOS = process.env.TODOS === '1'
const AMOSTRA = Number(process.env.AMOSTRA ?? 120)
const CONCORRENCIA = 8

type Redirect = { origem: string; destino: string }

async function comLimite<T>(itens: T[], limite: number, fn: (item: T) => Promise<void>) {
  let proximo = 0
  await Promise.all(
    Array.from({ length: Math.min(limite, itens.length) }, async () => {
      while (proximo < itens.length) await fn(itens[proximo++])
    }),
  )
}

const lista = JSON.parse(
  await fs.readFile(path.join(RAIZ, 'redirects.json'), 'utf8'),
) as Redirect[]

/** Amostra determinística e espalhada, para não testar só os mais recentes. */
const alvos = TODOS
  ? lista
  : lista.filter((_, i) => i % Math.max(1, Math.ceil(lista.length / AMOSTRA)) === 0)

console.log(`» Verificando ${alvos.length} de ${lista.length} redirects em ${ALVO}\n`)

const falhas: string[] = []
let ok = 0
let saltosExtras = 0

await comLimite(alvos, CONCORRENCIA, async ({ origem, destino }) => {
  // A URL antiga sempre terminava com barra.
  const url = `${ALVO}${origem}/`

  try {
    const primeira = await fetch(url, { redirect: 'manual' })

    if (primeira.status !== 301) {
      falhas.push(`${origem}  →  esperado 301, veio ${primeira.status}`)
      return
    }

    const local = primeira.headers.get('location')
    if (!local) {
      falhas.push(`${origem}  →  301 sem cabeçalho Location`)
      return
    }

    const destinoReal = new URL(local, ALVO)
    if (`${destinoReal.pathname}${destinoReal.search}` !== destino) {
      falhas.push(`${origem}  →  foi para ${destinoReal.pathname}${destinoReal.search}, esperado ${destino}`)
      return
    }

    // O destino precisa existir de verdade — 301 para 404 é pior que 404 direto.
    const final = await fetch(destinoReal.toString(), { redirect: 'follow' })
    if (!final.ok) {
      falhas.push(`${origem}  →  destino ${destino} respondeu ${final.status}`)
      return
    }
    if (final.redirected) saltosExtras++

    ok++
  } catch (erro) {
    falhas.push(`${origem}  →  ${(erro as Error).message}`)
  }
})

console.log(`  ok       ${ok}`)
console.log(`  falhas   ${falhas.length}`)
if (saltosExtras) console.log(`  atenção  ${saltosExtras} destinos com salto extra (cadeia de redirect)`)

if (falhas.length) {
  console.log('\nFalhas:')
  for (const f of falhas.slice(0, 40)) console.log(`  · ${f}`)
  if (falhas.length > 40) console.log(`  · …e mais ${falhas.length - 40}`)
  process.exit(1)
}

console.log('\nTodos os redirects verificados chegam a uma página que existe.')
process.exit(0)
