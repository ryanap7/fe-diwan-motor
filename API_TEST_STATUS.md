# API Test dengan JWT Token

Token yang digunakan:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDA2MTEsImV4cCI6MTc2MTA0NTQxMX0.wC6ne1OZqTzzc4qXZqjQH-XejdxTBAfXt7BibF_Bhic
```

## Status Komponen yang Sudah Diupdate:

✅ **ProductManagement.jsx** - JWT token sudah diset, import dari @/lib/api
✅ **CustomerManagement.jsx** - JWT token sudah diset, import dari @/lib/api
✅ **SupplierManagement.jsx** - JWT token sudah diset, import dari @/lib/api (completed sebelumnya)
✅ **CategoryManagement.jsx** - JWT token sudah diset, import dari @/lib/api
✅ **BrandManagement.jsx** - JWT token sudah diset, import dari @/lib/api
✅ **UserManagement.jsx** - JWT token sudah diset, import dari @/lib/api
✅ **BranchManagement.jsx** - JWT token sudah diset, import dari @/lib/api
✅ **POSKasir.jsx** - Syntax error fixed, menggunakan JWT token
✅ **lib/api.js** - setDevToken function sudah ditambahkan

## Cara Test API Endpoint:

1. Buka aplikasi Next.js di browser (http://localhost:3000)
2. Buka Developer Tools Console
3. Jalankan perintah ini untuk test masing-masing API:

```javascript
// Test Products API
fetch('https://api.diwanmotor.com/api/products', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDA2MTEsImV4cCI6MTc2MTA0NTQxMX0.wC6ne1OZqTzzc4qXZqjQH-XejdxTBAfXt7BibF_Bhic',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);

// Test Categories API
fetch('https://api.diwanmotor.com/api/categories', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDA2MTEsImV4cCI6MTc2MTA0NTQxMX0.wC6ne1OZqTzzc4qXZqjQH-XejdxTBAfXt7BibF_Bhic',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);

// Test Auth Profile
fetch('https://api.diwanmotor.com/api/auth/profile', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDA2MTEsImV4cCI6MTc2MTA0NTQxMX0.wC6ne1OZqTzzc4qXZqjQH-XejdxTBAfXt7BibF_Bhic',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

## Komponen yang Siap Ditest:

Semua komponen sekarang menggunakan JWT token yang valid dan struktur API yang konsisten. Untuk test:

1. **Jalankan aplikasi**: `npm run dev`
2. **Navigasi ke halaman**: 
   - http://localhost:3000/products (ProductManagement)
   - http://localhost:3000/customers (CustomerManagement) 
   - http://localhost:3000/categories (CategoryManagement)
   - http://localhost:3000/brands (BrandManagement)
   - http://localhost:3000/users (UserManagement)
   - http://localhost:3000/branches (BranchManagement)
3. **Cek Console** untuk melihat API calls dan responses
4. **Test CRUD operations** di masing-masing halaman

## Next Steps:

Semua komponen sudah ready dengan JWT token. Tinggal test functionality dan pastikan semua endpoint merespons dengan benar.