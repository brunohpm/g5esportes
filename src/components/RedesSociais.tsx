import { Facebook, Instagram, Youtube } from 'lucide-react'
import type { Configuracoe } from '@/payload-types'
import { cn } from '@/lib/utils'

const REDES = [
  { chave: 'instagram', Icone: Instagram, nome: 'Instagram' },
  { chave: 'facebook', Icone: Facebook, nome: 'Facebook' },
  { chave: 'youtube', Icone: Youtube, nome: 'YouTube' },
] as const

export function RedesSociais({
  cfg,
  tamanho = 'normal',
  className,
}: {
  cfg: Configuracoe
  tamanho?: 'compacto' | 'normal'
  className?: string
}) {
  const ativas = REDES.map((r) => ({ ...r, url: cfg[r.chave] })).filter(
    (r): r is (typeof REDES)[number] & { url: string } => Boolean(r.url),
  )

  if (ativas.length === 0) return null

  const compacto = tamanho === 'compacto'

  return (
    <ul className={cn('flex items-center', compacto ? 'gap-0.5' : 'gap-3', className)}>
      {ativas.map(({ url, Icone, nome }) => (
        <li key={nome}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'grid place-items-center rounded-full transition-colors',
              compacto
                ? 'size-9 text-white/70 hover:bg-white/10 hover:text-g5-200'
                : 'size-11 border border-white/15 hover:border-g5-200 hover:bg-g5-200 hover:text-g5-950',
            )}
          >
            <span className="sr-only">{nome} da G5 Esportes</span>
            <Icone className={compacto ? 'size-5' : 'size-5'} aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  )
}
