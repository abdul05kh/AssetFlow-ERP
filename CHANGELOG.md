# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-12

### Added
- Production-ready monorepo workspace configurations wrapping Next.js, Express, common types, config modules, UI components, and testing suites.
- Asynchronous FIFO background job queue (`BackgroundJobQueue`) to run log writes, audit trails, and email side-effects off the main execution thread.
- Live `/metrics` monitoring endpoint exposing real-time CPU load, DB reads/writes, slow queries, and background queue telemetry metrics.
- Granular Role-Based Access Control (RBAC) mapping Admin, Asset Manager, Department Head, and Employee roles.
- Automatic maintenance ticket generation triggers for physical assets returned in `DAMAGED` state.
- PostgreSQL database schemas for production environment and SQLite database configurations for development/CI.
- Playwright E2E browser test coverage validating invalid login alerts, dashboard statistics, asset searches, and role-based permissions.
- Continuous Integration and deployment setup via three distinct GitHub Actions workflows (`ci.yml`, `stress-tests.yml`, `release-validation.yml`).
- Premium glassmorphic Next.js dashboard with dark themes, real-time KPI metrics, and export capabilities.

### Fixed
- Client-side Next.js SSR hydration DOM mismatches using a mounted state tracker in the page router.
- Headless Playwright browser typing/submission value resets by waiting for full client-side React hydration (`data-hydrated="true"`).
- WebSocket cross-origin blocks using top-level Next.js HMR `allowedDevOrigins` parameter settings.
- Loopback address resolution errors in dual-stack GHA network runners (replacing localhost with 127.0.0.1).
- Interactive transactions SQLite socket timeout deadlocks by moving activity and audit log writes to background workers.
