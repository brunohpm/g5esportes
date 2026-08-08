import Image from 'next/image'
import { PlayCircle } from 'lucide-react'
import type { Configuracoe, Midia } from '@/payload-types'
import { getProfessores } from '@/lib/payload'
import { caminhoMidia } from '@/lib/utils'
import { idDoYoutube } from '@/lib/youtube'
import { Container } from '../ui'

/**
 * "A palavra de quem conduz" — vem logo depois do topo, porque é o argumento
 * que mais converte numa assessoria: quem são as pessoas que vão te treinar.
 *
 * Sem vídeo cadastrado, a seção não some nem fica quebrada: mostra o texto ao
 * lado dos professores e um aviso discreto de que o vídeo está por vir.
 */
export async function PalavraTreinadores({ cfg }: { cfg: Configuracoe }) {
  const dados = cfg.palavraTreinadores
  const professores = await getProfessores()

  const idVideo = idDoYoutube(dados?.videoUrl ?? '')
  const temConteudo = dados?.texto || idVideo || professores.length > 0
  if (!temConteudo) return null

  return (
    <section className="bg-mist py-20 lg:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-marca text-xs font-semibold uppercase tracking-[0.25em] text-g5-600">
              Quem conduz
            </p>
            <h2 className="titulo-display mt-4 font-display text-3xl font-extrabold uppercase text-g5-950 sm:text-4xl lg:text-5xl">
              {dados?.titulo ?? 'A palavra de quem conduz'}
            </h2>
            {dados?.texto && (
              <p className="mt-5 text-lg leading-relaxed text-ink-muted">{dados.texto}</p>
            )}

            {professores.length > 0 && (
              <ul className="mt-8 space-y-4">
                {professores.map((prof) => {
                  const foto = prof.foto as Midia | null | undefined
                  return (
                    <li key={prof.id} className="flex items-center gap-4">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-g5-100">
                        {foto?.url ? (
                          <Image
                            src={caminhoMidia(foto.url)!}
                            alt={foto.alt ?? prof.titulo}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="grid size-full place-items-center font-marca text-lg font-semibold text-g5-700">
                            {prof.titulo.charAt(0)}
                          </span>
                        )}
                      </span>
                      <span>
                        <span className="block font-display text-xl font-bold uppercase leading-tight text-g5-950">
                          {prof.titulo}
                        </span>
                        <span className="block text-sm text-ink-muted">
                          {prof.funcao}
                          {prof.cref ? ` · CREF ${prof.cref}` : ''}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div>
            {idVideo ? (
              <div className="aspect-video overflow-hidden rounded-3xl bg-g5-950 shadow-erguido">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${idVideo}`}
                  title={dados?.titulo ?? 'A palavra dos treinadores da G5'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="size-full border-0"
                />
              </div>
            ) : (
              /* Espaço reservado: mostra onde o vídeo entra, sem parecer erro. */
              <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-g5-300 bg-white/60 px-8 text-center">
                <PlayCircle className="size-12 text-g5-400" aria-hidden />
                <p className="font-display text-xl font-bold uppercase leading-tight text-g5-800">
                  Vídeo em produção
                </p>
                <p className="max-w-xs text-sm text-ink-muted">
                  Em breve, os treinadores contam aqui como a G5 trabalha.
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
