import Image from 'next/image'
import type { Configuracoe, Midia } from '@/payload-types'
import { caminhoMidia, cn } from '@/lib/utils'

/**
 * A assinatura da G5, empilhada como na arte da marca: "G5" grande com
 * "ESPORTES" espaçado embaixo.
 *
 * Se houver logo enviado em Configurações do site, ele substitui o lettering —
 * é o caminho para usar a Conthrax de verdade, já que a licença gratuita dela
 * cobre gerar a arte, mas não embutir a fonte no site.
 */
export function Marca({
  cfg,
  tamanho = 'normal',
  className,
}: {
  cfg: Configuracoe
  tamanho?: 'compacto' | 'normal' | 'grande'
  className?: string
}) {
  const logo = ((cfg.logoClara ?? cfg.logo) as Midia | null | undefined) ?? null
  const nome = cfg.nomeSite ?? 'G5 Esportes'

  if (logo?.url) {
    return (
      <Image
        src={caminhoMidia(logo.url)!}
        alt={nome}
        width={logo.width ?? 220}
        height={logo.height ?? 64}
        priority
        className={cn(
          'w-auto',
          tamanho === 'compacto' && 'h-10',
          tamanho === 'normal' && 'h-12',
          tamanho === 'grande' && 'h-16',
          className,
        )}
      />
    )
  }

  const escalas = {
    compacto: { g5: 'text-2xl', esportes: 'text-[0.5rem]' },
    normal: { g5: 'text-3xl sm:text-4xl', esportes: 'text-[0.6rem] sm:text-[0.68rem]' },
    grande: { g5: 'text-5xl', esportes: 'text-[0.85rem]' },
  }[tamanho]

  return (
    <span className={cn('block text-center font-display leading-none', className)}>
      <span className={cn('block font-black tracking-tight text-g5-200', escalas.g5)}>G5</span>
      {/*
        O tracking à direita empurra o texto meio caractere; a margem esquerda
        compensa e mantém o bloco centrado sob o "G5".
      */}
      <span
        className={cn(
          'ml-[0.34em] mt-0.5 block font-semibold uppercase tracking-[0.34em] text-white/75',
          escalas.esportes,
        )}
      >
        Esportes
      </span>
    </span>
  )
}
