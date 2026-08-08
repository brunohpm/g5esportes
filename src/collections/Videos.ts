import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import { logado, publico } from '@/access'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vídeos hospedados no próprio servidor.
 *
 * Separada da biblioteca de imagens de propósito: `midia` gera três variantes
 * com o sharp e converte tudo para webp, o que não faz sentido para vídeo — e
 * poluiria a lista de fotos com arquivos de dezenas de MB.
 *
 * QUANDO USAR CADA UM
 * - YouTube: melhor para o vídeo institucional. A entrega é pela rede do
 *   Google, a qualidade se adapta à conexão de quem assiste e não consome
 *   banda do VPS, que é compartilhado com outros três sites.
 * - Arquivo aqui: bom para clipes curtos, quando não se quer o vídeo no
 *   YouTube ou quando ele não deve ser público lá.
 */
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Vídeo', plural: 'Vídeos' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'filename', 'filesize'],
    group: 'Conteúdo',
    description:
      'Vídeos guardados no servidor. Para o vídeo institucional, o YouTube costuma ser melhor — não gasta banda do servidor e ajusta a qualidade à conexão de quem assiste.',
  },
  access: {
    read: publico,
    create: logado,
    update: logado,
    delete: logado,
  },
  upload: {
    staticDir: path.resolve(dirname, '../../media/videos'),
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    // Nada de variantes: sharp não processa vídeo.
    disableLocalStorage: false,
  },
  fields: [
    {
      name: 'titulo',
      type: 'text',
      label: 'Título',
      required: true,
      admin: { description: 'Só para você encontrar depois; não aparece no site.' },
    },
    {
      name: 'legenda',
      type: 'text',
      label: 'Descrição para acessibilidade',
      admin: {
        description: 'Resuma o que acontece no vídeo, para quem usa leitor de tela.',
      },
    },
    {
      name: 'capa',
      type: 'upload',
      relationTo: 'midia',
      label: 'Imagem de capa',
      admin: {
        description:
          'Aparece antes de o vídeo tocar. Sem ela o navegador mostra um quadro preto — vale sempre colocar.',
      },
    },
  ],
}
