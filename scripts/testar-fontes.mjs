/**
 * Verifica se uma fonte tem os glifos que o site precisa.
 *
 * Fontes "Demo"/trial costumam vir com conjunto reduzido — normalmente sem
 * acentuação. Num site em português isso não aparece no teste em inglês e
 * explode depois, com "SAUDE" no lugar de "SAÚDE" ou caixinhas vazias.
 *
 * O método: mede a largura de cada caractere na fonte alvo e na fonte de
 * fallback. Se as duas baterem exatamente, o glifo não existe na fonte alvo e
 * o navegador caiu no fallback.
 *
 *   node scripts/testar-fontes.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'

const PASTA = path.resolve('src/fontes')
const arquivos = (await fs.readdir(PASTA)).filter((f) => /\.(otf|ttf|woff2?)$/i.test(f))

/** Tudo que o site realmente escreve. */
const NECESSARIO = {
  'maiúsculas': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'minúsculas': 'abcdefghijklmnopqrstuvwxyz',
  'números': '0123456789',
  'acentos maiúsculos': 'ÁÀÃÂÉÊÍÓÔÕÚÜÇ',
  'acentos minúsculos': 'áàãâéêíóôõúüç',
  'pontuação': '.,;:!?()[]{}–—…"\'/@&%#*+=',
  'moeda e símbolos': 'R$º ª °',
}

const navegador = await chromium.launch()
const contexto = await navegador.newContext()
const pagina = await contexto.newPage()
await pagina.goto('about:blank')

console.log(`\nTestando ${arquivos.length} fontes em ${PASTA}\n`)

const problemas = []

for (const arquivo of arquivos) {
  const dados = await fs.readFile(path.join(PASTA, arquivo))
  const nome = arquivo.replace(/\.[^.]+$/, '')

  const faltando = await pagina.evaluate(
    async ({ nome, base64, grupos }) => {
      const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      const fonte = new FontFace(nome, bin.buffer)
      await fonte.load()
      document.fonts.add(fonte)

      const medir = (ch, familia) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        ctx.font = `100px ${familia}`
        return ctx.measureText(ch).width
      }

      const resultado = {}
      for (const [grupo, caracteres] of Object.entries(grupos)) {
        const ausentes = []
        for (const ch of caracteres) {
          if (ch === ' ') continue
          // Se a largura na fonte alvo é idêntica à do fallback, o glifo não
          // existe e o navegador desenhou com a fonte de sistema.
          const alvo = medir(ch, `"${nome}", monospace`)
          const fallback = medir(ch, 'monospace')
          if (Math.abs(alvo - fallback) < 0.01) ausentes.push(ch)
        }
        if (ausentes.length) resultado[grupo] = ausentes.join('')
      }
      return resultado
    },
    { nome, base64: dados.toString('base64'), grupos: NECESSARIO },
  )

  const grupos = Object.keys(faltando)
  if (grupos.length === 0) {
    console.log(`  ok   ${nome.padEnd(28)} completa`)
  } else {
    console.log(`   X   ${nome.padEnd(28)} FALTAM glifos:`)
    for (const g of grupos) console.log(`         ${g}: ${faltando[g]}`)
    problemas.push({ nome, faltando })
  }
}

await navegador.close()

if (problemas.length) {
  console.log(`\n${problemas.length} de ${arquivos.length} fontes têm glifos faltando.`)
  console.log('Fonte sem acento não serve para texto em português.')
}
process.exit(problemas.length ? 1 : 0)
