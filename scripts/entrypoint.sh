#!/bin/sh
set -e

echo "🚀 Starting Project Atlas Container on Port ${PORT:-8080}..."

# Ensure data directory exists
mkdir -p /app/data

# Sync Prisma Schema with SQLite database
echo "📦 Synchronizing Prisma SQLite database schema..."
npx prisma db push --skip-generate

# Seed database on first run
if [ ! -f "/app/data/.seeded" ]; then
  echo "🌱 Seeding initial organizational policies, users, and vector embeddings..."
  npx tsx prisma/seed.ts || true
  touch /app/data/.seeded
fi

echo "✨ Starting Next.js standalone production server..."
exec node server.js
