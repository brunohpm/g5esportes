import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock, HeartPulse, MapPin, Target, TrendingDown } from 'lucide-react'
import { Botao, Container, TituloSecao } from '@/components/ui'
import { CartaoPost } from '@/components/CartaoPost'
import { getConfiguracoes, getPosts, getProximasProvas } from '@/lib/payload'
import type { Midia } from '@/payload-types'
import { caminhoMidia, formatarDataCurta } from '@/lib/utils'


/*
 * Renderização sob demanda: o layout inteiro (menu, contato, rodapé) vem do
 * banco, então pré-gerar exigiria o banco no build da imagem Docker. Além
 * disso, o que o cliente publica aparece na hora, sem esperar revalidação.
 */
export const dynamic = 'force-dynamic'

const OBJETIVOS = [
  {
    Icone: HeartPulse,
    titulo: 'Saúde e qualidade de vida',
    texto:
      'Começar do zero, sair do sedentarismo e transformar o exercício em rotina — com acompanhamento e sem atropelo.',
    href: '/como-comecar',
  },
  {
    Icone: TrendingDown,
    titulo: 'Emagrecimento',
    texto:
      'Volume, intensidade e constância dosados para o corpo responder. A planilha muda conforme você muda.',
    href: '/metodologia',
  },
  {
    Icone: Target,
    titulo: 'Performance',
    texto:
      'Do primeiro 5k à maratona. Periodização, testes e ajuste fino para você chegar inteiro no dia da prova.',
    href: '/corridas',
  },
]

const ETAPAS = [
  { numero: '01', titulo: 'Converse com a gente', texto: 'Um WhatsApp já resolve. Contamos como funciona e tiramos suas dúvidas.' },
  { numero: '02', titulo: 'Avaliação e liberação médica', texto: 'Entendemos seu histórico, seu objetivo e sua disponibilidade de treino.' },
  { numero: '03', titulo: 'Sua planilha no ar', texto: 'Treinos individualizados na plataforma, acessíveis pelo celular.' },
  { numero: '04', titulo: 'Treine com o grupo', texto: 'Presencial no Parque Bacacheri, com professor em campo — ou onde você estiver.' },
]

