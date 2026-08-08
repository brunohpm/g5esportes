#!/usr/bin/env bash
# Remove rascunhos órfãos — versões sem documento pai.
#
#   ./deploy/limpar-orfaos.sh              # lista o que encontrou, não apaga
#   ./deploy/limpar-orfaos.sh --apagar     # apaga
#
# POR QUE PRECISA DISTO
# O Payload grava rascunhos numa tabela de versões (`_posts_v`, `_paginas_v`),
# ligada ao documento por `parent_id`. Quando um rascunho é salvo antes de o
# documento existir, a linha fica com `parent_id` nulo. O painel LISTA essa
# linha, como "<Nenhum(a) Título>", mas não consegue apagá-la: deletar exige o
# ID do documento, que não existe. A mensagem que aparece é
# "O documento com o ID null não pôde ser encontrado".
#
# Só apaga linha que esteja SIMULTANEAMENTE sem pai, sem título e sem
# conteúdo. Rascunho de verdade, com texto começado, nunca é tocado.
set -euo pipefail

ALVO="${ALVO:-root@2.25.182.14}"
CONTAINER="${CONTAINER:-g5-postgres}"
APAGAR="${1:-}"

psql_remoto() {
  ssh -o BatchMode=yes "$ALVO" \
    "docker exec -i $CONTAINER psql -U g5 -d g5esportes -v ON_ERROR_STOP=1 $*"
}

for tabela in _posts_v _paginas_v; do
  campo_titulo="version_titulo"
  campo_conteudo=$([ "$tabela" = "_posts_v" ] && echo "version_conteudo" || echo "version_titulo")

  echo "» $tabela"
  encontrados="$(psql_remoto -tA <<SQL
SELECT id FROM $tabela
WHERE parent_id IS NULL
  AND ($campo_titulo IS NULL OR $campo_titulo = '')
  AND ($campo_conteudo IS NULL OR $campo_conteudo::text = '');
SQL
)"

  if [ -z "$encontrados" ]; then
    echo "    nenhum órfão"
    continue
  fi

  echo "    órfãos: $(tr '\n' ' ' <<< "$encontrados")"
  if [ "$APAGAR" != "--apagar" ]; then
    echo "    (nada foi apagado — rode com --apagar)"
    continue
  fi

  psql_remoto <<SQL
BEGIN;
DELETE FROM $tabela
WHERE parent_id IS NULL
  AND ($campo_titulo IS NULL OR $campo_titulo = '')
  AND ($campo_conteudo IS NULL OR $campo_conteudo::text = '');
COMMIT;
SQL
  echo "    removidos"
done
