import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { beforeAll, describe, expect, it } from 'vitest'
import { slugify } from '@/lib/slug'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

describe('conteúdo migrado', () => {
  it('trouxe os 322 posts do WordPress', async () => {
    const { totalDocs } = await payload.count({ collection: 'posts' })
    expect(totalDocs).toBe(322)
  })

  it('todo post tem slug limpo, título e ao menos uma categoria', async () => {
    const { docs } = await payload.find({
      collection: 'posts',
      limit: 0,
      pagination: false,
      depth: 0,
    })

    const semTitulo = docs.filter((p) => !p.titulo?.trim())
    const semCategoria = docs.filter((p) => !p.categorias?.length)
    const slugSujo = docs.filter((p) => p.slug !== slugify(p.slug))

    expect(semTitulo, 'posts sem título').toEqual([])
    expect(semCategoria.map((p) => p.slug), 'posts sem categoria').toEqual([])
    expect(slugSujo.map((p) => p.slug), 'slugs fora do padrão').toEqual([])
  })

  it('não tem slug repetido entre os posts', async () => {
    const { docs } = await payload.find({
      collection: 'posts',
      limit: 0,
      pagination: false,
      depth: 0,
      select: { slug: true },
    })
    expect(new Set(docs.map((d) => d.slug)).size).toBe(docs.length)
  })

  it('guardou a URL antiga de cada post, para os redirects', async () => {
    const { totalDocs } = await payload.count({
      collection: 'posts',
      where: { 'legado.urlAntiga': { exists: true } },
    })
    expect(totalDocs).toBe(322)
  })

  it('consolidou as 16 categorias antigas em 6', async () => {
    const { totalDocs } = await payload.count({ collection: 'categorias' })
    expect(totalDocs).toBe(6)
  })

  it('nenhuma imagem do texto ficou como upload pendente', async () => {
    const { docs } = await payload.find({
      collection: 'posts',
      limit: 0,
      pagination: false,
      depth: 0,
    })

    const pendentes = docs.filter((p) => JSON.stringify(p.conteudo).includes('"pending"'))
    expect(pendentes.map((p) => p.slug)).toEqual([])
  })

  it('nenhum nó de upload sobrou dentro de parágrafo (quebraria o HTML)', async () => {
    const { docs } = await payload.find({
      collection: 'posts',
      limit: 0,
      pagination: false,
      depth: 0,
    })

    const aninhados: string[] = []
    const procurar = (nos: { type?: string; children?: unknown[] }[]): boolean =>
      nos.some((no) => {
        if (!Array.isArray(no?.children)) return false
        const filhos = no.children as { type?: string; children?: unknown[] }[]
        if (filhos.some((f) => f?.type === 'upload')) return true
        return procurar(filhos)
      })

    for (const post of docs) {
      const raiz = (post.conteudo as { root?: { children?: unknown[] } })?.root?.children ?? []
      if (procurar(raiz as { type?: string; children?: unknown[] }[])) aninhados.push(post.slug)
    }

    expect(aninhados).toEqual([])
  })
})

describe('calendário de provas', () => {
  it('tem provas cadastradas com data, cidade e ano coerentes', async () => {
    const { docs } = await payload.find({
      collection: 'provas',
      limit: 0,
      pagination: false,
      depth: 0,
    })

    expect(docs.length).toBeGreaterThan(150)

    const anoErrado = docs.filter((p) => new Date(p.data).getUTCFullYear() !== p.ano)
    const semCidade = docs.filter((p) => !p.cidade?.trim())
    // A migração antiga colava a UF no nome; não pode voltar.
    const nomeComUf = docs.filter((p) => /\/[A-Z]{2}$/.test(p.titulo))

    expect(anoErrado.map((p) => p.titulo), 'ano diferente da data').toEqual([])
    expect(semCidade.map((p) => p.titulo), 'provas sem cidade').toEqual([])
    expect(nomeComUf.map((p) => p.titulo), 'UF grudada no nome').toEqual([])
  })
})

describe('configurações do site', () => {
  it('tem o menu e os dados de contato preenchidos', async () => {
    const [menu, cfg] = await Promise.all([
      payload.findGlobal({ slug: 'menu', depth: 0 }),
      payload.findGlobal({ slug: 'configuracoes', depth: 0 }),
    ])

    expect(menu.principal?.length).toBeGreaterThanOrEqual(5)
    expect(cfg.whatsapp).toMatch(/^\d{12,13}$/)
    expect(cfg.areaAlunoUrl).toContain('sistematreinoonline')
  })
})
