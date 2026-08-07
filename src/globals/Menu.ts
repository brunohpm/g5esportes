import type { GlobalConfig } from 'payload'
import { logado, publico } from '@/access'

export const Menu: GlobalConfig = {
  slug: 'menu',
  label: 'Menu de navegação',
  admin: {
    group: 'Configurações',
    description:
      'Controla o menu do topo e os links do rodapé. Mantenha o topo com até 5 itens — é o que faz a navegação ficar legível.',
  },
  access: { read: publico, update: logado },
  fields: [
    {
      name: 'principal',
      type: 'array',
      label: 'Menu principal',
      maxRows: 6,
      fields: [
        { name: 'rotulo', type: 'text', label: 'Nome', required: true },
        {
          name: 'url',
          type: 'text',
          label: 'Link',
          required: true,
          admin: { description: 'Caminho interno (ex.: /treinos) ou endereço completo.' },
        },
        {
          name: 'submenu',
          type: 'array',
          label: 'Submenu',
          maxRows: 6,
          fields: [
            { name: 'rotulo', type: 'text', label: 'Nome', required: true },
            { name: 'url', type: 'text', label: 'Link', required: true },
            { name: 'descricao', type: 'text', label: 'Descrição curta' },
          ],
        },
      ],
    },
    {
      name: 'rodape',
      type: 'array',
      label: 'Colunas do rodapé',
      maxRows: 4,
      fields: [
        { name: 'titulo', type: 'text', label: 'Título da coluna', required: true },
        {
          name: 'links',
          type: 'array',
          label: 'Links',
          fields: [
            { name: 'rotulo', type: 'text', label: 'Nome', required: true },
            { name: 'url', type: 'text', label: 'Link', required: true },
          ],
        },
      ],
    },
  ],
}
