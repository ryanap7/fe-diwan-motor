Sempurna ✅
Aku sudah membaca isi terbaru **HD MOTOPART.pdf** dan menemukan bagian baru untuk:
📦 **Product Management**, 🚚 **Supplier Management**, dan 👥 **Customer Management**.

Berikut dokumentasi `.md` lengkap — **langsung disusun dari PDF**, tanpa tambahan di luar data aslinya.

---

# 🧾 HD MOTOPART API Documentation

*Fokus: Product, Supplier, dan Customer Management*

---

## 📦 Product Management

### **GET /products**

**Deskripsi:**
Mengambil daftar produk.

**Headers**

```
Authorization: Bearer <access_token>
```

**Query Parameters**

| Nama          | Tipe    | Deskripsi                                                        |
| ------------- | ------- | ---------------------------------------------------------------- |
| `page`        | integer | Nomor halaman (min: 1)                                           |
| `limit`       | integer | Jumlah item per halaman (max: 100)                               |
| `search`      | string  | Cari berdasarkan nama, SKU, atau model kompatibel                |
| `categoryId`  | string  | Filter berdasarkan kategori                                      |
| `brandId`     | string  | Filter berdasarkan brand                                         |
| `isActive`    | boolean | Filter produk aktif                                              |
| `isFeatured`  | boolean | Filter produk unggulan                                           |
| `hasDiscount` | boolean | Filter produk dengan diskon                                      |
| `minPrice`    | number  | Harga jual minimum                                               |
| `maxPrice`    | number  | Harga jual maksimum                                              |
| `sortBy`      | string  | Urutkan berdasarkan (`name`, `sku`, `sellingPrice`, `createdAt`) |
| `sortOrder`   | string  | `asc` atau `desc`                                                |

---

### **POST /products**

**Deskripsi:**
Membuat produk baru.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "sku": "PROD-001",
  "barcode": "1234567890123",
  "name": "Laptop HP Pavilion",
  "description": "Laptop HP Pavilion 15 with Intel Core i5",
  "categoryId": "4f8161ee-ec60-4de2-a7bf-fa41dd0c4071",
  "brandId": "22d3179e-2b61-4d67-82f3-98f4d2397fea",
  "unit": "PCS",
  "compatibleModels": "HP Pavilion 15-eg0000",
  "purchasePrice": 7000000,
  "sellingPrice": 9000000,
  "wholesalePrice": 8500000,
  "minStock": 5,
  "weight": 2.5,
  "dimensions": {
    "length": 35,
    "width": 25,
    "height": 2
  },
  "specifications": {
    "processor": "Intel Core i5",
    "ram": "8GB",
    "storage": "512GB SSD"
  },
  "storageLocation": "Warehouse A - Rack 12",
  "tags": "laptop,computer,hp",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "mainImage": "https://example.com/main-image.jpg",
  "isActive": true,
  "isFeatured": true
}
```

---

### **PUT /products/{id}**

**Deskripsi:**
Memperbarui data produk.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "sku": "PROD-002",
  "barcode": "1234567890123",
  "name": "Laptop HP Pavilion 15",
  "description": "Updated description",
  "categoryId": "5af5f66c-792d-487c-907d-f67b0a8758f2",
  "brandId": "22d3179e-2b61-4d67-82f3-98f4d2397fea",
  "unit": "PCS",
  "compatibleModels": "HP Pavilion 15-eg0000, 15-eg1000",
  "purchasePrice": 7500000,
  "sellingPrice": 9500000,
  "wholesalePrice": 9000000,
  "minStock": 10,
  "weight": 2.6,
  "dimensions": {
    "length": 36,
    "width": 26,
    "height": 2.5
  },
  "specifications": {
    "processor": "Intel Core i5 11th Gen",
    "ram": "16GB",
    "storage": "512GB SSD"
  },
  "storageLocation": "Warehouse B - Rack 5",
  "tags": "laptop,computer,hp,updated",
  "images": [
    "https://example.com/new-image1.jpg"
  ],
  "mainImage": "https://example.com/new-main-image.jpg",
  "isActive": true,
  "isFeatured": false
}
```

