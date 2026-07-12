# Release Notes — AssetFlow ERP v1.0.0

We are proud to announce the release of **AssetFlow ERP v1.0.0**, a production-ready Enterprise Resource Management System designed for the Odoo Hiring Hackathon 2026.

---

## 1. What's New in v1.0.0

### Core Domain Workflows
- **Sequence Tag Generator**: Automatic sequentially numbered tag allocation for new assets.
- **Double Assignment Locks**: Prevents concurrent allocations on assets.
- **Shared Calendar Overlap Checks**: Blocks overlapping reservations.
- **Auto-Maintenance Spawner**: Triggers high-priority repair tickets on damaged asset returns.
- **Compliance Audit Checklists**: Generates verification checkpoints and processes asset states upon closure.
- **System Inbox Alerts**: Real-time notifications and alerts.

### System Infrastructure Hardening
- **Dynamic Permission Matching**: Restricts routes against dynamic query grids.
- **Natively Safe Headers**: Helmet-like secure HTTP headers.
- **Centralized Audit Logging**: Logs all mutations asynchronously using a non-blocking Prisma Extension.

---

## 2. Security & Credentials Advisory

> [!WARNING]
> **Demo Seed Account Credentials**:
> The system is seeded with the following development credentials for evaluation/hackathon demo purposes:
> - **Username**: `admin@assetflow.erp`
> - **Password**: `Password123`
>
> These credentials must be replaced immediately when moving to production deployment.

---

## 3. Deployment Requirements

- **Runtime**: Node.js `22.10.0` or higher.
- **Database**: PostgreSQL `15-alpine` or SQLite `3` development fallback.
- **Port Settings**: API gateway uses port `4000`, frontend dashboard portal runs on port `3000`.
