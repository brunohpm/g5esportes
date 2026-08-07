import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Container({
  children,
  className,
  largura = 'padrao',
}: {
  children: React.ReactNode
  className?: string
  largura?: 'padrao' | 'leitura' | 'largo'
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 lg:px-8',
        largura === 'leitura' && 'max-w-3xl',
        largura === 'padrao' && 'max-w-7xl',
        largura === 'largo' && 'max-w-[90rem]',
        className,
      )}
    >
      {children}
    </div>
  )
}

type BotaoProps = {
  href: string
  children: React.ReactNode
  estilo?: 'primario' | 'secundario' | 'texto' | 'lime'
  className?: string
  externo?: boolean
}

const ESTILOS: Record<NonNullable<BotaoProps['estilo']>, string> = {
  primario: 'bg-g5-600 text-white hover:bg-g5-700',
  secundario: 'border-2 border-current text-g5-900 hover:bg-g5-900 hover:text-white',
  lime: 'bg-g5-200 text-g5-950 hover:bg-g5-300',
  texto: 'text-g5-700 underline underline-offset-4 hover:text-g5-900 px-0 py-0',
}

export function Botao({ href, children, estilo = 'primario', className, externo }: BotaoProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-display text-lg font-bold uppercase tracking-wide transition-all active:scale-95',
    estilo !== 'texto' && 'px-7 py-3.5',
    ESTILOS[estilo],
    className,
  )

  if (externo || /^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}

/**
 * Título de seção com o marcador numerado — a referência de placa de raia
 * que se repete pelo site.
 */
export function TituloSecao({
  numero,
  children,
  apoio,
  claro = false,
  className,
}: {
  numero?: string
  children: React.ReactNode
  apoio?: string
  claro?: boolean
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {numero && (
        <span
          className={cn(
            'mb-3 inline-block font-mono text-sm font-semibold tracking-[0.3em]',
            claro ? 'text-g5-200' : 'text-g5-600',
          )}
        >
          {numero}
        </span>
      )}
      <h2
        className={cn(
          'font-display text-4xl font-extrabold uppercase leading-[0.95] sm:text-5xl lg:text-6xl',
          claro ? 'text-white' : 'text-g5-950',
        )}
      >
        {children}
      </h2>
      {apoio && (
        <p className={cn('mt-4 text-lg leading-relaxed', claro ? 'text-white/70' : 'text-ink-muted')}>
          {apoio}
        </p>
      )}
    </div>
  )
}

export function Etiqueta({
  children,
  cor = 'green',
  className,
}: {
  children: React.ReactNode
  cor?: string | null
  className?: string
}) {
  const cores: Record<string, string> = {
    green: 'bg-g5-600 text-white',
    lime: 'bg-g5-200 text-g5-950',
    forest: 'bg-g5-900 text-white',
    slate: 'bg-ink text-white',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 font-display text-sm font-bold uppercase tracking-wider',
        cores[cor ?? 'green'] ?? cores.green,
        className,
      )}
    >
      {children}
    </span>
  )
}
