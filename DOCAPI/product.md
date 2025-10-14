# Product Management Module

Base: /products
Protected: Authorization required

---

## GET /products
Query params:
page, limit (max 100), search (name | SKU | compatibleModels), categoryId, brandId, isActive, isFeatured, hasDiscount, minPrice, maxPrice, sortBy, sortOrder

---

## POST /products
Create product
**Body** (example)
```json
{
  "sku": "PROD-001",
  "barcode": "1234567890123",
  "name": "Laptop HP Pavilion",
  "description": "Laptop HP Pavilion 15 with Intel Core i5",
  "categoryId": "1eb70ae6-23f0-4849-9d42-3664de2802b5",
  "brandId": "2d90dad0-4279-42d5-a9ac-97321f1e586e",
  "unit": "PCS",
  "compatibleModels": "HP Pavilion 15-eg0000",
  "purchasePrice": 7000000,
  "sellingPrice": 9000000,
  "wholesalePrice": 8500000,
  "minStock": 5,
  "weight": 2.5,
  "dimensions": { "length": 35, "width": 25, "height": 2 },
  "specifications": { "processor": "Intel Core i5", "ram": "8GB", "storage": "512GB SSD" },
  "storageLocation": "Warehouse A - Rack 12",
  "tags": "laptop,computer,hp",
  "images": ["https://example.com/image1.jpg"],
  "mainImage": "https://example.com/main-image.jpg",
  "isActive": true,
  "isFeatured": true
}
```

---

## PUT /products/{id}
Update product (body same as create but full)

---

## GET /products/{id}
Get product by id

---

## PATCH /products/{id}/status
Toggle product isActive
**Body**
```json
{ "isActive": false }
```

---

## PATCH /products/{id}/discount
Add/update discount
**Body**
```json
{ "discountPercent": 15 }
```

---

## DELETE /products/{id}/discount
Remove discount

---

## DELETE /products/{id}
Delete product

---

## POST /products/{id}/images
Upload images (multipart/form-data)
- images: file[] (max 3)
- setAsMain: boolean

---

## DELETE /products/{id}/images
Delete image
**Body**
```json
{ "imageUrl": "https://example.com/uploads/products/image.jpg" }
```

---

## PATCH /products/{id}/images/main
Set main image
**Body**
```json
{ "imageUrl": "https://example.com/uploads/products/main.jpg" }
```