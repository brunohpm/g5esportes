import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { getConfiguracoes, getMenu } from '@/lib/payload'
import { Marca } from './Marca'
import { MenuMobile } from './MenuMobile'
import { RedesSociais } from './RedesSociais'

export async function Cabecalho() {
  const [menu, cfg] = await Promise.all([getMenu(), getConfiguracoes()])
  const itens = menu.principal ?? []

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

      <div className="mx-auto flex h-19 max-w-7xl items-center gap-2 px-5 sm:h-21 sm:gap-4 lg:gap-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-85"
          aria-label={`${cfg.nomeSite ?? 'G5 Esportes'} — página inicial`}
        >
          <Marca cfg={cfg} />
        </Link>

        {/*
          Redes coladas na marca, no topo. Antes só existiam no rodapé — e o
          site é longo, então quem queria o Instagram precisava rolar tudo.
          Ficam visíveis em qualquer largura: no menor aparelho testado (344px)
          sobram ~100px depois de "G5", dos três ícones e do hambúrguer.
        */}
        <RedesSociais cfg={cfg} tamanho="compacto" />

        {/*
          O menu horizontal só a partir de xl (1280px). Medido em 1024px:
          marca 97 + redes 112 + menu 567 + botão 200 = 976px de conteúdo,
          mais 64 de padding e 96 de espaçamento = 1136px numa tela de 1024.
          Não é questão de apertar — não cabe. Entre 1024 e 1279 vale o
          hambúrguer, e o botão da Área do Aluno continua à vista.
        */}
        <nav aria-label="Menu principal" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {itens.map((item) => (
              <li key={item.id ?? item.url} className="group relative">
                {/*
                  `whitespace-nowrap` é obrigatório: sem ele, "A G5" quebra no
                  espaço entre as palavras quando o cabeçalho aperta e o item
                  vira duas linhas dentro da barra. Item de menu nunca quebra.
                  O tamanho sobe só a partir de xl, onde há folga de verdade.
                */}
                <Link
                  href={item.url}
                  className="flex items-center whitespace-nowrap rounded-full px-3 py-2.5 font-display text-base font-semibold uppercase tracking-wide text-white/85 transition-colors hover:bg-white/10 hover:text-white xl:px-4 xl:text-lg"
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
          /*
            `shrink-0` para o botão nunca ser espremido, e tamanho menor até
            xl: em 1024px o menu de desktop aparece pela primeira vez e a barra
            inteira (marca, redes, cinco itens e este botão) não cabia — a
            página passava a rolar 7px de lado em TODAS as telas.
            Conthrax aqui, igual aos demais botões do site.
          */
          className="ml-auto hidden shrink-0 items-center gap-2 rounded-full bg-g5-200 px-4 py-2.5 font-marca text-xs font-semibold uppercase tracking-[0.08em] text-g5-950 transition-transform hover:scale-[1.03] active:scale-95 lg:flex xl:ml-0 xl:px-5 xl:text-sm"
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
