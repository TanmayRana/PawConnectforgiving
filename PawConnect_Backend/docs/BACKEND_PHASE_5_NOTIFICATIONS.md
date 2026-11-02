# PawConnect Backend — Phase 5: Notification System Specification

This document provides complete documentation for the Phase 5 Notification Architecture in the PawConnect Spring Boot backend. The system provides persistent in-app notifications with deduplication, read-state tracking, pagination, and maintainable delivery abstractions for email and SMS channels with non-blocking error isolation.

---

## 1. Overview & Architecture

### Architectural Goals
1. **Persistent In-App Notifications**: All business-critical events are persisted in the PostgreSQL/JPA database and accessible to authenticated users via paginated APIs.
2. **Event Deduplication**: Implements idempotent emission using deterministic `dedupeKey` tokens to prevent duplicate customer notifications caused by retries, repeated webhooks, or repeated API calls.
3. **Pluggable Channel Abstractions**: Clean service interfaces (`EmailService` and `SmsService`) backed by configuration-driven implementations.
4. **Resilient Transaction Isolation**: External channel failures (such as email server timeouts or SMS provider outages) are safely caught and logged. They **never** roll back committed business transactions (such as order checkout, payment verification, or in-app notification persistence).
5. **Privacy & Security**: Credentials and personal data are never hardcoded or leaked into system logs.

---

## 2. In-App Notification APIs

All customer notification endpoints require authentication and resolve the recipient exclusively from the JWT security context (`currentUserService.getCurrentUserId()`). Cross-user access is strictly forbidden.

### 2.1 List User Notifications
- **Method**: `GET`
- **Path**: `/api/me/notifications` (and `/api/notifications`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:
  - `unreadOnly` *(optional, boolean)*: When `true`, filters only unread notifications (`isRead = false`).
  - `page` *(optional, default 0)*: Zero-based page number.
  - `size` *(optional, default 20, max 100)*: Items per page.
  - `sort` *(optional, default `createdAt,desc`)*: Sort order.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Operation completed successfully",
  "data": {
    "content": [
      {
        "id": 105,
        "notificationType": "ORDER_CREATED",
        "title": "Order Placed Successfully",
        "message": "Your order ORD-38151270-C0EA for INR 1499.00 has been placed successfully.",
        "referenceType": "ORDER",
        "referenceId": 42,
        "isRead": false,
        "readAt": null,
        "createdAt": "2026-10-10T18:45:51.280Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true,
    "empty": false
  }
}
```

### 2.2 Get Unread Notification Count
- **Method**: `GET`
- **Path**: `/api/me/notifications/unread-count` (and `/api/notifications/unread-count`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "data": {
    "unreadCount": 3
  }
}
```

### 2.3 Mark Single Notification as Read
- **Method**: `PATCH`
- **Path**: `/api/me/notifications/{notificationId}/read` (and `/api/notifications/{notificationId}/read`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Behavior**: Verifies that the notification belongs to the authenticated user. If owned, sets `isRead = true` and `readAt = LocalDateTime.now()`. If not owned by user, returns HTTP 403 Forbidden. If not found, returns HTTP 404 Not Found.

### 2.4 Mark All Notifications as Read
- **Method**: `PATCH`
- **Path**: `/api/me/notifications/read-all` (and `/api/notifications/read-all`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Behavior**: Executes a bulk update query in the repository:
  ```sql
  UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = :userId AND is_read = false
  ```
  Returns HTTP 200 OK.

### 2.5 Delete Notification
- **Method**: `DELETE`
- **Path**: `/api/me/notifications/{notificationId}` (and `/api/notifications/{notificationId}`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Behavior**: Verifies ownership and deletes the specified in-app notification.

---

## 3. Deduplication Strategy

To guarantee idempotency across network retries, parallel consumers, and repeated payment gateway webhooks, every notification emitted by domain services includes a deterministic `dedupeKey`.

### Deduplication Key Patterns
| Domain Event | Deterministic Key Pattern | Example |
|---|---|---|
| Order Created | `NOTIF-ORDER-{orderId}-CREATED` | `NOTIF-ORDER-42-CREATED` |
| Payment Success | `NOTIF-ORDER-{orderId}-PAID` | `NOTIF-ORDER-42-PAID` |
| Order Cancelled | `NOTIF-ORDER-{orderId}-CANCELLED` | `NOTIF-ORDER-42-CANCELLED` |
| Order Status Change | `NOTIF-ORDER-{orderId}-{STATUS}` | `NOTIF-ORDER-42-SHIPPED` |

### Invariant Guarantee:
Before persisting any notification, `NotificationServiceImpl` checks:
```java
if (dedupeKey != null && !dedupeKey.isBlank()) {
    Optional<Notification> existing = notificationRepository.findByDedupeKey(dedupeKey);
    if (existing.isPresent()) {
        log.info("Duplicate notification ignored for dedupeKey: {}", dedupeKey);
        return notificationMapper.toResponse(existing.get());
    }
}
```
If a duplicate request is received, the method returns the existing record immediately without inserting a duplicate or triggering duplicate email/SMS dispatch.

---

## 4. Email and SMS Channel Abstractions

### Service Interfaces
- `com.example.PawConnect.service.EmailService`:
  ```java
  public interface EmailService {
      void sendEmail(String toEmail, String subject, String body);
  }
  ```
- `com.example.PawConnect.service.SmsService`:
  ```java
  public interface SmsService {
      void sendSms(String phoneNumber, String message);
  }
  ```

### Development & Test Adapters (`DevEmailServiceImpl` & `DevSmsServiceImpl`)
In development and test environments, `DevEmailServiceImpl` and `DevSmsServiceImpl` provide:
- **In-Memory Tracking**: Captures dispatched messages in thread-safe collections (`getSentEmails()`, `getSentSms()`) for test verification.
- **Privacy Masking**: Email addresses and phone numbers are automatically masked in log outputs (e.g., `a***f@test.com`, `+91*****43210`) to prevent PII exposure in logs.
- **Configurable Channel Toggles**: Configured via `application.yaml`:
  ```yaml
  notification:
    email:
      enabled: false
    sms:
      enabled: false
  ```
- **Failure Simulation**: Exposes `setSimulateFailure(true)` for integration tests to verify exception isolation without external network calls.

---

## 5. Non-Blocking Error Isolation

External notification dispatch is decoupled from transactional data persistence. In `NotificationServiceImpl`:

```java
private void tryDispatchExternalChannels(User user, String title, String message) {
    try {
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendEmail(user.getEmail(), title, message);
        }
    } catch (Exception ex) {
        log.error("Email notification dispatch error: {}", ex.getMessage());
    }

    try {
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            smsService.sendSms(user.getPhone(), message);
        }
    } catch (Exception ex) {
        log.error("SMS notification dispatch error: {}", ex.getMessage());
    }
}
```

### Reliability Guarantee:
- A failure during email SMTP dispatch or SMS gateway invocation does **not** cause an exception to escape.
- The order creation, payment verification, and in-app notification records remain securely committed in the database.
