<div align="center">

<img src="https://img.shields.io/badge/AssetFlow-ERP-0ea5e9?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAxTDMgNXY2YzAgNS41NSAzLjg0IDEwLjc0IDkgMTIgNS4xNi0xLjI2IDktNi40NSA5LTEyVjVsLTktNHoiLz48L3N2Zz4=" alt="AssetFlow ERP" width="80" height="80" />

# AssetFlow ERP

### Enterprise Asset Lifecycle & Resource Management Platform

*Production-grade ERP system for managing physical assets, workforce allocation, maintenance cycles, and compliance audits across your entire organization.*

---

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Production-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Dev%2FCI-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-45ba4b?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=flat-square&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/abdul05kh/AssetFlow-ERP?style=flat-square&color=0ea5e9)](https://github.com/abdul05kh/AssetFlow-ERP/releases/latest)
[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)](https://github.com/abdul05kh/AssetFlow-ERP/releases/tag/v1.0.0)
[![GitHub Release](https://img.shields.io/badge/release-v1.0.0-success?style=flat-square)](https://github.com/abdul05kh/AssetFlow-ERP/releases/tag/v1.0.0)

</div>

---

AssetFlow ERP is a **production-grade Enterprise Asset & Resource Management platform** built for the [Odoo Hiring Hackathon 2026](https://odoo.com). It provides organizations with complete visibility and control over their physical asset inventory — from the moment an asset is procured through allocation, maintenance, transfer, audit, and eventual retirement. The platform features a modular Express.js + Prisma REST API backend, a glassmorphic React 19 / Next.js 16 dashboard, and a robust RBAC authorization system — all validated by Playwright E2E tests and a production-grade GitHub Actions CI pipeline.

---

## Key Capabilities

| Feature | Description |
|---|---|
| 📦 **Asset Lifecycle Management** | Register, track, allocate, transfer, retire, and dispose of physical assets with auto-generated sequence tags (`AF-XXXXXX`) |
| 🔐 **Role-Based Access Control** | Granular permission system with Admin, Asset Manager, Department Head, and Employee roles |
| 🔄 **Workflow Automation** | Automated maintenance triggers on damaged returns; auto-flag assets as `LOST` on audit close |
| 📅 **Resource Booking** | Time-range reservation scheduling with mathematical overlap conflict prevention |
| 🔧 **Maintenance Pipeline** | Full ticket lifecycle — request → approve → assign technician → resolve → close |
| 🔍 **Compliance Audit Cycles** | Department-scoped audits with per-asset verification, discrepancy detection, and cycle closing |
| 📊 **Dashboard Analytics** | Real-time KPIs: total assets, inventory valuation, allocation counts, repair queue depth |
| 🔔 **Notifications & Alerts** | Event-driven inbox alerts and simulated email notifications for allocations, transfers, and returns |
| 📜 **Immutable Audit Trail** | Tamper-proof `AuditLog` writes capturing every CREATE/UPDATE/DELETE with IP, user agent, and correlation IDs |
| ⚡ **Non-blocking Architecture** | FIFO background job queue (concurrency=1) decouples business transactions from audit logging |
| 🧪 **Production Testing Suite** | Integration, concurrency stress, and performance profiling test suites |
| 🚀 **CI/CD Ready** | Three GitHub Actions workflows: push CI, nightly stress benchmarks, and release validation |

---

## Table of Contents

- [Project Overview](#project-overview)
- [Application Screenshots](#application-screenshots)
- [User Roles & Permissions](#user-roles--permissions)
- [Business Workflow](#complete-business-workflow)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [Development](#development)
- [Testing](#testing)
- [API Reference](#api-reference)
- [CI/CD Pipelines](#cicd-pipelines)
- [Performance Benchmarks](#performance-benchmarks)
- [Security Model](#security-model)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

### The Problem

Organizations managing dozens to thousands of physical assets — laptops, phones, monitors, lab equipment — face a recurring set of operational failures:

- **Asset location uncertainty**: Nobody knows who has what, or where it currently is
- **Double-allocation conflicts**: The same asset gets assigned to two employees simultaneously
- **Maintenance neglect**: Damaged assets sit in a queue with no tracked resolution
- **Compliance gaps**: Audit cycles are manual, error-prone, and produce inaccurate discrepancy reports
- **No audit trail**: Changes to asset states leave no forensic record

### The Solution

AssetFlow ERP solves these problems through a structured asset lifecycle engine:

1. **Centralized Registry** — Every physical asset has a unique `AF-XXXXXX` sequence tag, serial number, status state machine, and full history log
2. **Transaction-Guarded Allocation** — Database transactions prevent race conditions; simultaneous allocation attempts are rejected with error code `ASSET_002`
3. **Automated Triggers** — Returning a `DAMAGED` asset automatically opens a high-priority maintenance ticket and locks the asset in `UNDER_MAINTENANCE`
4. **Audit-Driven Reconciliation** — Closing an audit cycle auto-transitions `MISSING` assets to `LOST` in the registry
5. **Immutable Audit Logs** — Every database mutation is captured by a Prisma Query Extension and persisted asynchronously to a tamper-proof `AuditLog` table

### Business Value

- **Reduction in asset loss** through continuous inventory visibility
- **Elimination of double-allocation** via transaction-scoped optimistic locking
- **Faster maintenance resolution** through structured ticket pipelines and auto-triggers
- **Compliance-ready audit trails** meeting enterprise governance requirements
- **Zero-downtime logging** through post-commit FIFO queue architecture

---

## Application Screenshots

### 1. Secure Authentication Portal

> A clean, dark-themed glassmorphic login form. Access is restricted to authorized personnel only. Registration creates Employee accounts by default — role elevation is performed by an Administrator.

![AssetFlow ERP Login Screen](docs/screenshots/01-login.png)

**Credentials for evaluation:**
| Role | Email | Password |
|---|---|---|
| Administrator | `admin@assetflow.erp` | `Password123` |
| Asset Manager | `manager@assetflow.erp` | `Password123` |
| Employee | `employee@assetflow.erp` | `Password123` |

---

### 2. Operations Dashboard — Overview

> Real-time inventory intelligence. The Overview tab displays critical KPIs — total registered assets, inventory valuation (USD), active allocation count, active repair ticket queue, and asset status breakdown. The Compliance Reporting panel provides one-click CSV exports.

![AssetFlow ERP Dashboard](docs/screenshots/02-dashboard.png)

**Dashboard KPI Cards:**
- **Total Registry Assets** — Live count of all records in the asset database
- **Inventory Valuation** — Sum of acquisition costs across all active assets (USD)
- **Active Allocations** — Count of assets currently assigned to employees or departments
- **Active Repair Tickets** — Count of open maintenance requests in the pipeline
- **Asset Status Breakdown** — Available / Allocated / In Maintenance counts at a glance
- **Compliance Reporting** — Direct CSV export buttons for assets and maintenance records

---

### 3. Asset Inventory Directory

> The central asset registry. Supports search by tag, name, or serial number. Filter by status (Available, Allocated, Under Maintenance, Lost, Retired). Every row shows the auto-generated `AF-XXXXXX` sequence tag, asset details, department assignment, live status badge, condition grade, and inline action buttons.

![AssetFlow ERP Asset Directory](docs/screenshots/04-assets.png)

**Asset Lifecycle States:** `AVAILABLE` → `ALLOCATED` → `UNDER_MAINTENANCE` → `AVAILABLE` (or `RETIRED` / `DISPOSED` / `LOST`)

**Asset Record Fields:**
- Auto-sequence tag (`AF-000001` format)
- Name, serial number, and category
- Department assignment and current location
- Acquisition date, cost, and warranty expiry
- Condition grade: `NEW` / `GOOD` / `FAIR` / `POOR` / `DAMAGED`
- Status with inline Allocate / Repair action buttons

---

### 4. Shared Resource Reservations & Bookings

> Assets flagged as `sharedResource` appear in the Reserves & Bookings section. Employees can schedule time-bounded reservations. The backend enforces mathematical overlap validation — two bookings cannot share the same time window for the same resource.

![AssetFlow ERP Resource Bookings](docs/screenshots/06-bookings.png)

**Booking Features:**
- Shared resource pool with availability schedule
- Overlap conflict prevention (error `BOOKING_002`)
- Reservation status tracking: `REQUESTED` → `CONFIRMED` → `ONGOING` → `COMPLETED` / `CANCELLED`
- Department Audit launch accessible directly from this panel

---

### 5. Maintenance Repair Ticket Pipeline

> A dedicated maintenance management module. Tracks every repair request through a strict state machine. Assets are automatically locked in `UNDER_MAINTENANCE` status while a ticket is open. Closing a resolved ticket restores the asset to `AVAILABLE`.

![AssetFlow ERP Maintenance Pipeline](docs/screenshots/07-maintenance.png)

**Maintenance State Machine:**
```
PENDING → APPROVED → TECHNICIAN_ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
```

**Ticket Fields:** Asset tag, description, priority (`LOW` / `MEDIUM` / `HIGH` / `CRITICAL`), assigned technician, resolution cost, status, and notes.

**Automated Trigger:** When an asset is returned with condition `DAMAGED`, the system automatically creates a `CRITICAL` priority maintenance ticket without manual intervention.

---

### 6. System Alerts & Notifications Inbox

> A personal notification inbox receiving event-driven alerts. Every significant operation — asset allocation, ownership transfer, return, and audit close — dispatches an inbox alert and a simulated SMTP email notification to relevant parties.

![AssetFlow ERP Notifications Inbox](docs/screenshots/10-notifications.png)

**Notification Events:**
- Asset allocation to employee
- Transfer request created and approved
- Asset return processed
- Maintenance ticket opened and resolved
- Audit cycle closed

---

## User Roles & Permissions

| Role | Code | Permissions |
|---|---|---|
| **Administrator** | `ADMIN` | Full system access — manage users, roles, departments, all assets, all workflows, audit cycles, and system settings |
| **Asset Manager** | `ASSET_MANAGER` | Register assets, manage allocations, approve transfers, manage maintenance tickets, run audits, view all reports |
| **Department Head** | `DEPT_HEAD` | View department assets, request transfers, initiate maintenance tickets, view department audit history |
| **Employee** | `EMPLOYEE` | View own allocated assets, request asset returns, book shared resources, view own notifications |

> **Role Assignment**: New registrations default to `EMPLOYEE` role. Administrators promote users through the user management panel. Roles carry 22 granular permissions mapped via a `RolePermission` join table.

---

## Complete Business Workflow

```mermaid
flowchart TD
    A[👤 Administrator Setup] --> B[🏢 Organization Configuration]
    B --> B1[Create Departments & Hierarchy]
    B --> B2[Define Asset Categories]
    B --> B3[Provision User Accounts & Roles]

    B1 & B2 & B3 --> C[📦 Asset Registration]
    C --> C1[Auto-generate AF-XXXXXX Tag]
    C1 --> C2[Assign Category, Department, Location]

    C2 --> D{Asset Workflow Branch}

    D -->|Dedicated Use| E[🔗 Allocation]
    E --> E1[Assign to Employee or Department]
    E1 --> E2[Set Expected Return Date]
    E2 --> E3[Asset Status → ALLOCATED]

    D -->|Shared Use| F[📅 Resource Booking]
    F --> F1[Employee Requests Time Slot]
    F1 --> F2{Overlap Check}
    F2 -->|Conflict| F3[❌ BOOKING_002 Rejected]
    F2 -->|Clear| F4[✅ Reservation Confirmed]

    E3 --> G[↩️ Return Process]
    G --> G1{Return Condition?}
    G1 -->|GOOD / FAIR| G2[Asset → AVAILABLE]
    G1 -->|DAMAGED| G3[Auto-create Maintenance Ticket]
    G3 --> G4[Asset → UNDER_MAINTENANCE]

    G4 --> H[🔧 Maintenance Pipeline]
    H --> H1[Approve Ticket]
    H1 --> H2[Assign Technician]
    H2 --> H3[In Progress → Resolved]
    H3 --> H4[Close Ticket → Asset → AVAILABLE]

    E3 --> I[🔄 Ownership Transfer]
    I --> I1[Manager Submits Request]
    I1 --> I2[Admin Approves]
    I2 --> I3[Old Allocation Closed, New Allocation Opened]

    G2 & H4 --> J[🔍 Compliance Audit Cycle]
    J --> J1[Initialize Department Audit]
    J1 --> J2[Auto-populate Checklist from Registry]
    J2 --> J3[Verify / Mark Missing / Mark Damaged]
    J3 --> J4{Close Audit}
    J4 --> J5[MISSING Assets → LOST in Registry]
    J4 --> J6[Discrepancy Report Generated]

    J5 & J6 --> K[📊 Reports & Analytics]
    K --> K1[Dashboard KPIs Updated]
    K --> K2[CSV Exports Available]
    K --> K3[Audit Trail Preserved]

    K3 --> L[🔔 Notifications Dispatched]
    L --> L1[Inbox Alerts per User]
    L --> L2[Simulated SMTP Email]
```

---

## System Architecture

### Layered Modular Monolith

```mermaid
graph TD
    subgraph Client["🖥️ Client Layer"]
        A[Next.js 16 + React 19\nZustand State Management\nTailwind CSS + Glassmorphism UI]
    end

    subgraph Gateway["🔀 API Gateway"]
        B[Express.js Router\nCORS + Helmet\nCorrelation ID Middleware]
        C[JWT Auth Middleware\nRBAC Permission Middleware\nZod Validation Layer]
    end

    subgraph Domain["📦 Domain Modules"]
        D1[Asset Module]
        D2[Allocation Module]
        D3[Booking Module]
        D4[Transfer Module]
        D5[Maintenance Module]
        D6[Audit Module]
        D7[Notification Module]
        D8[Dashboard Module]
    end

    subgraph Data["💾 Data Layer"]
        E[Prisma ORM\nQuery Extensions\nACID Transactions]
        F[(PostgreSQL\nProduction)]
        G[(SQLite\nDev / CI)]
    end

    subgraph Async["⚡ Async Processing"]
        H[In-Memory EventBus\nDomain Event Dispatch]
        I[FIFO Background Queue\nConcurrency = 1\nRetries + Metrics]
        J[AuditLog Writer\nActivityLog Writer\nNotification Dispatcher]
    end

    A -->|HTTP REST + JWT Bearer| B
    B --> C
    C --> D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8
    D1 & D2 & D3 & D4 & D5 & D6 -->|Prisma $transaction| E
    E -->|Production| F
    E -->|Development/CI| G
    E -->|Post-commit| H
    H --> I
    I --> J
    J -->|basePrisma writes| E
```

### Transaction Boundary & Post-Commit Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client as HTTP Client
    participant Service as Domain Service
    participant Tx as Prisma $transaction
    participant DB as Database
    participant Queue as FIFO Job Queue
    participant Log as AuditLog / ActivityLog

    Client->>Service: POST /api/v1/allocations
    Service->>Tx: Begin interactive transaction
    activate Tx
    Tx->>DB: UPDATE Asset SET status = ALLOCATED
    Tx->>DB: INSERT Allocation record
    Tx->>DB: SELECT oldState for audit context
    Tx-->>Tx: Queue AuditLog payload in memory
    Tx-->>Tx: Queue domain events in memory
    Tx->>DB: COMMIT
    deactivate Tx
    Service-->>Client: 201 Created (fast response)
    Note over Service,Queue: Post-commit (setImmediate)
    Service->>Queue: Enqueue AuditLog job
    Service->>Queue: Enqueue ActivityLog job
    Service->>Queue: Enqueue Notification job
    Queue->>Log: Sequential write (no lock contention)
    Log->>DB: INSERT AuditLog
    Log->>DB: INSERT ActivityLog
    Log->>DB: INSERT Notification
```

---

## Project Structure

```
AssetFlow-ERP/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Push CI: lint → build → test → Playwright
│       ├── stress-tests.yml          # Nightly concurrency stress benchmarks
│       └── release-validation.yml    # Release gate: lint → validate → test → Docker
│
├── apps/
│   ├── api/                          # Express.js REST API
│   │   ├── src/
│   │   │   ├── app.ts                # Express app factory + middleware stack
│   │   │   ├── main.ts               # Server entry point
│   │   │   ├── config/
│   │   │   │   ├── db.ts             # Prisma client + query extensions + FIFO queue hooks
│   │   │   │   ├── env.ts            # Zod-validated environment schema
│   │   │   │   └── swagger.ts        # OpenAPI 3.0 spec configuration
│   │   │   ├── modules/              # Domain feature modules (12 total)
│   │   │   │   ├── asset/            # Asset registry CRUD + category management
│   │   │   │   ├── allocation/       # Employee/department assignment workflows
│   │   │   │   ├── booking/          # Shared resource reservation scheduling
│   │   │   │   ├── transfer/         # Ownership handover request + approval
│   │   │   │   ├── return/           # Return processing + condition triggers
│   │   │   │   ├── maintenance/      # Repair ticket state machine
│   │   │   │   ├── audit/            # Compliance audit cycles + checklists
│   │   │   │   ├── auth/             # JWT authentication + refresh tokens
│   │   │   │   ├── user/             # User management + role assignment
│   │   │   │   ├── department/       # Department hierarchy management
│   │   │   │   ├── notification/     # Inbox alerts + SMTP dispatch
│   │   │   │   └── dashboard/        # KPI aggregation + analytics
│   │   │   ├── middlewares/          # Auth, RBAC, correlation ID, error handler
│   │   │   ├── events/               # In-memory EventBus publish/subscribe
│   │   │   ├── services/             # Shared services (email, upload)
│   │   │   ├── utils/
│   │   │   │   ├── job-queue.ts      # FIFO background job queue (concurrency=1)
│   │   │   │   └── logger.ts         # Structured JSON logger
│   │   │   ├── routes/               # API router aggregation
│   │   │   ├── seed.ts               # Database seed script
│   │   │   └── tests/
│   │   │       ├── run-tests.ts      # Integration test suite (8 scenarios)
│   │   │       ├── run-stress-tests.ts   # Concurrency stress benchmarks
│   │   │       └── run-performance-tests.ts  # Latency + throughput profiling
│   │   └── dist/                     # Compiled TypeScript output
│   │
│   └── web/                          # Next.js 16 frontend
│       ├── src/
│       │   └── app/
│       │       ├── page.tsx          # Main SPA dashboard (all views)
│       │       ├── layout.tsx        # Root layout + metadata
│       │       └── globals.css       # Global styles
│       ├── tests/
│       │   └── e2e.spec.ts           # Playwright E2E test suite (4 scenarios)
│       └── playwright.config.ts      # Playwright configuration
│
├── packages/                         # Shared workspace packages
│   ├── types/                        # Shared TypeScript interfaces
│   ├── utils/                        # Common utility functions
│   ├── ui/                           # Shared UI component library
│   └── config/                       # Shared configuration schemas
│
├── prisma/
│   ├── schema.prisma                 # Database schema (19 models)
│   └── dev.db                        # SQLite database (dev/CI)
│
├── docker/
│   ├── Dockerfile.api                # API production Docker image
│   └── Dockerfile.web                # Web production Docker image
│
├── docker-compose.yml                # PostgreSQL + service orchestration
│
└── docs/
    ├── ARCHITECTURE.md               # System architecture & ER model
    ├── BUSINESS_RULES.md             # Enforced business constraints
    ├── DEMO_GUIDE.md                 # Hackathon demo walkthrough
    ├── DEPLOYMENT_GUIDE.md           # Production deployment instructions
    ├── DEVELOPER_HANDBOOK.md         # Developer onboarding guide
    ├── TESTING_ARCHITECTURE.md       # Test suite design & philosophy
    ├── QUEUE_ARCHITECTURE.md         # Background queue sequence diagrams
    ├── PERFORMANCE_REPORT.md         # Latest performance benchmark
    ├── STRESS_TEST_REPORT.md         # Latest concurrency stress results
    ├── WORKFLOW_DOCUMENTATION.md     # State machines & approval flows
    └── screenshots/                  # Application screenshots
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | [Next.js](https://nextjs.org/) | 16.2 | React SSR/SSG + App Router |
| **UI Library** | [React](https://react.dev/) | 19.2 | Component model |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) | 5.0 | Client-side state |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | 4.0 | Utility-first dark UI |
| **API Backend** | [Express.js](https://expressjs.com/) | 4.21 | REST API gateway |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | 5.9 | Full-stack type safety |
| **ORM** | [Prisma](https://www.prisma.io/) | 6.19 | Type-safe database client |
| **Validation** | [Zod](https://zod.dev/) | 3.25 | Runtime schema validation |
| **Database (Prod)** | [PostgreSQL](https://www.postgresql.org/) | 15 | Relational production DB |
| **Database (Dev/CI)** | [SQLite](https://www.sqlite.org/) | — | Zero-config local/CI DB |
| **Authentication** | [JWT](https://jwt.io/) + [Argon2](https://github.com/ranisalt/node-argon2) | — | Stateless auth + password hashing |
| **E2E Testing** | [Playwright](https://playwright.dev/) | 1.61 | Browser automation tests |
| **API Docs** | [Swagger UI](https://swagger.io/) | 5.0 | Interactive OpenAPI 3.0 docs |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) | — | Automated pipelines |
| **Containerization** | [Docker](https://www.docker.com/) | — | Production image builds |

---

## Installation & Setup

### Prerequisites

- **Node.js** v20 or higher
- **npm** v9 or higher
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/abdul05kh/AssetFlow-ERP.git
cd AssetFlow-ERP
```

### 2. Install All Workspace Dependencies

```bash
npm install
```

This installs dependencies for all workspaces: `apps/api`, `apps/web`, and all `packages/*`.

### 3. Configure Environment Variables

Create `apps/api/.env` with the following configuration:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database — SQLite for local development
DATABASE_URL=file:../../prisma/dev.db

# JWT Secrets (replace with strong random values in production)
JWT_SECRET=your-strong-jwt-secret-minimum-32-chars
JWT_REFRESH_SECRET=your-strong-refresh-secret-minimum-32-chars
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# File Storage
STORAGE_TYPE=local
LOCAL_UPLOAD_DIR=./uploads

# SMTP (optional — simulated locally without a real server)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@assetflow.erp

# Booking constraints
MAX_BOOKING_DURATION_HOURS=24
DEFAULT_PAGE_LIMIT=10
```

For PostgreSQL production, set:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/assetflow
NODE_ENV=production
```

**For the frontend**, create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 4. Initialize the Database

```bash
# Generate Prisma Client
npx prisma generate --schema=prisma/schema.prisma

# Push schema to database (development)
npx prisma db push --schema=prisma/schema.prisma

# Seed with roles, permissions, departments, and demo users
npx ts-node apps/api/src/seed.ts
```

This seeds:
- 6 roles (Admin, Asset Manager, Department Head, Employee, Auditor, Technician)
- 22 granular permissions mapped to roles
- Core departments (IT, HR, Finance, R&D, Operations)
- Demo user accounts
- Asset categories (Hardware, Software, Office Equipment, Vehicles, etc.)

### 5. Build the Project

```bash
npm run build
```

---

## Development

### Start the API Backend

```bash
npm run dev --workspace=apps/api
# Starts ts-node-dev on http://localhost:4000 with hot reload
```

### Start the Frontend

```bash
npm run dev --workspace=apps/web
# Starts Next.js dev server on http://localhost:3000
```

### Run Both Concurrently

```bash
# Terminal 1
npm run dev --workspace=apps/api

# Terminal 2
npm run dev --workspace=apps/web
```

Navigate to **http://localhost:3000** and sign in with `admin@assetflow.erp` / `Password123`.

### Interactive API Documentation

Once the API is running, OpenAPI docs are available at:
- **Swagger UI**: http://localhost:4000/api/v1/docs
- **JSON Spec**: http://localhost:4000/api/v1/docs-json

### Production Start (post-build)

```bash
# API (uses compiled dist/main.js)
npm run start --workspace=apps/api

# Frontend (uses compiled .next/)
npm run start --workspace=apps/web
```

---

## Testing

AssetFlow implements three isolated test suites with clearly separated responsibilities. See [TESTING_ARCHITECTURE.md](docs/TESTING_ARCHITECTURE.md) for full design documentation.

### Integration Tests — Functional Correctness

Runs 8 deterministic scenarios against SQLite. Self-contained: bootstraps a clean database, starts Express, runs tests, tears down.

```bash
npm run test --workspace=apps/api
```

**Test scenarios:**
1. Admin authentication
2. Asset category creation
3. Asset registration + tag sequence assignment
4. RBAC: unauthenticated request rejection
5. Double-allocation conflict prevention (`ASSET_002`)
6. Ownership transfer request + approval
7. Post-commit audit log, activity log, and notification verification
8. Damaged return → automatic maintenance ticket trigger
9. Dashboard statistics compilation

### Playwright E2E Browser Tests — UI Validation

Validates the full frontend against both servers simultaneously.

```bash
npx playwright test --config=apps/web/playwright.config.ts
```

**Test scenarios:**
1. Invalid login credentials — error state validation
2. Successful admin login — dashboard transition
3. Asset search and filter operations
4. Audit log and RBAC enforcement checks

> In CI, Playwright uses pre-built artifacts (`npm run start`) for reliable server startup. Locally, it reuses any already-running dev servers.

### Concurrency Stress Tests — Scalability

Provider-aware parallel workload test. Automatically detects the database provider and applies appropriate concurrency limits.

```bash
npm run test:stress
```

| Provider | Default Workers | Override |
|---|---|---|
| SQLite | 3 | `SQLITE_STRESS_WORKERS=N` |
| PostgreSQL | 25 | `POSTGRES_STRESS_WORKERS=N` |

Outputs: `docs/STRESS_TEST_REPORT.md` + `docs/benchmarks/stress-report.json`

### Performance Profiling — Latency & Throughput

Profiles 100 sequential HTTP operations measuring P95/P99 latency, event loop delay, CPU usage, RSS memory, and database query statistics.

```bash
npm run test:performance
```

Outputs: `docs/PERFORMANCE_REPORT.md` + `docs/benchmarks/perf-report.json`

---

## API Reference

### Base URL
```
http://localhost:4000/api/v1
```

### Authentication
All protected routes require:
```
Authorization: Bearer <access_token>
```

Obtain a token via `POST /auth/login`.

### Core Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | API health check | No |
| `GET` | `/metrics` | Queue + DB telemetry | No |
| `POST` | `/auth/login` | Authenticate and get JWT | No |
| `GET` | `/assets` | List all assets (filterable) | Yes |
| `POST` | `/assets` | Register new asset | Yes (`ASSET_CREATE`) |
| `GET` | `/assets/categories` | List asset categories | Yes |
| `GET` | `/allocations` | List all allocations | Yes |
| `POST` | `/allocations` | Allocate asset to employee | Yes (`ASSET_ALLOCATE`) |
| `GET` | `/bookings` | List resource bookings | Yes |
| `POST` | `/bookings` | Create booking reservation | Yes |
| `GET` | `/transfers` | List transfer requests | Yes |
| `POST` | `/transfers` | Submit transfer request | Yes |
| `PATCH` | `/transfers/:id/approve` | Approve transfer | Yes (`ASSET_TRANSFER`) |
| `POST` | `/returns` | Process asset return | Yes |
| `GET` | `/maintenance` | List maintenance tickets | Yes |
| `POST` | `/maintenance` | Create maintenance request | Yes |
| `GET` | `/audits` | List audit cycles | Yes |
| `POST` | `/audits` | Initialize audit cycle | Yes (`AUDIT_MANAGE`) |
| `GET` | `/dashboard/stats` | Dashboard KPI aggregation | Yes (`REPORTS_VIEW`) |
| `GET` | `/notifications` | User notification inbox | Yes |
| `GET` | `/departments` | List departments | Yes |
| `GET` | `/users` | List users | Yes (`USER_VIEW`) |

### Health & Metrics Endpoints

```bash
# Health check
GET http://localhost:4000/health

# Live telemetry
GET http://localhost:4000/api/v1/metrics
```

**Metrics response:**
```json
{
  "status": "ok",
  "queue": {
    "queueLength": 0,
    "completedJobs": 44,
    "failedJobs": 0,
    "retries": 0,
    "droppedJobs": 0,
    "averageExecutionTimeMs": 1.25,
    "processingRatePerSecond": 0.8
  },
  "database": {
    "totalQueries": 510,
    "totalReads": 409,
    "totalWrites": 101,
    "averageDurationMs": 5.95,
    "slowestQueries": [ ... ]
  }
}
```

---

## CI/CD Pipelines

Three GitHub Actions workflows automate testing, benchmarking, and release validation.

### 1. Continuous Integration (`ci.yml`)

Triggered on every push and pull request to `main`.

```mermaid
flowchart LR
    A[Push / PR] --> B[ESLint Checks]
    B --> C[Prisma Generate]
    C --> D[Schema Push]
    D --> E[Database Seed]
    E --> F[Build API]
    F --> G[Build Frontend]
    G --> H[Integration Tests]
    H --> I[Install Playwright]
    I --> J[Playwright E2E]
    J -->|Pass| K[✅ Green]
    B -->|Fail| L[❌ Red — fix lint errors]
    H -->|Fail| M[❌ Red — fix business logic]
    J -->|Fail| N[❌ Red — fix UI regression]
```

### 2. Nightly Stress Benchmarks (`stress-tests.yml`)

Triggered nightly at 2:00 AM UTC and manually via `workflow_dispatch`.

- Runs provider-aware concurrency stress suite
- Archives `STRESS_TEST_REPORT.md` and `stress-report.json` as workflow artifacts

### 3. Release Validation (`release-validation.yml`)

Triggered on release tags (`v*`) and manually. Acts as the final production gate.

```
ESLint → Prisma Validate → Prisma Generate → Schema Push → Seed →
Build (API + Web) → Integration Tests → Playwright E2E →
Docker Build (API) → Docker Build (Web) → Release Artifact Upload
```

---

## Performance Benchmarks

*Measured on Node.js v24.13.0 / 13th Gen Intel Core i7-13700HX / SQLite (development provider).*

### Throughput & Latency (100 sequential HTTP requests)

| Metric | Value |
|---|---|
| **Throughput** | 20.13 req/sec |
| **Average Latency** | 38.98 ms |
| **P95 Latency** | 89 ms |
| **P99 Latency** | 101 ms |
| **Total Requests** | 100 (50 asset creations, 50 category queries) |
| **Success Rate** | 100% |

### Database Telemetry

| Metric | Value |
|---|---|
| **Total DB Queries** | 510 |
| **Read Operations** | 409 |
| **Write Operations** | 101 |
| **Average Query Time** | 5.95 ms |
| **Slowest Query** | 67 ms (AuditLog CREATE) |

### System Load

| Metric | Value |
|---|---|
| **Peak RSS Memory** | 492 MB |
| **CPU Time** | 3,312 ms |
| **Average Event Loop Delay** | 0.4 ms |
| **Maximum Event Loop Delay** | 3 ms |

### Concurrency Stress (3 parallel workers, SQLite)

| Metric | Value |
|---|---|
| **Success Rate** | 100% |
| **Throughput** | 3.71 ops/sec |
| **P95 Latency** | 560 ms |
| **Audit Logs Written** | 44 |
| **Activity Logs Written** | 10 |
| **Notifications Created** | 9 |

> For production PostgreSQL deployments, stress concurrency can be raised to 25+ workers. See `POSTGRES_STRESS_WORKERS` environment variable.

Full reports: [PERFORMANCE_REPORT.md](docs/PERFORMANCE_REPORT.md) | [STRESS_TEST_REPORT.md](docs/STRESS_TEST_REPORT.md)

---

## Security Model

### Authentication
- **JWT Bearer tokens** with configurable expiry (`JWT_EXPIRES_IN`, default `1d`)
- **Refresh tokens** for seamless session renewal (`JWT_REFRESH_EXPIRES_IN`, default `7d`)
- **Argon2** password hashing (memory-hard, resistant to GPU cracking)

### Authorization
- **RBAC middleware** intercepts every protected route, verifies the bearer token, extracts user roles, and checks the required permission code against the `RolePermission` mapping table
- 22 granular permission codes (e.g., `ASSET_CREATE`, `ASSET_DELETE`, `AUDIT_MANAGE`, `REPORTS_VIEW`)
- Permission failures return `AUTH_003` with a 403 status

### Data Integrity
- **Prisma interactive transactions** wrap all multi-step business operations
- **Optimistic status checks** within transaction scope prevent double-allocation races
- **Zod validation** rejects malformed requests before they reach the service layer
- **Correlation IDs** (`x-correlation-id` header) trace every request through all log layers

### Audit Trail
- Every `CREATE`, `UPDATE`, and `DELETE` operation is captured by a Prisma Query Extension
- Audit records include: `userId`, `tableName`, `recordId`, `changedValues` (JSON diff), `ipAddress`, `userAgent`, `correlationId`, and `timestamp`
- Log writes are deferred to the FIFO background queue — they **never block or roll back** the business transaction
- See [QUEUE_ARCHITECTURE.md](docs/QUEUE_ARCHITECTURE.md) for the complete sequence diagram

---

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, ER model, transaction boundaries, event-driven subscriptions |
| [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Docker Compose setup, production PostgreSQL, environment variables, health checks |
| [TESTING_ARCHITECTURE.md](docs/TESTING_ARCHITECTURE.md) | Test suite philosophy, CI lifecycle, DB provider strategy, SLA targets |
| [QUEUE_ARCHITECTURE.md](docs/QUEUE_ARCHITECTURE.md) | Background FIFO queue sequence diagrams, telemetry endpoint reference |
| [BUSINESS_RULES.md](docs/BUSINESS_RULES.md) | Enforced constraints: double-allocation lock, booking overlap validation, return triggers |
| [WORKFLOW_DOCUMENTATION.md](docs/WORKFLOW_DOCUMENTATION.md) | Maintenance state machine, transfer approval flow, audit cycle lifecycle |
| [DEMO_GUIDE.md](docs/DEMO_GUIDE.md) | Step-by-step hackathon demo script with judge Q&A |
| [DEVELOPER_HANDBOOK.md](docs/DEVELOPER_HANDBOOK.md) | Developer onboarding, coding conventions, module patterns |
| [PERFORMANCE_REPORT.md](docs/PERFORMANCE_REPORT.md) | Latest system performance telemetry report |
| [STRESS_TEST_REPORT.md](docs/STRESS_TEST_REPORT.md) | Latest concurrency stress benchmark results |

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. **Fork** the repository and create your feature branch from `main`
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Follow the module pattern** — new features go into `apps/api/src/modules/<name>/` with controller, service, repository, routes, and validation files

3. **Validate locally** before opening a PR:
   ```bash
   npm run lint          # No errors allowed
   npm run build         # Must compile cleanly
   npm run test --workspace=apps/api   # All 8+ integration tests must pass
   npx playwright test --config=apps/web/playwright.config.ts
   ```

4. **Write tests** — new business logic must include at least one integration test scenario in `run-tests.ts`

5. **Preserve the audit trail** — any new model that mutates state must emit the appropriate domain events through the EventBus

6. **Open a Pull Request** with a clear description of the change, the problem it solves, and how it was tested

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

AssetFlow ERP was built with these exceptional open-source technologies:

- [Next.js](https://nextjs.org/) — The React framework for production
- [Prisma](https://www.prisma.io/) — Next-generation ORM for Node.js and TypeScript
- [Express.js](https://expressjs.com/) — Fast, unopinionated Node.js web framework
- [Playwright](https://playwright.dev/) — Reliable end-to-end testing for modern web apps
- [Tailwind CSS](https://tailwindcss.com/) — A utility-first CSS framework
- [Zod](https://zod.dev/) — TypeScript-first schema validation
- [Zustand](https://github.com/pmndrs/zustand) — Bear necessities for state management
- [Swagger UI](https://swagger.io/tools/swagger-ui/) — Interactive API documentation
- [Argon2](https://github.com/ranisalt/node-argon2) — Memory-hard password hashing

---

<div align="center">

Built with ❤️ for the **Odoo Hiring Hackathon 2026**

**AssetFlow ERP** — *Know where every asset is. Every time.*

</div>
