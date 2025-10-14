# Purchase Orders Module

Base: /purchase-orders
Protected: Authorization required

---

## GET /purchase-orders
Query params: page, limit (max 100), search (PO number), supplierId, branchId, status (DRAFT|PENDING|APPROVED|PARTIALLY_RECEIVED|RECEIVED|CANCELLED), startDate, endDate, sortBy (orderDate|poNumber|totalAmount), sortOrder (asc|desc)

---

## POST /purchase-orders
Create PO
**Body**
```json
{
  "supplierId": "03bc22c0-bf17-43af-8e59-31e32ed0f784",
  "branchId": "c2c764c7-b578-485e-9086-f9f08786d227",
  "expectedDate": "2024-10-20T00:00:00.000Z",
  "paymentTerms": "Net 30",
  "notes": "Urgent order",
  "items": [
    { "productId": "0623cd62-a1f3-4ecd-9d24-4fc98137c5c0", "orderedQty": 12, "unitPrice": 10000, "notes": "Handle with care" }
  ],
  "taxAmount": 110000,
  "discountAmount": 50000,
  "shippingCost": 25000
}
```

---

## PUT /purchase-orders/{id}
Update PO

---

## PATCH /purchase-orders/{id}/submit
Submit PO

---

## PATCH /purchase-orders/{id}/approve
Approve PO
**Body**
```json
{ "notes": "Approved with conditions" }
```

---

## PATCH /purchase-orders/{id}/receive
Receive PO (partial/full)
**Body example**
```json
{
  "items": [
    { "itemId": "8f62f9d8-1a85-4270-8402-d6bbf6431e33", "receivedQty": 4, "notes":"First batch received" }
  ],
  "receivedDate": "2024-10-18T00:00:00.000Z",
  "notes": "Partial delivery"
}
```

---

## PATCH /purchase-orders/{id}/cancel
Cancel PO
**Body**
```json
{ "reason": "Supplier cannot fulfill the order" }
```

---

## DELETE /purchase-orders/{id}
Delete PO