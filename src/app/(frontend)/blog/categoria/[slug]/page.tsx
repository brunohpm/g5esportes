import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ListaBlog } from '@/components/ListaBlog'
import { cliente, getCategoriasComPosts, getPosts } from '@/lib/payload'

/*
 * Renderização sob demanda: o layout inteiro (menu, contato, rodapé) vem do
 * banco, então pré-gerar exigiria o banco no build da imagem Docker. Além
 * disso, o que o cliente publica aparece na hora, sem esperar revalidação.
 */
export const dynamic = 'force-dynamic'

async function buscarCategoria(slug: string) {
  const payload = await cliente()
  const { docs } = await payload.find({
    collection: 'categorias',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const categoria = await buscarCategoria(slug)
  if (!categoria) return { title: 'Categoria não encontrada' }

  return {
    title: categoria.titulo,
    description: categoria.descricao ?? undefined,
    alternates: { canonical: `/blog/categoria/${categoria.slug}` },
  }
}

export default async function PaginaCategoria({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ pagina?: string }>
}) {
  const [{ slug }, { pagina }] = await Promise.all([params, searchParams])
  const categoria = await buscarCategoria(slug)
  if (!categoria) notFound()

  const [resultado, categorias] = await Promise.all([
    getPosts({ pagina: Math.max(1, Number(pagina) || 1), limite: 12, categoria: categoria.id }),
    getCategoriasComPosts(),
  ])

  return (
    <ListaBlog
      titulo={categoria.titulo}
      chapeu="Categoria"
      descricao={categoria.descricao}
      resultado={resultado}
      categorias={categorias}
      base={`/blog/categoria/${categoria.slug}`}
      categoriaAtiva={categoria.slug}
    />
  )
}
