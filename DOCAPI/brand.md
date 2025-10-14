# Brand Management Module

Base: /brands
Protected: Authorization required

---

## GET /brands
Query params: page, limit, search, isActive, sortBy, sortOrder
**Response**: paginated brands list

---

## GET /brands/{id}
Get brand by id

---

## POST /brands
Create brand
**Body**
```json
{ "name": "Nokia", "description": "Korean electronics brand", "isActive": true }
```

---

## PUT /brands/{id}
Update brand
**Body**
```json
{ "name": "Nokia", "description": "Updated description", "isActive": true }
```

---

## PATCH /brands/{id}/status
Toggle active status
**Body**
```json
{ "isActive": true }
```

---

## DELETE /brands/{id}
Delete brand