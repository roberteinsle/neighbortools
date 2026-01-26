# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NeighborTools.net is a microservice-based tool sharing platform for neighborhood communities. Users can manage personal tool inventories, share them within neighborhoods, and handle lending workflows.

**Status**: Core implementation complete, frontend and services functional.

## Development Phases

### Phase 1: Project Foundation
- Monorepo setup (PNPM workspace, root package.json)
- Docker Compose configuration with PostgreSQL
- Shared packages (`shared-types`, `shared-utils`)
- Environment configuration (.env.example)

### Phase 2: User Service + API Gateway
- User Service: Registration, login, JWT token generation, user settings
- API Gateway: Request routing, JWT validation middleware, rate limiting
- Prisma schema for users

### Phase 3: Neighborhood Service
- Neighborhood CRUD operations
- Invite code generation and validation
- Membership management (join, leave, roles)

### Phase 4: Tool Service
- Tool CRUD operations
- Category management
- Photo upload and storage

### Phase 5: Lending Service
- Lending request workflow (request → approve/reject → return)
- Appointment scheduling
- Status tracking and history

### Phase 6: Notification Service
- Nodemailer integration (SMTP configuration)
- Multi-language email templates (EN, DE, ES, FR)
- Scheduled reminders for lending expirations

### Phase 7: Frontend
- React SPA with Vite setup
- Authentication flows (login, register, logout)
- Tool management UI
- Neighborhood UI with invite system
- Lending workflow UI
- Admin panel (user management, SMTP config, analytics)
- i18next integration for all supported languages

