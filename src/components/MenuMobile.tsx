'use client'

import { useEffect, useState } from 'react'
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
  const caminho = usePathname()

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

  return (
    <div className="ml-auto lg:hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="menu-mobile"
        className="grid size-11 place-items-center rounded-full text-white transition-colors hover:bg-white/10"
      >
        <span className="sr-only">{aberto ? 'Fechar menu' : 'Abrir menu'}</span>
        {aberto ? <X className="size-6" aria-hidden /> : <Hamburguer className="size-6" aria-hidden />}
      </button>

      {aberto && (
        <div
          id="menu-mobile"
          className="fixed inset-0 top-0 z-50 flex flex-col overflow-y-auto bg-g5-950 px-5 pb-10 pt-5 text-white"
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="font-display text-3xl font-extrabold text-g5-200">G5</span>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="grid size-11 place-items-center rounded-full transition-colors hover:bg-white/10"
            >
              <span className="sr-only">Fechar menu</span>
              <X className="size-6" aria-hidden />
            </button>
          </div>

          <nav aria-label="Menu principal">
            <ul className="space-y-1">
              {itens.map((item) => (
                <li key={item.id ?? item.url} className="border-b border-white/10 pb-3 last:border-0">
                  <Link
                    href={item.url}
                    className="block py-2.5 font-display text-3xl font-bold uppercase tracking-wide"
                  >
                    {item.rotulo}
                  </Link>
                  {item.submenu && item.submenu.length > 0 && (
                    <ul className="mt-1 space-y-0.5 pl-1">
                      {item.submenu.map((sub) => (
                        <li key={sub.id ?? sub.url}>
                          <Link href={sub.url} className="block py-2 text-white/65">
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
            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-g5-200 px-6 py-4 font-display text-2xl font-bold uppercase tracking-wide text-g5-950"
          >
            {areaAlunoRotulo}
            <ExternalLink className="size-5" aria-hidden />
          </a>
        </div>
      )}
    </div>
  )
}
