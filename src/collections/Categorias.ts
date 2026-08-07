import type { CollectionConfig } from 'payload'
import { logado, publico, somenteAdmin } from '@/access'
import { campoSlug } from '@/fields/slug'

export const Categorias: CollectionConfig = {
  slug: 'categorias',
  labels: { singular: 'Categoria', plural: 'Categorias' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'slug', 'ordem'],
    group: 'Conteúdo',
    description: 'As seções do blog. Mantenha poucas — o menu do blog é montado a partir daqui.',
  },
  access: {
    read: publico,
    create: logado,
    update: logado,
    delete: somenteAdmin,
  },
  defaultSort: 'ordem',
  fields: [
    {
      name: 'titulo',
      type: 'text',
      label: 'Nome',
      required: true,
    },
    {
      name: 'descricao',
      type: 'textarea',
      label: 'Descrição',
      admin: {
        description: 'Aparece no topo da página da categoria e na meta description.',
      },
    },
    {
      name: 'cor',
      type: 'select',
      label: 'Cor da etiqueta',
      defaultValue: 'green',
      options: [
        { label: 'Verde', value: 'green' },
        { label: 'Verde-limão', value: 'lime' },
        { label: 'Floresta', value: 'forest' },
        { label: 'Cinza', value: 'slate' },
      ],
    },
    {
      name: 'ordem',
      type: 'number',
      label: 'Ordem no menu',
      defaultValue: 100,
      admin: { position: 'sidebar' },
    },
    {
      name: 'slugsAntigos',
      type: 'text',
      hasMany: true,
      label: 'Slugs antigos do WordPress',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Usados para redirecionar as URLs antigas de categoria.',
      },
    },
    campoSlug(),
  ],
}
