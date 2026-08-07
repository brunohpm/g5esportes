/**
 * Migração do WordPress.com para o Payload.
 *
 *   npm run migrate:wp                    # migra tudo
 *   DRY_RUN=1 npm run migrate:wp          # só relata, não grava
 *   SEM_IMAGENS=1 npm run migrate:wp      # pula o download das imagens
 *
 * As opções vêm de variáveis de ambiente porque o `payload run` não repassa
 * argumentos de linha de comando para o script.
 *
 * É idempotente: reconhece o que já foi importado pelo campo `legado.wpId`
 * (posts/páginas) e `origemWordpress` (imagens), então pode rodar de novo.
 */
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '@payload-config'
import { JSDOM } from 'jsdom'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import {
  buscarTudo,
  caminhoAntigo,
  idDoYoutube,
  normalizarUrlImagem,
  urlDownload,
  type WpPagina,
  type WpPost,
  type WpTermo,
} from './wp'
import { textoSimples } from '../src/lib/utils'
import { slugify } from '../src/lib/slug'
import type { Post } from '../src/payload-types'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ligado = (v?: string) => v === '1' || v === 'true'
const SIMULAR = ligado(process.env.DRY_RUN)
const PULAR_IMAGENS = ligado(process.env.SEM_IMAGENS)

/** Tags do WordPress com menos posts que isto viram ruído e não são importadas. */
const MINIMO_POSTS_POR_TAG = 3
const CONCORRENCIA_IMAGENS = 6

// ---------------------------------------------------------------------------
// Consolidação das 16 categorias antigas em 6
// ---------------------------------------------------------------------------

const CATEGORIAS = [
  {
    slug: 'noticias',
    titulo: 'Notícias',
    descricao: 'O que acontece na G5 e no mundo da corrida de rua.',
    cor: 'green',
    ordem: 10,
    origens: ['noticias', 'arbitragem', 'adidas', 'parceiros', 'outros'],
  },
  {
    slug: 'corrida-de-rua',
    titulo: 'Corrida de Rua',
    descricao: 'Provas, resultados e a vida de quem corre nas ruas de Curitiba e do Paraná.',
    cor: 'lime',
    ordem: 20,
    origens: ['corrida', 'maratona', 'infantil'],
  },
  {
    slug: 'treinos',
    titulo: 'Treinos e Metodologia',
    descricao: 'Como a G5 treina, por que treina assim e o que esperar de cada ciclo.',
    cor: 'forest',
    ordem: 30,
    origens: ['treino-mix', 'testes'],
  },
  {
    slug: 'provas',
    titulo: 'Provas e Calendário',
    descricao: 'Calendários, inscrições e informações das provas que a G5 acompanha.',
    cor: 'green',
    ordem: 40,
    origens: ['campeonatos', 'organizacao', 'smelj', 'curitiba-run', 'lua-cheia'],
  },
  {
    slug: 'saude',
    titulo: 'Saúde e Bem-estar',
    descricao: 'Corpo, cabeça e qualidade de vida além do cronômetro.',
    cor: 'slate',
    ordem: 50,
    origens: [],
  },
  {
    slug: 'assessoria',
    titulo: 'Assessoria G5',
    descricao: 'Avisos, valores, horários e a rotina de quem treina com a gente.',
    cor: 'green',
    ordem: 60,
    origens: ['assessoria', 'online'],
  },
] as const

/** Categoria usada quando a antiga não está mapeada. */
const CATEGORIA_PADRAO = 'assessoria'

// ---------------------------------------------------------------------------
// Páginas: novo endereço de cada uma
// ---------------------------------------------------------------------------

/** Páginas que não viram página nova — só redirecionam para a estrutura nova. */
const PAGINAS_QUE_VIRAM_REDIRECT: Record<string, string> = {
  noticias: '/blog',
  'artigos-e-materias': '/blog',
  'calendario-anual': '/corridas',
  'corridas-2026': '/corridas?ano=2026',
  'corridas-2025': '/corridas?ano=2025',
}

