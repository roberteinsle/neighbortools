# NeighborTools.net - Claude Code Dokumentation

## Projektübersicht

NeighborTools.net ist eine **Microservice-basierte Tool-Sharing-Plattform** für Nachbarschaften. Die Anwendung ermöglicht es Nutzern, Werkzeuge zu verwalten, zu teilen und innerhalb ihrer Nachbarschaft zu leihen.

**GitHub Repository**: https://github.com/roberteinsle/neighbortools
**Maintainer**: Robert Einsle (robert@einsle.com)

---

## Entwicklungs- & Produktionsumgebungen

### DEV: GitHub Codespaces

Die **Entwicklungsumgebung** läuft vollständig in **GitHub Codespaces**:
- Automatische Container-Konfiguration via devcontainer
- Alle Services laufen lokal in Docker Compose
- Hot-Reload für schnelle Entwicklung
- PostgreSQL-Datenbank als Container
- Lokaler File-Storage für Tool-Fotos

**Vorteile**:
- Konsistente Entwicklungsumgebung für alle Entwickler
- Keine lokale Installation notwendig
- Direkte Git-Integration
- Isolierte Umgebung

### PROD: Railway

Die **Produktionsumgebung** wird auf **Railway** gehostet:
- Automatisches Deployment bei Push zu `main` Branch
- Separate Container für jeden Microservice
- Managed PostgreSQL Datenbank
- Persistent Volumes für File-Storage
- Automatische HTTPS-Konfiguration
- Railway Private Networking zwischen Services

**Deployment-Workflow**:
```
GitHub Codespaces (DEV) → Git Push → Railway (PROD)
```

---

## Tech Stack

### Backend
- **Runtime**: Node.js 18+ mit TypeScript
- **Framework**: Express.js (RESTful APIs)
- **Datenbank**: PostgreSQL 15
- **ORM**: Prisma
- **Authentifizierung**: JWT (selbst implementiert)
- **Email**: Nodemailer (SMTP konfigurierbar)
- **Architektur**: Domain-basierte Microservices mit API Gateway

### Frontend
- **Framework**: React 18 mit TypeScript
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS + shadcn/ui
- **Routing**: React Router
- **i18n**: i18next (EN, DE, ES, FR)
- **HTTP Client**: Axios

### DevOps
- **Containerisierung**: Docker
- **Orchestrierung**: Docker Compose (DEV), Railway (PROD)
- **Paketmanager**: PNPM Workspaces (Monorepo)
- **Testing**: Vitest

---

## Microservices-Architektur

Die Anwendung besteht aus **7 Microservices**:

1. **API Gateway** (Port 3000)
   - Zentraler Einstiegspunkt
   - JWT-Authentifizierung
   - Request-Routing
   - Rate Limiting

2. **User Service** (Port 3001)
   - User Management
   - Authentication (Login/Register)
   - User Settings

3. **Tool Service** (Port 3002)
   - Tool CRUD
   - Kategorien
   - Foto-Upload

4. **Lending Service** (Port 3003)
   - Lending-Workflow
   - Appointment-Scheduling
   - Status-Tracking

5. **Neighborhood Service** (Port 3004)
   - Neighborhood Management
   - Invite Codes
   - Membership-Verwaltung

6. **Notification Service** (Port 3005)
   - Email-Versand
   - Scheduled Reminders
   - Mehrsprachige Templates

7. **Frontend** (Port 5173)
   - React SPA
   - Mehrsprachige UI
   - Admin-Panel

---

## Projektstruktur (Monorepo)

```
/workspaces/neighbortools/
├── packages/
│   ├── shared-types/          # Geteilte TypeScript-Typen
│   └── shared-utils/          # Geteilte Utilities
├── services/
│   ├── api-gateway/           # API Gateway Service
│   ├── user-service/          # User Management Service
│   ├── tool-service/          # Tool Management Service
│   ├── lending-service/       # Lending Workflow Service
│   ├── neighborhood-service/  # Neighborhood Service
│   ├── notification-service/  # Email Notification Service
│   └── frontend/              # React Frontend SPA
├── scripts/
│   ├── setup-dev.sh           # Dev-Setup Skript
│   ├── migrate-all.sh         # Migrationen für alle Services
│   └── seed-database.ts       # Testdaten-Seed
├── docker-compose.yml         # Lokale Entwicklung
├── railway.json               # Railway Deployment Config
├── package.json               # Root Package (PNPM Workspace)
├── pnpm-workspace.yaml        # PNPM Workspace Definition
└── .gitignore                 # Git Ignore (inkl. Credentials)
```

---

## Entwicklungs-Workflow in GitHub Codespaces

### Initial Setup

