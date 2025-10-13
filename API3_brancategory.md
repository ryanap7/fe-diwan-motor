Baik 👍 berikut adalah dokumentasi **fokus pada dua bagian baru** dari PDF kamu —
📦 **Category Management** dan 🏷️ **Brand Management** — disusun **langsung dari data PDF HD MOTOPART** (tanpa tambahan fiktif), dengan format `.md` yang siap kamu pakai untuk dokumentasi API internal.

---

# 🗂️ HD MOTOPART API — Category & Brand Management

---

## 📦 Category Management

### **GET /categories**

**Deskripsi:**
Mengambil daftar semua kategori produk.

**Headers**

```
Authorization: Bearer <access_token>
```

**Query Parameters**

| Nama        | Tipe    | Default | Keterangan                                   |
| ----------- | ------- | ------- | -------------------------------------------- |
| `page`      | integer | 1       | Nomor halaman                                |
| `limit`     | integer | 10      | Jumlah item per halaman                      |
| `isActive`  | boolean | —       | Filter kategori aktif / nonaktif             |
| `sortBy`    | string  | name    | Urut berdasarkan kolom (`name`, `createdAt`) |
| `sortOrder` | string  | asc     | Urutan hasil (`asc`, `desc`)                 |

**Contoh Request**

```
GET /categories?page=1&limit=10&isActive=true&sortBy=name&sortOrder=asc
```

---

### **GET /categories/roots**

**Deskripsi:**
Mengambil hanya kategori induk (root categories).

**Headers**

```
Authorization: Bearer <access_token>
```

---

### **GET /categories/{id}**

**Deskripsi:**
Mengambil detail kategori berdasarkan ID.

**Headers**

```
Authorization: Bearer <access_token>
```

---

### **POST /categories**

**Deskripsi:**
Membuat kategori baru.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

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

### **PUT /categories/{id}**

**Deskripsi:**
Memperbarui data kategori yang ada.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "name": "Mesin",
  "parentId": "a6330c5c-1b51-4946-838f-dd08d6dbdbe3",
  "description": "Aki, busi, CDI, lampu",
  "sortOrder": 4,
  "icon": "electric-icon",
  "isActive": true
}
```

---

### **PATCH /categories/{id}/status**

**Deskripsi:**
Mengaktifkan atau menonaktifkan kategori.

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

### **DELETE /categories/{id}?cascade=false**

**Deskripsi:**
Menghapus kategori berdasarkan ID.
Jika `cascade=true`, maka subkategori ikut dihapus.

**Headers**

```
Authorization: Bearer <access_token>
```

**Query Parameter**

| Nama      | Tipe    | Default | Keterangan                       |
| --------- | ------- | ------- | -------------------------------- |
| `cascade` | boolean | false   | Hapus subkategori juga jika true |

---

## 🏷️ Brand Management

### **GET /brands**

**Deskripsi:**
Mengambil daftar semua brand/merk.

**Headers**

```
Authorization: Bearer <access_token>
```

**Query Parameters**

| Nama        | Tipe    | Default   | Keterangan                             |
| ----------- | ------- | --------- | -------------------------------------- |
| `page`      | integer | 1         | Nomor halaman                          |
| `limit`     | integer | 10        | Jumlah data per halaman (maks. 100)    |
| `search`    | string  | —         | Pencarian pada nama/description        |
| `isActive`  | boolean | —         | Filter brand aktif / nonaktif          |
| `sortBy`    | string  | createdAt | Kolom pengurutan (`name`, `createdAt`) |
| `sortOrder` | string  | desc      | Urutan hasil (`asc` / `desc`)          |

**Contoh**

```
GET /brands?page=1&limit=10&isActive=true&sortBy=name&sortOrder=asc
```

---

### **GET /brands/{id}**

**Deskripsi:**
Mengambil detail brand berdasarkan ID.

**Headers**

```
Authorization: Bearer <access_token>
```

---

### **POST /brands**

**Deskripsi:**
Membuat brand baru.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "name": "Nokia",
  "description": "Korean electronics brand",
  "isActive": true
}
```

---

### **PUT /brands/{id}**

**Deskripsi:**
Memperbarui data brand.

**Headers**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "name": "Nokia",
  "description": "Updated description for Samsung",
  "isActive": true
}
```

---

### **PATCH /brands/{id}/status**

**Deskripsi:**
Mengubah status aktif/nonaktif brand.

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

### **DELETE /brands/{id}**

**Deskripsi:**
Menghapus brand berdasarkan ID.

**Headers**

```
Authorization: Bearer <access_token>
```

---

## 🧩 Catatan Umum

* Semua endpoint memerlukan token Bearer kecuali `/auth/login` dan `/auth/refresh`.
* Gunakan format JSON untuk semua request body.
* Field `isActive` digunakan secara konsisten untuk menandai status aktif pada **kategori** dan **brand**.
* Parameter `page` dan `limit` digunakan untuk pagination.

---

Apakah kamu ingin saya ubah hasil di atas menjadi file **`category_brand_api.md`** agar bisa langsung kamu unduh?
