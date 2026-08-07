import Link from 'next/link'
import type { PaginatedDocs } from 'payload'
import type { Categoria, Post } from '@/payload-types'
import { Container } from './ui'
import { CartaoPost } from './CartaoPost'
import { cn } from '@/lib/utils'

type Props = {
  titulo: string
  chapeu: string
  descricao?: string | null
  resultado: PaginatedDocs<Post>
  categorias: (Categoria & { total: number })[]
  base: string
  categoriaAtiva?: string
}

export function ListaBlog({
  titulo,
  chapeu,
  descricao,
  resultado,
  categorias,
  base,
  categoriaAtiva,
}: Props) {
  const { docs, page = 1, totalPages, totalDocs } = resultado

  return (
    <>
      <section className="border-b border-line">
        <Container className="py-16 lg:py-20">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-g5-600">
            {chapeu}
          </p>
          <h1 className="titulo-display mt-4 font-display text-4xl font-extrabold uppercase text-g5-950 sm:text-6xl">
            {titulo}
          </h1>
          {descricao && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">{descricao}</p>
          )}

          {categorias.length > 0 && (
            <nav aria-label="Categorias" className="mt-10 flex flex-wrap gap-2">
              <Link
                href="/blog"
                aria-current={!categoriaAtiva ? 'page' : undefined}
                className={cn(
                  'rounded-full border-2 px-4 py-1.5 font-display text-base font-bold uppercase tracking-wide transition-colors',
                  !categoriaAtiva
                    ? 'border-g5-600 bg-g5-600 text-white'
                    : 'border-line text-ink-muted hover:border-g5-400 hover:text-g5-800',
                )}
              >
                Tudo
                <span className="ml-2 font-mono text-xs opacity-60">{totalDocs}</span>
              </Link>

              {categorias.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog/categoria/${cat.slug}`}
                  aria-current={categoriaAtiva === cat.slug ? 'page' : undefined}
                  className={cn(
                    'rounded-full border-2 px-4 py-1.5 font-display text-base font-bold uppercase tracking-wide transition-colors',
                    categoriaAtiva === cat.slug
                      ? 'border-g5-600 bg-g5-600 text-white'
                      : 'border-line text-ink-muted hover:border-g5-400 hover:text-g5-800',
                  )}
                >
                  {cat.titulo}
                  <span className="ml-2 font-mono text-xs opacity-60">{cat.total}</span>
                </Link>
              ))}
            </nav>
          )}
        </Container>
      </section>

      <Container className="py-16">
        {docs.length === 0 ? (
          <p className="py-20 text-center text-lg text-ink-muted">Nenhum post por aqui ainda.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((post, i) => (
              <CartaoPost key={post.id} post={post} prioridade={i < 3} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Paginação" className="mt-16 flex items-center justify-center gap-3">
            {page > 1 && (
              <Link
                href={page - 1 === 1 ? base : `${base}?pagina=${page - 1}`}
                rel="prev"
                className="rounded-full border-2 border-line px-6 py-2.5 font-display text-lg font-bold uppercase tracking-wide text-g5-900 transition-colors hover:border-g5-600 hover:text-g5-600"
              >
                ← Anterior
              </Link>
            )}

            <span className="px-4 font-mono text-sm tabular-nums text-ink-muted">
              página {page} de {totalPages}
            </span>

            {page < totalPages && (
              <Link
                href={`${base}?pagina=${page + 1}`}
                rel="next"
                className="rounded-full border-2 border-line px-6 py-2.5 font-display text-lg font-bold uppercase tracking-wide text-g5-900 transition-colors hover:border-g5-600 hover:text-g5-600"
              >
                Próxima →
              </Link>
            )}
          </nav>
        )}
      </Container>
    </>
  )
}