```bash
# 1. Codespace öffnen (automatisch in GitHub)
# Repository wird automatisch geklont nach /workspaces/neighbortools

# 2. Dependencies installieren
pnpm install

# 3. Environment-Variablen konfigurieren
cp .env.example .env
# .env mit lokalen Werten bearbeiten

# 4. Docker Compose starten (alle Services)
docker-compose up -d

# 5. Warten auf PostgreSQL
sleep 10

# 6. Datenbank-Migrationen ausführen
./scripts/migrate-all.sh

# 7. Testdaten einspielen (optional)
pnpm run seed

# 8. Anwendung ist bereit
# Frontend: http://localhost:5173
# API Gateway: http://localhost:3000
```

### Täglicher Workflow

```bash
# Services starten
docker-compose up -d

# Logs eines Services anzeigen
docker-compose logs -f user-service

# Service neu starten nach Code-Änderungen
docker-compose restart user-service

# Alle Services stoppen
docker-compose down

# Tests ausführen
pnpm run test

# Spezifische Service-Tests
pnpm run test:user-service
```

### Code-Änderungen

1. **Änderungen vornehmen** in `/workspaces/neighbortools/services/[service-name]/`
2. **Hot-Reload** aktiviert (Container aktualisiert automatisch)
3. **Tests ausführen**: `pnpm run test`
4. **Commit**: `git add . && git commit -m "feat: description"`
5. **Push**: `git push origin feature/branch-name`

---

## Deployment zu Railway (Production)

### Automatisches Deployment

**Workflow**:
1. Code-Änderungen in Feature-Branch committen
2. Pull Request erstellen
3. PR reviewen und zu `main` mergen
4. **Railway deployed automatisch** bei Push zu `main`

### Railway Environment Variables (Production)

Folgende Variablen müssen in Railway gesetzt werden:

```bash
# Global
NODE_ENV=production
JWT_SECRET=<strong-secret>

# Database
POSTGRES_USER=neighbortools
POSTGRES_PASSWORD=<strong-password>

# Service URLs (Railway Internal Network)
USER_SERVICE_URL=http://user-service.railway.internal:3001
TOOL_SERVICE_URL=http://tool-service.railway.internal:3002
LENDING_SERVICE_URL=http://lending-service.railway.internal:3003
NEIGHBORHOOD_SERVICE_URL=http://neighborhood-service.railway.internal:3004
NOTIFICATION_SERVICE_URL=http://notification-service.railway.internal:3005

# Frontend
VITE_API_URL=https://api-gateway.railway.app/api

# Database URLs (per service)
USER_DATABASE_URL=postgresql://user:pass@postgres:5432/user_db
TOOL_DATABASE_URL=postgresql://user:pass@postgres:5432/tool_db
LENDING_DATABASE_URL=postgresql://user:pass@postgres:5432/lending_db
NEIGHBORHOOD_DATABASE_URL=postgresql://user:pass@postgres:5432/neighborhood_db
NOTIFICATION_DATABASE_URL=postgresql://user:pass@postgres:5432/notification_db
```

### Manuelle Railway CLI Befehle

```bash
# Railway CLI installieren
npm i -g @railway/cli

# Login
railway login

# Projekt verlinken
railway link

# Logs anzeigen
railway logs

# Variablen setzen
railway variables set JWT_SECRET=<secret>

# Rollback bei Problemen
railway rollback
```

---

## Datenbank-Management

### Prisma Migrationen

Jeder Service hat sein eigenes Prisma-Schema und Migrationen:

```bash
# Migration für User Service erstellen
cd services/user-service
npx prisma migrate dev --name add_user_settings

# Alle Migrationen ausführen
./scripts/migrate-all.sh

# Prisma Studio öffnen (DB GUI)
cd services/user-service
npx prisma studio
```

### Testdaten einspielen

```bash
# Seed-Script ausführen
pnpm run seed

# Oder manuell pro Service
cd services/user-service
npx prisma db seed
```

---

## API-Dokumentation

### Wichtigste Endpunkte

**Base URL (DEV)**: `http://localhost:3000/api`
**Base URL (PROD)**: `https://api-gateway.railway.app/api`

#### Authentication
- `POST /api/auth/register` - User-Registrierung
- `POST /api/auth/login` - Login (JWT Token)
- `POST /api/auth/logout` - Logout

#### Tools
- `GET /api/tools` - Tools auflisten
- `POST /api/tools` - Neues Tool erstellen
- `GET /api/tools/:id` - Tool-Details
- `PUT /api/tools/:id` - Tool aktualisieren
- `DELETE /api/tools/:id` - Tool löschen

#### Lendings
- `GET /api/lendings` - Lendings auflisten
- `POST /api/lendings` - Lending-Anfrage erstellen
- `PUT /api/lendings/:id/approve` - Anfrage genehmigen
- `PUT /api/lendings/:id/reject` - Anfrage ablehnen

#### Neighborhoods
- `GET /api/neighborhoods` - Neighborhoods auflisten
- `POST /api/neighborhoods` - Neighborhood erstellen
- `POST /api/neighborhoods/join` - Mit Invite-Code beitreten

