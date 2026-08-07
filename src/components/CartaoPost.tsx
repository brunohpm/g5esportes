import Image from 'next/image'
import Link from 'next/link'
import type { Categoria, Midia, Post } from '@/payload-types'
import { caminhoMidia, cn, formatarData } from '@/lib/utils'
import { Etiqueta } from './ui'

const primeiraCategoria = (post: Post): Categoria | null => {
  const cat = post.categorias?.[0]
  return cat && typeof cat === 'object' ? cat : null
}

const capa = (post: Post): Midia | null =>
  post.capa && typeof post.capa === 'object' ? post.capa : null

export function CartaoPost({
  post,
  destaque = false,
  prioridade = false,
}: {
  post: Post
  destaque?: boolean
  prioridade?: boolean
}) {
  const imagem = capa(post)
  const categoria = primeiraCategoria(post)

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-erguido',
        destaque && 'lg:flex-row',
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden bg-mist',
          destaque ? 'aspect-16/10 lg:aspect-auto lg:w-3/5' : 'aspect-16/10',
        )}
      >
        {imagem?.url ? (
          <Image
            src={caminhoMidia(imagem.url)!}
            alt={imagem.alt ?? ''}
            fill
            sizes={destaque ? '(max-width: 1024px) 100vw, 60vw' : '(max-width: 768px) 100vw, 33vw'}
            priority={prioridade}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden
            className="size-full"
            style={{
              backgroundImage:
                'repeating-linear-gradient(115deg, var(--color-g5-100) 0 20px, var(--color-g5-50) 20px 40px)',
            }}
          />
        )}

        {categoria && (
          <div className="absolute left-4 top-4">
            <Etiqueta cor={categoria.cor}>{categoria.titulo}</Etiqueta>
          </div>
        )}
      </div>

      <div className={cn('flex flex-1 flex-col p-6', destaque && 'lg:justify-center lg:p-10')}>
        <time
          dateTime={post.publicadoEm}
          className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted"
        >
          {formatarData(post.publicadoEm)}
        </time>

        <h3
          className={cn(
            'mt-3 font-display font-bold uppercase leading-[1.05] text-g5-950',
            destaque ? 'text-3xl lg:text-5xl' : 'text-2xl',
          )}
        >
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.titulo}
          </Link>
        </h3>

        {post.resumo && (
          <p
            className={cn(
              'mt-3 leading-relaxed text-ink-muted',
              destaque ? 'line-clamp-4 text-lg' : 'line-clamp-3',
            )}
          >
            {post.resumo}
          </p>
        )}

        <span className="mt-5 inline-flex items-center gap-2 font-display text-base font-bold uppercase tracking-wide text-g5-600 transition-transform group-hover:gap-3">
          Ler
          <span aria-hidden>→</span>
        </span>
      </div>
    </article>
  )
}
