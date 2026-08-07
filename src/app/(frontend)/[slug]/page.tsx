import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Blocos } from '@/components/Blocos'
import { Container } from '@/components/ui'
import { getPagina } from '@/lib/payload'

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
  const pagina = await getPagina(slug)
  if (!pagina) return { title: 'Página não encontrada' }

  return {
    title: pagina.meta?.title ?? pagina.titulo,
    description: pagina.meta?.description ?? pagina.resumo ?? undefined,
    alternates: { canonical: `/${pagina.slug}` },
    robots: pagina.ocultarDoSitemap || pagina.arquivada ? { index: false, follow: true } : undefined,
  }
}

export default async function PaginaCms({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pagina = await getPagina(slug)
  if (!pagina) notFound()

  // Só mostra o cabeçalho padrão quando a página não começa com um hero próprio.
  const temHero = pagina.layout?.[0]?.blockType === 'hero'

  return (
    <>
      {!temHero && (
        <section className="border-b border-line">
          <Container className="py-16 lg:py-20">
            <h1 className="max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.92] text-g5-950 sm:text-6xl lg:text-7xl">
              {pagina.titulo}
            </h1>
          </Container>
        </section>
      )}

      {pagina.arquivada && (
        <Container largura="leitura" className="pt-10">
          <p className="flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 text-amber-900">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              Esta página é um arquivo de anos anteriores e não recebe mais atualizações. Para o
              calendário atual,{' '}
              <a href="/corridas" className="font-semibold underline underline-offset-4">
                clique aqui
              </a>
              .
            </span>
          </p>
        </Container>
      )}

      <Blocos blocos={pagina.layout} />
    </>
  )
}
