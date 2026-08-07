import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui'
import { CalendarioProvas } from '@/components/CalendarioProvas'
import { getAnosComProvas, getProvas } from '@/lib/payload'
import { cn } from '@/lib/utils'


/*
 * Renderização sob demanda: o layout inteiro (menu, contato, rodapé) vem do
 * banco, então pré-gerar exigiria o banco no build da imagem Docker. Além
 * disso, o que o cliente publica aparece na hora, sem esperar revalidação.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Calendário de provas',
  description:
    'Todas as corridas de rua de Curitiba, do Paraná e do Brasil que a G5 Esportes acompanha. Filtre por distância, mês, tipo e cidade.',
}

const ANO_ATUAL = new Date().getFullYear()

export default async function PaginaCorridas({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  const { ano: anoParam } = await searchParams
  const anos = await getAnosComProvas()

  const ano =
    anoParam && anos.includes(Number(anoParam))
      ? Number(anoParam)
      : anos.includes(ANO_ATUAL)
        ? ANO_ATUAL
        : (anos[0] ?? ANO_ATUAL)

  const provas = await getProvas(ano)

  return (
    <>
      <section className="bg-g5-950 text-white">
        <Container className="py-16 lg:py-24">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-g5-200">
            Calendário
          </p>
          <h1 className="titulo-display mt-4 font-display text-4xl font-extrabold uppercase sm:text-6xl lg:text-7xl">
            Provas {ano}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            As corridas que a G5 acompanha ao longo do ano. Filtre pela distância que você treina,
            pelo mês ou pela cidade — e vá se planejando.
          </p>

          {anos.length > 1 && (
            <nav aria-label="Escolher ano" className="mt-10 flex flex-wrap gap-2">
              {anos.map((a) => (
                <Link
                  key={a}
                  href={`/corridas?ano=${a}`}
                  aria-current={a === ano ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-5 py-2 font-display text-lg font-bold tabular-nums transition-colors',
                    a === ano
                      ? 'bg-g5-200 text-g5-950'
                      : 'border border-white/25 text-white/70 hover:border-g5-200 hover:text-white',
                  )}
                >
                  {a}
                </Link>
              ))}
            </nav>
          )}
        </Container>
      </section>

      <Container className="pb-24">
        {provas.length > 0 ? (
          <CalendarioProvas provas={provas} />
        ) : (
          <p className="py-24 text-center text-lg text-ink-muted">
            O calendário de {ano} ainda não foi publicado.
          </p>
        )}
      </Container>
    </>
  )
}
