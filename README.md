# NeighborTools.net

> **A Microservice-based Tool Sharing Platform for Neighborhood Communities**

[![GitHub](https://img.shields.io/badge/GitHub-neighbortools-blue)](https://github.com/roberteinsle/neighbortools)
[![Railway](https://img.shields.io/badge/Deploy-Railway-purple)](https://railway.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)

---

## 📋 Overview

NeighborTools.net is a comprehensive tool lending platform that enables users to manage their personal tool inventory and share it within neighborhood communities. The platform facilitates tool discovery, lending requests, and automated rental period management.

### Key Features

- 🔧 **Tool Inventory Management** - Add, edit, and manage personal tools with photos
- 🏘️ **Neighborhood System** - Create/join neighborhoods with invite codes
- 🤝 **Lending Workflow** - Request, approve, and track tool lendings
- 📧 **Automated Notifications** - Email reminders for lending expirations
- 👨‍💼 **Admin Panel** - SMTP configuration, user management, analytics
- 🌍 **Multi-Language** - Support for English, German, Spanish, French
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

---

## 🏗️ Architecture

### Microservices

The application consists of **7 independent microservices**:

1. **API Gateway** (Port 3000) - Central entry point, authentication, routing
2. **User Service** (Port 3001) - User management, authentication, settings
3. **Tool Service** (Port 3002) - Tool CRUD, categories, photo storage
4. **Lending Service** (Port 3003) - Lending workflow, appointments
5. **Neighborhood Service** (Port 3004) - Neighborhood management, invites
6. **Notification Service** (Port 3005) - Email notifications, reminders
7. **Frontend** (Port 5173) - React SPA with multi-language UI

### Tech Stack

**Backend:**
- Node.js 18+ with TypeScript
- Express.js (REST APIs)
- PostgreSQL 15 (Database)
- Prisma (ORM)
- JWT (Authentication)
- Nodemailer (Email)

**Frontend:**
- React 18 with TypeScript
- Vite (Build tool)
- Tailwind CSS + shadcn/ui
- React Router
- i18next (Internationalization)
- Axios (HTTP client)

**DevOps:**
- Docker & Docker Compose
- PNPM Workspaces (Monorepo)
- GitHub Codespaces (DEV)
- Railway (PROD)

---

## 🚀 Getting Started

### Prerequisites

- **DEV Environment**: GitHub Codespaces (recommended) or local Docker
- **Node.js**: 18+ (if running locally)
- **PNPM**: 8+ (package manager)
- **Docker**: Latest version
- **Git**: For version control

### Development Setup (GitHub Codespaces)

**GitHub Codespaces** is the primary development environment.

1. **Open in Codespaces**
   ```bash
   # Codespace automatically clones the repository to:
   # /workspaces/neighbortools
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start Services**
   ```bash
   # Start all services with Docker Compose
   docker-compose up -d

   # Wait for PostgreSQL to be ready
   sleep 10

   # Run database migrations
   ./scripts/migrate-all.sh

   # Seed database with test data (optional)
   pnpm run seed
   ```

5. **Access the Application**
   - **Frontend**: http://localhost:5173
   - **API Gateway**: http://localhost:3000
   - **API Docs**: http://localhost:3000/api-docs

### Local Development (Alternative)

If not using Codespaces:

```bash
# Clone repository
git clone https://github.com/roberteinsle/neighbortools.git
cd neighbortools

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start Docker Compose
docker-compose up -d

# Run migrations
./scripts/migrate-all.sh

# Start development
pnpm run dev
```

---

## 🌐 Environments

### DEV: GitHub Codespaces

**Development environment** runs entirely in GitHub Codespaces:
- Automatic container configuration
- All services run locally in Docker Compose
- Hot-reload for rapid development
- Local PostgreSQL database
- Local file storage for photos

**Benefits:**
- Consistent development environment
- No local installation required
- Direct Git integration
- Isolated environment

### PROD: Railway

**Production environment** is hosted on Railway:
- Automatic deployment on push to `main` branch
- Separate containers for each microservice
- Managed PostgreSQL database
- Persistent volumes for file storage
- Automatic HTTPS configuration
- Private networking between services

**Deployment Workflow:**
```
GitHub Codespaces (DEV) → Git Push → Railway (PROD)
```

---

## 📂 Project Structure

```
/workspaces/neighbortools/
├── packages/
│   ├── shared-types/          # Shared TypeScript types
│   └── shared-utils/          # Shared utilities
├── services/
│   ├── api-gateway/           # API Gateway service
│   ├── user-service/          # User management
│   ├── tool-service/          # Tool management
│   ├── lending-service/       # Lending workflow
│   ├── neighborhood-service/  # Neighborhood management
│   ├── notification-service/  # Email notifications
│   └── frontend/              # React SPA
├── scripts/
│   ├── setup-dev.sh           # Development setup
│   ├── migrate-all.sh         # Run all migrations
│   └── seed-database.ts       # Seed test data
├── docker-compose.yml         # Local development
├── railway.json               # Railway deployment config
├── package.json               # Root package (PNPM workspace)
├── pnpm-workspace.yaml        # PNPM workspace definition
├── .gitignore                 # Git ignore (includes credentials)
├── CLAUDE.md                  # Claude Code documentation
└── README.md                  # This file
```

---

## 🔧 Development Workflow

### Daily Development

```bash
# Start all services
docker-compose up -d

# View logs for a specific service
docker-compose logs -f user-service

# Restart a service after code changes
docker-compose restart user-service

# Run tests
pnpm run test

# Stop all services
docker-compose down
```

### Making Changes

1. Create a feature branch
   ```bash
   git checkout -b feature/new-feature
   ```

2. Make your changes (hot-reload is enabled)

3. Run tests
   ```bash
   pnpm run test
   ```

4. Commit and push
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

5. Create a Pull Request on GitHub

6. After PR approval, merge to `main`

7. **Railway automatically deploys** the changes to production

---

## 📡 API Documentation

### Base URLs

- **DEV**: `http://localhost:3000/api`
- **PROD**: `https://api-gateway.railway.app/api`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login (returns JWT token)
- `POST /api/auth/logout` - Logout

#### Tools
- `GET /api/tools` - List/search tools
- `POST /api/tools` - Create new tool
- `GET /api/tools/:id` - Get tool details
- `PUT /api/tools/:id` - Update tool
- `DELETE /api/tools/:id` - Delete tool

#### Lendings
- `GET /api/lendings` - List lendings
- `POST /api/lendings` - Create lending request
- `PUT /api/lendings/:id/approve` - Approve request
- `PUT /api/lendings/:id/reject` - Reject request

#### Neighborhoods
- `GET /api/neighborhoods` - List neighborhoods
- `POST /api/neighborhoods` - Create neighborhood
- `POST /api/neighborhoods/join` - Join with invite code

#### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/analytics` - System analytics
- `PUT /api/admin/smtp` - Configure SMTP settings

For complete API documentation, see [CLAUDE.md](CLAUDE.md).

---

## 🧪 Testing

### Run Tests

```bash
# All tests
pnpm run test

# Unit tests only
pnpm run test:unit

# Integration tests only
pnpm run test:integration

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:coverage

# Test specific service
cd services/user-service
pnpm test
```

### Test Coverage Goals

- Services: 80%+
- Controllers: 70%+
- Repositories: 80%+

---

## 🌍 Internationalization

### Supported Languages

- 🇬🇧 **English** (EN) - Default
- 🇩🇪 **German** (DE)
- 🇪🇸 **Spanish** (ES)
- 🇫🇷 **French** (FR)

### Adding a New Language

1. Create frontend translation file:
   ```
   services/frontend/src/i18n/locales/[lang]/translation.json
   ```

2. Create email templates:
   ```
   services/notification-service/src/templates/[lang]/
   ```

3. Update Prisma schema and run migration

For detailed instructions, see [CLAUDE.md](CLAUDE.md#internationalisierung-i18n).

---

## 🚢 Deployment

### Automatic Deployment (Railway)

1. Make changes in a feature branch
2. Create Pull Request
3. Review and merge to `main`
4. **Railway automatically deploys** to production

### Manual Deployment (Railway CLI)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Rollback if needed
railway rollback
```

---

## 🔒 Security

### ⚠️ Important: No Credentials in Repository

**NEVER commit:**
- `.env` files
- JWT secrets
- Database passwords
- SMTP credentials
- API keys

### Secrets Management

**DEV (Codespaces):**
- Local `.env` files (not committed)
- Codespaces Secrets for sensitive data

**PROD (Railway):**
- Railway Environment Variables
- Encrypted secrets in Railway Dashboard

---

## 📊 Admin Panel

The admin panel provides:

- **User Management** - View, activate/deactivate users
- **SMTP Configuration** - Configure email settings
- **Analytics Dashboard** - System statistics and insights
- **Moderation Tools** - Manage neighborhoods and disputes

Access: Login as admin user and navigate to `/admin`

---

## 🛠️ Troubleshooting

### Docker Compose Issues

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs

# Rebuild containers
docker-compose up -d --build

# Reset everything
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Connect to database
docker exec -it neighbortools-db psql -U neighbortools -d neighbortools
```

For more troubleshooting tips, see [CLAUDE.md](CLAUDE.md#troubleshooting).

---

## 📝 Scripts

### Available Scripts

```bash
# Install all dependencies
pnpm install

# Start development
pnpm run dev

# Build all services
pnpm run build

# Run all tests
pnpm run test

# Run migrations
./scripts/migrate-all.sh

# Seed database
pnpm run seed

# Lint code
pnpm run lint

# Format code
pnpm run format
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## 📄 License

This project is private and not intended for public use.

---

## 👥 Team

**Maintainer**: Robert Einsle
**Email**: robert@einsle.com
**GitHub**: [@roberteinsle](https://github.com/roberteinsle)

---

## 🔗 Links

- **Repository**: https://github.com/roberteinsle/neighbortools
- **Documentation**: [CLAUDE.md](CLAUDE.md)
- **Issues**: https://github.com/roberteinsle/neighbortools/issues

---

## 📌 Quick Links

- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

**Built with ❤️ using TypeScript, React, Node.js, PostgreSQL, and Docker**