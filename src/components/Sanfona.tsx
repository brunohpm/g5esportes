import { ChevronDown } from 'lucide-react'

type Item = {
  id: string
  pergunta: string
  resposta: React.ReactNode
}

/**
 * Perguntas frequentes com <details>/<summary> — abre e fecha sem JavaScript,
 * e o conteúdo continua encontrável pela busca do navegador.
 */
export function Sanfona({ itens }: { itens: Item[] }) {
  if (!itens.length) return null

  return (
    <div className="mt-10 divide-y divide-line border-y border-line">
      {itens.map((item) => (
        <details key={item.id} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-xl font-bold uppercase leading-tight text-g5-950 transition-colors hover:text-g5-600 [&::-webkit-details-marker]:hidden">
            {item.pergunta}
            <ChevronDown
              className="size-5 shrink-0 text-g5-600 transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="pb-6">{item.resposta}</div>
        </details>
      ))}
    </div>
  )
}
