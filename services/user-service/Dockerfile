FROM node:18-alpine AS base
RUN apk add --no-cache openssl && npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY services/user-service/package.json ./services/user-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/shared-utils/node_modules ./packages/shared-utils/node_modules
COPY --from=deps /app/services/user-service/node_modules ./services/user-service/node_modules

# Copy source code
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY services/user-service ./services/user-service

# Build shared packages
WORKDIR /app/packages/shared-types
RUN pnpm build

WORKDIR /app/packages/shared-utils
RUN pnpm build

# Generate Prisma client and build service
WORKDIR /app/services/user-service
RUN npx prisma generate
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy root node_modules (pnpm uses symlinks from service node_modules to root .pnpm store)
COPY --from=builder /app/node_modules ./node_modules

# Copy built artifacts
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/packages/shared-utils/package.json ./packages/shared-utils/
COPY --from=builder /app/services/user-service/dist ./services/user-service/dist
COPY --from=builder /app/services/user-service/package.json ./services/user-service/
COPY --from=builder /app/services/user-service/prisma ./services/user-service/prisma
COPY --from=builder /app/services/user-service/node_modules ./services/user-service/node_modules

WORKDIR /app/services/user-service

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
