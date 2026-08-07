import type { Metadata } from 'next'
import Image from 'next/image'
import { Container } from '@/components/ui'
import { getAlbuns } from '@/lib/payload'
import type { Midia } from '@/payload-types'
import { caminhoMidia, formatarData } from '@/lib/utils'
import { idDoYoutube } from '@/lib/youtube'


/*
 * Renderização sob demanda: o layout inteiro (menu, contato, rodapé) vem do
 * banco, então pré-gerar exigiria o banco no build da imagem Docker. Além
 * disso, o que o cliente publica aparece na hora, sem esperar revalidação.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Galeria',
  description: 'Fotos e vídeos das provas e dos treinos da G5 Esportes no Parque Bacacheri.',
}

const ROTULO_TIPO: Record<string, string> = {
  prova: 'Prova',
  treino: 'Treino',
  evento: 'Evento G5',
}

export default async function PaginaGaleria() {
  const albuns = await getAlbuns(48)

  return (
    <>
      <section className="border-b border-line">
        <Container className="py-16 lg:py-20">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-g5-600">
            Registro
          </p>
          <h1 className="mt-4 font-display text-6xl font-extrabold uppercase leading-[0.9] text-g5-950 sm:text-7xl">
            Galeria
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            As provas, os treinos e as manhãs no Parque Bacacheri.
          </p>
        </Container>
      </section>

      <Container className="py-16">
        {albuns.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line py-24 text-center">
            <p className="font-display text-2xl font-bold uppercase text-ink-muted">
              Nenhum álbum publicado ainda
            </p>
            <p className="mt-2 text-ink-muted">
              Os álbuns criados no painel aparecem aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-20">
            {albuns.map((album) => {
              const fotos = (album.fotos ?? []).filter((f): f is Midia => typeof f === 'object')
              const videos = album.videos ?? []

              return (
                <section key={album.id} id={album.slug} className="scroll-mt-28">
                  <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 className="font-display text-3xl font-extrabold uppercase text-g5-950">
                      {album.titulo}
                    </h2>
                    <span className="font-mono text-sm text-ink-muted">
                      {formatarData(album.data)}
                      {album.tipo ? ` · ${ROTULO_TIPO[album.tipo] ?? album.tipo}` : ''}
                    </span>
                  </header>

                  {album.descricao && (
                    <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">{album.descricao}</p>
                  )}

                  {fotos.length > 0 && (
                    <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {fotos.map((foto) => (
                        <li key={foto.id} className="relative aspect-square overflow-hidden rounded-2xl bg-mist">
                          {foto.url && (
                            <Image
                              src={caminhoMidia(foto.url)!}
                              alt={foto.alt ?? ''}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-cover transition-transform duration-500 hover:scale-105"
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {videos.length > 0 && (
                    <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                      {videos.map((video) => {
                        const id = idDoYoutube(video.url)
                        if (!id) return null
                        return (
                          <li key={video.id ?? video.url}>
                            <div className="aspect-video overflow-hidden rounded-2xl bg-g5-950">
                              <iframe
                                src={`https://www.youtube-nocookie.com/embed/${id}`}
                                title={video.titulo ?? 'Vídeo da G5 Esportes'}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                                className="size-full border-0"
                              />
                            </div>
                            {video.titulo && (
                              <p className="mt-2 text-sm text-ink-muted">{video.titulo}</p>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </Container>
    </>
  )
}
