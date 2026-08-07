/**
 * Converte os calendários de corrida que o site antigo mantinha como texto
 * corrido em registros estruturados da coleção `provas`.
 *
 * Os dois formatos que aparecem no conteúdo da G5:
 *   2026 →  "18 - Circuito Sanepar 5 e 10km (Guaratuba/PR)"
 *   2025 →  "06 - Corrida da Polícia Federal - Curitiba/PR (5 e 10km)"
 */

import type { Prova } from '../src/payload-types'

const MESES: Record<string, number> = {
  JANEIRO: 1, FEVEREIRO: 2, MARCO: 3, ABRIL: 4, MAIO: 5, JUNHO: 6,
  JULHO: 7, AGOSTO: 8, SETEMBRO: 9, OUTUBRO: 10, NOVEMBRO: 11, DEZEMBRO: 12,
}

const UFS = new Set([
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
  'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
])

type UF = NonNullable<Prova['uf']>

export type ProvaExtraida = {
  titulo: string
  data: string
  cidade: string
  uf: UF
  distancias: string[]
  tipo: NonNullable<Prova['tipo']>
}

const semAcento = (s: string) =>
  s.normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')

/** Transforma "5, 10, 21 e 42km" ou "4 e 8km" em ["5km","10km","21km","42km"]. */
function extrairDistancias(trecho: string): string[] {
  const distancias = new Set<string>()

  // Grupos como "5, 10, 21 e 42km" — os números compartilham o "km" final.
  for (const m of trecho.matchAll(/((?:\d{1,3}(?:[.,]\d)?\s*(?:,|e|and|\/)\s*)*\d{1,3}(?:[.,]\d)?)\s*(km|k\b|milhas?)/gi)) {
    const numeros = m[1].match(/\d{1,3}(?:[.,]\d)?/g) ?? []
    const unidade = /milha/i.test(m[2]) ? 'milhas' : 'km'
    for (const n of numeros) distancias.add(`${n.replace(',', '.')}${unidade}`)
  }

  // "12h" de provas de tempo fixo.
  for (const m of trecho.matchAll(/\b(\d{1,2})\s*h\b/gi)) distancias.add(`${m[1]}h`)

  return [...distancias]
}

function detectarTipo(texto: string): ProvaExtraida['tipo'] {
  const t = semAcento(texto).toLowerCase()
  if (/\btrail\b|montanha|cross/.test(t)) return 'trail'
  if (/\bultra\b|\b(5[0-9]|[6-9][0-9]|1\d{2})km\b|\b\d{1,2}h\b/.test(t)) return 'ultra'
  if (/infantil|kids|mirim/.test(t)) return 'infantil'
  if (/revezamento|estafeta/.test(t)) return 'revezamento'
  if (/caminhada/.test(t)) return 'caminhada'
  if (/\btri\b|triathlon|tri hard|duatlo|bike and run|aquathlon/.test(t)) return 'multi'
  return 'rua'
}

/** Conectores que não podem abrir um nome de cidade. */
const CONECTORES = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na'])

/**
 * Palavras de nome de prova que às vezes grudam na cidade — o calendário
 * escreve "1ª Etapa Guaratuba/PR", em que só "Guaratuba" é a cidade.
 * As estações entram porque o Circuito das Estações nomeia assim cada etapa.
 */
const PALAVRAS_DE_PROVA = new Set([
  'maratona', 'meia', 'corrida', 'circuito', 'trail', 'desafio', 'trofeu',
  'volta', 'grande', 'internacional', 'etapa', 'run', 'night', 'noturna',
  'verao', 'outono', 'inverno', 'primavera', 'final', 'abertura',
])

/** Ordinais como "1ª", "2a", "3º". */
const ORDINAL = /^\d{1,2}[ªºao]?$/i

/**
 * Remove do começo da cidade o que sobrou do nome da prova, mantendo pelo
 * menos uma palavra — cidades compostas ("São José dos Pinhais") ficam inteiras.
 */
function limparCidade(texto: string): string {
  let palavras = texto.split(/\s+/).filter(Boolean)

  while (palavras.length > 1) {
    const primeira = semAcento(palavras[0]).toLowerCase()
    if (PALAVRAS_DE_PROVA.has(primeira) || CONECTORES.has(primeira) || ORDINAL.test(palavras[0])) {
      palavras = palavras.slice(1)
      continue
    }
    break
  }

  return palavras.join(' ')
}

