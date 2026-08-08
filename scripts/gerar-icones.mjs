/**
 * Gera os ícones do site a partir do logo oficial.
 *
 *   node scripts/gerar-icones.mjs "C:/caminho/Logo_G5 2026 PNG.png"
 *
 * O logo é branco com fundo transparente. Usado assim, ele SOME numa aba de
 * navegador clara. Por isso cada ícone leva o verde escuro da marca por trás —
 * é o que garante contraste no tema claro e no escuro.
 */
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

const origem = process.argv[2]
if (!origem) {
  console.error('uso: node scripts/gerar-icones.mjs <arquivo-do-logo>')
  process.exit(1)
}

const VERDE = { r: 10, g: 61, b: 28, alpha: 1 } // --g5-950, o mesmo do cabeçalho
const APP = path.resolve('src/app')

/** Proporção da largura do ícone que o logo ocupa. O resto é respiro. */
const OCUPACAO = 0.74

/**
 * Só a marca "G5", sem a palavra "ESPORTES".
 *
 * O favicon aparece a 16 ou 32px. Nesse tamanho a palavra vira um borrão
 * cinza que só suja o desenho — o "G5" sozinho continua reconhecível.
 * Corta os 78% de cima e apara o transparente que sobra em volta.
 */
async function apenasMarca() {
  const { width, height } = await sharp(origem).metadata()
  return sharp(origem)
    .extract({ left: 0, top: 0, width, height: Math.round(height * 0.78) })
    .trim()
    .toBuffer()
}

async function gerar(lado, destino, ocupacao = OCUPACAO, recorte = null) {
  const largura = Math.round(lado * ocupacao)
  const base = recorte ?? origem
  const logo = await sharp(base)
    .resize({ width: largura, fit: 'inside', withoutEnlargement: false })
    .toBuffer()
  const { height } = await sharp(logo).metadata()

  await sharp({
    create: { width: lado, height: lado, channels: 4, background: VERDE },
  })
    .composite([{ input: logo, top: Math.round((lado - height) / 2), left: Math.round((lado - largura) / 2) }])
    .png()
    .toFile(destino)

  const { size } = await fs.stat(destino)
  console.log(`  ${path.basename(destino).padEnd(20)} ${lado}x${lado}  ${(size / 1024).toFixed(1)} KB`)
}

await fs.mkdir(APP, { recursive: true })

const marca = await apenasMarca()

// Ícone do navegador: só o "G5", porque ele vive a 16–32px.
await gerar(512, path.join(APP, 'icon.png'), 0.7, marca)

/*
 * Tela de início do iOS: aqui o ícone é grande (mostrado a 60px ou mais), então
 * cabe a assinatura inteira. Mais respiro nas bordas porque o sistema arredonda
 * os cantos e comeria o desenho colado na margem.
 */
await gerar(180, path.join(APP, 'apple-icon.png'), 0.68)

console.log('\nícones gerados em src/app/')
