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
