import type { CollectionConfig } from 'payload'
import { logado, publico, somenteAdmin } from '@/access'
import { campoSlug } from '@/fields/slug'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'Tag', plural: 'Tags' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'slug'],
    group: 'Conteúdo',
    description: 'Assuntos livres. Use para relacionar posts; a navegação principal usa categorias.',
  },
  access: {
    read: publico,
    create: logado,
    update: logado,
    delete: somenteAdmin,
  },
  fields: [
    {
      name: 'titulo',
      type: 'text',
      label: 'Nome',
      required: true,
    },
    campoSlug(),
  ],
}
