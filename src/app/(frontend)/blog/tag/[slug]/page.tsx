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

async function buscarTag(slug: string) {
  const payload = await cliente()
  const { docs } = await payload.find({
    collection: 'tags',
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
  const tag = await buscarTag(slug)
  if (!tag) return { title: 'Tag não encontrada' }

  return {
    title: `#${tag.titulo}`,
    description: `Posts da G5 Esportes marcados com ${tag.titulo}.`,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
    // Arquivos de tag não agregam nada ao Google; o valor está nos posts.
    robots: { index: false, follow: true },
  }
}

export default async function PaginaTag({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ pagina?: string }>
}) {
  const [{ slug }, { pagina }] = await Promise.all([params, searchParams])
  const tag = await buscarTag(slug)
  if (!tag) notFound()

  const [resultado, categorias] = await Promise.all([
    getPosts({ pagina: Math.max(1, Number(pagina) || 1), limite: 12, tag: tag.id }),
    getCategoriasComPosts(),
  ])

  return (
    <ListaBlog
      titulo={`#${tag.titulo}`}
      chapeu="Tag"
      resultado={resultado}
      categorias={categorias}
      base={`/blog/tag/${tag.slug}`}
    />
  )
}