/** Slug antigo -> slug novo, seguindo a arquitetura de menus nova. */
const RENOMEAR_PAGINA: Record<string, string> = {
  'professores-g5': 'professores',
  contatos: 'contato',
  'como-funcionam-os-treinos': 'metodologia',
  'produtos-g5': 'produtos',
  'assessoria-esportiva': 'treinos',
}

/**
 * Títulos que no WordPress vinham com pontuação de ordenação de menu
 * ("-Horários", "#Corrida"). Aqui eles ganham o nome que aparece no menu novo.
 */
const RENOMEAR_TITULO: Record<string, string> = {
  horarios: 'Horários e locais',
  'assessoria-esportiva': 'Treinos',
}

/**
 * Rede de segurança para o mesmo problema em páginas fora do mapa acima: tira
 * do começo do título os caracteres usados só para ordenar menu.
 *
 * A cerquilha NÃO entra: em vários títulos ela é hashtag de verdade
 * ("#VemPraRua", "#DomingoInsanoG5") e apagá-la mudaria o sentido.
 */
function limparTitulo(titulo: string): string {
  return titulo.replace(/^[\s\-–—*.·]+/, '').trim() || titulo
}

/** Calendários de anos anteriores: preservados, mas fora dos menus. */
const PAGINAS_ARQUIVADAS = new Set([
  'corridas-2016',
  'corridas-2015',
  'calendario-2014',
  'calendario-2013',
  'corridas-2012',
])

// ---------------------------------------------------------------------------

type Relatorio = {
  imagensImportadas: number
  imagensReaproveitadas: number
  imagensComFalha: { url: string; motivo: string }[]
  postsCriados: number
  postsAtualizados: number
  postsComFalha: { slug: string; motivo: string }[]
  paginasCriadas: number
  paginasAtualizadas: number
  paginasComFalha: { slug: string; motivo: string }[]
  tagsImportadas: number
  tagsDescartadas: number
  redirects: number
  videosConvertidos: number
}

const relatorio: Relatorio = {
  imagensImportadas: 0,
  imagensReaproveitadas: 0,
  imagensComFalha: [],
  postsCriados: 0,
  postsAtualizados: 0,
  postsComFalha: [],
  paginasCriadas: 0,
  paginasAtualizadas: 0,
  paginasComFalha: [],
  tagsImportadas: 0,
  tagsDescartadas: 0,
  redirects: 0,
  videosConvertidos: 0,
}

const idLexical = () => crypto.randomBytes(12).toString('hex')

/**
 * Slugs antigos do WordPress vêm percent-encoded quando tinham acento ou
 * símbolo (`3%c2%aa-etapa`). Decodifica antes de normalizar — senão o slug
 * novo fica com o lixo do encoding no meio (`3-c2-aa-etapa`).
 */
function slugSeguro(slugWp: string): string {
  let decodificado = slugWp
  try {
    decodificado = decodeURIComponent(slugWp)
  } catch {
    // Encoding malformado: segue com o original.
  }
  return slugify(decodificado) || slugify(slugWp)
}

function log(msg: string) {
  console.log(msg)
}

async function comLimite<T, R>(
  itens: T[],
  limite: number,
  fn: (item: T, indice: number) => Promise<R>,
): Promise<R[]> {
  const saida = new Array<R>(itens.length)
  let proximo = 0
  await Promise.all(
    Array.from({ length: Math.min(limite, itens.length) }, async () => {
      while (proximo < itens.length) {
        const i = proximo++
        saida[i] = await fn(itens[i], i)
      }
    }),
  )
  return saida
}

// ---------------------------------------------------------------------------

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.default({ config: payload.config })

