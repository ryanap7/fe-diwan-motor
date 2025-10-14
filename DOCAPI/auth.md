# Auth Module

Base: /auth

All requests and responses use JSON unless noted. Protected endpoints require header:
```
Authorization: Bearer <access_token>
```

---

## POST /auth/login
**Headers**
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
**Sample Response (200)**
```json
{
  "accessToken": "<token>",
  "refreshToken": "<refresh_token>"
}
```

---

## POST /auth/refresh
**Headers**
```
Content-Type: application/json
```
**Body**
```json
{ "refreshToken": "<refresh_token>" }
```
**Sample Response (200)**
```json
{ "accessToken": "<new_access_token>", "refreshToken": "<new_refresh_token>" }
```

---

## GET /auth/profile
**Headers**
```
Authorization: Bearer <access_token>
```
**Sample Response (200)**
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

## POST /auth/logout
**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
**Body**
```json
{ "refreshToken": "<refresh_token>" }
```
**Response**
```json
{ "message": "Logged out successfully" }
```

---

## POST /auth/logout-all
**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
**Body**
```json
{ "refreshToken": "<refresh_token>" }
```
**Response**
```json
{ "message": "Logged out from all devices" }
```