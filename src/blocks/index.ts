import type { Block } from 'payload'

/**
 * Blocos de layout das páginas institucionais.
 * O editor monta a página empilhando blocos, sem escrever HTML.
 */

const campoBotao: Block['fields'] = [
  {
    type: 'row',
    fields: [
      { name: 'rotulo', type: 'text', label: 'Texto do botão', required: true },
      { name: 'url', type: 'text', label: 'Link', required: true },
      {
        name: 'estilo',
        type: 'select',
        label: 'Estilo',
        defaultValue: 'primario',
        options: [
          { label: 'Verde preenchido', value: 'primario' },
          { label: 'Contorno', value: 'secundario' },
          { label: 'Só texto', value: 'texto' },
        ],
      },
    ],
  },
]

export const BlocoHero: Block = {
  slug: 'hero',
  labels: { singular: 'Destaque (Hero)', plural: 'Destaques' },
  imageAltText: 'Faixa grande no topo da página, com título, texto e botões.',
  fields: [
    { name: 'titulo', type: 'text', label: 'Título', required: true },
    { name: 'subtitulo', type: 'textarea', label: 'Subtítulo' },
    { name: 'imagem', type: 'upload', relationTo: 'midia', label: 'Imagem de fundo' },
    {
      name: 'alinhamento',
      type: 'select',
      label: 'Alinhamento',
      defaultValue: 'esquerda',
      options: [
        { label: 'Esquerda', value: 'esquerda' },
        { label: 'Centro', value: 'centro' },
      ],
    },
    { name: 'botoes', type: 'array', label: 'Botões', maxRows: 2, fields: campoBotao },
  ],
}

export const BlocoTexto: Block = {
  slug: 'texto',
  labels: { singular: 'Texto', plural: 'Textos' },
  imageAltText: 'Bloco de texto livre com formatação.',
  fields: [
    { name: 'conteudo', type: 'richText', label: 'Conteúdo', required: true },
    {
      name: 'largura',
      type: 'select',
      label: 'Largura',
      defaultValue: 'leitura',
      options: [
        { label: 'Coluna de leitura (recomendado)', value: 'leitura' },
        { label: 'Largura total', value: 'total' },
      ],
    },
  ],
}

export const BlocoCards: Block = {
  slug: 'cards',
  labels: { singular: 'Cards', plural: 'Cards' },
  imageAltText: 'Grade de cartões com ícone, título e texto curto.',
  fields: [
    { name: 'titulo', type: 'text', label: 'Título da seção' },
    { name: 'subtitulo', type: 'textarea', label: 'Texto de apoio' },
    {
      name: 'itens',
      type: 'array',
      label: 'Cartões',
      minRows: 1,
      fields: [
        {
          name: 'icone',
          type: 'select',
          label: 'Ícone',
          defaultValue: 'corrida',
          options: [
            { label: 'Corrida', value: 'corrida' },
            { label: 'Coração / saúde', value: 'saude' },
            { label: 'Relógio / horários', value: 'horarios' },
            { label: 'Calendário', value: 'calendario' },
            { label: 'Grupo / turma', value: 'grupo' },
            { label: 'Halteres / funcional', value: 'funcional' },
            { label: 'Celular / app', value: 'app' },
            { label: 'Troféu', value: 'trofeu' },
            { label: 'Mapa / local', value: 'local' },
          ],
        },
        { name: 'titulo', type: 'text', label: 'Título', required: true },
        { name: 'texto', type: 'textarea', label: 'Descrição' },
        { name: 'url', type: 'text', label: 'Link (opcional)' },
      ],
    },
    {
      name: 'colunas',
      type: 'select',
      label: 'Cartões por linha',
      defaultValue: '3',
      options: [
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
      ],
    },
  ],
}

export const BlocoChamada: Block = {
  slug: 'chamada',
  labels: { singular: 'Chamada (CTA)', plural: 'Chamadas' },
  imageAltText: 'Faixa verde com uma chamada para ação.',
  fields: [
    { name: 'titulo', type: 'text', label: 'Título', required: true },
    { name: 'texto', type: 'textarea', label: 'Texto' },
    { name: 'botoes', type: 'array', label: 'Botões', maxRows: 2, fields: campoBotao },
    {
      name: 'fundo',
      type: 'select',
      label: 'Fundo',
      defaultValue: 'floresta',
      options: [
        { label: 'Verde escuro', value: 'floresta' },
        { label: 'Verde-limão', value: 'lime' },
      ],
    },
  ],
}

