import type { MetadataRoute } from 'next'
import { cliente } from '@/lib/payload'

/*
 * Renderização sob demanda: o layout inteiro (menu, contato, rodapé) vem do
 * banco, então pré-gerar exigiria o banco no build da imagem Docker. Além
 * disso, o que o cliente publica aparece na hora, sem esperar revalidação.
 */
export const dynamic = 'force-dynamic'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await cliente()

  const [posts, paginas, categorias] = await Promise.all([
    payload.find({ collection: 'posts', limit: 1000, pagination: false, depth: 0, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'paginas', limit: 200, pagination: false, depth: 0, select: { slug: true, updatedAt: true, ocultarDoSitemap: true, arquivada: true } }),
    payload.find({ collection: 'categorias', limit: 50, pagination: false, depth: 0, select: { slug: true, updatedAt: true } }),
  ])

  const fixas: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/corridas`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/galeria`, changeFrequency: 'monthly', priority: 0.6 },
  ]

  return [
    ...fixas,
    ...paginas.docs
      .filter((p) => !p.ocultarDoSitemap && !p.arquivada)
      .map((p) => ({
        url: `${BASE}/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
    ...categorias.docs.map((c) => ({
      url: `${BASE}/blog/categoria/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...posts.docs.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ]
}
