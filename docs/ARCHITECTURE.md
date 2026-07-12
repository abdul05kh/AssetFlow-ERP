# System Architecture & ER Layout — AssetFlow ERP

This document maps the architectural patterns, workspace layering, event distributions, and entity relationships of **AssetFlow ERP v1.0.0**.

---

## 1. Modular Monolith Architecture

AssetFlow follows a modular monolith design utilizing npm/yarn workspaces to isolate domain scopes.

```mermaid
graph TD
  A[Next.js 16 Web UI Portal] -->|HTTP REST + JWT| B[Express API Gateway Router]
  B --> C[Security / Correlation / Audit Context Middleware]
  C --> D[Domain Controllers]
  D -->|DTO Validation / Zod| E[Domain Services]
  E -->|ACID Transactions / Prisma| F[Domain Repositories]
  F -->|Prisma Extension query hooks| G[PostgreSQL / SQLite fallback db]
  E -->|In-Memory EventBus| H[Event Listeners & Inbox Alerts]
```

### Layered Monolith Architecture
- **Presentation Layer**: Custom React 19 pages communicating via Next.js 16 client hooks, managed by Zustand stores.
- **Validation Layer**: Zod schemas validating incoming request bodies.
- **Business Logic Layer**: Domain Services implementing state machines (maintenance state-machine, overlap bookings).
- **Data Access Layer**: Repositories encapsulating Prisma Client transactions.

---

## 2. Event-Driven Subscriptions

An internal publish-subscribe Event Bus synchronizes activities across secondary boundaries:

| Publisher Event | Subscriber Handler | Action Result |
| :--- | :--- | :--- |
| `AssetAllocated` | Notification Service | Dispatches inbox alert and mock email notification |
| `AssetReturned` | Maintenance Service | Triggers pending ticket if return condition matches `DAMAGED` |
| `AuditCompleted` | Asset Service | Flags checklist discrepancies to `LOST` status in registry |

---

## 3. Database Entity Relationship (ER) Model

The schema mapped in `prisma/schema.prisma` establishes relationships between core assets, assignments, and logging records.

### Principal Database Models

- **`User` / `Employee`**: Belongs to a `Department` and links to `UserRole` memberships.
- **`Department`**: Contains organizational locations and references audit cycles.
- **`AssetCategory`**: Defines categorization metadata and default maintenance intervals.
- **`Asset`**: Tracks sequences tags, acquisition details, location states, and is associated with `Allocation` assignments.
- **`Allocation`**: Tracks the assignee, dates, expected returns, and notes.
- **`ResourceBooking`**: Schedules reservations on shared items, validating time ranges.
- **`MaintenanceRequest`**: Manages repairs states, assigned technicians, and resolution costs.
- **`Audit` & `AuditItem`**: Tracks compliance audits, verifications check sheets, and discrepancies logs.
- **`AuditLog`**: Centralized, immutable writes logger.
