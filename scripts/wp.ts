/**
 * Acesso à API pública do WordPress.com do site antigo da G5.
 * O endpoint `/media` exige autenticação, então as imagens são descobertas
 * a partir do HTML do conteúdo e do campo `jetpack_featured_media_url`.
 */

export const WP_BASE = 'https://public-api.wordpress.com/wp/v2/sites/g5esportes.wordpress.com'
export const SITE_ANTIGO = 'https://g5esportes.com'

/**
 * O WordPress.com redimensiona sob demanda. 1600px cobre o maior tamanho que o
 * site novo exibe e reduz o download de ~2,4 GB para ~370 MB.
 */
export const LARGURA_MAXIMA = 1600
export const QUALIDADE = 85

export type WpRenderizado = { rendered: string }

export type WpPost = {
  id: number
  date: string
  slug: string
  link: string
  title: WpRenderizado
  content: WpRenderizado
  excerpt: WpRenderizado
  categories: number[]
  tags: number[]
  jetpack_featured_media_url?: string
}

export type WpPagina = {
  id: number
  date: string
  slug: string
  link: string
  parent: number
  menu_order: number
  title: WpRenderizado
  content: WpRenderizado
  excerpt: WpRenderizado
  jetpack_featured_media_url?: string
}

export type WpTermo = {
  id: number
  name: string
  slug: string
  count: number
  description: string
}

async function buscarJson(url: string, tentativas = 3): Promise<Response> {
  let ultimoErro: unknown
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'g5esportes-migracao/1.0' } })
      if (res.ok) return res
      // 4xx não melhora com retry.
      if (res.status < 500) throw new Error(`HTTP ${res.status} em ${url}`)
      ultimoErro = new Error(`HTTP ${res.status} em ${url}`)
    } catch (erro) {
      ultimoErro = erro
    }
    await new Promise((r) => setTimeout(r, 800 * (i + 1)))
  }
  throw ultimoErro
}

/** Baixa todas as páginas de um endpoint da API, 100 por vez. */
export async function buscarTudo<T>(endpoint: string, campos?: string[]): Promise<T[]> {
  const resultado: T[] = []
  let pagina = 1
  let totalPaginas = 1

  do {
    const params = new URLSearchParams({ per_page: '100', page: String(pagina) })
    if (campos?.length) params.set('_fields', campos.join(','))
    const res = await buscarJson(`${WP_BASE}/${endpoint}?${params}`)
    totalPaginas = Number(res.headers.get('x-wp-totalpages') ?? '1')
    resultado.push(...((await res.json()) as T[]))
    pagina++
  } while (pagina <= totalPaginas)

  return resultado
}

/**
 * Normaliza uma URL de imagem: remove parâmetros, desfaz o proxy `i0.wp.com`
 * e aponta tudo para o mesmo host, para não baixar a mesma foto duas vezes.
 */
export function normalizarUrlImagem(url: string): string | null {
  if (!url) return null
  let limpa = url.trim().replace(/&amp;/g, '&')
  if (limpa.startsWith('//')) limpa = `https:${limpa}`
  if (!/^https?:\/\//i.test(limpa)) return null

  limpa = limpa.split('?')[0]

  // https://i0.wp.com/g5esportes.com/wp-content/... -> https://g5esportes.com/wp-content/...
  const proxy = limpa.match(/^https?:\/\/i\d\.wp\.com\/(.+)$/i)
  if (proxy) limpa = `https://${proxy[1]}`

  // O host canônico dos uploads é o .wordpress.com.
  limpa = limpa.replace(
    /^https?:\/\/g5esportes\.com\/wp-content\//i,
    'https://g5esportes.wordpress.com/wp-content/',
  )

  return limpa
}

/** URL de download com o redimensionamento do CDN aplicado. */
export function urlDownload(urlLimpa: string): string {
  if (/\.(svg|gif|pdf)$/i.test(urlLimpa)) return urlLimpa
  return `${urlLimpa}?w=${LARGURA_MAXIMA}&quality=${QUALIDADE}`
}

/** Extrai o ID de um vídeo do YouTube de qualquer formato de link. */
export function idDoYoutube(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  )
  return m ? m[1] : null
}

/** `/2025/12/09/slug/` a partir do link completo do WordPress. */
export function caminhoAntigo(link: string): string {
  try {
    const u = new URL(link)
    return u.pathname
  } catch {
    return link
  }
}
