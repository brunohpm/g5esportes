/**
 * Sobe o build de produção localmente.
 *
 * `next start` NÃO funciona com `output: 'standalone'` — ele abre a porta,
 * responde "Ready" e não serve nada. A auditoria ficava esperando timeout em
 * 90 combinações sem que nada indicasse a causa, a não ser um aviso discreto
 * no log do Next.
 *
 * O build standalone traz o servidor, mas não os estáticos: o Dockerfile copia
 * `.next/static` e `public` para dentro dele. Aqui é feito o mesmo, para o que
 * roda na máquina ser igual ao que roda no servidor.
 *
 *   node scripts/servir-local.mjs
 *
 * ATENÇÃO: pare este servidor antes de rodar `npm run build`. Ele roda de
 * dentro de `.next/standalone`, e no Windows a pasta fica travada — o build
 * falha com EBUSY ao tentar apagá-la.
 */
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

const RAIZ = process.cwd()
const STANDALONE = path.join(RAIZ, '.next', 'standalone')

try {
  await fs.access(path.join(STANDALONE, 'server.js'))
} catch {
  console.error('Build standalone não encontrado. Rode `npm run build` antes.')
  process.exit(1)
}

// Os estáticos que o servidor standalone espera encontrar ao lado dele.
await fs.cp(path.join(RAIZ, '.next', 'static'), path.join(STANDALONE, '.next', 'static'), {
  recursive: true,
  force: true,
})
try {
  await fs.cp(path.join(RAIZ, 'public'), path.join(STANDALONE, 'public'), {
    recursive: true,
    force: true,
  })
} catch {
  // Projeto sem pasta public: nada a copiar.
}

console.log('estáticos copiados; subindo o servidor standalone em http://localhost:3000')

/*
 * Sem fixar HOSTNAME: o padrão (0.0.0.0) faz `localhost` funcionar tanto por
 * IPv4 quanto por IPv6. Preso em 127.0.0.1, o Windows resolvia `localhost`
 * para ::1 primeiro e as requisições dos scripts caíam no vazio.
 */
spawn(process.execPath, [path.join(STANDALONE, 'server.js')], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT ?? '3000' },
})
