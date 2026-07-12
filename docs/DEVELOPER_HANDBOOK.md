# Developer Handbook — AssetFlow ERP v1.0.0

This guide details code styles, tooling setup, and directories structure conventions for developers working on AssetFlow ERP.

---

## 1. Directory Organization

- **`apps/api/src/modules/`**: Contains domain-isolated feature folders (e.g. `asset/`, `allocation/`). Inside each folder:
  - `controller/`: Intercepts request and responses.
  - `service/`: Domain workflows.
  - `repository/`: Direct database queries.
  - `validator/`: Zod body assertions.
  - `dto/`: Interfaces.
  - `routes/`: Routing mounts.
  - `events/`: Publisher/subscriber handlers.

---

## 2. Code Quality & Standards

- **TypeScript Strictness**: Implicit `any` is restricted on production files. Explicit casting is allowed on third-party typings bypasses (e.g. Prisma extensions).
- **Import Formats**: Relative imports within CommonJS API compilation targets must omit file extensions.
- **Winston JSON Logs**: Every diagnostic write uses standard logger levels:
  ```typescript
  logger.info("[Module] log details", { contextId });
  ```
