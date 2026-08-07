import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * O Payload devolve a URL absoluta do arquivo (`http://host/api/midia/file/x.webp`).
 * O otimizador de imagens do Next 16 recusa buscar em host que resolve para IP
 * privado — e mesmo em produção, buscar o próprio servidor pela rede é
 * desperdício. Reduzindo ao caminho, o Next lê o arquivo internamente.
 */
export function caminhoMidia(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith('/')) return url
  try {
    const u = new URL(url)
    return `${u.pathname}${u.search}`
  } catch {
    return url
  }
}

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
})

const formatadorDataCurta = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
})

/** "09 de dezembro de 2025" */
export function formatarData(data: string | Date): string {
  return formatadorData.format(new Date(data))
}

/** "09/12/2025" */
export function formatarDataCurta(data: string | Date): string {
  return formatadorDataCurta.format(new Date(data))
}

/** Limpa entidades e tags HTML para usar em resumos e meta description. */
export function textoSimples(html: string, limite = 200): string {
  const texto = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (texto.length <= limite) return texto
  return texto.slice(0, limite).replace(/\s+\S*$/, '') + '…'
}
