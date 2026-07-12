# Production Deployment Guide — AssetFlow ERP v1.0.0

This guide details steps for staging, building, and deploying AssetFlow ERP in production environments.

---

## 1. Staging Environments Configuration

Configure your environment settings in the backend file `apps/api/.env`:
- **`DATABASE_URL`**: Production PostgreSQL server credentials (`postgresql://user:password@host:5432/db`).
- **`JWT_SECRET`**: Strong encryption secret.
- **`PORT`**: API listener port (`4000`).
- **`DB_PROVIDER`**: Explicitly set database provider (`postgresql` or `sqlite`).
- **`SQLITE_STRESS_WORKERS`**: Limit for SQLite stress test concurrency (default `3`).
- **`POSTGRES_STRESS_WORKERS`**: Limit for PostgreSQL stress test concurrency (default `25`).

---

## 2. Telemetry and Operational Metrics

For production system observability, the API exposes live queue state and query latencies at the metrics endpoint:
- **Telemetry Endpoint**: `GET http://localhost:4000/api/v1/metrics`
- **Output Metrics**: Active queue length, job failure rate, average execution latency, and top 10 slowest database queries.

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

---

## 3. Health Checks & Service Readiness

AssetFlow API exposes a lightweight `/health` check endpoint used by Kubernetes, load balancers, and Docker orchestration tools:

- **Endpoint**: `GET http://localhost:4000/health`
- **Response Format**: `application/json`
- **Payload Shape**:
  ```json
  {
    "status": "ok"
  }
  ```

### Automated Startups Readiness Check

When booting in automated configurations (e.g. CI/CD runners, Docker compose orchestrators), utilize the following curl command to wait for the Express API to be fully initialized before launching depending portals or run-time validations:

```bash
until $(curl --output /dev/null --silent --head --fail http://localhost:4000/health); do
    echo "Waiting for AssetFlow API service gateway..."
    sleep 1
done
```
