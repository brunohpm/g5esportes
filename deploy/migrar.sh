#!/usr/bin/env bash
# Aplica as migrações de banco pendentes no servidor.
#
#   ./deploy/migrar.sh                     # aplica o que falta
#   ./deploy/migrar.sh --conferir          # só confere, não altera nada
#
# POR QUE ISTO EXISTE
# O Payload sincroniza o schema sozinho apenas em DESENVOLVIMENTO (`push`).
# Em produção ele assume que as tabelas já existem. Em 07/08/2026 uma imagem
# com campos novos foi publicada sem esse passo: as tabelas não existiam e o
# site devolveu 500 em todas as páginas públicas — enquanto o healthcheck
# seguia "healthy", porque o endpoint que ele consultava não tocava no banco.
#
# Cada arquivo .sql em deploy/migracoes/ roda UMA vez, em ordem de nome, e
# fica registrado em `migracoes_aplicadas`. Os arquivos são idempotentes de
# qualquer forma (IF NOT EXISTS), então reaplicar não quebra.
set -euo pipefail

ALVO="${ALVO:-root@2.25.182.14}"
DESTINO="${DESTINO:-/opt/g5esportes}"
CONTAINER="${CONTAINER:-g5-postgres}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
SO_CONFERIR="${1:-}"

# O SQL vai por STDIN, nunca como argumento: passar consulta em `-c` através de
# ssh exige dois níveis de escape e quebra em qualquer parêntese ou aspas.
psql_remoto() {
  ssh -o BatchMode=yes "$ALVO" \
    "docker exec -i $CONTAINER psql -U g5 -d g5esportes -v ON_ERROR_STOP=1 -q"
}
psql_consulta() {
  ssh -o BatchMode=yes "$ALVO" \
    "docker exec -i $CONTAINER psql -U g5 -d g5esportes -v ON_ERROR_STOP=1 -tA" | tr -d '\r'
}
psql_local_consulta() {
  docker exec -i g5-postgres-dev psql -U g5 -d g5esportes -tA | tr -d '\r'
}

# Registro das migrações já aplicadas.
psql_remoto > /dev/null <<'SQL'
CREATE TABLE IF NOT EXISTS migracoes_aplicadas (
  arquivo     text PRIMARY KEY,
  aplicada_em timestamptz NOT NULL DEFAULT now()
);
SQL

aplicadas="$(echo 'SELECT arquivo FROM migracoes_aplicadas;' | psql_consulta || true)"

pendentes=()
for arq in "$RAIZ"/deploy/migracoes/*.sql; do
  [ -e "$arq" ] || continue
  nome="$(basename "$arq")"
  grep -qxF "$nome" <<< "$aplicadas" || pendentes+=("$arq")
done

if [ ${#pendentes[@]} -eq 0 ]; then
  echo "  migrações: nenhuma pendente"
else
  echo "  migrações pendentes: ${#pendentes[@]}"
  for arq in "${pendentes[@]}"; do
    nome="$(basename "$arq")"
    if [ "$SO_CONFERIR" = "--conferir" ]; then
      echo "    · $nome (não aplicada — modo conferência)"
      continue
    fi
    echo "    aplicando $nome"
    psql_remoto < "$arq"
    echo "INSERT INTO migracoes_aplicadas (arquivo) VALUES ('$nome') ON CONFLICT DO NOTHING;" \
      | psql_remoto > /dev/null
  done
fi

# ── Rede de segurança ───────────────────────────────────────────────────────
# Compara o schema de produção com o de desenvolvimento, que é o que o Payload
# gera a partir do código. Divergência aqui significa migração faltando — é
# exatamente o sintoma que derrubou o site.
echo "  conferindo schema contra o banco de desenvolvimento"

CONSULTA_TABELAS="SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'migracoes_aplicadas' ORDER BY 1;"
CONSULTA_COLUNAS="SELECT table_name||'.'||column_name FROM information_schema.columns WHERE table_schema='public' AND table_name <> 'migracoes_aplicadas' ORDER BY 1;"

local_tabelas="$(echo "$CONSULTA_TABELAS" | psql_local_consulta)"
prod_tabelas="$(echo "$CONSULTA_TABELAS" | psql_consulta)"
local_colunas="$(echo "$CONSULTA_COLUNAS" | psql_local_consulta)"
prod_colunas="$(echo "$CONSULTA_COLUNAS" | psql_consulta)"

faltam_tabelas="$(comm -23 <(sort <<< "$local_tabelas") <(sort <<< "$prod_tabelas") || true)"
faltam_colunas="$(comm -23 <(sort <<< "$local_colunas") <(sort <<< "$prod_colunas") || true)"

if [ -n "$faltam_tabelas" ] || [ -n "$faltam_colunas" ]; then
  echo >&2
  echo "ERRO: o banco de produção está atrás do código." >&2
  [ -n "$faltam_tabelas" ] && { echo "  tabelas faltando:" >&2; sed 's/^/    /' >&2 <<< "$faltam_tabelas"; }
  [ -n "$faltam_colunas" ] && { echo "  colunas faltando:" >&2; sed 's/^/    /' >&2 <<< "$faltam_colunas"; }
  echo >&2
  echo "Escreva a migração em deploy/migracoes/ antes de publicar." >&2
  echo "Para ver o DDL do que falta:" >&2
  echo "  docker exec g5-postgres-dev pg_dump -U g5 -d g5esportes --schema-only --no-owner -t <tabela>" >&2
  exit 1
fi

echo "  schema em dia"
