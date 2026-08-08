#!/usr/bin/env bash
# Constrói a imagem AQUI (máquina de desenvolvimento) e envia pronta ao VPS.
#
#   ./deploy/enviar-imagem.sh
#   ALVO=root@2.25.182.14 DOMINIO=https://g5.prattsolutions.com.br ./deploy/enviar-imagem.sh
#
# Por que não buildar no servidor: o build do Next pede ~4 GB de heap e a
# máquina tem 7,8 GB sem swap, compartilhados com formiz, metodoaxion e
# casadoauau. Um OOM lá derrubaria site de cliente.
set -euo pipefail

ALVO="${ALVO:-root@2.25.182.14}"
DOMINIO="${DOMINIO:-https://g5.prattsolutions.com.br}"
DESTINO="${DESTINO:-/opt/g5esportes}"
VERSAO="$(date +%Y-%m-%d-%H%M)"

echo "» construindo g5esportes:$VERSAO para $DOMINIO"
# --platform explícito: o servidor é amd64 e um `docker load` aceita qualquer
# arquitetura calado — o erro só apareceria como 'exec format error' em loop
# de restart, com o nginx devolvendo 502.
docker build \
  --platform linux/amd64 \
  --build-arg "NEXT_PUBLIC_SERVER_URL=$DOMINIO" \
  -t "g5esportes:$VERSAO" \
  -t g5esportes:latest \
  .

arq="$(docker image inspect g5esportes:latest --format '{{.Os}}/{{.Architecture}}')"
[ "$arq" = "linux/amd64" ] || { echo "ERRO: imagem saiu como $arq, esperado linux/amd64" >&2; exit 1; }
echo "  arquitetura conferida: $arq"

echo "» enviando (a imagem tem $(docker image inspect g5esportes:latest --format '{{.Size}}' | awk '{printf "%.0f MB", $1/1048576}'))"
docker save "g5esportes:$VERSAO" g5esportes:latest \
  | gzip -1 \
  | ssh "$ALVO" 'gunzip | docker load'

# Schema ANTES da imagem: o Payload não cria tabela em produção, então código
# novo contra banco velho derruba o site. O script aborta se faltar migração,
# e como isso roda antes do swap da imagem, a versão atual continua no ar.
echo "» migrações e conferência de schema"
ALVO="$ALVO" DESTINO="$DESTINO" bash "$(dirname "$0")/migrar.sh"

echo "» subindo a versão nova"
ssh "$ALVO" "cd $DESTINO && docker compose up -d && docker compose ps"

echo "» aguardando ficar saudável"
ssh "$ALVO" '
  for _ in $(seq 1 45); do
    e=$(docker inspect g5-app --format "{{.State.Health.Status}}" 2>/dev/null || echo desconhecido)
    [ "$e" = "healthy" ] && { echo "  g5-app: healthy"; exit 0; }
    sleep 2
  done
  echo "  AVISO: nao ficou healthy em 90s" >&2; exit 1
'

echo
echo "pronto — versão $VERSAO no ar."
echo "Para voltar atrás:  ssh $ALVO 'docker tag g5esportes:<versao-anterior> g5esportes:latest && cd $DESTINO && docker compose up -d'"
echo "Imagens disponíveis: ssh $ALVO 'docker images g5esportes'"
