import type { Field } from 'payload'
import { slugify } from '@/lib/slug'

/**
 * Campo de slug que se preenche sozinho a partir de outro campo (por padrão `titulo`).
 * O editor não precisa pensar nele, mas pode ajustar quando quiser.
 */
export const campoSlug = (origem = 'titulo'): Field => ({
  name: 'slug',
  type: 'text',
  label: 'Endereço (slug)',
  index: true,
  unique: true,
  required: true,
  admin: {
    position: 'sidebar',
    description:
      'Preenchido automaticamente pelo título. Cuidado: alterar depois de publicado quebra o link antigo.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.trim().length > 0) return slugify(value)
        const base = data?.[origem]
        if (typeof base === 'string' && base.trim().length > 0) return slugify(base)
        return value
      },
    ],
  },
})