export const BlocoPrecos: Block = {
  slug: 'precos',
  labels: { singular: 'Planos e valores', plural: 'Planos e valores' },
  imageAltText: 'Tabela de planos com preços e o que está incluso.',
  fields: [
    { name: 'titulo', type: 'text', label: 'Título da seção' },
    {
      name: 'planos',
      type: 'array',
      label: 'Planos',
      minRows: 1,
      fields: [
        { name: 'nome', type: 'text', label: 'Nome do plano', required: true },
        { name: 'preco', type: 'text', label: 'Preço', admin: { description: 'Ex.: R$ 145' } },
        { name: 'periodo', type: 'text', label: 'Período', admin: { description: 'Ex.: /mês' } },
        { name: 'descricao', type: 'textarea', label: 'Descrição curta' },
        {
          name: 'itens',
          type: 'array',
          label: 'O que está incluso',
          fields: [{ name: 'item', type: 'text', label: 'Item', required: true }],
        },
        { name: 'destaque', type: 'checkbox', label: 'Destacar este plano', defaultValue: false },
        { name: 'urlBotao', type: 'text', label: 'Link do botão' },
        { name: 'rotuloBotao', type: 'text', label: 'Texto do botão', defaultValue: 'Quero começar' },
      ],
    },
    { name: 'observacao', type: 'textarea', label: 'Observação (letra miúda)' },
  ],
}

export const BlocoFAQ: Block = {
  slug: 'faq',
  labels: { singular: 'Perguntas frequentes', plural: 'Perguntas frequentes' },
  imageAltText: 'Lista de perguntas que abrem e fecham.',
  fields: [
    { name: 'titulo', type: 'text', label: 'Título da seção', defaultValue: 'Perguntas frequentes' },
    {
      name: 'perguntas',
      type: 'array',
      label: 'Perguntas',
      minRows: 1,
      fields: [
        { name: 'pergunta', type: 'text', label: 'Pergunta', required: true },
        { name: 'resposta', type: 'richText', label: 'Resposta', required: true },
      ],
    },
  ],
}

export const BlocoProvas: Block = {
  slug: 'listaProvas',
  labels: { singular: 'Calendário de provas', plural: 'Calendários de provas' },
  imageAltText: 'Lista as próximas provas cadastradas no calendário.',
  fields: [
    { name: 'titulo', type: 'text', label: 'Título da seção', defaultValue: 'Próximas provas' },
    {
      name: 'quantidade',
      type: 'number',
      label: 'Quantas provas mostrar',
      defaultValue: 6,
      min: 1,
      max: 30,
    },
    {
      name: 'apenasDestaques',
      type: 'checkbox',
      label: 'Só provas marcadas como destaque',
      defaultValue: false,
    },
  ],
}

export const BlocoGaleria: Block = {
  slug: 'galeria',
  labels: { singular: 'Galeria', plural: 'Galerias' },
  imageAltText: 'Grade de fotos de um álbum.',
  fields: [
    { name: 'titulo', type: 'text', label: 'Título da seção' },
    {
      name: 'albuns',
      type: 'relationship',
      relationTo: 'albuns',
      hasMany: true,
      label: 'Álbuns',
      required: true,
    },
  ],
}

export const BlocoVideo: Block = {
  slug: 'video',
  labels: { singular: 'Vídeo do YouTube', plural: 'Vídeos do YouTube' },
  imageAltText: 'Incorpora um vídeo do YouTube.',
  fields: [
    { name: 'titulo', type: 'text', label: 'Título' },
    {
      name: 'url',
      type: 'text',
      label: 'Link do YouTube',
      required: true,
      admin: { description: 'Cole o endereço completo do vídeo.' },
    },
  ],
}

export const BlocoProfessores: Block = {
  slug: 'equipe',
  labels: { singular: 'Equipe', plural: 'Equipes' },
  imageAltText: 'Mostra os professores cadastrados.',
  fields: [
    { name: 'titulo', type: 'text', label: 'Título da seção', defaultValue: 'Nossos professores' },
    {
      name: 'professores',
      type: 'relationship',
      relationTo: 'professores',
      hasMany: true,
      label: 'Professores',
      admin: { description: 'Deixe vazio para mostrar todos, na ordem cadastrada.' },
    },
  ],
}

/**
 * Bloco disponível dentro do editor de texto (posts e páginas).
 * Slug diferente do `video` para não colidir com o bloco de layout.
 */
export const BlocoVideoTexto: Block = {
  slug: 'videoEmbed',
  labels: { singular: 'Vídeo do YouTube', plural: 'Vídeos do YouTube' },
  fields: [
    {
      name: 'url',
      type: 'text',
      label: 'Link do YouTube',
      required: true,
      admin: { description: 'Cole o endereço do vídeo. Ex.: https://youtu.be/abc123' },
    },
    { name: 'legenda', type: 'text', label: 'Legenda' },
  ],
}

export const blocosDePagina = [
  BlocoHero,
  BlocoTexto,
  BlocoCards,
  BlocoPrecos,
  BlocoChamada,
  BlocoProvas,
  BlocoProfessores,
  BlocoGaleria,
  BlocoVideo,
  BlocoFAQ,
]
