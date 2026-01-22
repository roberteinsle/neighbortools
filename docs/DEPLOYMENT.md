# NeighborTools Deployment Guide

## Overview

NeighborTools is deployed as a microservices architecture on Railway. Each service runs as a separate container with its own database.

## Prerequisites

- Railway account with a project created
- GitHub repository connected to Railway
- Environment variables configured in Railway

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Nginx)                              │
│                    Port: 80/443                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway                                   │
│                    Port: 3000                                    │
│              (JWT Auth, Rate Limiting, Routing)                  │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│   User    │ │   Tool    │ │  Lending  │ │Neighborhood│ │Notification│
│  Service  │ │  Service  │ │  Service  │ │  Service  │ │  Service  │
│   :3001   │ │   :3002   │ │   :3003   │ │   :3004   │ │   :3005   │
└───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│  user_db  │ │  tool_db  │ │lending_db │ │neighbor_db│ │notif_db   │
└───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘
```

## Environment Variables

### Required for All Services

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Service port | `3000` |

### API Gateway

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) |
| `USER_SERVICE_URL` | Internal URL for user service |
| `TOOL_SERVICE_URL` | Internal URL for tool service |
| `LENDING_SERVICE_URL` | Internal URL for lending service |
| `NEIGHBORHOOD_SERVICE_URL` | Internal URL for neighborhood service |
| `NOTIFICATION_SERVICE_URL` | Internal URL for notification service |

### Services with Database

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

### Notification Service

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From email address |
| `APP_URL` | Frontend URL for email links |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API Gateway URL |

## Railway Setup

### 1. Create Services

Create the following services in your Railway project:

1. **PostgreSQL** - Add PostgreSQL plugin
2. **api-gateway** - From GitHub repo, path: `services/api-gateway`
3. **user-service** - From GitHub repo, path: `services/user-service`
4. **tool-service** - From GitHub repo, path: `services/tool-service`
5. **lending-service** - From GitHub repo, path: `services/lending-service`
6. **neighborhood-service** - From GitHub repo, path: `services/neighborhood-service`
7. **notification-service** - From GitHub repo, path: `services/notification-service`
8. **frontend** - From GitHub repo, path: `services/frontend`

### 2. Configure Databases

Each service needs its own database. In Railway:

1. Create a PostgreSQL plugin
2. Connect it to each service
3. Services will auto-create their database schemas on first run

### 3. Configure Internal Networking

Railway provides internal networking between services. Use the service names as hostnames:

```
USER_SERVICE_URL=http://user-service.railway.internal:3001
TOOL_SERVICE_URL=http://tool-service.railway.internal:3002
# etc.
```

### 4. Configure Domains

1. Add a custom domain for the frontend
2. Add a custom domain for the API gateway (api.yourdomain.com)

## Deployment

### Automatic Deployment

Push to the `main` branch triggers automatic deployment via GitHub Actions.

### Manual Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy a specific service
cd services/api-gateway
railway up
```

## Database Migrations

Migrations run automatically on service start via the Dockerfile CMD:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

For manual migrations:

```bash
cd services/user-service
railway run npx prisma migrate deploy
```

## Monitoring

### Health Checks

Each service exposes a `/health` endpoint. Railway monitors these automatically.

### Logs

View logs in Railway dashboard or via CLI:

```bash
railway logs --service api-gateway
```

## Rollback

Railway keeps deployment history. To rollback:

1. Go to service in Railway dashboard
2. Click on "Deployments"
3. Click "Rollback" on a previous deployment

## Scaling

Railway auto-scales based on traffic. For manual scaling:

1. Go to service settings
2. Adjust "Replicas" setting

## Troubleshooting

### Service Won't Start

1. Check logs for errors
2. Verify environment variables are set
3. Check database connection

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check if database migrations ran
3. Verify network connectivity

### 502 Bad Gateway

1. Service may still be starting
2. Check service health endpoint
3. Verify internal networking

## Security Checklist

- [ ] JWT_SECRET is at least 32 characters
- [ ] DATABASE_URL uses SSL in production
- [ ] SMTP credentials are secure
- [ ] Rate limiting is enabled on API gateway
- [ ] CORS is configured correctly
- [ ] No sensitive data in logs
