#!/bin/bash
# Script tự động backup database định kỳ
# Crontab: 0 2 * * * /var/www/taybac/backup-db.sh

APP_DIR="/var/www/taybac"
BACKUP_DIR="$APP_DIR/backups"
DB_FILE="$APP_DIR/backend/taybac.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Tạo thư mục backup nếu chưa có
mkdir -p $BACKUP_DIR

# Backup database
echo "🔄 Backing up database..."
cp $DB_FILE "$BACKUP_DIR/taybac.db.$TIMESTAMP"

# Nén file backup
gzip "$BACKUP_DIR/taybac.db.$TIMESTAMP"

# Xóa backup cũ hơn 30 ngày
find $BACKUP_DIR -name "taybac.db.*.gz" -mtime +30 -delete

echo "✅ Backup hoàn tất: taybac.db.$TIMESTAMP.gz"

# Hiển thị danh sách backup
echo ""
echo "📁 Danh sách backup:"
ls -lh $BACKUP_DIR/
