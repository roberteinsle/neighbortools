FROM node:18-alpine AS base
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY services/lending-service/package.json ./services/lending-service/

RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/shared-utils/node_modules ./packages/shared-utils/node_modules
COPY --from=deps /app/services/lending-service/node_modules ./services/lending-service/node_modules

COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY services/lending-service ./services/lending-service

WORKDIR /app/packages/shared-types
RUN pnpm build

WORKDIR /app/packages/shared-utils
RUN pnpm build

WORKDIR /app/services/lending-service
RUN npx prisma generate
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/packages/shared-utils/package.json ./packages/shared-utils/
COPY --from=builder /app/services/lending-service/dist ./services/lending-service/dist
COPY --from=builder /app/services/lending-service/package.json ./services/lending-service/
COPY --from=builder /app/services/lending-service/prisma ./services/lending-service/prisma
COPY --from=builder /app/services/lending-service/node_modules ./services/lending-service/node_modules

WORKDIR /app/services/lending-service

EXPOSE 3003

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
