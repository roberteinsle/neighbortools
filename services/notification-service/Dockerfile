FROM node:18-alpine AS base
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY services/notification-service/package.json ./services/notification-service/

RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/shared-utils/node_modules ./packages/shared-utils/node_modules
COPY --from=deps /app/services/notification-service/node_modules ./services/notification-service/node_modules

COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY services/notification-service ./services/notification-service

WORKDIR /app/packages/shared-types
RUN pnpm build

WORKDIR /app/packages/shared-utils
RUN pnpm build

WORKDIR /app/services/notification-service
RUN npx prisma generate
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy root node_modules (pnpm uses symlinks from service node_modules to root .pnpm store)
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/packages/shared-utils/package.json ./packages/shared-utils/
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/
COPY --from=builder /app/services/notification-service/prisma ./services/notification-service/prisma
COPY --from=builder /app/services/notification-service/node_modules ./services/notification-service/node_modules

# Copy email templates
COPY --from=builder /app/services/notification-service/src/templates ./services/notification-service/dist/templates

WORKDIR /app/services/notification-service

EXPOSE 3005

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
