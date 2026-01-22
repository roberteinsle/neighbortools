#!/bin/bash

# Development environment setup script
# Usage: ./scripts/setup-dev.sh

set -e

echo "Setting up NeighborTools development environment..."

# Check for required tools
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required but not installed. Install with: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "docker-compose is required but not installed."; exit 1; }

# Copy environment file if not exists
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Please edit .env file with your configuration"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install

# Build shared packages
echo ""
echo "Building shared packages..."
pnpm --filter @neighbortools/shared-types run build
pnpm --filter @neighbortools/shared-utils run build

# Start Docker containers
echo ""
echo "Starting Docker containers..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo ""
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Run migrations
echo ""
echo "Running database migrations..."
./scripts/migrate-all.sh

echo ""
echo "==================================="
echo "Development environment is ready!"
echo "==================================="
echo ""
echo "Start all services with: docker-compose up -d"
echo "Or start individual services with: docker-compose up -d <service-name>"
echo ""
echo "Frontend: http://localhost:5173"
echo "API Gateway: http://localhost:3000"
