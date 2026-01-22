#!/bin/bash

# Run Prisma migrations for all services
# Usage: ./scripts/migrate-all.sh

set -e

echo "Running migrations for all services..."

SERVICES=("user-service" "tool-service" "lending-service" "neighborhood-service" "notification-service")

for service in "${SERVICES[@]}"; do
  SERVICE_DIR="services/$service"

  if [ -d "$SERVICE_DIR" ] && [ -f "$SERVICE_DIR/prisma/schema.prisma" ]; then
    echo ""
    echo "=== Migrating $service ==="
    cd "$SERVICE_DIR"
    npx prisma migrate deploy
    npx prisma generate
    cd ../..
  else
    echo "Skipping $service (no Prisma schema found)"
  fi
done

echo ""
echo "All migrations completed!"
