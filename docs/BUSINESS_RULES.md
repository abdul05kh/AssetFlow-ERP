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
