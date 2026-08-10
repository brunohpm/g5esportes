/**
 * Extrai o ID de um vídeo do YouTube de qualquer formato de link.
 *
 * Usa o parser de URL do próprio JavaScript em vez de uma expressão regular:
 * o parâmetro `v` não é necessariamente o primeiro da query. O YouTube gera
 * endereços como `watch?reload=9&v=ZBEHcsjgBNg`, e um regex que procura
 * literalmente por "watch?v=" não encontra nada nesse caso.
 */
export function idDoYoutube(url?: string | null): string | null {
  if (!url) return null

  const limpo = url.trim()
  if (!limpo) return null

  const ehId = (v: string | null | undefined): v is string =>
    typeof v === 'string' && /^[A-Za-z0-9_-]{6,}$/.test(v)

  try {
    const u = new URL(limpo)
    const host = u.hostname.replace(/^www\./, '')

    // youtu.be/ID
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return ehId(id) ? id : null
    }

    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      // watch?v=ID — em qualquer posição da query
      const v = u.searchParams.get('v')
      if (ehId(v)) return v

      // /embed/ID, /v/ID, /shorts/ID, /live/ID
      const partes = u.pathname.split('/').filter(Boolean)
      if (['embed', 'v', 'shorts', 'live'].includes(partes[0])) {
        return ehId(partes[1]) ? partes[1] : null
      }
    }

    return null
  } catch {
    // Não é URL válida: aceita o ID colado sozinho.
    return ehId(limpo) ? limpo : null
  }
}
