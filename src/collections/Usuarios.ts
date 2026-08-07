import type { CollectionConfig } from 'payload'
import { adminOuProprioUsuario, campoSomenteAdmin, somenteAdmin } from '@/access'

export const Usuarios: CollectionConfig = {
  slug: 'usuarios',
  labels: { singular: 'Usuário', plural: 'Usuários' },
  auth: true,
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'email', 'role'],
    group: 'Configurações',
    description: 'Quem pode entrar no painel e publicar conteúdo.',
  },
  access: {
    create: somenteAdmin,
    read: adminOuProprioUsuario,
    update: adminOuProprioUsuario,
    delete: somenteAdmin,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'nome',
      type: 'text',
      label: 'Nome',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      label: 'Permissão',
      required: true,
      defaultValue: 'editor',
      access: {
        // Um editor não pode se promover a administrador.
        create: campoSomenteAdmin,
        update: campoSomenteAdmin,
      },
      options: [
        { label: 'Administrador (acesso total)', value: 'admin' },
        { label: 'Editor (publica conteúdo)', value: 'editor' },
      ],
      admin: {
        description:
          'Editor cria e publica posts, provas, álbuns e páginas. Administrador também mexe em usuários e configurações do site.',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Mini biografia',
      admin: {
        description: 'Aparece no rodapé dos posts assinados por este usuário.',
      },
    },
    {
      name: 'foto',
      type: 'upload',
      relationTo: 'midia',
      label: 'Foto',
    },
  ],
}