export default async function Home() {
  const [cfg, destaques, recentes, provas] = await Promise.all([
    getConfiguracoes(),
    getPosts({ limite: 1, destaque: true }),
    getPosts({ limite: 3 }),
    getProximasProvas(5),
  ])

  const heroImagem = cfg.hero?.imagem as Midia | null | undefined
  const postPrincipal = destaques.docs[0] ?? recentes.docs[0]
  const outros = recentes.docs.filter((p) => p.id !== postPrincipal?.id).slice(0, 3)
  const numeros = cfg.numeros ?? []

  return (
    <>
      {/* ── Topo ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-g5-950 text-white">
        {heroImagem?.url ? (
          <>
            <Image
              src={caminhoMidia(heroImagem.url)!}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-40"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-t from-g5-950 via-g5-950/85 to-g5-950/40"
            />
          </>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'repeating-linear-gradient(115deg, var(--color-g5-600) 0 60px, transparent 60px 120px)',
            }}
          />
        )}

        <Container className="relative py-24 lg:py-36">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-g5-200">
            Curitiba · Parque Bacacheri
          </p>

          <h1 className="titulo-display mt-6 max-w-4xl font-display text-4xl font-extrabold uppercase tracking-tight sm:text-6xl lg:text-7xl">
            {cfg.hero?.titulo ?? 'Sua melhor versão começa no primeiro quilômetro'}
          </h1>

          {cfg.hero?.subtitulo && (
            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-white/75">
              {cfg.hero.subtitulo}
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-4">
            <Botao href="/como-comecar" estilo="lime">
              Quero começar
              <ArrowRight className="size-5" aria-hidden />
            </Botao>
            <Botao
              href="/corridas"
              estilo="secundario"
              className="border-white/40 text-white hover:bg-white hover:text-g5-950"
            >
              Calendário de provas
            </Botao>
          </div>

          {numeros.length > 0 && (
            <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-8 border-t border-white/15 pt-10 sm:grid-cols-4">
              {numeros.map((n) => (
                <div key={n.id ?? n.rotulo}>
                  <dt className="sr-only">{n.rotulo}</dt>
                  <dd>
                    <span className="block font-display text-5xl font-extrabold tabular-nums leading-none text-g5-200">
                      {n.valor}
                    </span>
                    <span className="mt-2 block text-sm leading-snug text-white/60">{n.rotulo}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Container>
      </section>

      {/* ── Objetivos ────────────────────────────────────────────────────── */}
      <section className="py-24">
        <Container>
          <TituloSecao numero="01 / OBJETIVO" apoio="Não existe treino genérico. O ponto de partida é o que você quer conquistar.">
            O que traz você
            <br />
            para a corrida?
          </TituloSecao>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {OBJETIVOS.map(({ Icone, titulo, texto, href }) => (
              <Link
                key={titulo}
                href={href}
                className="group relative flex flex-col rounded-3xl border border-line bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-g5-300 hover:shadow-erguido"
              >
                <span className="grid size-14 place-items-center rounded-2xl bg-g5-100 text-g5-700 transition-colors group-hover:bg-g5-600 group-hover:text-white">
                  <Icone className="size-7" aria-hidden />
                </span>
                <h3 className="mt-6 font-display text-2xl font-bold uppercase leading-tight text-g5-950 sm:text-3xl">
                  {titulo}
                </h3>
                <p className="mt-3 flex-1 leading-relaxed text-ink-muted">{texto}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-display text-base font-bold uppercase tracking-wide text-g5-600 transition-all group-hover:gap-3">
                  Saiba mais
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Como funciona ────────────────────────────────────────────────── */}
      <section className="corte-diagonal bg-g5-950 py-28 text-white">
        <Container>
          <TituloSecao
            numero="02 / COMEÇO"
            claro
            apoio="Quatro passos entre a decisão e o primeiro treino. Nenhum deles complicado."
          >
            Como começar
          </TituloSecao>

          <ol className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {ETAPAS.map((etapa) => (
              <li key={etapa.numero} className="relative border-t-2 border-g5-600 pt-6">
                <span className="font-display text-6xl font-extrabold leading-none tabular-nums text-g5-200/25">
                  {etapa.numero}
                </span>
                <h3 className="mt-3 font-display text-2xl font-bold uppercase leading-tight">
                  {etapa.titulo}
                </h3>
                <p className="mt-2 leading-relaxed text-white/65">{etapa.texto}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16">
            <Botao href="/como-comecar" estilo="lime">
              Ver o passo a passo completo
              <ArrowRight className="size-5" aria-hidden />
            </Botao>
          </div>
        </Container>
      </section>

      {/* ── Próximas provas ──────────────────────────────────────────────── */}
      {provas.length > 0 && (
        <section className="py-24">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <TituloSecao numero="03 / CALENDÁRIO" apoio="As próximas corridas que a G5 acompanha.">
                Onde a gente vai estar
              </TituloSecao>
              <Botao href="/corridas" estilo="texto">
                Ver calendário completo →
              </Botao>
            </div>

            <ul className="mt-12 divide-y divide-line border-y border-line">
              {provas.map((prova) => (
                <li key={prova.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-5">
                  <span className="w-24 shrink-0 font-mono text-sm font-semibold tabular-nums text-ink-muted">
                    {formatarDataCurta(prova.data)}
                  </span>
                  <span className="min-w-0 flex-1 font-display text-2xl font-bold uppercase leading-tight text-g5-950">
                    {prova.titulo}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                    <MapPin className="size-4" aria-hidden />
                    {prova.cidade}/{prova.uf}
                  </span>
                  <ul className="flex gap-1.5">
                    {(prova.distancias ?? []).slice(0, 4).map((d) => (
                      <li
                        key={d}
                        className="rounded-md bg-g5-100 px-2 py-1 font-mono text-xs font-semibold tabular-nums text-g5-800"
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* ── Horários ─────────────────────────────────────────────────────── */}
      {(cfg.horarios ?? []).length > 0 && (
        <section className="bg-mist py-24">
          <Container>
            <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr]">
              <TituloSecao numero="04 / TREINOS" apoio="Frequência livre: venha quantas vezes quiser na semana.">
                Horários e locais
              </TituloSecao>

              <div className="grid gap-4 sm:grid-cols-2">
                {(cfg.horarios ?? []).map((h) => (
                  <div key={h.id ?? h.turma} className="rounded-3xl border border-line bg-white p-7">
                    <h3 className="font-display text-3xl font-extrabold uppercase text-g5-950">
                      {h.turma}
                    </h3>
                    <p className="mt-4 flex items-start gap-2.5 text-ink-muted">
                      <CalendarDays className="mt-0.5 size-5 shrink-0 text-g5-600" aria-hidden />
                      {h.dias}
                    </p>
                    <p className="mt-2 flex items-start gap-2.5 font-semibold text-g5-900">
                      <Clock className="mt-0.5 size-5 shrink-0 text-g5-600" aria-hidden />
                      {h.horario}
                    </p>
                    {h.local && (
                      <p className="mt-2 flex items-start gap-2.5 text-ink-muted">
                        <MapPin className="mt-0.5 size-5 shrink-0 text-g5-600" aria-hidden />
                        {h.local}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ── Blog ─────────────────────────────────────────────────────────── */}
      {postPrincipal && (
        <section className="py-24">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <TituloSecao numero="05 / BLOG" apoio="Avisos, artigos e o que rola na assessoria.">
                Do nosso diário de treinos
              </TituloSecao>
              <Botao href="/blog" estilo="texto">
                Todos os posts →
              </Botao>
            </div>

            <div className="mt-12 space-y-6">
              <CartaoPost post={postPrincipal} destaque prioridade />
              {outros.length > 0 && (
                <div className="grid gap-6 md:grid-cols-3">
                  {outros.map((post) => (
                    <CartaoPost key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* ── Chamada final ────────────────────────────────────────────────── */}
      <section className="bg-g5-200">
        <Container className="py-20 text-center">
          <h2 className="titulo-display mx-auto max-w-4xl font-display text-3xl font-extrabold uppercase text-g5-950 sm:text-5xl lg:text-6xl">
            {cfg.slogan ?? 'Você sonha, a G5 prescreve e juntos nós alcançamos!'}
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Botao href={`https://wa.me/${cfg.whatsapp}`} estilo="primario" externo>
              Falar no WhatsApp
            </Botao>
            <Botao
              href="/contato"
              estilo="secundario"
              className="border-g5-950 text-g5-950 hover:bg-g5-950 hover:text-g5-200"
            >
              Outras formas de contato
            </Botao>
          </div>
        </Container>
      </section>
    </>
  )
}
