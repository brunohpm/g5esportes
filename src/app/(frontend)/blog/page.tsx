import type { Metadata } from 'next'
import { ListaBlog } from '@/components/ListaBlog'
import { getCategoriasComPosts, getPosts } from '@/lib/payload'


/*
 * Renderização sob demanda: o layout inteiro (menu, contato, rodapé) vem do
 * banco, então pré-gerar exigiria o banco no build da imagem Docker. Além
 * disso, o que o cliente publica aparece na hora, sem esperar revalidação.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Notícias, artigos e avisos da G5 Esportes: corrida de rua, treinos, provas e a rotina da assessoria em Curitiba.',
}

export default async function PaginaBlog({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>
}) {
  const { pagina } = await searchParams
  const numeroPagina = Math.max(1, Number(pagina) || 1)

  const [resultado, categorias] = await Promise.all([
    getPosts({ pagina: numeroPagina, limite: 12 }),
    getCategoriasComPosts(),
  ])

  return (
    <ListaBlog
      titulo="Blog"
      chapeu="Diário de treinos"
      descricao="Tudo o que a G5 escreve: avisos da assessoria, artigos sobre treino e o registro das provas que corremos juntos."
      resultado={resultado}
      categorias={categorias}
      base="/blog"
    />
  )
}
