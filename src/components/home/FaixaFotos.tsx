import Image from 'next/image'
import type { Configuracoe, Midia } from '@/payload-types'
import { caminhoMidia } from '@/lib/utils'
import { Container } from '../ui'

/**
 * Uma tira de fotos do grupo. Assessoria de corrida vende pertencimento, e
 * isso não se explica por texto — se mostra.
 *
 * No celular vira carrossel horizontal (rolagem por toque, com encaixe) em vez
 * de empilhar: oito fotos empilhadas seriam meia tela de rolagem.
 */
export function FaixaFotos({ cfg }: { cfg: Configuracoe }) {
  const fotos = ((cfg.fotos?.imagens ?? []) as (Midia | number)[]).filter(
    (f): f is Midia => typeof f === 'object' && Boolean(f?.url),
  )

  if (fotos.length < 3) return null

  return (
    <section className="py-16 lg:py-20">
      <Container>
        {cfg.fotos?.titulo && (
          <h2 className="titulo-display font-display text-3xl font-extrabold uppercase text-g5-950 sm:text-4xl">
            {cfg.fotos.titulo}
          </h2>
        )}
      </Container>

      <ul
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 lg:px-8"
        // Barra de rolagem discreta: a tira é para olhar, não para operar.
        style={{ scrollbarWidth: 'thin' }}
      >
        {fotos.map((foto, i) => (
          <li
            key={foto.id}
            className="relative aspect-4/3 w-[78vw] shrink-0 snap-center overflow-hidden rounded-2xl bg-mist sm:w-[46vw] lg:w-[30vw] xl:w-[24vw]"
          >
            <Image
              src={caminhoMidia(foto.url)!}
              alt={foto.alt ?? ''}
              fill
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 24vw"
              loading={i < 2 ? 'eager' : 'lazy'}
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
