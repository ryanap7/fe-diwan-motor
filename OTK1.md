# Stocks API

Dokumentasi singkat untuk endpoint stocks pada API.

> Semua endpoint membutuhkan header `Authorization: Bearer <token>`.

---

## Ringkasan Endpoint
- `POST /stocks/adjust/` — Adjust (tambah/kurangi) stok di suatu branch untuk suatu product.
- `POST /stocks/transfer/` — Transfer stok antar branch.
- `GET  /stocks/product/` — Dapatkan data stok berdasarkan productId (stocks by branch dan totalStock).

---

## Header Umum
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 1) Adjust Stock
**URL**: `/stocks/adjust/`  
**Method**: `POST`

### Deskripsi
Menambah atau mengurangi kuantitas stok untuk sebuah product pada branch tertentu.

### Body (JSON)
Contoh request body:
```json
{
  "branchId": "bd23cce8-519f-42eb-8d07-10f63e0a0e12",
  "quantity": -9,
  "type": "OUT",
  "reason": "Purchase order received",
  "notes": "PO-2025-001 received from supplier"
}
```
**Field**:
- `branchId` (string, required) — UUID cabang.
- `quantity` (integer, required) — angka positif untuk penambahan, negatif untuk pengurangan.
- `type` (string, required) — contoh: `IN` atau `OUT`.
- `reason` (string, optional) — alasan penyesuaian.
- `notes` (string, optional) — catatan tambahan.

### Contoh cURL
```bash
curl --location '/stocks/adjust/' \
  --header 'Authorization: Bearer <token>' \
  --data '{
    "branchId": "2b1c404e-cfec-4627-961b-af2d0644a2db",
    "quantity": 10,
    "type": "IN",
    "reason": "Purchase order received",
    "notes": "PO-2025-001 received from supplier"
  }'
```

### Contoh Response (200 OK)
```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "_id": "fefa6ae4-d3cb-4e50-95d0-980f1b02694a",
    "productId": "971ffb4f-c7b3-49a7-a836-06966e4fb242",
    "branchId": "2b1c404e-cfec-4627-961b-af2d0644a2db",
    "quantity": 10,
    "isLowStock": false,
    "lastRestockDate": "2025-10-13T21:23:14.519Z"
  }
}
```

### Catatan/Error
- Pastikan `branchId` valid.
- `quantity` dapat bernilai negatif untuk `OUT`.

---

## 2) Transfer Stock Between Branches
**URL**: `/stocks/transfer/`  
**Method**: `POST`

### Deskripsi
Memindahkan jumlah stok dari satu branch (`fromBranchId`) ke branch lain (`toBranchId`).

### Body (JSON)
Contoh request body:
```json
{
  "fromBranchId": "2b1c404e-cfec-4627-961b-af2d0644a2db",
  "toBranchId": "57488464-2c00-496f-94d1-16532852a959",
  "quantity": 8,
  "notes": "PO-2025-001 received from supplier"
}
```
**Field**:
- `fromBranchId` (string, required) — UUID cabang asal.
- `toBranchId` (string, required) — UUID cabang tujuan.
- `quantity` (integer, required) — jumlah unit yang ditransfer (harus > 0).
- `notes` (string, optional) — catatan.

### Contoh cURL
```bash
curl --location '/stocks/transfer/' \
  --header 'Authorization: Bearer <token>' \
  --data '{
    "fromBranchId": "2b1c404e-cfec-4627-961b-af2d0644a2db",
    "toBranchId": "2b1c404e-cfec-4627-961b-af2d0644a2db",
    "quantity": 12,
    "notes": "PO-2025-001 received from supplier"
  }'
```

### Contoh Response (400 Bad Request - example)
Jika terjadi transfer tidak valid (mis. dari dan ke branch sama):
```json
{
  "success": false,
  "message": "Cannot transfer to the same branch",
  "meta": { "timestamp": "2025-10-13T21:28:46.454Z" },
  "code": "INVALID_TRANSFER"
}
```

### Catatan/Error
- Validasi: `fromBranchId` != `toBranchId`.
- Pastikan `fromBranchId` memiliki stok yang cukup sebelum memproses transfer.
- `quantity` harus positif.

---

## 3) Get Stock by Product ID
**URL**: `/stocks/product/`  
**Method**: `GET`

### Deskripsi
Mengambil detail stok untuk suatu produk, termasuk total stok dan daftar `stocksByBranch`.

### Header
Gunakan header `Authorization: Bearer <token>`.

### Contoh Response (200 OK)
```json
{
  "success": true,
  "message": "Product stock details retrieved successfully",
  "data": {
    "productId": "2f47e116-817e-45ca-9c0a-aaca3b3a97ed",
    "totalStock": 0,
    "stocksByBranch": [
      {
        "branchId": "2b1c404e-cfec-4627-961b-af2d0644a2db",
        "branchName": "Cabang Jakarta Pusat",
        "quantity": 0
      }
    ]
  }
}
```

### Query/Path
- Endpoint pada screenshot tampak tanpa path parameter; implementasi umum:
  - `GET /stocks/product/?productId=<productId>` atau
  - `GET /stocks/product/:productId`  
  Sesuaikan dengan implementasi API Anda.

---

## Response Format Umum
- `success` (boolean)
- `message` (string)
- `data` (object | array | null)
- `meta` (object, optional) — untuk tambahan seperti `timestamp`, pagination, dll.
- `code` (string, optional) — kode error pada kegagalan.

---

## Contoh Alur Singkat
1. Cek stok produk: `GET /stocks/product/?productId=...`.
2. Jika perlu menambah stok pada branch A: `POST /stocks/adjust/` with `type: IN`.
3. Jika perlu memindahkan stok dari branch A ke branch B: `POST /stocks/transfer/`.

---

## Catatan Implementasi
- Semua operasi yang merubah stok harus dijalankan dalam transaksi/lock untuk menghindari race conditions.
- Validasi input: UUID, nilai integer untuk `quantity`, dan izin user (role-based access) harus diperiksa.
- Berikan audit log untuk setiap penyesuaian/transfer (user, timestamp, reason/notes).

---

Jika Anda mau, saya bisa juga membuat versi README bahasa Inggris atau menambahkan contoh response lengkap untuk kasus error lain (insufficient stock, invalid branch, missing fields, dll.).
