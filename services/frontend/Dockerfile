# Production Dockerfile for Frontend
FROM node:18-alpine AS base
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY services/frontend/package.json ./services/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/frontend/node_modules ./services/frontend/node_modules

# Copy source code
COPY services/frontend ./services/frontend

# Build the application
WORKDIR /app/services/frontend
RUN pnpm run build

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy nginx config template for production
COPY services/frontend/nginx.prod.conf.template /etc/nginx/templates/default.conf.template

# Copy built assets from builder
COPY --from=builder /app/services/frontend/dist /usr/share/nginx/html

# Default environment variables (overridden by Railway)
ENV PORT=80
ENV API_GATEWAY_HOST=api-gateway.railway.internal
ENV API_GATEWAY_PORT=3000

EXPOSE 80

# Substitute env vars in nginx config and start nginx
CMD ["/bin/sh", "-c", "export RESOLVER=$(grep nameserver /etc/resolv.conf | head -1 | awk '{print $2}') && envsubst '${PORT} ${API_GATEWAY_HOST} ${API_GATEWAY_PORT} ${RESOLVER}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
