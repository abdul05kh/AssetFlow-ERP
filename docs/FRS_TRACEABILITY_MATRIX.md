# FRS Requirement Traceability Matrix — AssetFlow ERP

| Requirement ID | Requirement Name | Module | Database Entity | API Endpoint | Frontend Screen | Business Rule | Validation Rule | Test Case | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AF-AUTH** | Authentication | Auth | User, Session | `POST /auth/login` | Login Form View | Enforces secure Argon2 password hashing | Validates email string shape & password lengths (Zod) | run-tests.ts:1, e2e.spec.ts:1 | **COMPLETED** |
| **AF-ASSET** | Asset Registry | Asset | Asset, Category | `POST /assets`, `GET /assets` | Assets Inventory Tab | Dynamic tag sequence parser (`AF-XXXXXX`), unique serial check | Validates registration data structures | run-tests.ts:3, e2e.spec.ts:3 | **COMPLETED** |
| **AF-ALLOC** | Asset Allocation | Allocation | Allocation | `POST /allocations` | Assign Asset Dialog | Assets must be AVAILABLE status before assignment | Double allocation lock validations | run-tests.ts:5 | **COMPLETED** |
| **AF-BOOK** | Shared Bookings | Booking | ResourceBooking | `POST /bookings` | Booking Calendar Dialog | Prevents concurrent reservation overlap checks | Overlap date limits validation | run-tests.ts:7 | **COMPLETED** |
| **AF-TRANS** | Ownership Transfers | Transfer | AssetTransfer | `POST /transfers`, `PUT /transfers/:id/approve` | Approvals View | Close old holder allocations and open new assignees | Dynamic authorization signature verify | run-tests.ts:6 | **COMPLETED** |
| **AF-RET** | Asset Returns | Return | ReturnRecord | `POST /returns` | Return Asset Dialog | Restores asset status to AVAILABLE or locks to repairs | Damaged condition assessment triggers | run-tests.ts:7 | **COMPLETED** |
| **AF-MAINT** | Maintenance Tickets | Maintenance | MaintenanceRequest | `POST /maintenance`, `PUT /maintenance/:id/resolve` | Maintenance Pipeline Tab | Technicians assignment and condition state changes | Verifies resolved cost limits | run-tests.ts:7 | **COMPLETED** |
| **AF-AUDIT** | Department Audits | Audit | Audit, AuditItem | `POST /audits`, `PUT /audits/items/:itemId/verify` | Run Audits Tab | Auto-generates checklist items for department inventory | Verification locks on closure | run-tests.ts:8 | **COMPLETED** |
| **AF-DASH** | KPI & CSV Reports | Dashboard | Asset, ActivityLog | `GET /dashboard/stats`, `GET /dashboard/reports/assets/export` | Dashboard Overview Tab | Dynamic compilation of counts, values, and alerts | Export data formatting constraints | run-tests.ts:8 | **COMPLETED** |

---

*Note: All tests referenced in this matrix compile and execute cleanly in both local and workspace context pipelines.*
