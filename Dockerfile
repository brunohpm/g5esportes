# syntax=docker/dockerfile:1

# Node 22 LTS: exigido pelo Next 16 e pelo Payload 3.
ARG NODE_VERSION=22-alpine

# ── Dependências ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
# libc6-compat é o que o sharp precisa no Alpine.
RUN apk add --no-cache libc6-compat
# O .npmrc precisa vir junto: ele tem `legacy-peer-deps=true`, e sem isso o
# npm resolve a árvore de outro jeito e o `npm ci` acusa lock fora de sincronia.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# ── Build ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# O build do Next lê o endereço público para gerar canonical, sitemap e og:image.
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--no-deprecation --max-old-space-size=4096"

# `npx next build` e não `npm run build`: o script do package.json passa
# `--max-old-space-size=8000` via cross-env, o que SOBRESCREVE o NODE_OPTIONS
# acima. Chamando o next direto, o teto de 4 GB definido aqui é o que vale —
# é isso que impede o build de esgotar a RAM de uma máquina sem swap.
RUN npx next build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
RUN apk add --no-cache libc6-compat curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--no-deprecation
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# O usuário `node` já existe na imagem oficial; nada roda como root.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# Os uploads (bind) e o cache do otimizador de imagens (volume nomeado) são
# montados aqui. Os dois alvos precisam EXISTIR e pertencer ao `node` ANTES do
# mount: quando o alvo de um volume não existe na imagem, o Docker o cria
# root:root — e o processo roda como `node` (UID 1000), então o next/image
# ficaria sem conseguir gravar o cache e reprocessaria 2.817 imagens com sharp
# a cada requisição, em 2 vCPU compartilhadas com outros clientes.
RUN mkdir -p /app/media /app/.next/cache && chown -R node:node /app/media /app/.next

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/access > /dev/null || exit 1

CMD ["node", "server.js"]
