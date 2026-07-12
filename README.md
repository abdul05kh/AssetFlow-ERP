# AssetFlow ERP — Enterprise Resource Management System

AssetFlow is a production-grade Enterprise Asset & Resource Management System designed for the Odoo Hiring Hackathon 2026. The solution features a robust modular Express.js + Prisma API backend, a PostgreSQL database layout, and a responsive Next.js 16 Web Dashboard interface.

---

## 🏗️ Monorepo Workspaces

The repository follows a clean, layered architecture organized into typescript packages:

- **`apps/api`**: Express.js + TypeScript REST backend implementing repositories, validation layers (Zod), logging contexts, and event streams.
- **`apps/web`**: Next.js 16 + React 19 Client Dashboard Portal styled with Tailwind CSS.
- **`packages/types`**: Shared corporate types and schema interfaces.
- **`packages/utils`**: Core helper routines and date validators.

---

## 🛠️ Infrastructure & Databases

### PostgreSQL (Production)
The authoritative production database. To boot the system using PostgreSQL:
1. Ensure your PostgreSQL server is active.
2. Adjust `provider = "postgresql"` in `prisma/schema.prisma`.
3. Set `DATABASE_URL="postgresql://user:password@localhost:5432/assetflow"` in `apps/api/.env`.
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

### SQLite (Fallback Development Context)
For sandboxed local development (such as terminal virtualizations lacking Docker):
1. The datasource provider is configured to `provider = "sqlite"`.
2. The local database resides at `apps/api/dev.db` (initialized using `DATABASE_URL="file:./dev.db"`).

---

## 🛡️ Centralized Audit Logging

A modern, non-blocking Prisma Query Extension in `apps/api/src/config/db.ts` intercepts all database mutations:
- **CREATE, UPDATE, DELETE** actions are trapped automatically.
- Logs include user identifiers, entity types, mutated row keys, old/new states as JSON, client IP addresses, user agent headers, and correlation tracking tokens.
- Deferring log persistence using `setImmediate` avoids transaction deadlocks.

---

## 📖 Swagger API Documentation

Interactive OpenAPI 3.0 specs are exposed dynamically:
- **Interactive UI**: [http://localhost:4000/api/v1/docs](http://localhost:4000/api/v1/docs)
- **JSON Specification**: [http://localhost:4000/api/v1/docs-json](http://localhost:4000/api/v1/docs-json)

Endpoints cover:
- Authentication (`POST /auth/login`)
- Asset Registry (`GET /assets`, `POST /assets`)
- Allocations (`POST /allocations`)
- Asset Returns (`POST /returns`)
- Repairs Maintenance (`POST /maintenance`)
- Audit Checklists (`POST /audits`)
- Dashboard KPIs (`GET /dashboard/stats`)

---

## 🧪 Running Integration Tests

To run the automated integration test suite checking out login access, sequence tag mapping, double allocation locks, ownership transfers, and return triggers:

```bash
npm run test --workspace=apps/api
```
