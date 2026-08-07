import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/**
 * A homologação (g5.prattsolutions.com.br) fica fora do índice até o corte de
 * DNS — evita que o Google veja o site duplicado. Só o endereço definitivo
 * libera a indexação.
 *
 * Este arquivo precisa ficar na raiz de `src/app`: dentro do route group
 * `(frontend)` o Next não registra a rota e /robots.txt cai em 404.
 */
const EH_PRODUCAO = BASE === 'https://g5esportes.com'

export default function robots(): MetadataRoute.Robots {
  if (!EH_PRODUCAO) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
