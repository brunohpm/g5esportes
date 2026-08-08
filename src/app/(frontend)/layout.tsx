import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import localFont from 'next/font/local'
import { Cabecalho } from '@/components/Cabecalho'
import { Rodape } from '@/components/Rodape'
import { BotaoWhatsapp } from '@/components/BotaoWhatsapp'
import { getConfiguracoes } from '@/lib/payload'
import './styles.css'

/**
 * Hanson Bold — os títulos. Tem a acentuação completa do português, que é o
 * que mais importa num título em caixa alta.
 *
 * Não tem — … [ ] { } $ º ª °. Isso é tratado na cadeia de fallback do
 * styles.css: o navegador substitui GLIFO A GLIFO, então "R$ 145" sai com o
 * cifrão em Archivo e o resto em Hanson, sem quebrar.
 */
const display = localFont({
  src: [{ path: '../../fontes/Hanson-Bold.otf', weight: '700', style: 'normal' }],
  variable: '--fonte-display',
  display: 'swap',
  // Ajusta a métrica do fallback para reduzir o pulo de layout na troca.
  adjustFontFallback: false,
})

/**
 * Conthrax SemiBold — a fonte da marca. Carrega a assinatura "G5 ESPORTES",
 * os rótulos de seção e os botões. Acentuação completa (testada em
 * scripts/testar-fontes.mjs).
 *
 * É desenho de display: ótima em caixa alta e pouco texto, ruim em parágrafo.
 * Por isso não entra no corpo.
 */
const marca = localFont({
  src: [{ path: '../../fontes/Conthrax-SemiBold.otf', weight: '600', style: 'normal' }],
  variable: '--fonte-marca',
  display: 'swap',
  adjustFontFallback: false,
})

/**
 * Grotesca de trabalho para texto corrido. Fica no calendário de provas por
 * ter algarismos tabulares — é o que mantém as datas alinhadas na coluna.
 */
const texto = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fonte-texto',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getConfiguracoes()
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  return {
    metadataBase: new URL(base),
    title: {
      default: `${cfg.nomeSite ?? 'G5 Esportes'} · Assessoria de Corrida em Curitiba`,
      template: `%s · ${cfg.nomeSite ?? 'G5 Esportes'}`,
    },
    description: cfg.descricao ?? cfg.slogan ?? undefined,
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: cfg.nomeSite ?? 'G5 Esportes',
    },
    alternates: { canonical: '/' },
  }
}

export const viewport: Viewport = {
  themeColor: '#0a3d1c',
}

export default async function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${marca.variable} ${texto.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-g5-600 focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <Cabecalho />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Rodape />
        <BotaoWhatsapp />
      </body>
    </html>
  )
}
