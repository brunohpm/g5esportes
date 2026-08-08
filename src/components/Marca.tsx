import Image from 'next/image'
import type { Configuracoe, Midia } from '@/payload-types'
import { caminhoMidia, cn } from '@/lib/utils'

/**
 * A assinatura da G5, empilhada: "G5" grande com "ESPORTES" espaçado embaixo.
 *
 * O lettering sai em Conthrax, que é a fonte da marca. Mas o "G5" do logo
 * oficial NÃO é tipografia — é um desenho próprio, com o G em curva aberta e o
 * 5 fundido nele. Nenhuma fonte reproduz isso.
 *
 * Por isso: assim que o arquivo do logo for enviado em Configurações do site,
 * ele substitui este lettering. O texto aqui é só o que segura enquanto isso.
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
          tamanho === 'normal' && 'h-12 sm:h-14',
          tamanho === 'grande' && 'h-20',
          className,
        )}
      />
    )
  }

  const escalas = {
    compacto: { g5: 'text-2xl', esportes: 'text-[0.5rem]' },
    normal: { g5: 'text-3xl sm:text-4xl', esportes: 'text-[0.55rem] sm:text-[0.62rem]' },
    grande: { g5: 'text-5xl', esportes: 'text-[0.8rem]' },
  }[tamanho]

  return (
    <span className={cn('block text-center font-marca leading-none', className)}>
      <span className={cn('block font-semibold tracking-tight text-g5-200', escalas.g5)}>G5</span>
      {/*
        O tracking à direita empurra o bloco meio caractere; a margem esquerda
        compensa e mantém "ESPORTES" centrado sob o "G5".
      */}
      <span
        className={cn(
          'ml-[0.3em] mt-1 block font-semibold uppercase tracking-[0.3em] text-white/75',
          escalas.esportes,
        )}
      >
        Esportes
      </span>
    </span>
  )
}
