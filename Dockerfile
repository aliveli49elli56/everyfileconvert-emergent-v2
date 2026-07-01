# EveryFileConvert — Production Dockerfile
# Multi-stage build: deps → builder → runner
#
# Usage:
#   docker build -t everyfileconvert .
#   docker run -p 3000:3000 everyfileconvert
#
# Note: The application runs perfectly WITHOUT Docker (npm install && npm run dev).
# Docker is an optional deployment mechanism — not a development requirement.

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: deps — Install production dependencies only
# ─────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS deps

# Install system dependencies for native npm modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy lockfile and package manifest only (cache layer)
COPY package.json yarn.lock ./

# Install production-only dependencies
# --ignore-engines: some packages require Node 22 but we use 18 (Supabase etc.)
RUN yarn install --frozen-lockfile --ignore-engines --production=false

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: builder — Build the Next.js application
# ─────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
# IMPORTANT: All NEXT_PUBLIC_* env vars needed at build time must be passed as build args
ARG NEXT_PUBLIC_APP_URL=""
ARG NEXT_PUBLIC_ENABLE_AUTH="false"
ARG NEXT_PUBLIC_ENABLE_PAYMENTS="false"
ARG NEXT_PUBLIC_ENABLE_DB="false"
ARG NEXT_PUBLIC_ENABLE_REDIS="false"
ARG NEXT_PUBLIC_ENABLE_SEARCH="false"
ARG NEXT_PUBLIC_ENABLE_AI="false"
ARG NEXT_PUBLIC_ENABLE_CDN="false"
ARG NEXT_PUBLIC_ENABLE_QUEUE="false"
ARG NEXT_PUBLIC_ENABLE_STORAGE="false"
ARG NEXT_PUBLIC_ENABLE_NOTIFICATIONS="false"
ARG NEXT_PUBLIC_ENABLE_SERVER_PROVIDERS="false"
ARG NEXT_PUBLIC_ENABLE_MONITORING="false"
ARG NEXT_PUBLIC_ENABLE_LOCAL_STORAGE="false"
ARG NEXT_PUBLIC_ENABLE_DOCKER="false"

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ENABLE_AUTH=$NEXT_PUBLIC_ENABLE_AUTH
ENV NEXT_PUBLIC_ENABLE_PAYMENTS=$NEXT_PUBLIC_ENABLE_PAYMENTS
ENV NEXT_PUBLIC_ENABLE_DB=$NEXT_PUBLIC_ENABLE_DB
ENV NEXT_PUBLIC_ENABLE_REDIS=$NEXT_PUBLIC_ENABLE_REDIS
ENV NEXT_PUBLIC_ENABLE_SEARCH=$NEXT_PUBLIC_ENABLE_SEARCH
ENV NEXT_PUBLIC_ENABLE_AI=$NEXT_PUBLIC_ENABLE_AI
ENV NEXT_PUBLIC_ENABLE_CDN=$NEXT_PUBLIC_ENABLE_CDN
ENV NEXT_PUBLIC_ENABLE_QUEUE=$NEXT_PUBLIC_ENABLE_QUEUE
ENV NEXT_PUBLIC_ENABLE_STORAGE=$NEXT_PUBLIC_ENABLE_STORAGE
ENV NEXT_PUBLIC_ENABLE_NOTIFICATIONS=$NEXT_PUBLIC_ENABLE_NOTIFICATIONS
ENV NEXT_PUBLIC_ENABLE_SERVER_PROVIDERS=$NEXT_PUBLIC_ENABLE_SERVER_PROVIDERS
ENV NEXT_PUBLIC_ENABLE_MONITORING=$NEXT_PUBLIC_ENABLE_MONITORING
ENV NEXT_PUBLIC_ENABLE_LOCAL_STORAGE=$NEXT_PUBLIC_ENABLE_LOCAL_STORAGE
ENV NEXT_PUBLIC_ENABLE_DOCKER=$NEXT_PUBLIC_ENABLE_DOCKER

RUN yarn build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: runner — Minimal production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

USER nextjs

EXPOSE 3000

# Health check — Docker will mark container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -q -O- http://localhost:3000/en || exit 1

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
