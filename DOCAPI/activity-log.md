# Activity Log Module

Base: /activity-logs
Protected: Authorization required

---

## GET /activity-logs/statistics
Params: userId, startDate, endDate
**Response**: activity statistics per user

---

## GET /activity-logs
Params: page, limit, search, userId, action, entityType, startDate, endDate
**Response**: paginated activity log entries

---

## GET /activity-logs/filters
Get available filters for logs

---

## GET /activity-logs/users/{userId}/summary
Get user activity summary (days param)

---

## GET /activity-logs/entities/{entityId}
Get history for entity

---

## GET /activity-logs/{id}
Get single activity log by id