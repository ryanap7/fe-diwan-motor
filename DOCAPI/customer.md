# Customer Management Module

Base: /customers
Protected: Authorization required

---

## POST /customers
Create customer
**Body**
```json
{
  "name": "Jane Smith",
  "phone": "+6281234567891",
  "email": "jane@example.com",
  "address": "Jl. Thamrin No. 456, Jakarta",
  "notes": "Regular customer",
  "isActive": true
}
```

---

## GET /customers
Query params: page (1-100), limit, search (name|phone|email), isActive, sortBy (name|createdAt), sortOrder (asc|desc)
**Response**: paginated list

---

## GET /customers/{id}
Get customer by id

---

## PUT /customers/{id}
Update customer (body same as create)

---

## PATCH /customers/{id}/status
Toggle status
**Body**
```json
{ "isActive": true }
```

---

## DELETE /customers/{id}
Delete customer