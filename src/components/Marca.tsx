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

  /*
   * O lockup é quase quadrado (164x139), então numa barra horizontal ele só
   * ganha presença se usar quase toda a altura disponível do cabeçalho.
   */
  const alturas = {
    compacto: 'h-10',
    normal: 'h-13 sm:h-15',
    grande: 'h-20',
  }[tamanho]

  /*
   * Assinatura desenhada em vetor (scripts/gerar-logo.mjs). É <img> comum e
   * não next/image de propósito: SVG já é resolução-independente e leve
   * (2,8 KB), então otimizar não traz nada — e `images.localPatterns` do
   * next.config restringe o otimizador aos uploads do Payload.
   */
  return (
    <img
      src="/marca-g5.svg"
      alt={nome}
      width={164}
      height={139}
      className={cn('w-auto', alturas, className)}
    />
  )
}
