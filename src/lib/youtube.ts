/** Extrai o ID de um vídeo do YouTube de qualquer formato de link. */
export function idDoYoutube(url: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : null
}
