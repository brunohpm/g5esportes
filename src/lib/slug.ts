/**
 * Marcas de acentuação combinantes (U+0300–U+036F), separadas pelo normalize('NFD').
 * Construída via string ASCII para o arquivo não depender de caracteres invisíveis.
 */
const ACENTOS = new RegExp('[\\u0300-\\u036f]', 'g')

/**
 * Gera slugs limpos a partir de texto em português — remove acentos, pontuação
 * e entidades HTML que vêm do WordPress (`&nbsp;`, `&#8211;`).
 */
export function slugify(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .normalize('NFD')
    .replace(ACENTOS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/g, '')
}
