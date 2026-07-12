# Quality Assurance & Testing Strategy — AssetFlow ERP v1.0.0

AssetFlow implements a dual automated verification model to guarantee stability:

---

## 1. Backend Integration Tests

Managed under the API workspace, tests run programmatically via:
```bash
npm run test --workspace=apps/api
```
Verify:
- **Authentication**: Validation tokens checks.
- **Dynamic Permission (RBAC)**: Route access validations.
- **Category & Asset Sequence**: Unique serials and sequentially generated tag numbers mapping.
- **Asset Locks**: Rejects double-allocations inside a single transaction.
- **Ownership Transfer**: Handover transitions.
- **Returns Triggers**: Returning a DAMAGED asset auto-spawns a maintenance repair ticket.

---

## 2. Playwright E2E Web Browser Tests

Located at [playwright.config.ts](file:///d:/projects/AssetFlow-ERP/apps/web/playwright.config.ts), tests target the Next.js frontend pages:
```bash
npx playwright test --config=apps/web/playwright.config.ts
```
Scenarios:
- Login UI validation boundaries.
- Demo credentials dashboard access.
- Filter toolbar fields (search queries).
- Tabs buttons mount checks (Overview, Assets Inventory).

---

## 3. Continuous Integration (CI) Lifecycle

The GitHub Actions pipeline is defined in [ci.yml](file:///d:/projects/AssetFlow-ERP/.github/workflows/ci.yml). It automates the full build-and-test verification cycle:

1. **Environment Setup**: Checks out code, boots Node.js v22 environment, and installs monorepo dependencies.
2. **Database Initialization & Seeding**:
   - Compiles Prisma Client mapping: `npx prisma generate`
   - Recreates a clean test schema: `npx prisma db push --force-reset --accept-data-loss`
   - Populates default departments, roles, categories, and test user accounts: `npx ts-node apps/api/src/seed.ts`
3. **Monorepo Compilation**: Runs workspaces build scripts.
4. **Automated Integration Testing**:
   - The test runner [run-tests.ts](file:///d:/projects/AssetFlow-ERP/apps/api/src/tests/run-tests.ts) programmatically spins up the Express server on port 4000.
   - It performs readiness polling against the `GET /health` endpoint (max 30 attempts, 500ms delay).
   - Once `/health` is healthy, it executes the 8 REST integration test cases.
   - Upon completion, it gracefully shuts down the Express listener.
5. **Playwright E2E Verification**:
   - Playwright automatically spawns the Next.js frontend (port 3000) and the backend API (port 4000) via its built-in config.
   - It polls `http://localhost:3000` and `http://localhost:4000/health` before starting browser tests.
   - It gracefully terminates both server processes upon execution exit.

---

## 4. Regression & High-Concurrency Stress Testing

To verify transactional reliability and the non-blocking behavior of the post-commit logging architecture, the automated integration test suite includes specialized regression and load validation stages:

### Regression Verifications
- **Activity & Audit Mappings**: Asserts that `ActivityLog`, `AuditLog`, and `Notification` table records are created successfully following transfer approvals, confirming they persist correctly without blocking business commits.
- **Error Boundaries**: Verifies that when database errors occur, transactions roll back cleanly without writing orphan audit data.

### High-Concurrency Stress Tests
- **Parallel Workloads**: Executes 20 simultaneous asset creations and allocations, followed by 10 concurrent transfer requests and approvals.
- **Locks & Deadlocks Check**: Ensures all concurrent operations complete without SQLite write lock contentions or timeouts.
- **Logs Auditing**: Confirms that more than 50 audit logs are correctly written post-commit under parallel stress loads, with zero duplicate entries.
