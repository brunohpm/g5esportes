import { NextResponse, type NextRequest } from 'next/server'
import redirects from '../redirects.json'

/**
 * Redirects 301 das URLs do WordPress, gerados por `npm run migrate:wp`.
 *
 * Ficam aqui e não em `next.config.ts` porque são ~1.600 — acima do limite
 * recomendado de rotas customizadas do Next. Um Map resolve em O(1) e o
 * arquivo é carregado uma única vez, no boot.
 *
 * Como `skipTrailingSlashRedirect` está ligado, este arquivo também normaliza
 * a barra final — assim cada URL antiga faz um único salto até o destino, em
 * vez de 308 seguido de 301.
 *
 * (No Next 16 esta convenção chama-se `proxy`; era `middleware` até o 15.)
 */
const MAPA = new Map<string, string>(
  (redirects as { origem: string; destino: string }[]).map((r) => [r.origem, r.destino]),
)

export default function proxy(req: NextRequest) {
  const { pathname, search, origin } = req.nextUrl
  const semBarra = pathname.replace(/\/+$/, '') || '/'

  const destino = MAPA.get(semBarra)
  if (destino) {
    const url = new URL(destino, origin)
    /*
     * Mescla a query da URL antiga sem sobrescrever a do destino: alguns
     * destinos já trazem a sua (`/corridas?ano=2026`), e um acesso vindo de
     * campanha (`?utm_source=...`) não pode apagar o filtro de ano.
     */
    for (const [chave, valor] of new URLSearchParams(search)) {
      if (!url.searchParams.has(chave)) url.searchParams.append(chave, valor)
    }
    return NextResponse.redirect(url, 301)
  }

  // Barra final em endereço que não é redirect antigo: normaliza mesmo assim,
  // para o site ter uma única forma canônica de cada URL.
  if (pathname !== semBarra) {
    return NextResponse.redirect(new URL(`${semBarra}${search}`, origin), 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Tudo, menos:
     * - /admin e /api  (painel e API do Payload)
     * - /_next         (assets do Next)
     * - arquivos com extensão (favicon, robots, imagens estáticas)
     */
    '/((?!admin|api|_next|.*\\.[a-zA-Z0-9]+$).*)',
  ],
}
