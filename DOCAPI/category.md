# Category Management Module

Base: /categories
Protected: Authorization required

---

## GET /categories
Query params: page, limit, isActive, sortBy, sortOrder
**Response** returns paginated list of categories

---

## GET /categories/roots
Returns root categories (parentId == null)

---

## GET /categories/{id}
Get category by id

---

## POST /categories
Create category
**Body**
```json
{
  "name": "Mesin",
  "parentId": null,
  "description": "Aki, busi, CDI, lampu",
  "sortOrder": 4,
  "icon": "electric-icon",
  "isActive": true
}
```

---

## PUT /categories/{id}
Update category (full)

---

## PATCH /categories/{id}/status
Toggle active status
**Body**
```json
{ "isActive": false }
```

---

## DELETE /categories/{id}?cascade=false
Delete category, cascade optional (cascade=true deletes subcategories)