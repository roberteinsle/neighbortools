# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NeighborTools.net is a microservice-based tool sharing platform for neighborhood communities. Users can manage personal tool inventories, share them within neighborhoods, and handle lending workflows.

**Status**: Architecture planned, implementation in progress.

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
- Railway deployment configuration
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
- **JWT authentication**: Implemented in api-gateway, tokens validated on each request
- **Inter-service communication**: Services communicate via internal HTTP (Railway private networking in prod)
- **i18n**: Frontend uses i18next; notification-service has language-specific email templates in `src/templates/[lang]/`

## Tech Stack

- **Backend**: Node.js 18+, TypeScript, Express.js, Prisma ORM, PostgreSQL 15
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, i18next, Axios
- **Testing**: Vitest
- **Package Management**: PNPM Workspaces (monorepo)

## Environments

- **DEV**: GitHub Codespaces with Docker Compose
- **PROD**: Railway (auto-deploys on push to `main`)

## Supported Languages

EN (default), DE, ES, FR

To add a new language:
1. Frontend: `services/frontend/src/i18n/locales/[lang]/translation.json`
2. Backend: `services/notification-service/src/templates/[lang]/`
3. Update Prisma Language enum and run migrations
