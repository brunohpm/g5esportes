import 'server-only'
import { cache } from 'react'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import type { Categoria, Configuracoe, Menu, Pagina, Post, Professore, Prova } from '@/payload-types'

export const cliente = cache(async () => getPayload({ config }))


export const getConfiguracoes = cache(async (): Promise<Configuracoe> => {
  const payload = await cliente()
  return payload.findGlobal({ slug: 'configuracoes', depth: 1 })
})

export const getMenu = cache(async (): Promise<Menu> => {
  const payload = await cliente()
  return payload.findGlobal({ slug: 'menu', depth: 0 })
})

/** Só categorias com pelo menos um post — evita seções vazias na navegação. */
export const getCategoriasComPosts = cache(async (): Promise<(Categoria & { total: number })[]> => {
  const payload = await cliente()
  const { docs } = await payload.find({
    collection: 'categorias',
    limit: 50,
    sort: 'ordem',
    depth: 0,
  })

  const comTotal = await Promise.all(
    docs.map(async (cat) => {
      const { totalDocs } = await payload.count({
        collection: 'posts',
        where: { categorias: { in: [cat.id] } },
      })
      return { ...cat, total: totalDocs }
    }),
  )

  return comTotal.filter((c) => c.total > 0)
})

export const getPosts = cache(
  async (opcoes: {
    pagina?: number
    limite?: number
    categoria?: number
    tag?: number
    busca?: string
    destaque?: boolean
  } = {}) => {
    const payload = await cliente()
    const { pagina = 1, limite = 12, categoria, tag, busca, destaque } = opcoes

    const where: Where = {}
    if (categoria) where.categorias = { in: [categoria] }
    if (tag) where.tags = { in: [tag] }
    if (destaque) where.destaque = { equals: true }
    if (busca) where.or = [{ titulo: { like: busca } }, { resumo: { like: busca } }]

    return payload.find({
      collection: 'posts',
      where,
      page: pagina,
      limit: limite,
      sort: '-publicadoEm',
      depth: 1,
    })
  },
)

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  const payload = await cliente()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
})

export const getPagina = cache(async (slug: string): Promise<Pagina | null> => {
  const payload = await cliente()
  const { docs } = await payload.find({
    collection: 'paginas',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
})

export const getProfessores = cache(async (): Promise<Professore[]> => {
  const payload = await cliente()
  const { docs } = await payload.find({
    collection: 'professores',
    limit: 50,
    sort: 'ordem',
    depth: 1,
  })
  return docs
})

/** Provas a partir de hoje, para as listagens de "próximas provas". */
export const getProximasProvas = cache(async (limite = 6, apenasDestaques = false): Promise<Prova[]> => {
  const payload = await cliente()
  const hoje = new Date()
  hoje.setUTCHours(0, 0, 0, 0)

  const where: Where = { data: { greater_than_equal: hoje.toISOString() } }
  if (apenasDestaques) where.destaque = { equals: true }

  const { docs } = await payload.find({
    collection: 'provas',
    where,
    limit: limite,
    sort: 'data',
    depth: 0,
  })
  return docs
})

export const getProvas = cache(async (ano: number): Promise<Prova[]> => {
  const payload = await cliente()
  const { docs } = await payload.find({
    collection: 'provas',
    where: { ano: { equals: ano } },
    limit: 500,
    sort: 'data',
    depth: 0,
    pagination: false,
  })
  return docs
})

export const getAnosComProvas = cache(async (): Promise<number[]> => {
  const payload = await cliente()
  const { docs } = await payload.find({
    collection: 'provas',
    limit: 1000,
    depth: 0,
    pagination: false,
    select: { ano: true },
  })
  return [...new Set(docs.map((d) => d.ano))].filter(Boolean).sort((a, b) => b - a)
})

export const getAlbuns = cache(async (limite = 24) => {
  const payload = await cliente()
  const { docs } = await payload.find({
    collection: 'albuns',
    limit: limite,
    sort: '-data',
    depth: 1,
  })
  return docs
})
