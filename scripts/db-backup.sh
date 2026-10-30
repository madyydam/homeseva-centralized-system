#!/bin/bash
# scripts/db-backup.sh
# Nightly whole-database pg_dump backup — disaster recovery
# Run via cron: 0 2 * * * /path/to/homeseva/scripts/db-backup.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/homeseva}"
DB_NAME="${POSTGRES_DB:-homeseva_db}"
DB_USER="${POSTGRES_USER:-homeseva}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
S3_BUCKET="${S3_BUCKET:-homeseva-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="homeseva_full_${TIMESTAMP}.dump"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Starting nightly pg_dump backup..."
mkdir -p "$BACKUP_DIR"

# Dump
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -Fc \
  -f "$FILEPATH" \
  "$DB_NAME"

echo "[$(date)] Dump complete: $FILEPATH ($(du -sh $FILEPATH | cut -f1))"

# Checksum
sha256sum "$FILEPATH" > "${FILEPATH}.sha256"
echo "[$(date)] Checksum: $(cat ${FILEPATH}.sha256)"

# Upload to S3 (requires aws CLI or mc configured)
if command -v aws &> /dev/null; then
  aws s3 cp "$FILEPATH" "s3://${S3_BUCKET}/nightly/${FILENAME}" \
    --server-side-encryption AES256
  aws s3 cp "${FILEPATH}.sha256" "s3://${S3_BUCKET}/nightly/${FILENAME}.sha256"
  echo "[$(date)] Uploaded to S3: s3://${S3_BUCKET}/nightly/${FILENAME}"
fi

# Remove old local backups beyond retention
find "$BACKUP_DIR" -name "homeseva_full_*.dump" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Cleaned up backups older than ${RETENTION_DAYS} days"

echo "[$(date)] Nightly backup complete."

