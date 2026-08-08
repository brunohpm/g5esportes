import Image from 'next/image'
import {
  CalendarDays,
  ClipboardList,
  MessageCircle,
  Smartphone,
  TrendingUp,
  Watch,
} from 'lucide-react'
import type { Configuracoe, Midia } from '@/payload-types'
import { caminhoMidia } from '@/lib/utils'
import { Botao, Container } from '../ui'

const ICONES = {
  planilha: ClipboardList,
  relogio: Watch,
  celular: Smartphone,
  evolucao: TrendingUp,
  conversa: MessageCircle,
  calendario: CalendarDays,
} as const

/**
 * A plataforma de treinos — planilha individual e treino já no relógio.
 *
 * É o diferencial mais concreto da assessoria e antes só aparecia como uma
 * linha solta no meio de um texto. Aqui vira seção com peso próprio, ao lado
 * do botão da Área do Aluno, que é onde o aluno de fato usa isso.
 */
export function Plataforma({ cfg }: { cfg: Configuracoe }) {
  const dados = cfg.plataforma
  const recursos = dados?.recursos ?? []
  if (!dados?.titulo && recursos.length === 0) return null

  const imagem = dados?.imagem as Midia | null | undefined

  return (
    <section className="bg-g5-950 py-20 text-white lg:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="font-marca text-xs font-semibold uppercase tracking-[0.25em] text-g5-200">
              Plataforma
            </p>
            <h2 className="titulo-display mt-4 font-display text-3xl font-extrabold uppercase sm:text-4xl lg:text-5xl">
              {dados?.titulo ?? 'Sua planilha no bolso'}
            </h2>
            {dados?.texto && (
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">{dados.texto}</p>
            )}

            {recursos.length > 0 && (
              <ul className="mt-10 grid gap-6 sm:grid-cols-2">
                {recursos.map((r) => {
                  const Icone = ICONES[(r.icone ?? 'planilha') as keyof typeof ICONES] ?? ClipboardList
                  return (
                    <li key={r.id ?? r.titulo} className="flex gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-g5-600/25 text-g5-200">
                        <Icone className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-lg font-bold uppercase leading-tight">
                          {r.titulo}
                        </span>
                        {r.texto && (
                          <span className="mt-1 block text-sm leading-relaxed text-white/60">
                            {r.texto}
                          </span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}

            {cfg.areaAlunoUrl && (
              <Botao href={cfg.areaAlunoUrl} estilo="lime" externo className="mt-10">
                {cfg.areaAlunoRotulo ?? 'Área do Aluno'}
              </Botao>
            )}
          </div>

          {imagem?.url && (
            <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-g5-900 lg:aspect-3/4">
              <Image
                src={caminhoMidia(imagem.url)!}
                alt={imagem.alt ?? ''}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
