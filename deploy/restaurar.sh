#!/bin/sh
# Restaura um backup gerado por backup.sh.
#
#   ./deploy/restaurar.sh backups/banco_2026-08-06_0310.dump
#   ./deploy/restaurar.sh backups/banco_2026-08-06_0310.dump backups/midia_2026-08-06_0340.tar
set -eu

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
BANCO="${1:-}"
MIDIA="${2:-}"

if [ -z "$BANCO" ]; then
  echo "uso: $0 <banco.dump> [midia.tar]" >&2
  exit 1
fi

cd "$RAIZ"

printf 'Isto SOBRESCREVE o banco%s atual. Continuar? [digite SIM] ' \
  "$([ -n "$MIDIA" ] && echo ' e a mídia')"
read -r resposta
[ "$resposta" = "SIM" ] || { echo "cancelado"; exit 1; }

echo "» parando a aplicação (o banco segue no ar para receber o restore)"
docker compose stop app

echo "» restaurando o banco"
docker compose exec -T postgres \
  pg_restore -U g5 -d g5esportes --clean --if-exists --no-owner < "$BANCO"

if [ -n "$MIDIA" ]; then
  echo "» restaurando a mídia"
  # Extrai por cima, sem mover a pasta: um `mv` trocaria o inode e o bind
  # mount do container continuaria apontando para a pasta antiga.
  tar -xf "$MIDIA" -C "$RAIZ" --overwrite
  # O container roda como UID 1000; sem isto os uploads novos falham.
  chown -R 1000:1000 "$RAIZ/media"
fi

echo "» subindo a aplicação"
docker compose start app

echo "» aguardando ficar saudável"
for _ in $(seq 1 30); do
  estado=$(docker inspect g5-app --format '{{.State.Health.Status}}' 2>/dev/null || echo desconhecido)
  [ "$estado" = "healthy" ] && { echo "pronto."; exit 0; }
  sleep 2
done

echo "AVISO: o container não ficou 'healthy' em 60s. Veja: docker compose logs app" >&2
exit 1
