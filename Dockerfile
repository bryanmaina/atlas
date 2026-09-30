# ------------------------------------------------------------------------------
# Project Atlas — Optimized Multi-Stage Dockerfile for Next.js Standalone + SQLite
# ------------------------------------------------------------------------------

# 1. Base stage: Minimal Alpine with OpenSSL & libc compatibility for Prisma
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 2. Dependencies stage: Install node_modules
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# 3. Builder stage: Generate Prisma client, compile Next.js standalone, and pre-seed SQLite
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for linux-musl target
RUN npx prisma generate

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Pre-initialize and seed SQLite database template for instant (<100ms) cold start
ENV DATABASE_URL="file:/app/template/atlas.db"
RUN mkdir -p /app/template && \
    npx prisma db push && \
    npx tsx prisma/seed.ts

# 4. Production Runner stage: Ultra-lightweight final container (Cloud Run target)
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/atlas.db"

# Create non-root system user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone server and static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy pre-seeded SQLite template
COPY --from=builder --chown=nextjs:nodejs /app/template /app/template

# Copy startup entrypoint script
COPY --from=builder --chown=nextjs:nodejs /app/scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Create writable data directory for SQLite runtime
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 8080

ENTRYPOINT ["sh", "./entrypoint.sh"]
