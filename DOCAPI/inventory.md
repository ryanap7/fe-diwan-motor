# Inventory / Stock Management Module

Base: /stocks
Protected: Authorization required

---

## GET /stocks
Get stock overview. Query params: page, limit, search (product name|sku), branchId, categoryId, isLowStock, sortBy (name|sku|totalStock), sortOrder

---

## GET /stocks/product/{productId}
Get stock by product id

---

## POST /stocks/transfer
Transfer stock between branches
**Body**
```json
{
  "fromBranchId": "2b1c404e-cfec-4627-961b-af2d0644a2db",
  "toBranchId": "57488464-2c00-496f-94d1-16532852a959",
  "quantity": 8,
  "notes": "PO-2025-001 received from supplier"
}
```

---

## POST /stocks/adjust
Adjust stock (increase/decrease)
**Body**
```json
{ "branchId": "uuid", "quantity": -12, "type": "OUT", "reason": "Purchase order received", "notes":"PO-2025-001" }
```

---

## GET /stocks/movements
Stock movements history. Params: page, limit, productId, branchId, type (IN|OUT|TRANSFER|ADJUSTMENT), startDate, endDate
