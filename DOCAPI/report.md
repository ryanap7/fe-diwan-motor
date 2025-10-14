# Reports Module

Base: /reports
Protected: Authorization required

---

## GET /reports/sales/summary
Params: startDate, endDate, branchId
**Response**: sales totals summary

---

## GET /reports/sales/top-products
Params: startDate, endDate, branchId
**Response**: top products list

---

## GET /reports/sales/slow-moving?daysThreshold={n}
Params: daysThreshold, branchId
**Response**: slow moving products

---

## GET /reports/sales/by-category
Params: startDate, endDate, branchId
**Response**: sales by category

---

## GET /reports/sales/cashier-performance
Params: startDate, endDate, branchId
**Response**: cashier performance metrics

---

## Inventory reports
- /reports/inventory/summary
- /reports/inventory/low-stock (params: branchId, threshold)
- /reports/inventory/dead-stock (params: daysThreshold, branchId)
- /reports/inventory/stock-valuation