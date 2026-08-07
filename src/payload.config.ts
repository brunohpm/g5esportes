import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { BlocoVideoTexto } from './blocks'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { pt } from '@payloadcms/translations/languages/pt'
import sharp from 'sharp'

import { Usuarios } from './collections/Usuarios'
import { Midia } from './collections/Midia'
import { Posts } from './collections/Posts'
import { Paginas } from './collections/Paginas'
import { Provas } from './collections/Provas'
import { Professores } from './collections/Professores'
import { Albuns } from './collections/Albuns'
import { Categorias } from './collections/Categorias'
import { Tags } from './collections/Tags'
import { Configuracoes } from './globals/Configuracoes'
import { Menu } from './globals/Menu'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default buildConfig({
  serverURL,
  admin: {
    user: Usuarios.slug,
    meta: {
      titleSuffix: ' · G5 Esportes',
      description: 'Painel de administração do site da G5 Esportes',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      breakpoints: [
        { label: 'Celular', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Notebook', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  collections: [Posts, Paginas, Provas, Professores, Albuns, Categorias, Tags, Midia, Usuarios],
  globals: [Configuracoes, Menu],
  // Painel inteiro em português.
  i18n: {
    supportedLanguages: { pt },
    fallbackLanguage: 'pt',
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      // H1 é o título da página; o editor só usa de H2 para baixo.
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      EXPERIMENTAL_TableFeature(),
      BlocksFeature({ blocks: [BlocoVideoTexto] }),
      FixedToolbarFeature(),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  cors: [serverURL],
  csrf: [serverURL],
  sharp,
  plugins: [
    seoPlugin({
      collections: ['posts', 'paginas'],
      uploadsCollection: 'midia',
      tabbedUI: false,
      // O plugin traduz as mensagens, mas mantém os rótulos dos campos em inglês.
      fields: ({ defaultFields }) =>
        defaultFields.map((campo) => {
          if (!('name' in campo)) return campo
          const rotulos: Record<string, string> = {
            title: 'Título para o Google',
            description: 'Descrição para o Google',
            image: 'Imagem de compartilhamento',
          }
          const label = rotulos[campo.name as string]
          return label ? { ...campo, label } : campo
        }),
      generateTitle: ({ doc }) => {
        const titulo = (doc as { titulo?: string })?.titulo
        return titulo ? `${titulo} · G5 Esportes` : 'G5 Esportes'
      },
      generateDescription: ({ doc }) => (doc as { resumo?: string })?.resumo ?? '',
      generateURL: ({ doc, collectionSlug }) => {
        const slug = (doc as { slug?: string })?.slug ?? ''
        return collectionSlug === 'posts' ? `${serverURL}/blog/${slug}` : `${serverURL}/${slug}`
      },
    }),
  ],
})
