Bagus — aku sudah membaca isi lengkap dari **HD MOTOPART.pdf** yang kamu kirim.
Berikut hasilnya dalam bentuk file dokumentasi **`dok.md`**, sudah disusun berdasarkan isi PDF **tanpa improvisasi**, lengkap dengan path, header, body, parameter, dan contoh request/response.

---

# HD MOTOPART API Documentation

Versi berdasarkan *Postman Collection* dari **HD MOTOPART.pdf**

---

## 📘 Daftar Isi

1. **Auth**

   * POST Login
   * POST Refresh Token
   * GET Profile
   * POST Logout
   * POST Logout All Devices
2. **User Management**

   * POST Create User
   * GET Get All Users
   * GET Get User by ID
   * PUT Update User
   * DELETE Delete User
3. **Branch Management**

   * POST Create Branch
   * POST Assign Manager to Branch
   * POST Assign Cashier to Branch
   * POST Activate Branch
   * POST Deactivate Branch
   * PATCH Update Branch
   * GET Get All Branches
   * GET Get Branch by ID

---

## ⚙️ Auth Endpoints

### **POST /auth/login**

**Header**

```
Content-Type: application/json
```

**Body**

```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**Response (200)**

```json
{
  "accessToken": "<token>",
  "refreshToken": "<token>"
}
```

---

### **POST /auth/refresh**

**Header**

```
Content-Type: application/json
```

**Body**

```json
{
  "refreshToken": "<refresh_token>"
}
```

**Response (200)**

```json
{
  "accessToken": "<new_access_token>",
  "refreshToken": "<new_refresh_token>"
}
```

---

### **GET /auth/profile**

**Header**

```
Authorization: Bearer <access_token>
```

**Response (200)**

```json
{
  "id": "uuid",
  "username": "admin",
  "email": "admin@company.com",
  "role": "ADMIN",
  "fullName": "Administrator"
}
```

---

### **POST /auth/logout**

**Header**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "refreshToken": "<refresh_token>"
}
```

**Response**

```json
{ "message": "Logged out successfully" }
```

---

### **POST /auth/logout-all**

**Header**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "refreshToken": "<refresh_token>"
}
```

**Response**

```json
{ "message": "Logged out from all devices" }
```

---

## 👤 User Management

### **POST /users — Create User**

**Header**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "username": "cah2",
  "password": "password123",
  "email": "manager.bandusn2g@company.com",
  "fullName": "New User Name",
  "phone": "081234567890",
  "role": "CASHIER",
  "isActive": true
}
```

**Response (201)**

```json
{
  "id": "uuid",
  "username": "cah2",
  "role": "CASHIER",
  "isActive": true
}
```

---

### **GET /users — Get All Users**

**Header**

```
Authorization: Bearer <access_token>
```

**Query Params**

| Nama     | Deskripsi                        |
| -------- | -------------------------------- |
| page     | Halaman (default 1)              |
| limit    | Jumlah per halaman (default 10)  |
| search   | Cari username/email/fullName     |
| role     | ADMIN | CASHIER | BRANCH_MANAGER |
| branchId | Filter berdasarkan branch UUID   |
| isActive | true/false                       |

**Contoh Request**

```
GET /users?page=1&limit=10&role=CASHIER&isActive=true
```

**Response (200)**

```json
{
  "data": [
    {
      "id": "uuid",
      "username": "cah2",
      "email": "manager.bandusn2g@company.com",
      "role": "CASHIER",
      "isActive": true
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 25
}
```

---

### **GET /users/{id} — Get User by ID**

**Header**

```
Authorization: Bearer <access_token>
```

**Response**

```json
{
  "id": "uuid",
  "username": "user1",
  "email": "user1@company.com",
  "role": "CASHIER",
  "isActive": true
}
```

---

### **PUT /users/{id} — Update User**

