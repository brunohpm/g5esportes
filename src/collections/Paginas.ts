import type { CollectionConfig } from 'payload'
import { logado, publicadoOuLogado, somenteAdmin } from '@/access'
import { campoSlug } from '@/fields/slug'
import { blocosDePagina } from '@/blocks'

export const Paginas: CollectionConfig = {
  slug: 'paginas',
  labels: { singular: 'Página', plural: 'Páginas' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'slug', 'arquivada', '_status'],
    group: 'Conteúdo',
    description: 'Páginas institucionais montadas por blocos.',
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/${data?.slug ?? ''}`,
    },
    preview: (doc) =>
      `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/${doc?.slug ?? ''}`,
  },
  access: {
    read: publicadoOuLogado,
    create: logado,
    update: logado,
    delete: somenteAdmin,
  },
  versions: {
    drafts: { autosave: { interval: 800 } },
    maxPerDoc: 20,
  },
  fields: [
    {
      name: 'titulo',
      type: 'text',
      label: 'Título',
      required: true,
    },
    {
      name: 'resumo',
      type: 'textarea',
      label: 'Resumo',
      maxLength: 300,
      admin: { description: 'Usado no compartilhamento e na busca do Google.' },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Blocos da página',
      blocks: blocosDePagina,
      admin: {
        description: 'Monte a página empilhando blocos. Arraste para reordenar.',
      },
    },
    campoSlug(),
    {
      name: 'arquivada',
      type: 'checkbox',
      label: 'Página arquivada',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Continua acessível pelo link direto, mas sai dos menus e recebe aviso de conteúdo antigo. Usado nos calendários de anos anteriores.',
      },
    },
    {
      name: 'ocultarDoSitemap',
      type: 'checkbox',
      label: 'Ocultar do sitemap',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'legado',
      type: 'group',
      label: 'Origem no WordPress',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.legado?.wpId),
      },
      fields: [
        { name: 'wpId', type: 'number', label: 'ID no WordPress', index: true, admin: { readOnly: true } },
        { name: 'urlAntiga', type: 'text', label: 'URL antiga', admin: { readOnly: true } },
      ],
    },
  ],
}
