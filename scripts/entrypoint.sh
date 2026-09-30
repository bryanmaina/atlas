#!/bin/sh
set -e

echo "🚀 Starting Project Atlas Container on Port ${PORT:-8080}..."

# Ensure writable data directory exists
mkdir -p /app/data

# If database file does not exist in the volume or container writable layer, copy pre-seeded template
if [ ! -f "/app/data/atlas.db" ]; then
  echo "📦 Initializing SQLite database from pre-seeded template..."
  if [ -f "/app/template/atlas.db" ]; then
    cp /app/template/atlas.db /app/data/atlas.db
    chmod 664 /app/data/atlas.db 2>/dev/null || true
  else
    echo "⚠️  Template database not found. Creating fresh schema..."
    npx prisma db push --skip-generate
  fi
else
  echo "✓ Existing SQLite database detected at /app/data/atlas.db"
fi

echo "✨ Starting Next.js standalone production server..."
exec node server.js
