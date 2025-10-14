# User Management Module

Base: /users

Protected: Authorization required (Bearer token)

---

## POST /users
Create new user (admin)
**Headers**
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
{ "id": "uuid", "username": "cah2", "role": "CASHIER", "isActive": true }
```

---

## GET /users
Get all users with pagination & filters
**Query params**
- page (default 1)
- limit (default 10)
- search (username | email | fullName)
- role (ADMIN|CASHIER|BRANCH_MANAGER)
- branchId (UUID)
- isActive (true|false)

**Response (200)**
```json
{
  "data": [ { "id": "uuid", "username": "cah2", "email": "...", "role": "CASHIER" } ],
  "page": 1,
  "limit": 10,
  "total": 25
}
```

---

## GET /users/{id}
Get user by id
**Response (200)**
```json
{ "id":"uuid","username":"user1","email":"user1@company.com","role":"CASHIER","isActive":true }
```

---

## PUT /users/{id}
Update user
**Body** (example)
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

---

## DELETE /users/{id}
Delete user
**Response**
```json
{ "message": "User deleted successfully" }
```