# Production Deployment Guide — AssetFlow ERP v1.0.0

This guide details steps for staging, building, and deploying AssetFlow ERP in production environments.

---

## 1. Staging Environments Configuration

Configure your environment settings in the backend file `apps/api/.env`:
- **`DATABASE_URL`**: Production PostgreSQL server credentials (`postgresql://user:password@host:5432/db`).
- **`JWT_SECRET`**: Strong encryption secret.
- **`PORT`**: API listener port (`4000`).

---

## 2. Docker Compose Deployment

Boot database and app containers using Docker:

### Step 1: Validate Configuration
```bash
docker compose config
```

### Step 2: Compile & Start Containers
```bash
docker compose up -d --build
```
This launches:
- **`postgres:15-alpine`** container.
- Persistent volumes mapped to `postgres_data`.

### Step 3: Run Database Migrations
Inside the container context:
```bash
npx prisma migrate deploy
```
This syncs schemas, sets indexes, and applies cascades.
