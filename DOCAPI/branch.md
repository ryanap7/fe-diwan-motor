# Branch Management Module

Base: /branches
Protected: Authorization required

---

## POST /branches
Create branch
**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
**Body**
```json
{
  "code": "JKT-002",
  "name": "Cabang Jakarta Selatan",
  "address": "Jl. TB Simatupang No. 123, Jakarta Selatan",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12430",
  "phone": "0217890123",
  "email": "jaksel@company.com",
  "operatingHours": {
    "monday": { "open": "08:00", "close": "17:00", "closed": false }
  },
  "notes": "Cabang baru di Jakarta Selatan"
}
```
**Response (201)**
```json
{ "id": "uuid", "code": "JKT-002", "name": "Cabang Jakarta Selatan", "isActive": true }
```

---

## POST /branches/{id}/assign-manager
Assign manager to branch
**Body**
```json
{ "userId": "110ef02d-36fc-481c-8058-00c861d2c20a" }
```

---

## POST /branches/{id}/assign-cashier
Assign cashier to branch
**Body**
```json
{ "userId": "bfa82f21-20ed-47c5-9c23-536c6f9417b7" }
```

---

## POST /branches/{id}/activate
Activate branch
**Response**
```json
{ "message": "Branch activated successfully" }
```

---

## POST /branches/{id}/deactivate
Deactivate branch
**Body**
```json
{ "reason": "Renovasi gedung untuk 2 bulan ke depan" }
```

---

## PATCH /branches/{id}
Update branch (partial)
**Body** (example same as create)
```json
{ "name": "Cabang Jakarta Selatan", "phone":"021..." }
```

---

## GET /branches
Query params: page, limit, status, search, city, province, isActive
**Response (200)** includes list and pagination metadata.

---

## GET /branches/{id}
Response (200) returns branch details and assignments
