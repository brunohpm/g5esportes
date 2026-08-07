import Image from 'next/image'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { Midia } from '@/payload-types'
import { idDoYoutube } from '@/lib/youtube'
import { caminhoMidia, cn } from '@/lib/utils'

type NoBlocoVideo = SerializedBlockNode<{ blockType: 'videoEmbed'; url: string; legenda?: string }>

const conversores: JSXConvertersFunction<DefaultNodeTypes | NoBlocoVideo> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,

  // Imagens migradas do WordPress e novas: sempre otimizadas e com dimensões
  // conhecidas, para não causar salto de layout.
  upload: ({ node }) => {
    const midia = node.value as Midia | number | null
    if (!midia || typeof midia === 'number' || !midia.url) return null

    return (
      <figure className="my-8 not-prose">
        <Image
          src={caminhoMidia(midia.url)!}
          alt={midia.alt ?? ''}
          width={midia.width ?? 1600}
          height={midia.height ?? 1000}
          sizes="(max-width: 768px) 100vw, 768px"
          className="h-auto w-full rounded-2xl"
        />
        {midia.creditos && (
          <figcaption className="mt-2 text-sm text-ink-muted">{midia.creditos}</figcaption>
        )}
      </figure>
    )
  },

  blocks: {
    videoEmbed: ({ node }) => {
      const id = idDoYoutube(node.fields.url ?? '')
      if (!id) return null

      return (
        <figure className="my-8 not-prose">
          <div className="aspect-video overflow-hidden rounded-2xl bg-g5-950">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title={node.fields.legenda || 'Vídeo da G5 Esportes'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="size-full border-0"
            />
          </div>
          {node.fields.legenda && (
            <figcaption className="mt-2 text-sm text-ink-muted">{node.fields.legenda}</figcaption>
          )}
        </figure>
      )
    },
  },
})

export function TextoRico({
  data,
  className,
}: {
  data: Parameters<typeof RichText>[0]['data']
  className?: string
}) {
  return <RichText data={data} converters={conversores} className={cn('prosa', className)} />
}
