# Supplier Management Module

Base: /suppliers
Protected: Authorization required

---

## GET /suppliers
Query params: page, limit (max 100), search (name|contactPerson|phone|email), isActive, sortBy (name|createdAt), sortOrder (asc|desc)

**Response**: paginated supplier list

---

## POST /suppliers
Create new supplier
**Body**
```json
{
  "name": "PT. Supplier Utama",
  "contactPerson": "John Doe",
  "phone": "021-12345678",
  "email": "supplier@example.com",
  "address": "Jl. Raya No. 123, Jakarta Pusat",
  "paymentTerms": "Net 30 days, COD",
  "deliveryTerms": "FOB, CIF",
  "notes": "Supplier terpercaya untuk spare parts",
  "isActive": true
}
```

---

## GET /suppliers/{id}
Get supplier by id

---

## PUT /suppliers/{id}
Update supplier (body same as create)

---

## PATCH /suppliers/{id}/status
Toggle supplier status
**Body**
```json
{ "isActive": true }
```

---

## DELETE /suppliers/{id}
Delete supplier