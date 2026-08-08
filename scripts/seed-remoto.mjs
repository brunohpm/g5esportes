/**
 * Semeia o conteúdo da home num site JÁ NO AR, pela API REST.
 *
 * Existe porque `npm run seed` usa a API local do Payload e por isso só
 * alcança o banco de desenvolvimento. Quando um campo novo entrava no ar, a
 * tabela era criada pela migração mas ficava vazia — a seção simplesmente não
 * renderizava, sem erro nenhum, o que é pior que quebrar.
 *
 *   ALVO=https://g5.prattsolutions.com.br \
 *   EMAIL=... SENHA=... node scripts/seed-remoto.mjs
 *
 * Lê o global atual e MESCLA: campos que já têm valor no ar não são
 * sobrescritos, então rodar de novo é seguro.
 */
const ALVO = (process.env.ALVO ?? 'http://localhost:3000').replace(/\/$/, '')
const EMAIL = process.env.EMAIL
const SENHA = process.env.SENHA

if (!EMAIL || !SENHA) {
  console.error('Defina EMAIL e SENHA de um usuário administrador.')
  process.exit(1)
}

const CONTEUDO = {
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
        texto: 'Montada para o seu objetivo e a sua rotina, revisada ciclo a ciclo pelo treinador.',
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
  fotos: { titulo: 'A G5 na pista' },
}

/** Só preenche o que está vazio — o que o cliente já editou fica de pé. */
function mesclar(atual, novo) {
  const saida = { ...atual }
  for (const [chave, valor] of Object.entries(novo)) {
    const existente = saida[chave]
    if (Array.isArray(valor)) {
      if (!Array.isArray(existente) || existente.length === 0) saida[chave] = valor
    } else if (valor && typeof valor === 'object') {
      saida[chave] = mesclar(existente ?? {}, valor)
    } else if (existente === undefined || existente === null || existente === '') {
      saida[chave] = valor
    }
  }
  return saida
}

console.log(`» ${ALVO}`)

const login = await fetch(`${ALVO}/api/usuarios/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: SENHA }),
}).then((r) => r.json())

if (!login.token) {
  console.error('  não autenticou:', login.errors?.[0]?.message ?? JSON.stringify(login).slice(0, 200))
  process.exit(1)
}
console.log('  autenticado')

const atual = await fetch(`${ALVO}/api/globals/configuracoes?depth=0`, {
  headers: { Authorization: `JWT ${login.token}` },
}).then((r) => r.json())

const mesclado = mesclar(atual, CONTEUDO)

const resposta = await fetch(`${ALVO}/api/globals/configuracoes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `JWT ${login.token}` },
  body: JSON.stringify(mesclado),
}).then((r) => r.json())

if (resposta.errors) {
  console.error('  erro:', JSON.stringify(resposta.errors).slice(0, 400))
  process.exit(1)
}

const salvo = resposta.result ?? resposta.doc ?? resposta
console.log(`  palavra dos treinadores: ${salvo.palavraTreinadores?.titulo ?? '(vazio)'}`)
console.log(`  plataforma:              ${salvo.plataforma?.titulo ?? '(vazio)'}`)
console.log(`  recursos:                ${salvo.plataforma?.recursos?.length ?? 0}`)
console.log(`  faixa de fotos:          ${salvo.fotos?.titulo ?? '(vazio)'}`)
console.log('\npronto.')
