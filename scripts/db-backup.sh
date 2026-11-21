#!/bin/bash
# ==============================================================================
# HOMESEVA WEEKLY AUTOMATED DATABASE BACKUP & ROTATION
# Schedule: Every Sunday at 02:00 AM
# Crontab entry:
#   0 2 * * 0 /bin/bash /opt/homeseva/scripts/db-backup.sh >> /var/log/homeseva-backup.log 2>&1
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 1. Load environment variables safely if present
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-/backups/homeseva}"
DB_NAME="${POSTGRES_DB:-homeseva_db}"
DB_USER="${POSTGRES_USER:-homeseva}"
DB_PASS="${POSTGRES_PASSWORD:-}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

DATE_TAG=$(date +%Y%m%d_%H%M%S)
FILENAME="homeseva_weekly_${DATE_TAG}.dump"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "================================================================="
echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Starting Weekly Sunday PostgreSQL Backup..."
echo "Target DB: ${DB_NAME} | Output: ${FILEPATH}"
echo "================================================================="

mkdir -p "$BACKUP_DIR"

# 2. Execute pg_dump via Docker container (preferred) or local pg_dump
if docker ps --format '{{.Names}}' | grep -q "homeseva_postgres"; then
  echo "Executing pg_dump inside homeseva_postgres container..."
  docker exec -t homeseva_postgres pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$FILEPATH"
elif [ -n "$DB_PASS" ]; then
  echo "Executing pg_dump via host connection..."
  PGPASSWORD="$DB_PASS" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -Fc \
    -f "$FILEPATH" \
    "$DB_NAME"
else
  echo "[ERROR] Neither 'homeseva_postgres' container nor POSTGRES_PASSWORD is available."
  exit 1
fi

# Verify dump was created and is non-empty
if [ ! -s "$FILEPATH" ]; then
  echo "[ERROR] Backup failed: output file is missing or empty."
  rm -f "$FILEPATH"
  exit 1
fi

FILESIZE=$(du -sh "$FILEPATH" | cut -f1)
echo "✅ Dump generated successfully: ${FILEPATH} (${FILESIZE})"

# 3. Calculate SHA-256 Checksum for tamper/corruption verification
sha256sum "$FILEPATH" > "${FILEPATH}.sha256"
echo "✅ SHA-256 Checksum: $(cat "${FILEPATH}.sha256")"

# 4. Optional Remote Storage (S3 / Cloudflare R2 / MinIO)
if [ -n "${S3_BUCKET:-}" ] && command -v aws &> /dev/null; then
  echo "Uploading weekly backup to s3://${S3_BUCKET}/weekly/..."
  aws s3 cp "$FILEPATH" "s3://${S3_BUCKET}/weekly/${FILENAME}" --server-side-encryption AES256
  aws s3 cp "${FILEPATH}.sha256" "s3://${S3_BUCKET}/weekly/${FILENAME}.sha256"
  echo "✅ S3 Upload complete."
fi

# 5. Weekly Rotation: Automatically delete backups older than retention window (7 days)
# Since the new full Sunday dump contains all cumulative data, previous weekly dumps are pruned.
echo "Cleaning up previous backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "homeseva_weekly_*.dump*" -mtime "+${RETENTION_DAYS}" -exec rm -f {} +
find "$BACKUP_DIR" -name "homeseva_full_*.dump*" -mtime "+${RETENTION_DAYS}" -exec rm -f {} +

REMAINING_COUNT=$(find "$BACKUP_DIR" -name "*.dump" | wc -l)
echo "✅ Cleanup finished. Total backup archives currently retained: ${REMAINING_COUNT}"
echo "================================================================="
echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Weekly backup completed successfully."
echo "================================================================="