#### Admin
- `GET /api/admin/users` - Alle User
- `GET /api/admin/analytics` - System-Analytics
- `PUT /api/admin/smtp` - SMTP konfigurieren

---

## Internationalisierung (i18n)

### Unterstützte Sprachen

- **EN** - Englisch (Default)
- **DE** - Deutsch
- **ES** - Spanisch
- **FR** - Französisch

### Neue Sprache hinzufügen

1. **Frontend**: Translation-Datei erstellen
   ```
   services/frontend/src/i18n/locales/[lang]/translation.json
   ```

2. **Backend**: Email-Templates erstellen
   ```
   services/notification-service/src/templates/[lang]/
   ```

3. **Prisma**: Language enum erweitern
   ```prisma
   enum Language {
     EN
     DE
     ES
     FR
     IT  // Neue Sprache
   }
   ```

4. **Migration** ausführen und deployen

---

## Testing

### Test-Commands

```bash
# Alle Tests
pnpm run test

# Nur Unit Tests
pnpm run test:unit

# Nur Integration Tests
pnpm run test:integration

# Watch Mode
pnpm run test:watch

# Coverage Report
pnpm run test:coverage

# Spezifischer Service
cd services/user-service
pnpm test
```

### Test-Struktur

Jeder Service hat:
- `tests/unit/` - Unit Tests für Services, Controller
- `tests/integration/` - API Endpoint Tests

**Coverage-Ziele**:
- Services: 80%+
- Controllers: 70%+
- Repositories: 80%+

---

## Sicherheit & Credentials

### ⚠️ WICHTIG: Keine Credentials im Repository

**NIEMALS committen**:
- `.env` Dateien
- JWT Secrets
- Database Passwörter
- SMTP Credentials
- API Keys

### .gitignore

Die `.gitignore` ist konfiguriert für:
```
.env
.env.*
!.env.example
*.pem
*.key
secrets/
credentials/
```

### Secrets Management

**DEV (Codespaces)**:
- Lokale `.env` Dateien (nicht committed)
- Codespaces Secrets für sensitive Daten

**PROD (Railway)**:
- Railway Environment Variables
- Verschlüsselte Secrets im Railway Dashboard

---

## Troubleshooting

### Docker Compose startet nicht

```bash
# Container-Status prüfen
docker-compose ps

# Logs anzeigen
docker-compose logs

# Container neu bauen
docker-compose up -d --build

# Alles zurücksetzen
docker-compose down -v
docker-compose up -d
```

### Datenbank-Verbindungsprobleme

```bash
# PostgreSQL-Status prüfen
docker-compose ps postgres

# PostgreSQL-Logs
docker-compose logs postgres

# Verbindung testen
docker exec -it neighbortools-db psql -U neighbortools -d neighbortools
```

### Port bereits belegt

```bash
# Prozess auf Port finden
lsof -i :3000

# Prozess beenden
kill -9 <PID>

# Oder Docker Compose neu starten
docker-compose restart
```

### Migration-Fehler

```bash
# Prisma Schema prüfen
cd services/user-service
npx prisma validate

# Migration zurücksetzen
npx prisma migrate reset

# Neue Migration erstellen
npx prisma migrate dev
```

---

## Nützliche Commands

### PNPM Workspace

```bash
# Dependencies für alle Services installieren
pnpm install

# Dependency zu spezifischem Service hinzufügen
pnpm --filter user-service add express

# Script in allen Services ausführen
pnpm -r run build

# Script in spezifischem Service
pnpm --filter frontend run dev
```

### Docker

```bash
# Alle Container anzeigen
docker ps

# In Container einloggen
docker exec -it neighbortools-user-service sh

# Container-Logs folgen
docker logs -f neighbortools-gateway

# Volumes auflisten
docker volume ls

# Dangling Images löschen
docker image prune
```

### Git

```bash
# Feature Branch erstellen
git checkout -b feature/new-feature

# Änderungen committen
git add .
git commit -m "feat: neue Funktion"

# Push zu Remote
git push origin feature/new-feature

# Branch wechseln
git checkout main

# Remote-Änderungen holen
git pull origin main
```

---

## Support & Kontakt

**Maintainer**: Robert Einsle
**Email**: robert@einsle.com
**GitHub**: https://github.com/roberteinsle/neighbortools

**Issues & Bugs**:
- GitHub Issues: https://github.com/roberteinsle/neighbortools/issues

---

## Lizenz

Dieses Projekt ist privat und nicht für die öffentliche Nutzung bestimmt.

---

## Changelog

### Version 1.0.0 (In Entwicklung)
- Initial Setup
- Microservices-Architektur
- User Authentication (JWT)
- Tool Management
- Lending Workflow
- Neighborhood System
- Email Notifications
- Multi-Language Support (EN, DE, ES, FR)
- Admin Panel
