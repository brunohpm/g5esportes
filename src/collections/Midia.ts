import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import { logado, publico } from '@/access'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const Midia: CollectionConfig = {
  slug: 'midia',
  labels: { singular: 'Imagem', plural: 'Mídia' },
  admin: {
    group: 'Conteúdo',
    description: 'Fotos e arquivos usados no site.',
  },
  access: {
    read: publico,
    create: logado,
    update: logado,
    delete: logado,
  },
  upload: {
    // Fica fora de src/ para o bind mount do VPS apontar direto para cá.
    // MEDIA_DIR deixa o caminho explícito em produção, sem depender de como o
    // bundler do Next resolve `import.meta.url` no build standalone.
    staticDir: process.env.MEDIA_DIR || path.resolve(dirname, '../../media'),
    mimeTypes: ['image/*', 'application/pdf'],
    focalPoint: true,
    /*
     * Redimensiona o ORIGINAL antes de guardar. Sem isto, uma foto de celular
     * ou drone entra com 4000px e ~4 MB e fica assim no disco: cada tamanho
     * novo que o site pede obriga o otimizador a ler e reprocessar o arquivo
     * inteiro, e a primeira visita à seção fica visivelmente lenta.
     * 2400px cobre com folga o maior uso (imagem de fundo em tela cheia).
     */
    resizeOptions: {
      width: 2400,
      height: 2400,
      fit: 'inside',
      withoutEnlargement: true,
    },
    imageSizes: [
      { name: 'thumb', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800 },
      { name: 'hero', width: 1600 },
    ],
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texto alternativo',
      admin: {
        description:
          'Descreva a imagem em poucas palavras. Serve para leitores de tela e para o Google.',
      },
    },
    {
      name: 'creditos',
      type: 'text',
      label: 'Créditos / fotógrafo',
    },
    {
      name: 'origemWordpress',
      type: 'text',
      label: 'URL original no WordPress',
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Preenchido pela migração. Evita baixar a mesma imagem duas vezes.',
      },
    },
  ],
}