/** Substitui iframes do YouTube por um marcador de texto que vira bloco depois. */
function prepararHtml(html: string): string {
  return (
    html
      .replace(/<iframe[^>]*\bsrc="([^"]+)"[^>]*>[\s\S]*?<\/iframe>/gi, (_m, src: string) => {
        const id = idDoYoutube(src)
        return id ? `<p>[[YT:${id}]]</p>` : ''
      })
      // Blocos vazios do Gutenberg só engordam o resultado.
      .replace(/<div class="sharedaddy[\s\S]*?<\/div>/gi, '')
      /*
       * O WordPress envolvia cada imagem num link para o arquivo original no
       * CDN dele. Esses links morrem quando o site sair do WordPress.com — e
       * ainda geram <figure> dentro de <p>, que é HTML inválido. Fora.
       */
      .replace(
        /<a\b[^>]*>\s*((?:<figure[^>]*>\s*)?<img\b[^>]*\/?>(?:\s*<\/figure>)?)\s*<\/a>/gi,
        '$1',
      )
  )
}

/** Primeira imagem do corpo do texto — vira capa quando o post não tem destaque. */
function primeiraImagem(html: string): string | null {
  for (const m of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) {
    const limpa = normalizarUrlImagem(m[1])
    if (limpa) return limpa
  }
  return null
}

/** Coleta todas as URLs de imagem de um HTML, com o alt quando existir. */
function coletarImagens(html: string, destino: Map<string, string>) {
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0]
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1]
    const alt = tag.match(/\balt="([^"]*)"/i)?.[1] ?? ''
    const limpa = normalizarUrlImagem(src ?? '')
    if (!limpa) continue
    // Um alt preenchido ganha de um vazio registrado antes.
    if (!destino.get(limpa) && alt) destino.set(limpa, alt)
    else if (!destino.has(limpa)) destino.set(limpa, alt)
  }
}

/** Baixa uma imagem para a coleção `midia`, reaproveitando o que já existe. */
async function importarImagem(urlLimpa: string, alt: string): Promise<number | null> {
  const existente = await payload.find({
    collection: 'midia',
    where: { origemWordpress: { equals: urlLimpa } },
    limit: 1,
    pagination: false,
    depth: 0,
  })
  if (existente.docs.length) {
    relatorio.imagensReaproveitadas++
    return existente.docs[0].id as number
  }

  if (SIMULAR) return null

  try {
    const res = await fetch(urlDownload(urlLimpa), {
      headers: { 'user-agent': 'g5esportes-migracao/1.0' },
    })
    if (!res.ok) {
      relatorio.imagensComFalha.push({ url: urlLimpa, motivo: `HTTP ${res.status}` })
      return null
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.byteLength === 0) {
      relatorio.imagensComFalha.push({ url: urlLimpa, motivo: 'arquivo vazio' })
      return null
    }

    const nome = decodeURIComponent(urlLimpa.split('/').pop() || `imagem-${Date.now()}.jpg`)
    const mimetype = (res.headers.get('content-type') ?? 'image/jpeg').split(';')[0]

    const doc = await payload.create({
      collection: 'midia',
      data: {
        alt: alt || nome.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '),
        origemWordpress: urlLimpa,
      },
      file: { data: buffer, mimetype, name: nome, size: buffer.byteLength },
    })

    relatorio.imagensImportadas++
    return doc.id as number
  } catch (erro) {
    relatorio.imagensComFalha.push({ url: urlLimpa, motivo: (erro as Error).message })
    return null
  }
}

type NoLexical = Record<string, any>

