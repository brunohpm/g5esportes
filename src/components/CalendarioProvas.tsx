'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, Search, X } from 'lucide-react'
import type { Prova } from '@/payload-types'
import { cn } from '@/lib/utils'

const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const ROTULO_TIPO: Record<string, string> = {
  rua: 'Rua',
  trail: 'Trail',
  ultra: 'Ultra',
  infantil: 'Infantil',
  revezamento: 'Revezamento',
  caminhada: 'Caminhada',
  multi: 'Triatlo',
}

/** Distâncias que valem virar filtro rápido, na ordem que um corredor pensa. */
const DISTANCIAS_DESTAQUE = ['5km', '10km', '21km', '42km']

const mesDe = (iso: string) => new Date(iso).getUTCMonth()
const diaDe = (iso: string) => new Date(iso).getUTCDate()

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        'rounded-full border-2 px-4 py-1.5 font-display text-base font-bold uppercase tracking-wide transition-colors',
        ativo
          ? 'border-g5-600 bg-g5-600 text-white'
          : 'border-line bg-white text-ink-muted hover:border-g5-400 hover:text-g5-800',
      )}
    >
      {children}
    </button>
  )
}

export function CalendarioProvas({ provas }: { provas: Prova[] }) {
  const [distancia, setDistancia] = useState<string | null>(null)
  const [tipo, setTipo] = useState<string | null>(null)
  const [mes, setMes] = useState<number | null>(null)
  const [busca, setBusca] = useState('')

  const cidades = useMemo(
    () => [...new Set(provas.map((p) => p.cidade))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [provas],
  )

  const tiposPresentes = useMemo(
    () => [...new Set(provas.map((p) => p.tipo).filter(Boolean))] as string[],
    [provas],
  )

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return provas.filter((p) => {
      if (distancia && !(p.distancias ?? []).includes(distancia)) return false
      if (tipo && p.tipo !== tipo) return false
      if (mes !== null && mesDe(p.data) !== mes) return false
      if (termo) {
        const alvo = `${p.titulo} ${p.cidade} ${p.organizador ?? ''}`.toLowerCase()
        if (!alvo.includes(termo)) return false
      }
      return true
    })
  }, [provas, distancia, tipo, mes, busca])

  const porMes = useMemo(() => {
    const grupos = new Map<number, Prova[]>()
    for (const p of filtradas) {
      const m = mesDe(p.data)
      if (!grupos.has(m)) grupos.set(m, [])
      grupos.get(m)!.push(p)
    }
    return [...grupos.entries()].sort((a, b) => a[0] - b[0])
  }, [filtradas])

  const temFiltro = distancia || tipo || mes !== null || busca

  const limpar = () => {
    setDistancia(null)
    setTipo(null)
    setMes(null)
    setBusca('')
  }

  return (
    <div>
      {/* Filtros */}
      {/* Gruda logo abaixo do cabeçalho: faixa de 4px + barra (h-19 / sm:h-21). */}
      <div className="sticky top-20 z-30 -mx-5 border-y border-line bg-white/95 px-5 py-4 backdrop-blur-md sm:top-22 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
            Distância
          </span>
          {DISTANCIAS_DESTAQUE.map((d) => (
            <Chip key={d} ativo={distancia === d} onClick={() => setDistancia(distancia === d ? null : d)}>
              {d}
            </Chip>
          ))}

          {tiposPresentes.length > 1 && (
            <>
              <span className="ml-4 mr-1 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                Tipo
              </span>
              {tiposPresentes.map((t) => (
                <Chip key={t} ativo={tipo === t} onClick={() => setTipo(tipo === t ? null : t)}>
                  {ROTULO_TIPO[t] ?? t}
                </Chip>
              ))}
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <label className="relative">
              <span className="sr-only">Buscar prova ou cidade</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar prova ou cidade"
                className="w-56 rounded-full border-2 border-line py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-g5-500"
              />
            </label>

            {temFiltro && (
              <button
                type="button"
                onClick={limpar}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-mist hover:text-g5-800"
              >
                <X className="size-4" aria-hidden />
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {MESES.map((nome, i) => {
            const quantidade = provas.filter((p) => mesDe(p.data) === i).length
            if (quantidade === 0) return null
            return (
              <button
                key={nome}
                type="button"
                onClick={() => setMes(mes === i ? null : i)}
                aria-pressed={mes === i}
                className={cn(
                  'rounded-lg px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider transition-colors',
                  mes === i ? 'bg-g5-950 text-g5-200' : 'text-ink-muted hover:bg-mist',
                )}
              >
                {MESES_CURTOS[i]}
                <span className="ml-1.5 opacity-50">{quantidade}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-6 font-mono text-sm text-ink-muted" role="status">
        {filtradas.length === provas.length
          ? `${provas.length} provas no calendário`
          : `${filtradas.length} de ${provas.length} provas`}
        {cidades.length > 0 && ` · ${cidades.length} cidades`}
      </p>

      {filtradas.length === 0 ? (
        <div className="mt-10 rounded-3xl border-2 border-dashed border-line py-20 text-center">
          <p className="font-display text-2xl font-bold uppercase text-ink-muted">
            Nenhuma prova com esses filtros
          </p>
          <button
            type="button"
            onClick={limpar}
            className="mt-4 font-semibold text-g5-600 underline underline-offset-4"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {porMes.map(([indiceMes, doMes]) => (
            <section key={indiceMes}>
              <h2 className="flex items-baseline gap-4 font-display text-3xl font-extrabold uppercase tracking-tight text-g5-950">
                {MESES[indiceMes]}
                <span aria-hidden className="h-px flex-1 bg-line" />
                <span className="font-mono text-sm font-semibold text-ink-muted">
                  {doMes.length}
                </span>
              </h2>

              <ul className="mt-4">
                {doMes.map((prova) => (
                  <li
                    key={prova.id}
                    className={cn(
                      'group grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-2 border-b border-line py-5 transition-colors hover:bg-mist sm:grid-cols-[auto_1fr_auto]',
                      prova.cancelada && 'opacity-50',
                    )}
                  >
                    {/* Bloco de data: o número é o elemento gráfico da linha. */}
                    <div className="flex w-16 flex-col items-center rounded-xl bg-g5-950 py-2 text-center">
                      <span className="font-display text-3xl font-extrabold leading-none text-g5-200 tabular-nums">
                        {String(diaDe(prova.data)).padStart(2, '0')}
                      </span>
                      <span className="mt-0.5 font-mono text-[0.625rem] font-semibold tracking-widest text-white/50">
                        {MESES_CURTOS[mesDe(prova.data)]}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-bold uppercase leading-tight text-g5-950">
                        {prova.linkInscricao ? (
                          <a
                            href={prova.linkInscricao}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 hover:text-g5-600"
                          >
                            {prova.titulo}
                            <ExternalLink className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />
                          </a>
                        ) : (
                          prova.titulo
                        )}
                        {prova.cancelada && (
                          <span className="ml-2 align-middle font-mono text-xs uppercase text-red-600">
                            cancelada
                          </span>
                        )}
                      </h3>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {prova.cidade}
                        {prova.uf ? `/${prova.uf}` : ''}
                        {prova.horario ? ` · ${prova.horario}` : ''}
                        {prova.organizador ? ` · ${prova.organizador}` : ''}
                      </p>
                    </div>

                    <ul className="col-start-2 flex flex-wrap gap-1.5 sm:col-start-3 sm:justify-end">
                      {prova.tipo && prova.tipo !== 'rua' && (
                        <li className="rounded-md bg-g5-900 px-2 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-g5-200">
                          {ROTULO_TIPO[prova.tipo] ?? prova.tipo}
                        </li>
                      )}
                      {(prova.distancias ?? []).map((d) => (
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
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
