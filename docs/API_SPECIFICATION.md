# REST API Specifications — AssetFlow ERP v1.0.0

Interactive dynamic API specs are served under:
- **Swagger Documentation**: [http://localhost:4000/api/v1/docs](http://localhost:4000/api/v1/docs)
- **JSON Specification**: [http://localhost:4000/api/v1/docs-json](http://localhost:4000/api/v1/docs-json)

---

## 1. Authentication Endpoints

### Login Session (`POST /auth/login`)
- **Payload Request**:
  ```json
  {
    "email": "admin@assetflow.erp",
    "password": "Password123"
  }
  ```
- **Response Format (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "user": { "id": "uuid", "email": "admin@assetflow.erp", "name": "Admin" }
    }
  }
  ```

---

## 2. Asset Inventory Endpoints

### Register Asset (`POST /assets`)
- **Headers**: `Authorization: Bearer <token>`
- **Payload Request**:
  ```json
  {
    "name": "Lenovo ThinkPad T14",
    "serialNumber": "SN-LNV-9923",
    "categoryId": "category-uuid",
    "departmentId": "department-uuid",
    "acquisitionDate": "2026-07-12T12:00:00Z",
    "acquisitionCost": 1550.00,
    "currentLocation": "Lab 201"
  }
  ```
- **Response (210 Created)**: Returns the generated sequential sequence tag `AF-XXXXXX`.

---

## 3. Operations Endpoints

- **Allocate Asset (`POST /allocations`)**: Binds asset to employee, locks state to `ALLOCATED`.
- **Return Asset (`POST /returns`)**: Releases active allocation, triggers auto-maintenance tickets if return condition evaluates to `DAMAGED`.
- **Overlap Booking (`POST /bookings`)**: Prevents concurrent schedules on shared category assets.
- **Ownership Transfer (`POST /transfers`)**: Moves asset department ownership.
