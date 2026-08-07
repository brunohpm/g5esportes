import type { Metadata, Viewport } from 'next'
import { Archivo, Montserrat } from 'next/font/google'
import { Cabecalho } from '@/components/Cabecalho'
import { Rodape } from '@/components/Rodape'
import { BotaoWhatsapp } from '@/components/BotaoWhatsapp'
import { getConfiguracoes } from '@/lib/payload'
import './styles.css'

/**
 * Geométrica e pesada, na construção do lettering "G5 ESPORTES" da marca.
 * Carrega títulos, a assinatura e os botões.
 */
const display = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--fonte-display',
  display: 'swap',
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
    <html lang="pt-BR" className={`${display.variable} ${texto.variable}`}>
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
