#!/bin/bash
# Railway Setup Script for NeighborTools Monorepo
#
# Prerequisites:
#   - Railway CLI installed: npm install -g @railway/cli
#   - Logged in: railway login
#
# This script creates all services and configures them for the monorepo.
# Run from the repository root.

set -e

echo "=== NeighborTools Railway Setup ==="
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "Error: Railway CLI not installed. Run: npm install -g @railway/cli"
    exit 1
fi

# Check login
if ! railway whoami &> /dev/null; then
    echo "Error: Not logged in. Run: railway login"
    exit 1
fi

echo "Step 1: Link or create Railway project"
echo "--------------------------------------"
if ! railway status &> /dev/null 2>&1; then
    echo "No project linked. Creating new project..."
    railway init
fi

echo ""
echo "Step 2: Add PostgreSQL database"
echo "-------------------------------"
echo "Please add a PostgreSQL database in the Railway dashboard:"
echo "  → Project Dashboard → New → Database → PostgreSQL"
echo ""
read -p "Press Enter when PostgreSQL is added..."

echo ""
echo "Step 3: Create services"
echo "-----------------------"
echo ""
echo "For each microservice, create a Railway service in the dashboard:"
echo ""
echo "  1. api-gateway"
echo "     → Source: GitHub Repo"
echo "     → Root Directory: (leave empty)"
echo "     → Dockerfile Path: services/api-gateway/Dockerfile"
echo ""
echo "  2. user-service"
echo "     → Source: GitHub Repo"
echo "     → Root Directory: (leave empty)"
echo "     → Dockerfile Path: services/user-service/Dockerfile"
echo ""
echo "  3. tool-service"
echo "     → Source: GitHub Repo"
echo "     → Root Directory: (leave empty)"
echo "     → Dockerfile Path: services/tool-service/Dockerfile"
echo ""
echo "  4. lending-service"
echo "     → Source: GitHub Repo"
echo "     → Root Directory: (leave empty)"
echo "     → Dockerfile Path: services/lending-service/Dockerfile"
echo ""
echo "  5. neighborhood-service"
echo "     → Source: GitHub Repo"
echo "     → Root Directory: (leave empty)"
echo "     → Dockerfile Path: services/neighborhood-service/Dockerfile"
echo ""
echo "  6. notification-service"
echo "     → Source: GitHub Repo"
echo "     → Root Directory: (leave empty)"
echo "     → Dockerfile Path: services/notification-service/Dockerfile"
echo ""
echo "  7. frontend"
echo "     → Source: GitHub Repo"
echo "     → Root Directory: (leave empty)"
echo "     → Dockerfile Path: services/frontend/Dockerfile"
echo ""
read -p "Press Enter when all services are created..."

echo ""
echo "Step 4: Environment Variables"
echo "-----------------------------"
echo ""
echo "Set these environment variables for each service in the Railway dashboard:"
echo ""
echo "=== Shared (all backend services) ==="
echo "  DATABASE_URL=\${{Postgres.DATABASE_URL}}  (Railway reference variable)"
echo ""
echo "=== api-gateway ==="
echo "  JWT_SECRET=<generate-a-secure-random-string>"
echo "  USER_SERVICE_URL=http://user-service.railway.internal:3001"
echo "  TOOL_SERVICE_URL=http://tool-service.railway.internal:3002"
echo "  LENDING_SERVICE_URL=http://lending-service.railway.internal:3003"
echo "  NEIGHBORHOOD_SERVICE_URL=http://neighborhood-service.railway.internal:3004"
echo "  NOTIFICATION_SERVICE_URL=http://notification-service.railway.internal:3005"
echo ""
echo "=== user-service ==="
echo "  JWT_SECRET=<same-as-api-gateway>"
echo "  DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo ""
echo "=== tool-service ==="
echo "  DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo ""
echo "=== lending-service ==="
echo "  DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo ""
echo "=== neighborhood-service ==="
echo "  DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo ""
echo "=== notification-service ==="
echo "  DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo "  SMTP_HOST=<your-smtp-host>"
echo "  SMTP_PORT=587"
echo "  SMTP_USER=<your-smtp-user>"
echo "  SMTP_PASS=<your-smtp-password>"
echo "  SMTP_FROM=noreply@neighbortools.net"
echo ""
echo "=== frontend ==="
echo "  API_GATEWAY_HOST=api-gateway.railway.internal"
echo "  API_GATEWAY_PORT=3000"
echo "  PORT=80"
echo ""
echo ""
echo "Step 5: Networking"
echo "------------------"
echo "  → Generate a public domain for the 'frontend' service"
echo "  → All other services use Railway's internal networking (no public domain needed)"
echo ""
echo "Step 6: Deploy"
echo "--------------"
echo "Push to main branch. Railway auto-deploys on push."
echo ""
echo "=== Setup Complete ==="
