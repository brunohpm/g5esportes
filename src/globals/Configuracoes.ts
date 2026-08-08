import type { GlobalConfig } from 'payload'
import { logado, publico } from '@/access'

export const Configuracoes: GlobalConfig = {
  slug: 'configuracoes',
  label: 'Configurações do site',
  admin: {
    group: 'Configurações',
    description: 'Contato, redes sociais, horários e textos que aparecem em todo o site.',
  },
  access: { read: publico, update: logado },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identidade',
          fields: [
            { name: 'nomeSite', type: 'text', label: 'Nome do site', defaultValue: 'G5 Esportes' },
            {
              name: 'slogan',
              type: 'text',
              label: 'Slogan',
              defaultValue: 'Você sonha, a G5 prescreve e juntos nós alcançamos!',
            },
            {
              name: 'descricao',
              type: 'textarea',
              label: 'Descrição do site',
              maxLength: 200,
              admin: { description: 'Aparece no Google e no compartilhamento em redes sociais.' },
            },
            { name: 'logo', type: 'upload', relationTo: 'midia', label: 'Logo' },
            {
              name: 'logoClara',
              type: 'upload',
              relationTo: 'midia',
              label: 'Logo para fundo escuro',
            },
            {
              name: 'imagemCompartilhamento',
              type: 'upload',
              relationTo: 'midia',
              label: 'Imagem padrão de compartilhamento',
              admin: { description: 'Usada quando um post não tem capa. Ideal: 1200×630.' },
            },
          ],
        },
        {
          label: 'Página inicial',
          fields: [
            {
              name: 'hero',
              type: 'group',
              label: 'Destaque do topo',
              fields: [
                {
                  name: 'titulo',
                  type: 'text',
                  label: 'Título',
                  defaultValue: 'Sua melhor versão começa no primeiro quilômetro',
                },
                {
                  name: 'subtitulo',
                  type: 'textarea',
                  label: 'Texto de apoio',
                  defaultValue:
                    'Assessoria de corrida em Curitiba desde 2009. Saúde, emagrecimento ou performance — a planilha é sua, o caminho a gente faz junto.',
                },
                {
                  name: 'imagem',
                  type: 'upload',
                  relationTo: 'midia',
                  label: 'Imagem de fundo',
                  admin: { description: 'Horizontal, de preferência com o grupo em movimento. Ideal: 2000×1200.' },
                },
              ],
            },
            {
              name: 'numeros',
              type: 'array',
              label: 'Números da G5',
              maxRows: 4,
              admin: { description: 'A faixa de estatísticas logo abaixo do topo.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'valor', type: 'text', label: 'Número', required: true, admin: { width: '40%', placeholder: 'Ex.: 15+' } },
                    { name: 'rotulo', type: 'text', label: 'Legenda', required: true, admin: { width: '60%', placeholder: 'Ex.: anos de estrada' } },
                  ],
                },
              ],
            },
            {
              name: 'palavraTreinadores',
              type: 'group',
              label: 'Palavra dos treinadores',
              admin: {
                description:
                  'Aparece logo abaixo do destaque do topo. Sem vídeo, a seção mostra o texto ao lado dos professores cadastrados — nunca fica quebrada.',
              },
              fields: [
                { name: 'titulo', type: 'text', label: 'Título', defaultValue: 'A palavra de quem conduz' },
                {
                  name: 'texto',
                  type: 'textarea',
                  label: 'Texto',
                  admin: { description: 'Duas ou três frases. O vídeo é quem fala; aqui é só o convite.' },
                },
                {
                  name: 'videoUrl',
                  type: 'text',
                  label: 'Vídeo do YouTube',
                  admin: {
                    description:
                      'Cole o endereço do YouTube. Recomendado para o vídeo institucional: não gasta banda do servidor e a qualidade se adapta à conexão de quem assiste.',
                  },
                },
                {
                  name: 'videoArquivo',
                  type: 'upload',
                  relationTo: 'videos',
                  label: 'Ou envie um arquivo de vídeo',
                  admin: {
                    description:
                      'Alternativa ao YouTube, para vídeo que não deva ficar público lá. Se os dois estiverem preenchidos, o YouTube tem preferência. Até 300 MB.',
                    condition: (_, irmaos) => !irmaos?.videoUrl,
                  },
                },
              ],
            },
            {
              name: 'plataforma',
              type: 'group',
              label: 'Plataforma de treinos',
              admin: { description: 'Destaca a planilha online e os treinos no relógio.' },
              fields: [
                { name: 'titulo', type: 'text', label: 'Título', defaultValue: 'Sua planilha no bolso' },
                { name: 'texto', type: 'textarea', label: 'Texto de apoio' },
                {
                  name: 'recursos',
                  type: 'array',
                  label: 'Recursos',
                  maxRows: 4,
                  fields: [
                    {
                      name: 'icone',
                      type: 'select',
                      label: 'Ícone',
                      defaultValue: 'planilha',
                      options: [
                        { label: 'Planilha', value: 'planilha' },
                        { label: 'Relógio / Garmin', value: 'relogio' },
                        { label: 'Celular', value: 'celular' },
                        { label: 'Gráfico de evolução', value: 'evolucao' },
                        { label: 'Conversa com o treinador', value: 'conversa' },
                        { label: 'Calendário', value: 'calendario' },
                      ],
                    },
                    { name: 'titulo', type: 'text', label: 'Título', required: true },
                    { name: 'texto', type: 'textarea', label: 'Descrição' },
                  ],
                },
                {
                  name: 'imagem',
                  type: 'upload',
                  relationTo: 'midia',
                  label: 'Imagem ao lado',
                  admin: { description: 'Print da plataforma ou foto de alguém olhando o relógio.' },
                },
              ],
            },
            {
              name: 'fotos',
              type: 'group',
              label: 'Faixa de fotos',
              admin: { description: 'Uma tira de fotos do grupo, entre as seções da home.' },
              fields: [
                { name: 'titulo', type: 'text', label: 'Título', defaultValue: 'A G5 na pista' },
                {
                  name: 'imagens',
                  type: 'upload',
                  relationTo: 'midia',
                  hasMany: true,
                  label: 'Fotos',
                  admin: { description: 'De 3 a 8 fotos. Horizontais funcionam melhor.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Contato',
          fields: [
            { name: 'email', type: 'email', label: 'E-mail', defaultValue: 'g5esportes@yahoo.com.br' },
            {
              name: 'whatsapp',
              type: 'text',
              label: 'WhatsApp',
              defaultValue: '5541984680986',
              admin: { description: 'Só números, com país e DDD. Ex.: 5541984680986' },
            },
            {
              name: 'mensagemWhatsapp',
              type: 'text',
              label: 'Mensagem inicial do WhatsApp',
              defaultValue: 'Olá! Vim pelo site e quero saber mais sobre os treinos da G5.',
            },
            { name: 'telefone', type: 'text', label: 'Telefone (exibição)', defaultValue: '(41) 98468-0986' },
            {
              name: 'localTreino',
              type: 'text',
              label: 'Local dos treinos',
              defaultValue: 'Parque Bacacheri, Curitiba/PR',
            },
            {
              name: 'mapaUrl',
              type: 'text',
              label: 'Link do mapa',
              admin: { description: 'Endereço do Google Maps do ponto de encontro.' },
            },
          ],
        },
        {
          label: 'Horários',
          fields: [
            {
              name: 'horarios',
              type: 'array',
              label: 'Turmas',
              fields: [
                { name: 'turma', type: 'text', label: 'Turma', required: true, admin: { placeholder: 'Ex.: Manhã' } },
                { name: 'dias', type: 'text', label: 'Dias', required: true, admin: { placeholder: 'Ex.: Ter, Qui e Sex' } },
                { name: 'horario', type: 'text', label: 'Horário', required: true, admin: { placeholder: 'Ex.: 07h00 às 09h00' } },
                { name: 'local', type: 'text', label: 'Local' },
              ],
            },
          ],
        },
        {
          label: 'Redes sociais',
          fields: [
            { name: 'instagram', type: 'text', label: 'Instagram' },
            { name: 'facebook', type: 'text', label: 'Facebook' },
            { name: 'youtube', type: 'text', label: 'YouTube' },
            { name: 'strava', type: 'text', label: 'Strava' },
          ],
        },
        {
          label: 'Área do Aluno',
          fields: [
            {
              name: 'areaAlunoUrl',
              type: 'text',
              label: 'Endereço da Área do Aluno',
              defaultValue: 'https://g5esportes.sistematreinoonline.com.br/',
              admin: { description: 'Sistema externo de planilhas usado pelos alunos.' },
            },
            {
              name: 'areaAlunoRotulo',
              type: 'text',
              label: 'Texto do botão',
              defaultValue: 'Área do Aluno',
            },
          ],
        },
      ],
    },
  ],
}
