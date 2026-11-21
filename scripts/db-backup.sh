#!/bin/bash
# scripts/db-backup.sh
# Nightly whole-database pg_dump backup — disaster recovery
# Run via cron: 0 2 * * * /opt/homeseva/scripts/db-backup.sh

set -euo pipefail

# 1. Source environment variables if available
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  # Load env vars safely
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-/backups/homeseva}"
DB_NAME="${POSTGRES_DB:-homeseva_db}"
DB_USER="${POSTGRES_USER:-homeseva}"
DB_PASS="${POSTGRES_PASSWORD:-}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
S3_BUCKET="${S3_BUCKET:-homeseva-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="homeseva_full_${TIMESTAMP}.dump"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Starting nightly pg_dump backup..."
mkdir -p "$BACKUP_DIR"

# 2. Execute pg_dump via Docker container or local psql
if docker ps --format '{{.Names}}' | grep -q "homeseva_postgres"; then
  docker exec homeseva_postgres pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$FILEPATH"
elif [ -n "$DB_PASS" ]; then
  PGPASSWORD="$DB_PASS" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -Fc \
    -f "$FILEPATH" \
    "$DB_NAME"
else
  echo "[$(date)] ERROR: Neither homeseva_postgres container nor POSTGRES_PASSWORD available."
  exit 1
fi

echo "[$(date)] Dump complete: $FILEPATH ($(du -sh "$FILEPATH" | cut -f1))"

# Checksum
sha256sum "$FILEPATH" > "${FILEPATH}.sha256"
echo "[$(date)] Checksum: $(cat "${FILEPATH}.sha256")"

# Upload to S3 (optional, requires aws CLI or mc configured)
if command -v aws &> /dev/null; then
  aws s3 cp "$FILEPATH" "s3://${S3_BUCKET}/nightly/${FILENAME}" \
    --server-side-encryption AES256
  aws s3 cp "${FILEPATH}.sha256" "s3://${S3_BUCKET}/nightly/${FILENAME}.sha256"
  echo "[$(date)] Uploaded to S3: s3://${S3_BUCKET}/nightly/${FILENAME}"
fi

# Remove old local backups beyond retention
find "$BACKUP_DIR" -name "homeseva_full_*.dump" -mtime "+${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -name "homeseva_full_*.dump.sha256" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date)] Cleaned up backups older than ${RETENTION_DAYS} days"

echo "[$(date)] Nightly backup complete."
