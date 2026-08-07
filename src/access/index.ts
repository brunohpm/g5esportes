import type { Access, FieldAccess } from 'payload'

type UsuarioLogado = { role?: 'admin' | 'editor' } | null | undefined

const ehAdmin = (user: UsuarioLogado) => user?.role === 'admin'

/** Qualquer visitante lê. Usado no conteúdo público do site. */
export const publico: Access = () => true

/** Precisa estar logado (admin ou editor). */
export const logado: Access = ({ req: { user } }) => Boolean(user)

/** Só administradores. */
export const somenteAdmin: Access = ({ req: { user } }) => ehAdmin(user as UsuarioLogado)

/** Só administradores — versão para acesso a campo. */
export const campoSomenteAdmin: FieldAccess = ({ req: { user } }) => ehAdmin(user as UsuarioLogado)

/**
 * Conteúdo publicado é público; rascunhos só aparecem para quem está logado.
 * Usado nas coleções com versionamento/draft.
 */
export const publicadoOuLogado: Access = ({ req: { user } }) => {
  if (user) return true
  return {
    _status: {
      equals: 'published',
    },
  }
}

/** Administradores mexem em qualquer usuário; editores só no próprio cadastro. */
export const adminOuProprioUsuario: Access = ({ req: { user } }) => {
  if (!user) return false
  if (ehAdmin(user as UsuarioLogado)) return true
  return { id: { equals: user.id } }
}