/** Troca nós `upload` pendentes por referências reais e marcadores de YT por blocos. */
function resolverNos(nos: NoLexical[], mapa: Map<string, number>): NoLexical[] {
  const saida: NoLexical[] = []

  for (const no of nos) {
    if (no?.type === 'upload') {
      const src = no.pending?.src ?? no.src
      const limpa = src ? normalizarUrlImagem(src) : null
      const id = limpa ? mapa.get(limpa) : undefined
      if (!id) continue // imagem que não veio: descarta o nó em vez de quebrar o documento
      saida.push({
        type: 'upload',
        version: 3,
        format: no.format ?? '',
        id: idLexical(),
        relationTo: 'midia',
        value: id,
        fields: {},
      })
      continue
    }

    if (Array.isArray(no?.children)) {
      no.children = resolverNos(no.children, mapa)
    }

    // Parágrafo cujo único conteúdo era o marcador de vídeo.
    if (no?.type === 'paragraph' && no.children?.length === 1 && no.children[0]?.type === 'text') {
      const yt = String(no.children[0].text ?? '').match(/^\s*\[\[YT:([A-Za-z0-9_-]+)\]\]\s*$/)
      if (yt) {
        relatorio.videosConvertidos++
        saida.push({
          type: 'block',
          version: 2,
          format: '',
          fields: {
            id: idLexical(),
            blockName: '',
            blockType: 'videoEmbed',
            url: `https://www.youtube.com/watch?v=${yt[1]}`,
          },
        })
        continue
      }
    }

    // Parágrafo que ficou vazio depois de perder a imagem.
    if (no?.type === 'paragraph' && Array.isArray(no.children) && no.children.length === 0) continue

    saida.push(no)
  }

  return saida
}

/** Extrai recursivamente todos os nós de upload de dentro de uma subárvore. */
function retirarUploads(nos: NoLexical[]): { uploads: NoLexical[]; limpos: NoLexical[] } {
  const uploads: NoLexical[] = []
  const limpos: NoLexical[] = []

  for (const no of nos) {
    if (no?.type === 'upload') {
      uploads.push(no)
      continue
    }

    if (Array.isArray(no?.children)) {
      const dentro = retirarUploads(no.children)
      uploads.push(...dentro.uploads)
      // Container inline (link, negrito) que só tinha a imagem: some junto.
      const sobrou = dentro.limpos
      const temConteudo = sobrou.some(
        (f) => String(f?.text ?? '').trim().length > 0 || Array.isArray(f?.children),
      )
      if (temConteudo) limpos.push({ ...no, children: sobrou })
      continue
    }

    limpos.push(no)
  }

  return { uploads, limpos }
}

/**
 * Nós de upload são nós de bloco, mas o conversor os deixa dentro de parágrafos
 * (e às vezes dentro de links). Sobem para a raiz para o HTML final ser válido —
 * `<figure>` dentro de `<p>` quebra a hidratação do React.
 */
function elevarUploads(nos: NoLexical[]): NoLexical[] {
  const saida: NoLexical[] = []

  for (const no of nos) {
    if (no?.type === 'upload') {
      saida.push(no)
      continue
    }

    if (!Array.isArray(no?.children)) {
      saida.push(no)
      continue
    }

    const { uploads, limpos } = retirarUploads(no.children)
    if (uploads.length === 0) {
      saida.push(no)
      continue
    }

    saida.push(...uploads)
    const temTexto = limpos.some(
      (f) => String(f?.text ?? '').trim().length > 0 || Array.isArray(f?.children),
    )
    if (temTexto) saida.push({ ...no, children: limpos })
  }

  return saida
}

function paragrafoVazio(): NoLexical {
  return {
    type: 'paragraph',
    version: 1,
    format: '',
    indent: 0,
    direction: null,
    children: [],
    textFormat: 0,
    textStyle: '',
  }
}

/**
 * O retorno é a árvore Lexical montada à mão a partir do HTML, então o cast
 * é o ponto onde ela passa a ser tratada como o campo `conteudo` do Payload.
 */
function converterConteudo(html: string, mapa: Map<string, number>): Post['conteudo'] {
  const preparado = prepararHtml(html)
  const arvore = convertHTMLToLexical({ editorConfig, html: preparado, JSDOM }) as {
    root: { children: NoLexical[] } & Record<string, unknown>
  }

  let filhos = resolverNos(arvore.root.children ?? [], mapa)
  filhos = elevarUploads(filhos)
  if (filhos.length === 0) filhos = [paragrafoVazio()]

  return { ...arvore, root: { ...arvore.root, children: filhos } } as Post['conteudo']
}

// ---------------------------------------------------------------------------

