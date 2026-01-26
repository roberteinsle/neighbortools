#!/bin/bash

# Production Database Reset Script
# WARNING: This will DELETE all data!

set -e

echo "=========================================="
echo "  PRODUCTION DATABASE RESET"
echo "=========================================="
echo ""
echo "WARNING: This will DELETE ALL DATA!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Stopping all services..."
docker compose -f docker-compose.prod.yml down

echo ""
echo "Step 2: Removing database volume..."
docker volume rm neighbortools_postgres_data 2>/dev/null || echo "Volume already removed or doesn't exist"

echo ""
echo "Step 3: Starting database..."
docker compose -f docker-compose.prod.yml up -d postgres

echo ""
echo "Step 4: Waiting for database to be ready..."
sleep 10

echo ""
echo "Step 5: Starting all services..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "Step 6: Waiting for services to start..."
sleep 15

echo ""
echo "Step 7: Pushing Prisma schemas to database..."
docker exec neighbortools-user-service npx prisma db push --skip-generate
docker exec neighbortools-tool-service npx prisma db push --skip-generate
docker exec neighbortools-lending-service npx prisma db push --skip-generate
docker exec neighbortools-neighborhood-service npx prisma db push --skip-generate
docker exec neighbortools-notification-service npx prisma db push --skip-generate

echo ""
echo "=========================================="
echo "  DATABASE RESET COMPLETE"
echo "=========================================="
echo ""
echo "All services have been restarted with a fresh database."
echo "You can now register new users at https://www.neighbortools.net"