---

### **GET /products/{id}**

**Deskripsi:**
Mengambil detail produk berdasarkan ID.

**Headers**

```
Authorization: Bearer <access_token>
```

---

### **PATCH /products/{id}/status**

**Deskripsi:**
Mengubah status aktif/nonaktif produk.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "isActive": false
}
```

---

### **PATCH /products/{id}/discount**

**Deskripsi:**
Menambahkan atau memperbarui diskon produk.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "discountPercent": 15
}
```

---

### **DELETE /products/{id}/discount**

**Deskripsi:**
Menghapus diskon dari produk.

**Headers**

```
Authorization: Bearer <access_token>
```

---

### **DELETE /products/{id}**

**Deskripsi:**
Menghapus produk.

**Headers**

```
Authorization: Bearer <access_token>
```

---

### **POST /products/{id}/images**

**Deskripsi:**
Mengunggah gambar produk.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data**

| Field       | Keterangan                            |
| ----------- | ------------------------------------- |
| `images`    | File gambar (maks 3 file)             |
| `setAsMain` | (boolean) true = jadikan gambar utama |

---

### **DELETE /products/{id}/images**

**Deskripsi:**
Menghapus gambar produk.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "imageUrl": "https://example.com/uploads/products/image.jpg"
}
```

---

### **PATCH /products/{id}/images/main**

**Deskripsi:**
Mengatur gambar utama produk.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "imageUrl": "https://example.com/uploads/products/main.jpg"
}
```

---

## 🚚 Supplier Management

### **GET /suppliers**

**Deskripsi:**
Mengambil daftar supplier.

**Headers**

```
Authorization: Bearer <access_token>
```

**Query Parameters**

| Nama        | Tipe    | Deskripsi                                     |
| ----------- | ------- | --------------------------------------------- |
| `page`      | integer | Nomor halaman                                 |
| `limit`     | integer | Jumlah item per halaman (maks 100)            |
| `search`    | string  | Cari berdasarkan nama, kontak, telepon, email |
| `isActive`  | boolean | Filter aktif/nonaktif                         |
| `sortBy`    | string  | Kolom urutan (`name`, `createdAt`)            |
| `sortOrder` | string  | Urutan (`asc`, `desc`)                        |

---

### **POST /suppliers**

**Deskripsi:**
Menambahkan supplier baru.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

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

### **GET /suppliers/{id}**

**Deskripsi:**
Mengambil data supplier berdasarkan ID.

**Headers**

```
Authorization: Bearer <access_token>
```

---

### **PUT /suppliers/{id}**

**Deskripsi:**
Memperbarui data supplier.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "name": "PT. Supplier Utama",
  "contactPerson": "Jane Doe",
  "phone": "021-98765432",
  "email": "newsupplier@example.com",
  "address": "Jl. Baru No. 456, Jakarta",
  "paymentTerms": "Net 45 days",
  "deliveryTerms": "CIF",
  "notes": "Updated notes",
  "isActive": true
}
```

---

### **PATCH /suppliers/{id}/status**

**Deskripsi:**
Mengubah status aktif/nonaktif supplier.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "isActive": true
}
```

---

### **DELETE /suppliers/{id}**

**Deskripsi:**
Menghapus supplier.

**Headers**

```
Authorization: Bearer <access_token>
```

---

## 👥 Customer Management

### **POST /customers**

**Deskripsi:**
Menambahkan customer baru.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

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

### **GET /customers**

**Deskripsi:**
Mengambil daftar pelanggan.

**Headers**

```
Authorization: Bearer <access_token>
```

---

### **GET /customers/{id}**

**Deskripsi:**
Mengambil detail customer berdasarkan ID.

**Headers**

```
Authorization: Bearer <access_token>
```

---

Apakah kamu mau saya jadikan file `.md` siap unduh (mis. `product_supplier_customer_api.md`)?
