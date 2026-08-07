import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { Midia } from '@/payload-types'
import { caminhoMidia } from '@/lib/utils'
import { getConfiguracoes, getMenu } from '@/lib/payload'
import { MenuMobile } from './MenuMobile'
import { RedesSociais } from './RedesSociais'

export async function Cabecalho() {
  const [menu, cfg] = await Promise.all([getMenu(), getConfiguracoes()])
  const itens = menu.principal ?? []

  // O cabeçalho é escuro: prefere a versão clara do logo, cai na normal.
  const logo = ((cfg.logoClara ?? cfg.logo) as Midia | null | undefined) ?? null

  return (
    <header className="sticky top-0 z-50 bg-g5-950/95 text-white backdrop-blur-md">
      {/* Raia de largada: a assinatura gráfica que amarra header e rodapé. */}
      <div
        aria-hidden
        className="h-1 w-full"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, var(--color-g5-200) 0 14px, var(--color-g5-600) 14px 28px)',
        }}
      />

      <div className="mx-auto flex h-18 max-w-7xl items-center gap-2 px-5 sm:gap-4 lg:gap-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-baseline gap-1.5 font-display leading-none sm:gap-2"
          aria-label={`${cfg.nomeSite ?? 'G5 Esportes'} — página inicial`}
        >
          {logo?.url ? (
            /*
             * Assim que o arquivo do logo for enviado em Configurações do site
             * → "Logo para fundo escuro", ele substitui o lettering. Enquanto
             * não houver, o texto abaixo desenha a marca na própria Montserrat.
             */
            <Image
              src={caminhoMidia(logo.url)!}
              alt={cfg.nomeSite ?? 'G5 Esportes'}
              width={logo.width ?? 200}
              height={logo.height ?? 56}
              priority
              className="h-9 w-auto sm:h-11"
            />
          ) : (
            <>
              <span className="text-3xl font-black tracking-tight text-g5-200 transition-colors group-hover:text-white sm:text-4xl">
                G5
              </span>
              <span className="hidden text-lg font-semibold uppercase tracking-[0.18em] text-white/70 sm:block sm:text-xl">
                Esportes
              </span>
            </>
          )}
        </Link>

        {/*
          Redes coladas na marca, no topo. Antes só existiam no rodapé — e o
          site é longo, então quem queria o Instagram precisava rolar tudo.
          Ficam visíveis em qualquer largura: no menor aparelho testado (344px)
          sobram ~100px depois de "G5", dos três ícones e do hambúrguer.
        */}
        <RedesSociais cfg={cfg} tamanho="compacto" />

        <nav aria-label="Menu principal" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {itens.map((item) => (
              <li key={item.id ?? item.url} className="group relative">
                <Link
                  href={item.url}
                  className="flex items-center rounded-full px-4 py-2.5 font-display text-lg font-semibold uppercase tracking-wide text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.rotulo}
                </Link>

                {item.submenu && item.submenu.length > 0 && (
                  <div className="invisible absolute left-0 top-full w-72 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <ul className="overflow-hidden rounded-2xl border border-white/10 bg-g5-950 p-2 shadow-erguido">
                      {item.submenu.map((sub) => (
                        <li key={sub.id ?? sub.url}>
                          <Link
                            href={sub.url}
                            className="block rounded-xl px-4 py-3 transition-colors hover:bg-white/10"
                          >
                            <span className="block font-semibold text-white">{sub.rotulo}</span>
                            {sub.descricao && (
                              <span className="mt-0.5 block text-sm leading-snug text-white/55">
                                {sub.descricao}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={cfg.areaAlunoUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto hidden items-center gap-2 rounded-full bg-g5-200 px-5 py-2.5 font-display text-lg font-bold uppercase tracking-wide text-g5-950 transition-transform hover:scale-[1.03] active:scale-95 lg:ml-0 lg:flex"
        >
          {cfg.areaAlunoRotulo ?? 'Área do Aluno'}
          <ExternalLink className="size-4" aria-hidden />
        </a>

        <MenuMobile
          itens={itens}
          areaAlunoUrl={cfg.areaAlunoUrl ?? '#'}
          areaAlunoRotulo={cfg.areaAlunoRotulo ?? 'Área do Aluno'}
        />
      </div>
    </header>
  )
}
