#!/bin/sh
# Backup do banco e dos uploads.
#
# Instalar no VPS (como root, que é quem tem o /opt):
#   chmod +x /opt/g5esportes/deploy/backup.sh
#   crontab -e
#   10 3 * * *  /opt/g5esportes/deploy/backup.sh       >> /opt/g5esportes/backups/backup.log 2>&1
#   40 3 * * 0  /opt/g5esportes/deploy/backup.sh midia >> /opt/g5esportes/backups/backup.log 2>&1
#
# O dump do banco é pequeno (~2 MB) e roda todo dia. A mídia tem ~700 MB e
# quase não comprime (já é webp/jpeg), então roda só aos domingos — 14 cópias
# diárias dela encheriam ~10 GB do disco que também é dos outros três clientes.
#
# ATENÇÃO: este servidor hospeda formiz, metodoaxion e casadoauau.
# NUNCA rode `docker system prune -a` nem `docker volume prune` aqui.
# Para liberar espaço: `docker builder prune -f`.
set -eu

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="$RAIZ/backups"
CARIMBO="$(date +%Y-%m-%d_%H%M)"
RETENCAO_BANCO=14
RETENCAO_MIDIA=28

# `nice`/`ionice` para o backup não roubar CPU e I/O dos vizinhos às 3h.
SUAVE="nice -n 19"
command -v ionice >/dev/null 2>&1 && SUAVE="$SUAVE ionice -c3"

mkdir -p "$DESTINO"
cd "$RAIZ"

echo "[$(date '+%F %T')] iniciando backup ${1:-banco}"

# ── Banco ───────────────────────────────────────────────────────────────────
# O pg_dump roda dentro do container, então não precisa de cliente no host.
# `-Fc` (formato custom) permite restauração seletiva e já vem comprimido.
$SUAVE docker compose exec -T postgres \
  pg_dump -U g5 -d g5esportes -Fc > "$DESTINO/banco_$CARIMBO.dump"
echo "  banco:  $(du -h "$DESTINO/banco_$CARIMBO.dump" | cut -f1)"

# ── Mídia (só quando chamado com "midia") ───────────────────────────────────
if [ "${1:-}" = "midia" ]; then
  # Sem -z: os arquivos já são webp/jpeg, gzipar 700 MB num core só custa
  # muito e economiza quase nada.
  $SUAVE tar -cf "$DESTINO/midia_$CARIMBO.tar" -C "$RAIZ" media
  echo "  mídia:  $(du -h "$DESTINO/midia_$CARIMBO.tar" | cut -f1)"
fi

# ── Expurgo ─────────────────────────────────────────────────────────────────
find "$DESTINO" -name 'banco_*.dump' -mtime "+$RETENCAO_BANCO" -delete
find "$DESTINO" -name 'midia_*.tar'  -mtime "+$RETENCAO_MIDIA" -delete

LIVRE=$(df -h "$RAIZ" | awk 'NR==2{print $4}')
echo "[$(date '+%F %T')] concluído — $(ls -1 "$DESTINO"/banco_*.dump 2>/dev/null | wc -l) dumps guardados, $LIVRE livres no disco"

# O backup só protege de perda do servidor se sair dele. Configure uma cópia
# externa (rclone para S3/Backblaze/Drive) apontando para $DESTINO.
