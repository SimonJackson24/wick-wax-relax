#!/usr/bin/env bash
# Daily Postgres backup with 30-day retention (roadmap 1.36).
#
# Usage: ./scripts/backup-db.sh
# Cron (3am daily):  0 3 * * *  cd /path/to/wick-wax-relax && ./scripts/backup-db.sh >> logs/backup.log 2>&1
#
# Reads DB_* from backend/.env (same vars the app uses). Backups land in
# backups/ (gitignored) as gzip'd custom-format dumps — custom format
# supports selective restore (single table) via pg_restore.
#
# Offsite copy: this script prepares the local 30-day window; the hosted
# DB (CloudPanel/managed) should ALSO have automated snapshots enabled —
# belt and braces. To push offsite, add after the dump:
#   rclone copy "$OUT" remote:wickwaxrelax-backups/   (or aws s3 cp)

set -euo pipefail

cd "$(dirname "$0")/.."

# Load DB config from backend/.env
if [ -f backend/.env ]; then
  set -a; . backend/.env; set +a
fi

: "${DB_HOST:?DB_HOST not set (check backend/.env)}"
: "${DB_NAME:?DB_NAME not set}"
: "${DB_USER:?DB_USER not set}"
DB_PORT="${DB_PORT:-5432}"

BACKUP_DIR="backups"
RETENTION_DAYS=30
STAMP="$(date +%Y-%m-%d_%H%M%S)"
OUT="$BACKUP_DIR/${DB_NAME}_${STAMP}.dump.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] dumping ${DB_NAME}@${DB_HOST}:${DB_PORT} -> $OUT"

# -Fc: custom format (pg_restore-compatible, compressed)
# PGPASSWORD via env if present in .env
PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
  -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -Fc \
  | gzip -9 > "$OUT"

SIZE="$(du -h "$OUT" | cut -f1)"
echo "[$(date -Iseconds)] wrote $OUT ($SIZE)"

# Retention: prune local dumps older than the window
find "$BACKUP_DIR" -name '*.dump.gz' -mtime +"$RETENTION_DAYS" -delete
echo "[$(date -Iseconds)] pruned backups older than ${RETENTION_DAYS}d"

# Integrity spot-check: newest dump must list its tables
if command -v pg_restore >/dev/null 2>&1; then
  TABLES="$(pg_restore --list "$OUT" 2>/dev/null | grep -c 'TABLE' || true)"
  echo "[$(date -Iseconds)] integrity check: $TABLES table entries in catalog"
  if [ "$TABLES" -lt 5 ]; then
    echo "WARNING: dump catalog looks thin — verify $OUT manually" >&2
  fi
fi
