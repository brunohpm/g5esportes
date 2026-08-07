import type { CollectionConfig } from 'payload'
import { logado, publico, somenteAdmin } from '@/access'
import { campoSlug } from '@/fields/slug'

export const Professores: CollectionConfig = {
  slug: 'professores',
  labels: { singular: 'Professor', plural: 'Professores' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'cref', 'ordem'],
    group: 'Conteúdo',
    description: 'A equipe técnica da G5.',
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
      type: 'row',
      fields: [
        {
          name: 'cref',
          type: 'text',
          label: 'CREF',
          admin: { width: '50%', placeholder: 'Ex.: 12986-G/PR' },
        },
        {
          name: 'funcao',
          type: 'text',
          label: 'Função',
          admin: { width: '50%', placeholder: 'Ex.: Treinador de corrida' },
        },
      ],
    },
    {
      name: 'foto',
      type: 'upload',
      relationTo: 'midia',
      label: 'Foto',
      admin: { description: 'Formato quadrado ou vertical. Ideal: 800×800.' },
    },
    {
      name: 'bio',
      type: 'richText',
      label: 'Biografia',
    },
    {
      name: 'especialidades',
      type: 'array',
      label: 'Especialidades',
      fields: [{ name: 'item', type: 'text', label: 'Especialidade', required: true }],
    },
    {
      name: 'redes',
      type: 'group',
      label: 'Redes sociais',
      fields: [
        { name: 'instagram', type: 'text', label: 'Instagram' },
        { name: 'strava', type: 'text', label: 'Strava' },
        { name: 'email', type: 'email', label: 'E-mail' },
      ],
    },
    {
      name: 'ordem',
      type: 'number',
      label: 'Ordem de exibição',
      defaultValue: 100,
      admin: { position: 'sidebar' },
    },
    campoSlug(),
  ],
}
