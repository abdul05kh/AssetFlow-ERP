# Business Rules & Constraints — AssetFlow ERP v1.0.0

This document defines core operational constraints and logic checks enforced by AssetFlow.

---

## 1. Asset Sequence Tags (`AF-ASSET`)
- Custom tag sequence auto-assignment (`AF-XXXXXX` tag format).
- Non-duplicate serial numbers validation.

---

## 2. Double-Allocation Lock (`AF-ALLOC`)
- Assets must be in the `AVAILABLE` status to allow allocation.
- Once allocated, status transitions to `ALLOCATED`.
- Concurrent assignment attempts return error `ASSET_002` (422 Unprocessable Entity).

---

## 3. Booking Overlap Boundary (`AF-BOOK`)
- Category assets flagged as `sharedResource` support booking schedules.
- Reservation slots are blocked if the range overlaps an active booking:
  $StartA < EndB \land EndA > StartB$
- Overlapping bookings return error `BOOKING_002` (422).

---

## 4. Return Ticketing Triggers (`AF-RET`)
- Returning an asset terminates active allocations.
- If return condition is flagged as `DAMAGED`, the asset's status transitions to `UNDER_MAINTENANCE` and a high-priority repair ticket is automatically created.

---

## 5. Transactional Integrity & Event Lifecycles (`AF-TX`)
- **Isolation of Logging**: Database audit logs must never block or roll back business transactions. They are captured and persisted asynchronously post-commit.
- **Rollback Consistency**: If a database transaction fails or is aborted (e.g. due to validation or lock issues), all associated audit logs and domain events are discarded, preventing false entries in the audit trail.
- **Diagnostics logging**: Database transactions timing out must log detailed context variables including duration, correlation ID, and active operations for troubleshooting.
