import type { CollectionConfig } from 'payload'
import { logado, publico, somenteAdmin } from '@/access'
import { campoSlug } from '@/fields/slug'

/**
 * Substitui as 14 páginas de "Calendário de Corridas" do site antigo por dados
 * estruturados — uma única página `/corridas` filtra por ano, mês, cidade e distância.
 */
export const Provas: CollectionConfig = {
  slug: 'provas',
  labels: { singular: 'Prova', plural: 'Calendário de provas' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'data', 'cidade', 'ano', 'destaque'],
    group: 'Conteúdo',
    description: 'As corridas do calendário. Cadastre uma vez e ela aparece em todos os lugares.',
    listSearchableFields: ['titulo', 'cidade', 'organizador'],
  },
  access: {
    read: publico,
    create: logado,
    update: logado,
    delete: somenteAdmin,
  },
  defaultSort: 'data',
  fields: [
    {
      name: 'titulo',
      type: 'text',
      label: 'Nome da prova',
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
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
          },
        },
        {
          name: 'horario',
          type: 'text',
          label: 'Horário da largada',
          admin: { width: '50%', placeholder: 'Ex.: 07h00' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'cidade',
          type: 'text',
          label: 'Cidade',
          required: true,
          defaultValue: 'Curitiba',
          index: true,
          admin: { width: '70%' },
        },
        {
          name: 'uf',
          type: 'select',
          label: 'UF',
          defaultValue: 'PR',
          admin: { width: '30%' },
          options: [
            'PR', 'SC', 'RS', 'SP', 'RJ', 'MG', 'ES', 'BA', 'PE', 'CE', 'DF', 'GO',
            'MT', 'MS', 'PA', 'AM', 'RN', 'PB', 'AL', 'SE', 'PI', 'MA', 'TO', 'RO',
            'AC', 'AP', 'RR', 'EX',
          ].map((uf) => ({ label: uf === 'EX' ? 'Exterior' : uf, value: uf })),
        },
      ],
    },
    {
      name: 'distancias',
      type: 'text',
      hasMany: true,
      label: 'Distâncias',
      index: true,
      admin: {
        description:
          'Uma por linha, no formato "5km", "21km". Os filtros do site usam exatamente esse texto.',
      },
    },
    {
      name: 'tipo',
      type: 'select',
      label: 'Tipo de prova',
      defaultValue: 'rua',
      index: true,
      options: [
        { label: 'Corrida de rua', value: 'rua' },
        { label: 'Trail / montanha', value: 'trail' },
        { label: 'Ultramaratona', value: 'ultra' },
        { label: 'Infantil', value: 'infantil' },
        { label: 'Revezamento', value: 'revezamento' },
        { label: 'Caminhada', value: 'caminhada' },
        { label: 'Triatlo / duatlo', value: 'multi' },
      ],
    },
    {
      name: 'organizador',
      type: 'text',
      label: 'Organização',
    },
    {
      name: 'linkInscricao',
      type: 'text',
      label: 'Link de inscrição',
      admin: { description: 'Endereço do site oficial ou da página de inscrição.' },
    },
    {
      name: 'observacoes',
      type: 'textarea',
      label: 'Observações',
    },
    {
      name: 'ano',
      type: 'number',
      label: 'Ano',
      index: true,
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Calculado a partir da data.',
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          ({ siblingData }) => {
            const data = siblingData?.data
            if (data) return new Date(data).getUTCFullYear()
            return undefined
          },
        ],
      },
    },
    {
      name: 'destaque',
      type: 'checkbox',
      label: 'Prova em destaque',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Provas-alvo da assessoria. Aparecem primeiro e na home.',
      },
    },
    {
      name: 'cancelada',
      type: 'checkbox',
      label: 'Cancelada / adiada',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    campoSlug(),
  ],
}
