'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, Menu as Hamburguer, X } from 'lucide-react'
import type { Menu } from '@/payload-types'

type Props = {
  itens: NonNullable<Menu['principal']>
  areaAlunoUrl: string
  areaAlunoRotulo: string
}

export function MenuMobile({ itens, areaAlunoUrl, areaAlunoRotulo }: Props) {
  const [aberto, setAberto] = useState(false)
  const [montado, setMontado] = useState(false)
  const caminho = usePathname()

  // O portal precisa do document, que não existe na renderização do servidor.
  useEffect(() => setMontado(true), [])

  // Navegar fecha o menu; o pathname mudando é o sinal mais confiável disso.
  useEffect(() => setAberto(false), [caminho])

  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [aberto])

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  /*
   * O painel vai para o <body> por portal, e não fica dentro do <header>.
   * Motivo: o cabeçalho usa `backdrop-blur`, e um ancestral com `backdrop-filter`
   * diferente de `none` passa a ser o bloco de contenção dos descendentes
   * `position: fixed` — o `inset-0` se resolveria contra a faixa do cabeçalho
   * em vez da tela, e o menu abriria espremido dentro dela.
   */
  const painel = (
    <div
      id="menu-mobile"
      className="fixed inset-0 z-100 flex flex-col bg-g5-950 text-white lg:hidden"
      style={{
        // Respeita o notch e a barra de gestos do iPhone.
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex shrink-0 items-center justify-between px-5 py-3">
        <span className="font-display text-3xl font-extrabold leading-none text-g5-200">G5</span>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="-mr-2 grid size-11 place-items-center rounded-full transition-colors hover:bg-white/10"
        >
          <span className="sr-only">Fechar menu</span>
          <X className="size-6" aria-hidden />
        </button>
      </div>

      {/* Só a lista rola; o botão da Área do Aluno fica ancorado no rodapé.
          Assim o CTA principal continua visível em tela pequena e não some se
          o cliente acrescentar itens ao menu pelo painel. */}
      <nav
        aria-label="Menu principal"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"
      >
        <ul>
          {itens.map((item) => (
            <li key={item.id ?? item.url} className="border-b border-white/10 last:border-0">
              <Link
                href={item.url}
                className="titulo-display block pb-1 pt-3 font-display text-2xl font-bold uppercase tracking-wide"
              >
                {item.rotulo}
              </Link>
              {item.submenu && item.submenu.length > 0 && (
                <ul className="pb-2">
                  {item.submenu.map((sub) => (
                    <li key={sub.id ?? sub.url}>
                      <Link href={sub.url} className="block py-1.5 text-white/60">
                        {sub.rotulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <a
        href={areaAlunoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-5 mb-5 mt-4 flex shrink-0 items-center justify-center gap-2 rounded-full bg-g5-200 px-6 py-3.5 font-display text-xl font-bold uppercase tracking-wide text-g5-950"
      >
        {areaAlunoRotulo}
        <ExternalLink className="size-5" aria-hidden />
      </a>
    </div>
  )

  return (
    <div className="ml-auto lg:hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="menu-mobile"
        className="-mr-2 grid size-11 place-items-center rounded-full text-white transition-colors hover:bg-white/10"
      >
        <span className="sr-only">{aberto ? 'Fechar menu' : 'Abrir menu'}</span>
        {aberto ? <X className="size-6" aria-hidden /> : <Hamburguer className="size-6" aria-hidden />}
      </button>

      {montado && aberto && createPortal(painel, document.body)}
    </div>
  )
}
