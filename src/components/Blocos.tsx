import Image from 'next/image'
import Link from 'next/link'
import {
  Activity, CalendarDays, Clock, Dumbbell, Footprints, HeartPulse,
  MapPin, Smartphone, Trophy, Users,
} from 'lucide-react'
import type { Albun, Midia, Pagina, Professore } from '@/payload-types'
import { getProfessores, getProximasProvas } from '@/lib/payload'
import { caminhoMidia, cn, formatarDataCurta } from '@/lib/utils'
import { idDoYoutube } from '@/lib/youtube'
import { Botao, Container, TituloSecao } from './ui'
import { TextoRico } from './TextoRico'
import { Sanfona } from './Sanfona'

type Bloco = NonNullable<Pagina['layout']>[number]

const ICONES: Record<string, typeof Activity> = {
  corrida: Footprints,
  saude: HeartPulse,
  horarios: Clock,
  calendario: CalendarDays,
  grupo: Users,
  funcional: Dumbbell,
  app: Smartphone,
  trofeu: Trophy,
  local: MapPin,
}

export async function Blocos({ blocos }: { blocos?: Pagina['layout'] }) {
  if (!blocos?.length) return null
  return (
    <>
      {blocos.map((bloco, i) => (
        <RenderizarBloco key={bloco.id ?? i} bloco={bloco} primeiro={i === 0} />
      ))}
    </>
  )
}

