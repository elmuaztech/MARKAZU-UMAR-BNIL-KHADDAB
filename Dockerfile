# Multi-stage Dockerfile for Markazu Umar School Management System

FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat ca-certificates

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install --legacy-peer-deps

# Stage 2: Build Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_OPTIONS "--max-old-space-size=2048"
ENV DATABASE_URL "postgresql://mssms_user:mssms_secure_pass_1447@postgres:5432/mssms_db?schema=public"
RUN npm run build

# Stage 3: Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/nodemailer ./node_modules/nodemailer

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
