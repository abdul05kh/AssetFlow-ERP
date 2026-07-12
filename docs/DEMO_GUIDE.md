# Hackathon Demo & Installation Guide — AssetFlow ERP v1.0.0

This guide is designed to assist hackathon judges and developers in installing, bootstrapping, and demoing **AssetFlow ERP v1.0.0** from scratch.

---

## 1. Quick Installation & Setup

Ensure you have **Node.js (v20+)** installed on your system.

### Step 1: Clone and Install Workspaces Dependencies
From the repository root, install dependencies:
```bash
npm install
```

### Step 2: Configure Environment Parameters
- API environment settings are defined at `apps/api/.env`.
- Frontend client settings are defined at `apps/web/.env.local` (or default backends are automatically mapped).

### Step 3: Run Database Migrations & Seeds
Initialize schemas and load development data (departments, employees, categories):
```bash
npx prisma migrate dev --name init
npx ts-node apps/api/src/seed.ts
```

### Step 4: Start Services
To run the Express REST API and Next.js frontend development servers concurrently:
- **Start Backend API**: `npm run dev:api` (Runs on port `4000`)
- **Start Next.js Client**: `npm run dev:web` (Runs on port `3000`)

---

## 2. Interactive Hackathon Demo Script

To present the ERP system workflow during the demo:

### Step 1: Secure Authentication
1. Navigate to [http://localhost:3000](http://localhost:3000) in your browser.
2. Login with the development seed administrator account:
   - **Email**: `admin@assetflow.erp`
   - **Password**: `Password123`
3. Click **Submit**. Observe the transition to the dark-theme glassmorphic overview page compiling real-time metrics.

### Step 2: Register a Physical Asset
1. Click the **Register Asset** modal button.
2. Fill in details:
   - **Name**: `Lenovo ThinkPad T14 Gen 4`
   - **Serial**: `SN-LNV-T14-9988`
   - **Category**: select Hardware
   - **Department**: select Research & Development
   - **Acquisition Cost**: `1850.00`
3. Click **Register**. The system triggers tag sequence allocation (`AF-XXXXXX` tag format). Observe that the total assets count on the dashboard increments instantly!

### Step 3: Enforce Double Allocation Lock
1. Navigate to the newly created asset and click **Allocate**.
2. Allocate it to a developer employee. Click **Submit**. The asset transitions to the `ALLOCATED` state.
3. Try to allocate the *same* asset a second time. Observe that the API rejects the request, throwing validation error code `ASSET_002` (422 Unprocessable Entity), proving double allocation protection works.

### Step 4: Simulate Asset Return & Auto-Maintenance Trigger
1. Select the active allocation and click **Return**.
2. Change the return condition state to `DAMAGED` and add notes: "Laptop screen is cracked."
3. Click **Process Return**.
4. Transition to the **Maintenance** tab. Observe that a high-priority repair ticket has been auto-generated with status `PENDING`, and the asset status is locked to `UNDER_MAINTENANCE` in the inventory!

### Step 5: Finalize compliance Department Audits
1. Click **Run Department Audit**.
2. Select R&D department, assign a compliance auditor, and hit **Submit**.
3. View the generated checklist containing all assets registered to R&D. Check off an asset as `VERIFIED` and another as `MISSING`.
4. Close the audit cycle. Verify that the missing asset status automatically flags to `LOST` in the inventory registry.

---

## 3. Judge Q&A Guide

### Q1: How does the system handle concurrent allocation conflicts?
> **Answer**: AssetFlow implements database transactions (`prisma.$transaction`) combined with optimistic locking states. An asset's status is evaluated within the transaction boundary; if it differs from `AVAILABLE`, the write locks roll back and return a structured `ASSET_002` validation error.

### Q2: What is the centralized audit logging model?
> **Answer**: The system uses a modern, non-blocking Prisma Query Extension that hooks into all database writes. To prevent locking deadlocks, audit log insertions are deferred to the next event loop tick using `setImmediate`.

### Q3: How is access control verified dynamically?
> **Answer**: The backend implements an RBAC authorization middleware (`permission.middleware.ts`) that intercepts incoming request tokens, extracts user roles, and queries the database privileges grid dynamically before allowing route controllers to execute.
