import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Botao, Container, Etiqueta } from '@/components/ui'
import { CartaoPost } from '@/components/CartaoPost'
import { TextoRico } from '@/components/TextoRico'
import { cliente, getConfiguracoes, getPost } from '@/lib/payload'
import type { Categoria, Midia, Tag, Usuario } from '@/payload-types'
import { caminhoMidia, formatarData } from '@/lib/utils'

/*
 * Renderização sob demanda: o layout inteiro (menu, contato, rodapé) vem do
 * banco, então pré-gerar exigiria o banco no build da imagem Docker. Além
 * disso, o que o cliente publica aparece na hora, sem esperar revalidação.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Post não encontrado' }

  const capa = post.capa as Midia | null | undefined

  return {
    title: post.meta?.title ?? post.titulo,
    description: post.meta?.description ?? post.resumo ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.titulo,
      description: post.resumo ?? undefined,
      publishedTime: post.publicadoEm,
      images: capa?.url ? [{ url: capa.url, width: capa.width ?? 1200, height: capa.height ?? 630 }] : undefined,
    },
  }
}

export default async function PaginaPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const capa = post.capa as Midia | null | undefined
  const categorias = (post.categorias ?? []).filter((c): c is Categoria => typeof c === 'object')
  const tags = (post.tags ?? []).filter((t): t is Tag => typeof t === 'object')
  const autor = typeof post.autor === 'object' ? (post.autor as Usuario) : null

  const [payload, cfg] = await Promise.all([cliente(), getConfiguracoes()])
  const { docs: relacionados } = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { id: { not_equals: post.id } },
        ...(categorias.length ? [{ categorias: { in: categorias.map((c) => c.id) } }] : []),
      ],
    },
    limit: 3,
    sort: '-publicadoEm',
    depth: 1,
  })

  return (
    <article>
      <Container largura="leitura" className="pt-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-display text-base font-bold uppercase tracking-wide text-ink-muted transition-colors hover:text-g5-600"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Blog
        </Link>
      </Container>

      <header>
        <Container largura="leitura" className="pt-8">
          {categorias.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {categorias.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/blog/categoria/${cat.slug}`}>
                    <Etiqueta cor={cat.cor}>{cat.titulo}</Etiqueta>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h1 className="mt-5 font-display text-5xl font-extrabold uppercase leading-[0.95] text-g5-950 sm:text-6xl">
            {post.titulo}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-sm text-ink-muted">
            <time dateTime={post.publicadoEm}>{formatarData(post.publicadoEm)}</time>
            {autor?.nome && (
              <>
                <span aria-hidden>·</span>
                <span>{autor.nome}</span>
              </>
            )}
          </div>
        </Container>

        {capa?.url && (
          <Container className="mt-10">
            <div className="relative aspect-16/9 overflow-hidden rounded-3xl bg-mist">
              <Image
                src={caminhoMidia(capa.url)!}
                alt={capa.alt ?? ''}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
              />
            </div>
          </Container>
        )}
      </header>

      <Container largura="leitura" className="py-14">
        <TextoRico data={post.conteudo} />

        {tags.length > 0 && (
          <ul className="mt-14 flex flex-wrap gap-2 border-t border-line pt-8">
            {tags.map((tag) => (
              <li key={tag.id}>
                <Link
                  href={`/blog/tag/${tag.slug}`}
                  className="rounded-full bg-mist px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-g5-100 hover:text-g5-800"
                >
                  #{tag.titulo}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>

      <section className="bg-g5-200">
        <Container className="py-16 text-center">
          <h2 className="mx-auto max-w-3xl font-display text-4xl font-extrabold uppercase leading-[0.95] text-g5-950 sm:text-5xl">
            Bora treinar com a gente?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-g5-900/75">
            Treinos no Parque Bacacheri, planilha individual e professor em campo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Botao href={`https://wa.me/${cfg.whatsapp}`} externo>
              Falar no WhatsApp
            </Botao>
            <Botao
              href="/como-comecar"
              estilo="secundario"
              className="border-g5-950 text-g5-950 hover:bg-g5-950 hover:text-g5-200"
            >
              Como começar
            </Botao>
          </div>
        </Container>
      </section>

      {relacionados.length > 0 && (
        <Container className="py-16">
          <h2 className="font-display text-3xl font-extrabold uppercase text-g5-950">
            Leia também
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relacionados.map((p) => (
              <CartaoPost key={p.id} post={p} />
            ))}
          </div>
        </Container>
      )}
    </article>
  )
}