async function garantirAdmin(): Promise<number> {
  const existentes = await payload.find({ collection: 'usuarios', limit: 1, pagination: false, depth: 0 })
  if (existentes.docs.length) return existentes.docs[0].id as number

  const senha = crypto.randomBytes(9).toString('base64url')
  const doc = await payload.create({
    collection: 'usuarios',
    data: {
      nome: 'G5 Esportes',
      email: 'admin@g5esportes.com',
      password: senha,
      role: 'admin',
    },
  })

  log('')
  log('  ┌──────────────────────────────────────────────┐')
  log('  │  ADMIN CRIADO — anote agora                  │')
  log('  ├──────────────────────────────────────────────┤')
  log('  │  e-mail: admin@g5esportes.com                │')
  log(`  │  senha:  ${senha.padEnd(36)}│`)
  log('  └──────────────────────────────────────────────┘')
  log('')

  return doc.id as number
}

async function garantirCategorias(): Promise<Map<string, number>> {
  const porSlugNovo = new Map<string, number>()

  for (const cat of CATEGORIAS) {
    const existente = await payload.find({
      collection: 'categorias',
      where: { slug: { equals: cat.slug } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    const dados = {
      titulo: cat.titulo,
      slug: cat.slug,
      descricao: cat.descricao,
      cor: cat.cor,
      ordem: cat.ordem,
      slugsAntigos: [...cat.origens],
    }

    if (existente.docs.length) {
      const id = existente.docs[0].id as number
      if (!SIMULAR) await payload.update({ collection: 'categorias', id, data: dados })
      porSlugNovo.set(cat.slug, id)
    } else if (!SIMULAR) {
      const doc = await payload.create({ collection: 'categorias', data: dados })
      porSlugNovo.set(cat.slug, doc.id as number)
    }
  }

  return porSlugNovo
}

async function importarTags(tagsWp: WpTermo[]): Promise<Map<number, number>> {
  const relevantes = tagsWp.filter((t) => t.count >= MINIMO_POSTS_POR_TAG)
  relatorio.tagsDescartadas = tagsWp.length - relevantes.length

  const mapa = new Map<number, number>()
  if (SIMULAR) {
    relatorio.tagsImportadas = relevantes.length
    return mapa
  }

  for (const tag of relevantes) {
    const existente = await payload.find({
      collection: 'tags',
      where: { slug: { equals: tag.slug } },
      limit: 1,
      pagination: false,
      depth: 0,
    })
    if (existente.docs.length) {
      mapa.set(tag.id, existente.docs[0].id as number)
      continue
    }
    try {
      const doc = await payload.create({
        collection: 'tags',
        data: { titulo: textoSimples(tag.name, 80), slug: tag.slug },
      })
      mapa.set(tag.id, doc.id as number)
      relatorio.tagsImportadas++
    } catch {
      // slug duplicado depois da normalização: ignora a tag
    }
  }

  return mapa
}

// ---------------------------------------------------------------------------

async function main() {
  log(SIMULAR ? '» SIMULAÇÃO (nada será gravado)\n' : '» Migração do WordPress\n')

  log('1/6  Baixando conteúdo do WordPress…')
  const [posts, paginas, categoriasWp, tagsWp] = await Promise.all([
    buscarTudo<WpPost>('posts', [
      'id', 'date', 'slug', 'link', 'title', 'content', 'excerpt',
      'categories', 'tags', 'jetpack_featured_media_url',
    ]),
    buscarTudo<WpPagina>('pages', [
      'id', 'date', 'slug', 'link', 'parent', 'menu_order', 'title', 'content',
      'excerpt', 'jetpack_featured_media_url',
    ]),
    buscarTudo<WpTermo>('categories', ['id', 'name', 'slug', 'count', 'description']),
    buscarTudo<WpTermo>('tags', ['id', 'name', 'slug', 'count']),
  ])
  log(`     ${posts.length} posts · ${paginas.length} páginas · ${categoriasWp.length} categorias · ${tagsWp.length} tags`)

  const autorId = SIMULAR ? 0 : await garantirAdmin()

  log('\n2/6  Categorias e tags…')
  const categoriasNovas = await garantirCategorias()
  const tagsMapa = await importarTags(tagsWp)
  log(`     ${CATEGORIAS.length} categorias · ${relatorio.tagsImportadas} tags importadas (${relatorio.tagsDescartadas} descartadas por terem menos de ${MINIMO_POSTS_POR_TAG} posts)`)

  // wpCategoriaId -> id da categoria nova
  const deParaCategoria = new Map<number, number>()
  for (const cwp of categoriasWp) {
    const destino =
      CATEGORIAS.find((c) => (c.origens as readonly string[]).includes(cwp.slug))?.slug ??
      CATEGORIA_PADRAO
    const id = categoriasNovas.get(destino)
    if (id) deParaCategoria.set(cwp.id, id)
  }

  log('\n3/6  Levantando imagens…')
  const imagens = new Map<string, string>()
  for (const p of posts) {
    coletarImagens(p.content.rendered, imagens)
    const destaque = normalizarUrlImagem(p.jetpack_featured_media_url ?? '')
    if (destaque && !imagens.has(destaque)) imagens.set(destaque, textoSimples(p.title.rendered, 120))
  }
  for (const p of paginas) {
    coletarImagens(p.content.rendered, imagens)
    const destaque = normalizarUrlImagem(p.jetpack_featured_media_url ?? '')
    if (destaque && !imagens.has(destaque)) imagens.set(destaque, textoSimples(p.title.rendered, 120))
  }
  log(`     ${imagens.size} imagens únicas`)

  const mapaImagens = new Map<string, number>()
  if (PULAR_IMAGENS) {
    log('     (pulando o download — --sem-imagens)')
  } else {
    const lista = [...imagens.entries()]
    await comLimite(lista, CONCORRENCIA_IMAGENS, async ([url, alt], i) => {
      const id = await importarImagem(url, alt)
      if (id) mapaImagens.set(url, id)
      const feito = i + 1
      if (feito % 50 === 0 || feito === lista.length) {
        log(`     ${feito}/${lista.length} imagens (${relatorio.imagensImportadas} novas, ${relatorio.imagensReaproveitadas} já existiam, ${relatorio.imagensComFalha.length} falhas)`)
      }
    })
  }

  const redirects: { origem: string; destino: string }[] = []

  log('\n4/6  Importando posts…')
  const slugsDePost = new Set<string>()

  for (const [i, post] of posts.entries()) {
    const caminho = caminhoAntigo(post.link)

    let slug = slugSeguro(post.slug)
    // A normalização pode aproximar dois slugs distintos; o ID antigo desempata.
    if (slugsDePost.has(slug)) slug = `${slug}-${post.id}`
    slugsDePost.add(slug)

    const destino = `/blog/${slug}`
    redirects.push({ origem: caminho, destino })

    if (SIMULAR) continue

    try {
      const categorias = [
        ...new Set(post.categories.map((c) => deParaCategoria.get(c)).filter(Boolean)),
      ] as number[]
      if (categorias.length === 0) {
        const padrao = categoriasNovas.get(CATEGORIA_PADRAO)
        if (padrao) categorias.push(padrao)
      }

      // Sem imagem de destaque no WordPress, a primeira do texto vira capa —
      // senão 260 dos 322 posts apareceriam sem imagem na listagem do blog.
      const capaUrl =
        normalizarUrlImagem(post.jetpack_featured_media_url ?? '') ??
        primeiraImagem(post.content.rendered)
      const capa = capaUrl ? mapaImagens.get(capaUrl) : undefined

      const dados = {
        titulo: textoSimples(post.title.rendered, 250),
        slug,
        resumo: textoSimples(post.excerpt.rendered, 280),
        capa: capa ?? undefined,
        conteudo: converterConteudo(post.content.rendered, mapaImagens),
        categorias,
        tags: post.tags.map((t) => tagsMapa.get(t)).filter(Boolean) as number[],
        autor: autorId,
        publicadoEm: post.date,
        legado: { wpId: post.id, urlAntiga: caminho },
        _status: 'published' as const,
      }

      const existente = await payload.find({
        collection: 'posts',
        where: { 'legado.wpId': { equals: post.id } },
        limit: 1,
        pagination: false,
        depth: 0,
        draft: true,
      })

      if (existente.docs.length) {
        await payload.update({ collection: 'posts', id: existente.docs[0].id, data: dados })
        relatorio.postsAtualizados++
      } else {
        await payload.create({ collection: 'posts', data: dados })
        relatorio.postsCriados++
      }
    } catch (erro) {
      relatorio.postsComFalha.push({ slug: post.slug, motivo: (erro as Error).message })
    }

    if ((i + 1) % 25 === 0 || i + 1 === posts.length) {
      log(`     ${i + 1}/${posts.length} posts (${relatorio.postsCriados} criados, ${relatorio.postsAtualizados} atualizados, ${relatorio.postsComFalha.length} falhas)`)
    }
  }

  log('\n5/6  Importando páginas…')
  const slugsUsados = new Set<string>()

  for (const pagina of paginas) {
    const caminho = caminhoAntigo(pagina.link)
    const conteudoVazio = pagina.content.rendered.trim().length === 0

    const redirectFixo = PAGINAS_QUE_VIRAM_REDIRECT[pagina.slug]
    if (redirectFixo) {
      redirects.push({ origem: caminho, destino: redirectFixo })
      continue
    }

    if (conteudoVazio) {
      redirects.push({ origem: caminho, destino: '/' })
      continue
    }

    let slug = RENOMEAR_PAGINA[pagina.slug] ?? slugSeguro(pagina.slug)
    if (slugsUsados.has(slug)) slug = `${slug}-${pagina.id}`
    slugsUsados.add(slug)

    redirects.push({ origem: caminho, destino: `/${slug}` })

    if (SIMULAR) continue

    try {
      const dados = {
        titulo:
          RENOMEAR_TITULO[pagina.slug] ?? limparTitulo(textoSimples(pagina.title.rendered, 250)),
        slug,
        resumo: textoSimples(pagina.excerpt.rendered || pagina.content.rendered, 280),
        arquivada: PAGINAS_ARQUIVADAS.has(pagina.slug),
        layout: [
          {
            blockType: 'texto' as const,
            conteudo: converterConteudo(pagina.content.rendered, mapaImagens),
            largura: 'leitura' as const,
          },
        ],
        legado: { wpId: pagina.id, urlAntiga: caminho },
        _status: 'published' as const,
      }

      const existente = await payload.find({
        collection: 'paginas',
        where: { 'legado.wpId': { equals: pagina.id } },
        limit: 1,
        pagination: false,
        depth: 0,
        draft: true,
      })

      if (existente.docs.length) {
        await payload.update({ collection: 'paginas', id: existente.docs[0].id, data: dados })
        relatorio.paginasAtualizadas++
      } else {
        await payload.create({ collection: 'paginas', data: dados })
        relatorio.paginasCriadas++
      }
    } catch (erro) {
      relatorio.paginasComFalha.push({ slug: pagina.slug, motivo: (erro as Error).message })
    }
  }
  log(`     ${relatorio.paginasCriadas} criadas, ${relatorio.paginasAtualizadas} atualizadas, ${relatorio.paginasComFalha.length} falhas`)

  log('\n6/6  Gerando redirects e relatório…')

  // Arquivos de categoria e tag do WordPress.
  for (const cwp of categoriasWp) {
    const destinoSlug =
      CATEGORIAS.find((c) => (c.origens as readonly string[]).includes(cwp.slug))?.slug ??
      CATEGORIA_PADRAO
    redirects.push({ origem: `/category/${cwp.slug}/`, destino: `/blog/categoria/${destinoSlug}` })
  }
  for (const twp of tagsWp) {
    const destino = twp.count >= MINIMO_POSTS_POR_TAG ? `/blog/tag/${twp.slug}` : '/blog'
    redirects.push({ origem: `/tag/${twp.slug}/`, destino })
  }

  // Feeds e endereços fixos do WordPress.
  redirects.push(
    { origem: '/feed/', destino: '/blog' },
    { origem: '/comments/feed/', destino: '/blog' },
    { origem: '/wp-admin', destino: '/admin' },
    { origem: '/wp-login.php', destino: '/admin' },
  )

  const unicos = new Map<string, string>()
  for (const r of redirects) {
    const origem = r.origem.replace(/\/+$/, '') || '/'
    if (origem === r.destino || origem === '/') continue
    if (!unicos.has(origem)) unicos.set(origem, r.destino)
  }
  relatorio.redirects = unicos.size

  const arquivoRedirects = [...unicos.entries()].map(([origem, destino]) => ({ origem, destino }))
  await fs.writeFile(
    path.join(RAIZ, 'redirects.json'),
    JSON.stringify(arquivoRedirects, null, 2),
    'utf8',
  )

  const linhas = [
    '# Relatório da migração WordPress → Payload',
    '',
    `Gerado em ${new Date().toISOString()}${SIMULAR ? ' (SIMULAÇÃO)' : ''}`,
    '',
    '## Conteúdo',
    '',
    '| Item | Origem (WP) | Resultado |',
    '|---|---|---|',
    `| Posts | ${posts.length} | ${relatorio.postsCriados} criados, ${relatorio.postsAtualizados} atualizados, ${relatorio.postsComFalha.length} falhas |`,
    `| Páginas | ${paginas.length} | ${relatorio.paginasCriadas} criadas, ${relatorio.paginasAtualizadas} atualizadas, ${relatorio.paginasComFalha.length} falhas |`,
    `| Categorias | ${categoriasWp.length} | ${CATEGORIAS.length} (consolidadas) |`,
    `| Tags | ${tagsWp.length} | ${relatorio.tagsImportadas} importadas, ${relatorio.tagsDescartadas} descartadas |`,
    `| Imagens | ${imagens.size} únicas | ${relatorio.imagensImportadas} novas, ${relatorio.imagensReaproveitadas} reaproveitadas, ${relatorio.imagensComFalha.length} falhas |`,
    `| Vídeos do YouTube | — | ${relatorio.videosConvertidos} convertidos em bloco |`,
    `| Redirects 301 | — | ${relatorio.redirects} |`,
    '',
    '## Consolidação de categorias',
    '',
    '| Nova | Absorve |',
    '|---|---|',
    ...CATEGORIAS.map((c) => `| ${c.titulo} | ${c.origens.join(', ') || '—'} |`),
    '',
  ]

  if (relatorio.postsComFalha.length) {
    linhas.push('## Posts que falharam', '', ...relatorio.postsComFalha.map((f) => `- \`${f.slug}\` — ${f.motivo}`), '')
  }
  if (relatorio.paginasComFalha.length) {
    linhas.push('## Páginas que falharam', '', ...relatorio.paginasComFalha.map((f) => `- \`${f.slug}\` — ${f.motivo}`), '')
  }
  if (relatorio.imagensComFalha.length) {
    linhas.push(
      '## Imagens que falharam',
      '',
      ...relatorio.imagensComFalha.slice(0, 100).map((f) => `- ${f.url} — ${f.motivo}`),
      relatorio.imagensComFalha.length > 100 ? `- …e mais ${relatorio.imagensComFalha.length - 100}` : '',
      '',
    )
  }

  await fs.writeFile(path.join(RAIZ, 'migration-report.md'), linhas.join('\n'), 'utf8')

  log('')
  log('─'.repeat(60))
  log(`  posts     ${relatorio.postsCriados + relatorio.postsAtualizados}/${posts.length}`)
  log(`  páginas   ${relatorio.paginasCriadas + relatorio.paginasAtualizadas} (de ${paginas.length}, o resto virou redirect)`)
  log(`  imagens   ${relatorio.imagensImportadas + relatorio.imagensReaproveitadas}/${imagens.size}`)
  log(`  redirects ${relatorio.redirects}`)
  log('─'.repeat(60))
  log('  relatório: migration-report.md')
  log('  redirects: redirects.json')
  log('')
}

await main()
process.exit(0)
