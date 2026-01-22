FROM node:18-alpine AS base
RUN apk add --no-cache openssl && npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY services/tool-service/package.json ./services/tool-service/

RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/shared-utils/node_modules ./packages/shared-utils/node_modules
COPY --from=deps /app/services/tool-service/node_modules ./services/tool-service/node_modules

COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY services/tool-service ./services/tool-service

WORKDIR /app/packages/shared-types
RUN pnpm build

WORKDIR /app/packages/shared-utils
RUN pnpm build

WORKDIR /app/services/tool-service
RUN npx prisma generate
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install sharp dependencies for image processing
RUN apk add --no-cache vips-dev

# Copy root node_modules (pnpm uses symlinks from service node_modules to root .pnpm store)
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/packages/shared-utils/package.json ./packages/shared-utils/
COPY --from=builder /app/services/tool-service/dist ./services/tool-service/dist
COPY --from=builder /app/services/tool-service/package.json ./services/tool-service/
COPY --from=builder /app/services/tool-service/prisma ./services/tool-service/prisma
COPY --from=builder /app/services/tool-service/node_modules ./services/tool-service/node_modules

WORKDIR /app/services/tool-service

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3002

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
