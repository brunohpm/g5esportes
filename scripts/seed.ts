/**
 * Popula o que a migração não traz: configurações do site, menu, professores
 * e o calendário de provas (extraído dos calendários em texto do site antigo).
 *
 *   npm run seed
 *
 * Idempotente — pode rodar quantas vezes precisar.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { extrairProvas } from './provas-parser'
import { slugify } from '../src/lib/slug'
import { urlDownload, WP_BASE } from './wp'

const payload = await getPayload({ config })

/** Calendários do site antigo que viram provas estruturadas. */
const CALENDARIOS = [
  { ano: 2026, endpoint: 'posts?slug=calendario-de-corridas-2026&_fields=content' },
  { ano: 2025, endpoint: 'pages/5597?_fields=content' },
]

const AREA_ALUNO = 'https://g5esportes.sistematreinoonline.com.br/'

/** Imagem que o site antigo usava como capa de compartilhamento. */
const HERO_ORIGEM = 'https://g5esportes.wordpress.com/wp-content/uploads/2026/01/img_20240321_073734ed.jpg'

/**
 * Procura a imagem na mídia; se não veio na migração (o caso do hero, que só
 * existia como og:image e não aparecia no corpo de nenhum post), baixa agora.
 */
async function acharOuBaixarMidia(origem: string, alt: string) {
  const { docs } = await payload.find({
    collection: 'midia',
    where: { origemWordpress: { equals: origem } },
    limit: 1,
    pagination: false,
    depth: 0,
  })
  if (docs[0]) return docs[0].id

  try {
    const res = await fetch(urlDownload(origem))
    if (!res.ok) {
      console.log(`  ! imagem do topo indisponível (HTTP ${res.status})`)
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const nome = decodeURIComponent(origem.split('/').pop() ?? 'topo.jpg')
    const doc = await payload.create({
      collection: 'midia',
      data: { alt, origemWordpress: origem },
      file: {
        data: buffer,
        mimetype: (res.headers.get('content-type') ?? 'image/jpeg').split(';')[0],
        name: nome,
        size: buffer.byteLength,
      },
    })
    return doc.id
  } catch (erro) {
    console.log(`  ! imagem do topo falhou: ${(erro as Error).message}`)
    return null
  }
}

async function seedConfiguracoes() {
  const heroId = await acharOuBaixarMidia(HERO_ORIGEM, 'Grupo da G5 Esportes correndo no Parque Bacacheri')
  const { totalDocs: totalProvas } = await payload.count({ collection: 'provas' })

  await payload.updateGlobal({
    slug: 'configuracoes',
    data: {
      hero: {
        titulo: 'Sua melhor versão começa no primeiro quilômetro',
        subtitulo:
          'Assessoria de corrida em Curitiba desde 2009. Saúde, emagrecimento ou performance — a planilha é sua, o caminho a gente faz junto.',
        ...(heroId ? { imagem: heroId } : {}),
      },
      numeros: [
        { valor: '2009', rotulo: 'correndo juntos desde' },
        { valor: '5x', rotulo: 'treinos por semana, frequência livre' },
        { valor: String(totalProvas), rotulo: 'provas no calendário' },
        { valor: '2', rotulo: 'turmas por dia: manhã e noite' },
      ],
      palavraTreinadores: {
        titulo: 'A palavra de quem conduz',
        texto:
          'Quem prescreve o seu treino tem nome, rosto e registro no CREF. Antes de qualquer planilha, vem a conversa: o que você quer, de onde está partindo e quanto tempo tem na semana.',
      },
      plataforma: {
        titulo: 'Sua planilha no bolso',
        texto:
          'O treino não fica num papel nem num print de WhatsApp. Ele vive numa plataforma que acompanha a sua semana — e, se você tem relógio, sai do celular direto para o pulso.',
        recursos: [
          {
            icone: 'planilha',
            titulo: 'Planilha individual',
            texto:
              'Montada para o seu objetivo e a sua rotina, revisada ciclo a ciclo pelo treinador.',
          },
          {
            icone: 'relogio',
            titulo: 'Treino pronto no Garmin',
            texto:
              'A sessão do dia é enviada para o relógio: é só dar start e seguir os avisos de ritmo e volta.',
          },
          {
            icone: 'celular',
            titulo: 'Tudo pelo celular',
            texto: 'Planilha, histórico e avisos na palma da mão, em qualquer lugar.',
          },
          {
            icone: 'evolucao',
            titulo: 'Evolução registrada',
            texto: 'Cada treino fica gravado. Dá para olhar para trás e ver o quanto você andou.',
          },
        ],
      },
      fotos: {
        titulo: 'A G5 na pista',
      },
      nomeSite: 'G5 Esportes',
      slogan: 'Você sonha, a G5 prescreve e juntos nós alcançamos!',
      descricao:
        'Assessoria de corrida em Curitiba desde 2009. Treinos no Parque Bacacheri para saúde, emagrecimento e performance, com acompanhamento de profissionais registrados no CREF.',
      email: 'g5esportes@yahoo.com.br',
      whatsapp: '5541984680986',
      mensagemWhatsapp: 'Olá! Vim pelo site e quero saber mais sobre os treinos da G5.',
      telefone: '(41) 98468-0986',
      localTreino: 'Parque Bacacheri, Curitiba/PR',
      mapaUrl: 'https://maps.google.com/?q=Parque+Bacacheri+Curitiba',
      horarios: [
        { turma: 'Manhã', dias: 'Terça, quinta e sexta', horario: '07h00 às 09h00', local: 'Parque Bacacheri' },
        { turma: 'Noite', dias: 'Segunda e quarta', horario: '18h30 às 20h30', local: 'Parque Bacacheri' },
      ],
      instagram: 'https://www.instagram.com/g5esportes/',
      facebook: 'https://www.facebook.com/g5esportes',
      youtube: 'https://www.youtube.com/user/G5esportes',
      areaAlunoUrl: AREA_ALUNO,
      areaAlunoRotulo: 'Área do Aluno',
    },
  })
  console.log('  ✓ configurações')
}

async function seedMenu() {
  await payload.updateGlobal({
    slug: 'menu',
    data: {
      principal: [
        {
          rotulo: 'Treinos',
          url: '/treinos',
          submenu: [
            { rotulo: 'Como começar', url: '/como-comecar', descricao: 'Nunca correu? Comece por aqui.' },
            { rotulo: 'Metodologia', url: '/metodologia', descricao: 'Como montamos os ciclos e as planilhas.' },
            { rotulo: 'Horários e locais', url: '/horarios', descricao: 'Turmas da manhã e da noite.' },
          ],
        },
        {
          rotulo: 'Corridas',
          url: '/corridas',
          submenu: [
            { rotulo: 'Calendário de provas', url: '/corridas', descricao: 'Todas as provas do ano, filtráveis.' },
            { rotulo: 'Galeria', url: '/galeria', descricao: 'Fotos e vídeos das provas e treinos.' },
          ],
        },
        { rotulo: 'Blog', url: '/blog' },
        {
          rotulo: 'A G5',
          url: '/quem-somos',
          submenu: [
            { rotulo: 'A empresa', url: '/quem-somos', descricao: 'Nossa história desde 2009.' },
            { rotulo: 'Professores', url: '/professores', descricao: 'Quem conduz os treinos.' },
            { rotulo: 'Produtos G5', url: '/produtos', descricao: 'Camisetas, kits e acessórios.' },
            { rotulo: 'Parceiros', url: '/parceiros' },
          ],
        },
        { rotulo: 'Contato', url: '/contato' },
      ],
      rodape: [
        {
          titulo: 'Treinos',
          links: [
            { rotulo: 'Como começar', url: '/como-comecar' },
            { rotulo: 'Metodologia', url: '/metodologia' },
            { rotulo: 'Horários e locais', url: '/horarios' },
          ],
        },
        {
          titulo: 'Corridas',
          links: [
            { rotulo: 'Calendário de provas', url: '/corridas' },
            { rotulo: 'Galeria', url: '/galeria' },
            { rotulo: 'Blog', url: '/blog' },
          ],
        },
        {
          titulo: 'A G5',
          links: [
            { rotulo: 'A empresa', url: '/quem-somos' },
            { rotulo: 'Professores', url: '/professores' },
            { rotulo: 'Produtos G5', url: '/produtos' },
            { rotulo: 'Parceiros', url: '/parceiros' },
          ],
        },
      ],
    },
  })
  console.log('  ✓ menu')
}

const PROFESSORES = [
  {
    titulo: 'Gustavo Nogas',
    cref: '12986-G/PR',
    funcao: 'Treinador de corrida e fundador',
    ordem: 10,
  },
  {
    titulo: 'Guilherme Horst',
    cref: '24207-G/PR',
    funcao: 'Treinador de corrida e treinamento funcional',
    ordem: 20,
  },
]

async function seedProfessores() {
  for (const prof of PROFESSORES) {
    const slug = slugify(prof.titulo)
    const existente = await payload.find({
      collection: 'professores',
      where: { slug: { equals: slug } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    const dados = { ...prof, slug }
    if (existente.docs.length) {
      await payload.update({ collection: 'professores', id: existente.docs[0].id, data: dados })
    } else {
      await payload.create({ collection: 'professores', data: dados })
    }
  }
  console.log(`  ✓ ${PROFESSORES.length} professores`)
}

async function seedProvas() {
  let criadas = 0
  let atualizadas = 0
  const naoInterpretadas: string[] = []

  for (const cal of CALENDARIOS) {
    const res = await fetch(`${WP_BASE}/${cal.endpoint}`)
    if (!res.ok) {
      console.log(`  ! calendário ${cal.ano}: HTTP ${res.status}`)
      continue
    }

    const json = (await res.json()) as { content: { rendered: string } } | { content: { rendered: string } }[]
    const doc = Array.isArray(json) ? json[0] : json
    if (!doc?.content?.rendered) {
      console.log(`  ! calendário ${cal.ano}: sem conteúdo`)
      continue
    }

    const { provas, ignoradas } = extrairProvas(doc.content.rendered, cal.ano)
    naoInterpretadas.push(...ignoradas.map((l) => `${cal.ano}: ${l}`))

    for (const prova of provas) {
      const slug = slugify(`${prova.titulo}-${prova.data.slice(0, 10)}`)
      const existente = await payload.find({
        collection: 'provas',
        where: { slug: { equals: slug } },
        limit: 1,
        pagination: false,
        depth: 0,
      })

      const dados = { ...prova, slug, ano: cal.ano }
      if (existente.docs.length) {
        await payload.update({ collection: 'provas', id: existente.docs[0].id, data: dados })
        atualizadas++
      } else {
        await payload.create({ collection: 'provas', data: dados })
        criadas++
      }
    }

    console.log(`  ✓ calendário ${cal.ano}: ${provas.length} provas (${ignoradas.length} linhas ignoradas)`)
  }

  console.log(`  ✓ provas: ${criadas} criadas, ${atualizadas} atualizadas`)
  // O total alimenta o número "provas no calendário" da home.
  if (naoInterpretadas.length) {
    console.log('\n  Linhas que o parser não interpretou (confira no painel se faltou alguma prova):')
    for (const l of naoInterpretadas.slice(0, 25)) console.log(`    · ${l}`)
    if (naoInterpretadas.length > 25) console.log(`    · …e mais ${naoInterpretadas.length - 25}`)
  }
}

/**
 * A página `professores` veio do WordPress só com texto. Acrescenta o bloco de
 * equipe para os professores cadastrados aparecerem — sem mexer no conteúdo
 * migrado, e sem duplicar se já estiver lá.
 */
async function seedBlocoEquipe() {
  const { docs } = await payload.find({
    collection: 'paginas',
    where: { slug: { equals: 'professores' } },
    limit: 1,
    pagination: false,
    depth: 0,
    draft: true,
  })

  const pagina = docs[0]
  if (!pagina) {
    console.log('  ! página "professores" não encontrada')
    return
  }

  const layout = pagina.layout ?? []
  if (layout.some((b) => b.blockType === 'equipe')) {
    console.log('  ✓ bloco de equipe já estava na página de professores')
    return
  }

  await payload.update({
    collection: 'paginas',
    id: pagina.id,
    data: {
      layout: [...layout, { blockType: 'equipe', titulo: 'Nossos professores' }],
    },
  })
  console.log('  ✓ bloco de equipe adicionado à página de professores')
}

console.log('» Seed do site\n')
await seedProvas()
await seedConfiguracoes()
await seedMenu()
await seedProfessores()
await seedBlocoEquipe()
console.log('\nPronto.')
process.exit(0)