async function RenderizarBloco({ bloco, primeiro }: { bloco: Bloco; primeiro: boolean }) {
  switch (bloco.blockType) {
    case 'hero': {
      const imagem = bloco.imagem as Midia | null | undefined
      return (
        <section className="relative isolate overflow-hidden bg-g5-950 text-white">
          {imagem?.url && (
            <>
              <Image src={caminhoMidia(imagem.url)!} alt="" fill priority={primeiro} sizes="100vw" className="object-cover opacity-40" />
              <div aria-hidden className="absolute inset-0 bg-linear-to-t from-g5-950 via-g5-950/80 to-g5-950/40" />
            </>
          )}
          <Container
            className={cn('relative py-24 lg:py-32', bloco.alinhamento === 'centro' && 'text-center')}
          >
            <h1 className={cn(
              'font-display text-5xl font-extrabold uppercase leading-[0.9] sm:text-6xl lg:text-7xl',
              bloco.alinhamento === 'centro' ? 'mx-auto max-w-4xl' : 'max-w-4xl',
            )}>
              {bloco.titulo}
            </h1>
            {bloco.subtitulo && (
              <p className={cn(
                'mt-6 text-xl leading-relaxed text-white/75',
                bloco.alinhamento === 'centro' ? 'mx-auto max-w-2xl' : 'max-w-2xl',
              )}>
                {bloco.subtitulo}
              </p>
            )}
            {bloco.botoes?.length ? (
              <div className={cn('mt-10 flex flex-wrap gap-4', bloco.alinhamento === 'centro' && 'justify-center')}>
                {bloco.botoes.map((b) => (
                  <Botao
                    key={b.id ?? b.url}
                    href={b.url}
                    estilo={b.estilo === 'primario' ? 'lime' : b.estilo === 'texto' ? 'texto' : 'secundario'}
                    className={b.estilo === 'secundario' ? 'border-white/40 text-white hover:bg-white hover:text-g5-950' : undefined}
                  >
                    {b.rotulo}
                  </Botao>
                ))}
              </div>
            ) : null}
          </Container>
        </section>
      )
    }

    case 'texto':
      return (
        <section className="py-14 first:pt-20">
          <Container largura={bloco.largura === 'total' ? 'padrao' : 'leitura'}>
            <TextoRico data={bloco.conteudo} />
          </Container>
        </section>
      )

    case 'cards': {
      const colunas = { '2': 'sm:grid-cols-2', '3': 'sm:grid-cols-2 lg:grid-cols-3', '4': 'sm:grid-cols-2 lg:grid-cols-4' }
      return (
        <section className="py-16">
          <Container>
            {(bloco.titulo || bloco.subtitulo) && (
              <TituloSecao apoio={bloco.subtitulo ?? undefined}>{bloco.titulo}</TituloSecao>
            )}
            <div className={cn('mt-12 grid gap-6', colunas[bloco.colunas ?? '3'])}>
              {(bloco.itens ?? []).map((item) => {
                const Icone = ICONES[item.icone ?? 'corrida'] ?? Footprints
                const classes = cn(
                  'flex flex-col rounded-3xl border border-line bg-white p-7',
                  item.url &&
                    'group transition-all hover:-translate-y-1 hover:border-g5-300 hover:shadow-erguido',
                )
                const conteudo = (
                  <>
                    <span className="grid size-12 place-items-center rounded-2xl bg-g5-100 text-g5-700">
                      <Icone className="size-6" aria-hidden />
                    </span>
                    <h3 className="mt-5 font-display text-2xl font-bold uppercase leading-tight text-g5-950">
                      {item.titulo}
                    </h3>
                    {item.texto && <p className="mt-2 leading-relaxed text-ink-muted">{item.texto}</p>}
                  </>
                )

                return item.url ? (
                  <Link key={item.id ?? item.titulo} href={item.url} className={classes}>
                    {conteudo}
                  </Link>
                ) : (
                  <div key={item.id ?? item.titulo} className={classes}>
                    {conteudo}
                  </div>
                )
              })}
            </div>
          </Container>
        </section>
      )
    }

    case 'precos':
      return (
        <section className="bg-mist py-20">
          <Container>
            {bloco.titulo && <TituloSecao>{bloco.titulo}</TituloSecao>}
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {(bloco.planos ?? []).map((plano) => (
                <div
                  key={plano.id ?? plano.nome}
                  className={cn(
                    'flex flex-col rounded-3xl border-2 bg-white p-8',
                    plano.destaque ? 'border-g5-600 shadow-erguido' : 'border-line',
                  )}
                >
                  {plano.destaque && (
                    <span className="mb-4 self-start rounded-full bg-g5-600 px-3 py-1 font-display text-sm font-bold uppercase tracking-wide text-white">
                      Mais procurado
                    </span>
                  )}
                  <h3 className="font-display text-3xl font-extrabold uppercase text-g5-950">{plano.nome}</h3>
                  {plano.descricao && <p className="mt-2 text-ink-muted">{plano.descricao}</p>}
                  {plano.preco && (
                    <p className="mt-6 flex items-baseline gap-1">
                      <span className="font-display text-5xl font-extrabold tabular-nums text-g5-950">{plano.preco}</span>
                      {plano.periodo && <span className="text-ink-muted">{plano.periodo}</span>}
                    </p>
                  )}
                  {plano.itens?.length ? (
                    <ul className="mt-6 flex-1 space-y-2.5">
                      {plano.itens.map((i) => (
                        <li key={i.id ?? i.item} className="flex gap-2.5 text-ink-muted">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-g5-500" />
                          {i.item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {plano.urlBotao && (
                    <Botao
                      href={plano.urlBotao}
                      estilo={plano.destaque ? 'primario' : 'secundario'}
                      className="mt-8 w-full"
                    >
                      {plano.rotuloBotao ?? 'Quero começar'}
                    </Botao>
                  )}
                </div>
              ))}
            </div>
            {bloco.observacao && (
              <p className="mt-8 text-center text-sm text-ink-muted">{bloco.observacao}</p>
            )}
          </Container>
        </section>
      )

    case 'chamada':
      return (
        <section className={bloco.fundo === 'lime' ? 'bg-g5-200' : 'bg-g5-950'}>
          <Container className="py-20 text-center">
            <h2
              className={cn(
                'mx-auto max-w-4xl font-display text-4xl font-extrabold uppercase leading-[0.95] sm:text-5xl lg:text-6xl',
                bloco.fundo === 'lime' ? 'text-g5-950' : 'text-white',
              )}
            >
              {bloco.titulo}
            </h2>
            {bloco.texto && (
              <p
                className={cn(
                  'mx-auto mt-5 max-w-2xl text-lg leading-relaxed',
                  bloco.fundo === 'lime' ? 'text-g5-900/80' : 'text-white/70',
                )}
              >
                {bloco.texto}
              </p>
            )}
            {bloco.botoes?.length ? (
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {bloco.botoes.map((b) => (
                  <Botao
                    key={b.id ?? b.url}
                    href={b.url}
                    estilo={bloco.fundo === 'lime' ? 'primario' : 'lime'}
                  >
                    {b.rotulo}
                  </Botao>
                ))}
              </div>
            ) : null}
          </Container>
        </section>
      )

    case 'listaProvas': {
      const provas = await getProximasProvas(bloco.quantidade ?? 6, Boolean(bloco.apenasDestaques))
      if (!provas.length) return null
      return (
        <section className="py-16">
          <Container>
            {bloco.titulo && <TituloSecao>{bloco.titulo}</TituloSecao>}
            <ul className="mt-10 divide-y divide-line border-y border-line">
              {provas.map((prova) => (
                <li key={prova.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
                  <span className="w-24 shrink-0 font-mono text-sm font-semibold tabular-nums text-ink-muted">
                    {formatarDataCurta(prova.data)}
                  </span>
                  <span className="min-w-0 flex-1 font-display text-xl font-bold uppercase text-g5-950">
                    {prova.titulo}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {prova.cidade}/{prova.uf}
                  </span>
                </li>
              ))}
            </ul>
            <Botao href="/corridas" estilo="texto" className="mt-8">
              Ver calendário completo →
            </Botao>
          </Container>
        </section>
      )
    }

    case 'equipe': {
      const selecionados = (bloco.professores ?? []).filter(
        (p): p is Professore => typeof p === 'object',
      )
      const professores = selecionados.length ? selecionados : await getProfessores()
      if (!professores.length) return null

      return (
        <section className="py-16">
          <Container>
            {bloco.titulo && <TituloSecao>{bloco.titulo}</TituloSecao>}
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {professores.map((prof) => {
                const foto = prof.foto as Midia | null | undefined
                return (
                  <article key={prof.id} className="overflow-hidden rounded-3xl border border-line bg-white">
                    <div className="relative aspect-4/5 bg-mist">
                      {foto?.url ? (
                        <Image src={caminhoMidia(foto.url)!} alt={foto.alt ?? prof.titulo} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                      ) : (
                        <div
                          aria-hidden
                          className="size-full"
                          style={{ backgroundImage: 'repeating-linear-gradient(115deg, var(--color-g5-100) 0 20px, var(--color-g5-50) 20px 40px)' }}
                        />
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-2xl font-bold uppercase text-g5-950">{prof.titulo}</h3>
                      {prof.funcao && <p className="mt-1 text-ink-muted">{prof.funcao}</p>}
                      {prof.cref && (
                        <p className="mt-2 font-mono text-xs font-semibold uppercase tracking-wider text-g5-600">
                          CREF {prof.cref}
                        </p>
                      )}
                      {prof.bio && (
                        <div className="mt-4 text-sm">
                          <TextoRico data={prof.bio} className="prose-sm" />
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </Container>
        </section>
      )
    }

    case 'galeria': {
      const albuns = (bloco.albuns ?? []).filter((a): a is Albun => typeof a === 'object')
      if (!albuns.length) return null
      return (
        <section className="py-16">
          <Container>
            {bloco.titulo && <TituloSecao>{bloco.titulo}</TituloSecao>}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {albuns.map((album) => {
                const capa = album.capa as Midia | null | undefined
                return (
                  <Link key={album.id} href={`/galeria#${album.slug}`} className="group overflow-hidden rounded-3xl border border-line">
                    <div className="relative aspect-4/3 bg-mist">
                      {capa?.url && (
                        <Image src={caminhoMidia(capa.url)!} alt={capa.alt ?? album.titulo} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-xl font-bold uppercase text-g5-950">{album.titulo}</h3>
                      <p className="mt-1 font-mono text-xs text-ink-muted">{formatarDataCurta(album.data)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Container>
        </section>
      )
    }

    case 'video': {
      const id = idDoYoutube(bloco.url ?? '')
      if (!id) return null
      return (
        <section className="py-14">
          <Container largura="leitura">
            {bloco.titulo && (
              <h2 className="mb-6 font-display text-3xl font-bold uppercase text-g5-950">{bloco.titulo}</h2>
            )}
            <div className="aspect-video overflow-hidden rounded-2xl bg-g5-950">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${id}`}
                title={bloco.titulo ?? 'Vídeo da G5 Esportes'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="size-full border-0"
              />
            </div>
          </Container>
        </section>
      )
    }

    case 'faq':
      return (
        <section className="py-16">
          <Container largura="leitura">
            {bloco.titulo && <TituloSecao>{bloco.titulo}</TituloSecao>}
            <Sanfona
              itens={(bloco.perguntas ?? []).map((p, i) => ({
                id: p.id ?? String(i),
                pergunta: p.pergunta,
                resposta: <TextoRico data={p.resposta} className="prose-base" />,
              }))}
            />
          </Container>
        </section>
      )

    default:
      return null
  }
}
