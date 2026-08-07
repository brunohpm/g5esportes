import type { CollectionConfig } from 'payload'
import { logado, publicadoOuLogado, somenteAdmin } from '@/access'
import { campoSlug } from '@/fields/slug'
import { textoSimples } from '@/lib/utils'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Post', plural: 'Posts' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'categorias', 'publicadoEm', '_status'],
    group: 'Conteúdo',
    description: 'Notícias, artigos e avisos. É aqui que o blog do site é alimentado.',
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/blog/${data?.slug ?? ''}`,
    },
    preview: (doc) =>
      `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/blog/${doc?.slug ?? ''}`,
  },
  access: {
    read: publicadoOuLogado,
    create: logado,
    update: logado,
    delete: somenteAdmin,
  },
  versions: {
    drafts: {
      autosave: { interval: 800 },
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
  defaultSort: '-publicadoEm',
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Conteúdo',
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
              admin: {
                description:
                  'Duas ou três linhas que aparecem na listagem e no compartilhamento. Se deixar vazio, geramos a partir do texto.',
              },
            },
            {
              name: 'capa',
              type: 'upload',
              relationTo: 'midia',
              label: 'Imagem de capa',
              admin: {
                description: 'Formato horizontal (paisagem) funciona melhor. Ideal: 1600×900.',
              },
            },
            {
              name: 'conteudo',
              type: 'richText',
              label: 'Texto',
              required: true,
            },
          ],
        },
        {
          label: 'Organização',
          fields: [
            {
              name: 'categorias',
              type: 'relationship',
              relationTo: 'categorias',
              hasMany: true,
              label: 'Categorias',
              required: true,
              admin: {
                description: 'Escolha ao menos uma. Define onde o post aparece na navegação.',
              },
            },
            {
              name: 'tags',
              type: 'relationship',
              relationTo: 'tags',
              hasMany: true,
              label: 'Tags',
            },
            {
              name: 'provasRelacionadas',
              type: 'relationship',
              relationTo: 'provas',
              hasMany: true,
              label: 'Provas relacionadas',
              admin: {
                description: 'Liga o post a provas do calendário (opcional).',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'publicadoEm',
      type: 'date',
      label: 'Data de publicação',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' },
      },
    },
    {
      name: 'autor',
      type: 'relationship',
      relationTo: 'usuarios',
      label: 'Autor',
      admin: { position: 'sidebar' },
      defaultValue: ({ user }) => user?.id,
    },
    {
      name: 'destaque',
      type: 'checkbox',
      label: 'Destacar na home',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Posts destacados aparecem em evidência na página inicial.',
      },
    },
    campoSlug(),
    {
      name: 'legado',
      type: 'group',
      label: 'Origem no WordPress',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.legado?.wpId),
      },
      fields: [
        {
          name: 'wpId',
          type: 'number',
          label: 'ID no WordPress',
          index: true,
          admin: { readOnly: true },
        },
        {
          name: 'urlAntiga',
          type: 'text',
          label: 'URL antiga',
          admin: { readOnly: true },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Resumo em branco: deriva do texto para a listagem nunca ficar vazia.
        if (!data.resumo && data.conteudo) {
          const texto = JSON.stringify(data.conteudo)
            .match(/"text":"((?:[^"\\]|\\.)*)"/g)
            ?.map((t) => t.slice(8, -1).replace(/\\"/g, '"').replace(/\\n/g, ' '))
            .join(' ')
          if (texto) data.resumo = textoSimples(texto, 220)
        }
        return data
      },
    ],
  },
}