**Header**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "username": "updated_username",
  "password": "newpassword",
  "email": "updated@company.com",
  "fullName": "Updated Name",
  "phone": "081234567890",
  "role": "BRANCH_MANAGER",
  "isActive": true
}
```

**Response**

```json
{
  "id": "uuid",
  "username": "updated_username",
  "role": "BRANCH_MANAGER",
  "isActive": true
}
```

---

### **DELETE /users/{id} — Delete User**

**Header**

```
Authorization: Bearer <access_token>
```

**Response**

```json
{ "message": "User deleted successfully" }
```

---

## 🏢 Branch Management

### **POST /branches — Create Branch**

**Header**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "code": "JKT-002",
  "name": "Cabang Jakarta Selatan",
  "address": "Jl. TB Simatupang No. 123, Jakarta Selatan",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12430",
  "phone": "0217890123",
  "email": "jaksel@company.com",
  "operatingHours": {
    "monday": { "open": "08:00", "close": "17:00", "closed": false },
    "tuesday": { "open": "08:00", "close": "17:00", "closed": false },
    "wednesday": { "open": "08:00", "close": "17:00", "closed": false },
    "thursday": { "open": "08:00", "close": "17:00", "closed": false },
    "friday": { "open": "08:00", "close": "17:00", "closed": false },
    "saturday": { "open": "09:00", "close": "15:00", "closed": false },
    "sunday": { "open": "00:00", "close": "00:00", "closed": true }
  },
  "notes": "Cabang baru di Jakarta Selatan"
}
```

---

### **POST /branches/{id}/assign-manager**

**Header**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "userId": "110ef02d-36fc-481c-8058-00c861d2c20a"
}
```

**Response**

```json
{ "message": "Manager assigned successfully" }
```

---

### **POST /branches/{id}/assign-cashier**

**Header**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "userId": "bfa82f21-20ed-47c5-9c23-536c6f9417b7"
}
```

**Response**

```json
{ "message": "Cashier assigned successfully" }
```

---

### **POST /branches/{id}/activate**

**Header**

```
Authorization: Bearer <access_token>
```

**Response**

```json
{ "message": "Branch activated successfully" }
```

---

### **POST /branches/{id}/deactivate**

**Header**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "reason": "Renovasi gedung untuk 2 bulan ke depan"
}
```

**Response**

```json
{ "message": "Branch deactivated successfully" }
```

---

### **PATCH /branches/{id} — Update Branch**

**Header**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**

```json
{
  "name": "Cabang Jakarta Selatan",
  "address": "Jl. TB Simatupang No. 123, Jakarta Selatan",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12430",
  "phone": "0217890123",
  "email": "jakarta@company.com",
  "operatingHours": {
    "monday": { "open": "08:00", "close": "17:00", "closed": false },
    "tuesday": { "open": "08:00", "close": "17:00", "closed": false },
    "wednesday": { "open": "08:00", "close": "17:00", "closed": false },
    "thursday": { "open": "08:00", "close": "17:00", "closed": false },
    "friday": { "open": "08:00", "close": "17:00", "closed": false },
    "saturday": { "open": "09:00", "close": "15:00", "closed": false },
    "sunday": { "open": "00:00", "close": "00:00", "closed": true }
  },
  "notes": "Cabang baru di Jakarta Selatan"
}
```

---

### **GET /branches — Get All Branches**

**Header**

```
Authorization: Bearer <access_token>
```

**Query Params**

| Nama     | Deskripsi                       |
| -------- | ------------------------------- |
| page     | Halaman (default 1)             |
| limit    | Jumlah per halaman (default 10) |
| status   | ACTIVE/INACTIVE                 |
| search   | Kata kunci                      |
| city     | Filter kota                     |
| province | Filter provinsi                 |
| isActive | true/false                      |

**Contoh**

```
GET /branches?page=1&limit=10&status=ACTIVE&search=jakarta&city=Jakarta&province=DKI Jakarta&isActive=true
```

**Response**

```json
{
  "data": [
    {
      "id": "uuid",
      "code": "JKT-002",
      "name": "Cabang Jakarta Selatan",
      "city": "Jakarta",
      "isActive": true
    }
  ]
}
```

---

### **GET /branches/{id} — Get Branch by ID**

**Header**

```
Authorization: Bearer <access_token>
```

**Response**

```json
{
  "id": "uuid",
  "code": "JKT-002",
  "name": "Cabang Jakarta Selatan",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "isActive": true,
  "manager": { "id": "uuid", "fullName": "Manager Name" },
  "cashiers": [
    { "id": "uuid", "fullName": "Cashier 1" },
    { "id": "uuid", "fullName": "Cashier 2" }
  ]
}
```

---

Apakah kamu mau saya ubah dokumen ini jadi file `.md` siap unduh (mis. `hd-motopart-api.md`)?
Kalau iya, saya bisa langsung buatkan file-nya dari hasil di atas.