/**
 * Procura "Cidade/UF" em qualquer posição da linha.
 * O texto capturado antes da barra pode conter o nome da prova junto
 * ("Maratona de Curitiba/PR"), então a cidade fica limitada às últimas
 * palavras e o nome completo é devolvido em `resto`.
 */
function extrairLocal(texto: string): { cidade: string; uf: string; resto: string } {
  // Para em traços, parênteses e vírgulas — eles separam nome de local.
  const re = /([A-Za-zÀ-ÿ'.\s]{2,40})\s*\/\s*([A-Z]{2})\b/g
  let melhor: RegExpExecArray | null = null
  let m: RegExpExecArray | null

  while ((m = re.exec(texto)) !== null) {
    if (UFS.has(m[2])) melhor = m
  }

  if (!melhor) return { cidade: '', uf: '', resto: texto }

  const capturado = melhor[1].replace(/^[\s\-–(]+|[\s\-–]+$/g, '').trim()

  const resto = (texto.slice(0, melhor.index) + ' ' + texto.slice(melhor.index + melhor[0].length))
    .replace(/\(\s*\)/g, '')
    .trim()

  // Caso normal: o local vem separado do nome, então o capturado já é a cidade
  // inteira — inclusive nomes longos como "São José dos Pinhais".
  if (resto.replace(/\([^)]*\)/g, '').trim().length >= 3) {
    return { cidade: limparCidade(capturado), uf: melhor[2], resto }
  }

  // Caso fundido ("Maratona de Curitiba/PR"): o nome da prova engoliu a cidade.
  // Mantém o nome inteiro como título e recorta as últimas palavras como cidade.
  const cidade = limparCidade(capturado.split(/\s+/).slice(-2).join(' '))

  return { cidade, uf: melhor[2], resto: texto.replace(/\s*\/\s*[A-Z]{2}\b/, '') }
}

const arrumarEspacos = (s: string) =>
  s
    .replace(/\s*[-–]\s*$/g, '')
    .replace(/^\s*[-–]\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .trim()

function limparNome(texto: string): string {
  const semParenteses = texto.replace(/\([^)]*\)/g, ' ')

  const completo = arrumarEspacos(
    semParenteses
      .replace(/(?:\d{1,3}(?:[.,]\d)?\s*(?:,|e|\/)\s*)*\d{1,3}(?:[.,]\d)?\s*(?:km|milhas?)\b/gi, ' ')
      .replace(/\b\d{1,2}\s*h\b/gi, ' '),
  )
  if (completo) return completo

  // A distância era o próprio nome ("10 Milhas", "21k de BC") — preserva.
  return arrumarEspacos(semParenteses)
}

/**
 * Recebe o HTML de um calendário e o ano de referência.
 * Retorna as provas encontradas e as linhas que não deram para interpretar.
 */
export function extrairProvas(
  html: string,
  ano: number,
): { provas: ProvaExtraida[]; ignoradas: string[] } {
  const texto = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')

  const provas: ProvaExtraida[] = []
  const ignoradas: string[] = []
  let mesAtual = 0

  for (const bruta of texto.split('\n')) {
    const linha = bruta.trim()
    if (!linha) continue

    const cabecalho = MESES[semAcento(linha).toUpperCase().replace(/[^A-Z]/g, '')]
    if (cabecalho) {
      mesAtual = cabecalho
      continue
    }

    const m = linha.match(/^(\d{1,2})\s*[-–]\s*(.+)$/)
    if (!m || !mesAtual) {
      // "05" sozinho é só um dia sem prova no calendário original.
      if (!/^\d{1,2}$/.test(linha)) ignoradas.push(linha)
      continue
    }

    const dia = Number(m[1])
    if (dia < 1 || dia > 31) {
      ignoradas.push(linha)
      continue
    }

    const corpo = m[2].trim()
    const { cidade, uf, resto } = extrairLocal(corpo)
    const titulo = limparNome(resto || corpo)
    if (!titulo) {
      ignoradas.push(linha)
      continue
    }

    provas.push({
      titulo,
      // Meio-dia UTC evita que o fuso empurre a data para o dia anterior.
      data: new Date(Date.UTC(ano, mesAtual - 1, dia, 12)).toISOString(),
      cidade: cidade || 'A confirmar',
      // `extrairLocal` só devolve siglas que estão em UFS, que é a mesma lista
      // de opções do campo — daí o cast ser seguro aqui.
      uf: (uf || 'PR') as UF,
      distancias: extrairDistancias(corpo),
      tipo: detectarTipo(corpo),
    })
  }

  return { provas, ignoradas }
}
