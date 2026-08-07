import type { CollectionConfig } from 'payload'
import { logado, publico, somenteAdmin } from '@/access'
import { campoSlug } from '@/fields/slug'

export const Albuns: CollectionConfig = {
  slug: 'albuns',
  labels: { singular: 'Álbum', plural: 'Galeria' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'data', 'tipo'],
    group: 'Conteúdo',
    description: 'Fotos e vídeos de provas e treinos.',
  },
  access: {
    read: publico,
    create: logado,
    update: logado,
    delete: somenteAdmin,
  },
  defaultSort: '-data',
  fields: [
    {
      name: 'titulo',
      type: 'text',
      label: 'Título',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'data',
          type: 'date',
          label: 'Data',
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
          },
        },
        {
          name: 'tipo',
          type: 'select',
          label: 'Tipo',
          defaultValue: 'prova',
          required: true,
          admin: { width: '50%' },
          options: [
            { label: 'Prova', value: 'prova' },
            { label: 'Treino', value: 'treino' },
            { label: 'Evento G5', value: 'evento' },
          ],
        },
      ],
    },
    {
      name: 'descricao',
      type: 'textarea',
      label: 'Descrição',
    },
    {
      name: 'capa',
      type: 'upload',
      relationTo: 'midia',
      label: 'Capa do álbum',
    },
    {
      name: 'fotos',
      type: 'upload',
      relationTo: 'midia',
      hasMany: true,
      label: 'Fotos',
      admin: { description: 'Arraste várias de uma vez.' },
    },
    {
      name: 'videos',
      type: 'array',
      label: 'Vídeos do YouTube',
      fields: [
        { name: 'titulo', type: 'text', label: 'Título' },
        { name: 'url', type: 'text', label: 'Link do YouTube', required: true },
      ],
    },
    {
      name: 'prova',
      type: 'relationship',
      relationTo: 'provas',
      label: 'Prova relacionada',
      admin: { position: 'sidebar' },
    },
    campoSlug(),
  ],
}
