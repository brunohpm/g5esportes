import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const serverURL = new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000')

const nextConfig: NextConfig = {
  images: {
    // As imagens são servidas pelo próprio Payload; `caminhoMidia()` reduz a URL
    // absoluta ao caminho para o otimizador ler o arquivo internamente.
    localPatterns: [{ pathname: '/api/midia/file/**', search: '' }],
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false,
  // Necessário para a imagem Docker de produção.
  output: 'standalone',
  /*
   * Todas as URLs antigas do WordPress terminavam com barra. Sem isto, o Next
   * emite um 308 removendo a barra e só depois o middleware emite o 301 —
   * dois saltos para cada uma das 322 URLs indexadas. Desligando, o middleware
   * resolve em um único 301.
   */
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: path.resolve(dirname),
  },
  // Os 1.582 redirects da migração ficam no middleware (src/middleware.ts):
  // o Next avisa acima de 1.000 rotas customizadas, e um Map resolve em O(1).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // Uploads são imutáveis: o nome muda quando o arquivo muda.
        source: '/api/midia/file/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
