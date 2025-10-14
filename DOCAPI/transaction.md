# Transactions Module (POS)

Base: /transactions
Protected: Authorization required

---

## GET /transactions/products/pos
Get products for POS. Query: page, limit, search, categoryId, brandId, priceType

---

## GET /transactions/customers/search?phone={phone}
Search customer by phone

---

## POST /transactions/customers/quick
Quick create customer (for POS)
**Body**
```json
{ "name": "Lukman Hakim", "phone": "081234567810" }
```

---

## POST /transactions
Create transaction
**Body**
```json
{
  "customerId": "24bb80cc-b66e-4292-b8bb-303fa62f0d0d",
  "items": [
    { "productId": "75e5a2a3-a899-4740-8fb2-e21b3c4e0a0d", "quantity": 2, "unitPrice": 245000, "subtotal": 490000 }
  ],
  "subtotal": 620000,
  "taxAmount": 62000,
  "discountAmount": 20000,
  "totalAmount": 662000,
  "paymentMethod": "CASH",
  "amountPaid": 700000,
  "changeAmount": 38000,
  "notes": "Customer bought spare parts for Honda Beat"
}
```

---

## PATCH /transactions/{id}/status
Update transaction status
**Body**
```json
{ "status": "CANCELLED", "notes": "Customer requested cancellation - wrong item ordered" }
```

---

## GET /transactions
Get all transactions. Params: page, limit, search (invoice), branchId, cashierId, status, paymentMethod, startDate, endDate, sortBy, sortOrder

---

## GET /transactions/{id}
Get transaction by id

---

## GET /transactions/invoice/{invoiceNo}
Get transaction by invoice

---

## GET /transactions/stats/summary
Get transaction statistics