### Phase 8: Integration & Deployment
- End-to-end testing
- Hetzner VM deployment with Docker Compose
- Traefik reverse proxy with automatic SSL (Let's Encrypt)
- CI/CD pipeline setup
- Production environment variables

## Development Commands

```bash
# Install dependencies (PNPM workspace)
pnpm install

# Start all services
docker-compose up -d

# Run database migrations for all services
./scripts/migrate-all.sh

# Seed database with test data
pnpm run seed

# Run all tests
pnpm run test

# Run tests for specific service
pnpm --filter user-service test

# Run tests in watch mode
pnpm run test:watch

# Build all services
pnpm run build

# Add dependency to specific service
pnpm --filter <service-name> add <package>
```

### Database Operations (per service)

```bash
cd services/<service-name>
npx prisma migrate dev --name <migration-name>  # Create migration
npx prisma studio                                # Open DB GUI
npx prisma validate                              # Validate schema
npx prisma migrate reset                         # Reset database
```

### Initial Database Setup (in Docker)

After starting containers for the first time, push schemas to create tables:

```bash
docker exec neighbortools-user-service npx prisma db push
docker exec neighbortools-tool-service npx prisma db push
docker exec neighbortools-lending-service npx prisma db push
docker exec neighbortools-neighborhood-service npx prisma db push
docker exec neighbortools-notification-service npx prisma db push
```

## Architecture

### Microservices (7 services)

| Service | Port | Responsibility |
|---------|------|----------------|
| api-gateway | 3000 | Entry point, JWT auth, routing, rate limiting |
| user-service | 3001 | User management, authentication, settings |
| tool-service | 3002 | Tool CRUD, categories, photo upload |
| lending-service | 3003 | Lending workflow, appointments, status tracking |
| neighborhood-service | 3004 | Neighborhood management, invite codes, membership |
| notification-service | 3005 | Email notifications, scheduled reminders, i18n templates |
| frontend | 5173 | React SPA with multi-language UI |

### Project Structure

```
packages/
  shared-types/      # Shared TypeScript types across services
  shared-utils/      # Shared utility functions
services/
  api-gateway/       # Routes requests to appropriate microservice
  user-service/      # Each service has its own Prisma schema
  tool-service/
  lending-service/
  neighborhood-service/
  notification-service/
  frontend/          # React + Vite + Tailwind + shadcn/ui
scripts/
  migrate-all.sh     # Runs Prisma migrations for all services
  seed-database.ts   # Seeds test data
```

### Key Architectural Decisions

- **Database per service**: Each microservice has its own Prisma schema and database
- **JWT authentication**: Implemented in api-gateway, tokens validated on each request (synchronous, no external calls)
- **Inter-service communication**: Services communicate via internal Docker network (neighbortools-network)
- **i18n**: Frontend uses i18next; notification-service has language-specific email templates in `src/templates/[lang]/`
- **Profile updates use POST**: Frontend uses POST instead of PATCH for `/api/users/profile` due to GitHub Codespaces proxy issues with PATCH request bodies
- **No body parsing in gateway**: API Gateway does not parse request bodies; raw body is forwarded directly to microservices

### Category System

The tool category system is based on the **Google Shopping Product Taxonomy**:
- Reference: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt

**Hierarchical Structure**:
- Categories have parent/child relationships (up to 2 levels deep)
- Each category has an emoji for visual identification
- Multi-language support (EN, DE, ES, FR) with names stored per language

**Top-Level Categories** (14 categories with ~41 subcategories):
- Hand Tools, Power Tools, Garden & Outdoor, Measuring & Layout
- Painting & Decorating, Plumbing, Electrical, Automotive
- Cleaning & Maintenance, Building & Construction, Safety & Workwear
- Storage & Organization, Ladders & Scaffolding, Specialty Tools

**Database Schema** (tool-service):
```prisma
model Category {
  id        String     @id @default(uuid())
  key       String     @unique        // e.g., "HAND_TOOLS", "POWER_DRILLS"
  googleId  String?                   // Google taxonomy ID reference
  emoji     String?                   // Visual identifier
  parentId  String?                   // For hierarchical structure
  parent    Category?  @relation("CategoryHierarchy", fields: [parentId])
  children  Category[] @relation("CategoryHierarchy")
  level     Int        @default(0)    // 0 = top-level, 1 = subcategory
  nameEn    String                    // Multi-language names
  nameDe    String?
  nameEs    String?
  nameFr    String?
  tools     Tool[]
}
```

**API Endpoints** (`/api/categories`):
- `GET /top-level` - Get all top-level categories with children
- `GET /:id/with-children` - Get category with its children
- `POST /seed` - Seed default categories (admin only)

**Frontend Flow**:
1. ToolsPage shows category cards first (not tools)
2. User clicks a category to see subcategories and tools
3. Tool creation requires category selection before entering tool details
4. Category filter via URL param: `/tools?category={categoryId}`

**Backwards Compatibility**:
- Tools have both `categoryId` (UUID) and `categoryLegacy` (enum) fields
- Tool service auto-detects UUID vs legacy enum when filtering/creating

### Critical Infrastructure - DO NOT DELETE

**IMPORTANT: The database container `neighbortools-db` must NEVER be deleted or recreated.**

- The PostgreSQL container holds all production data
- NEVER run `docker compose down -v` (the `-v` flag deletes volumes including database data)
- NEVER delete the Docker volume `neighbortools_postgres_data`
- Schema changes via Prisma migrations are allowed
- Data modifications are allowed
- Rebuilding application containers is safe, but leave the database container untouched

### Git Workflow

**IMPORTANT: Do NOT automatically push to GitHub.**

- `git add` and `git commit` are allowed
- `git push` should ONLY be done when explicitly requested by the user
- Always wait for user confirmation before pushing changes to the remote repository

## Tech Stack

- **Backend**: Node.js 18+, TypeScript, Express.js, Prisma ORM, PostgreSQL 15
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, i18next, Axios
- **Testing**: Vitest
- **Package Management**: PNPM Workspaces (monorepo)

## Environments

- **DEV**: GitHub Codespaces with Docker Compose
- **PROD**: Hetzner VM with Docker Compose + Traefik (manual deploy via git pull)

## Production Deployment (Hetzner VM)

### Initial Setup

```bash
# On Hetzner VM, clone repo and configure
git clone https://github.com/roberteinsle/neighbortools.git
cd neighbortools
cp .env.prod.example .env
# Edit .env with production values

# Start all services
docker compose -f docker-compose.prod.yml up -d --build

# Initialize databases (first time only)
docker exec neighbortools-user-service npx prisma db push
docker exec neighbortools-tool-service npx prisma db push
docker exec neighbortools-lending-service npx prisma db push
docker exec neighbortools-neighborhood-service npx prisma db push
docker exec neighbortools-notification-service npx prisma db push
```

### Updating Production

```bash
cd /path/to/neighbortools
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Useful Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f frontend

# Restart a service
docker compose -f docker-compose.prod.yml restart frontend

# Stop all services
docker compose -f docker-compose.prod.yml down

# Check status
docker compose -f docker-compose.prod.yml ps
```

## Supported Languages

EN (default), DE, ES, FR

To add a new language:
1. Frontend: `services/frontend/src/i18n/locales/[lang]/translation.json`
2. Backend: `services/notification-service/src/templates/[lang]/`
3. Update Prisma Language enum and run migrations
