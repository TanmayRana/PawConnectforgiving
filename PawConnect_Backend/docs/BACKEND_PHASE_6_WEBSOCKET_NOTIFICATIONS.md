# PawConnect Backend — Phase 6: WebSocket/STOMP & Real-Time Notifications Specification

This document provides complete technical documentation for the Phase 6 Real-Time Notification Delivery architecture in the PawConnect Spring Boot backend. The system layers WebSocket/STOMP messaging over the existing persistent notification system (Phase 5), ensuring private, authenticated, event-driven notification dispatch after database transaction commits with zero business transaction rollbacks.

---

## 1. Overview & Architecture

### 1.1 Architectural Goals
1. **Source of Truth**: The database (`Notification` entity) remains the authoritative source of truth. Real-time messages are delivery signals, not read receipts.
2. **Transaction-Bound Dispatch**: Real-time notifications are published **only after** the underlying business transaction commits (`@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`). If a business transaction rolls back, no WebSocket message is dispatched.
3. **Decoupled & Isolated**: WebSocket dispatch failures (e.g. client disconnect, broker timeout) are safely caught and logged. They **never** cause transaction rollbacks or affect business operations.
4. **Strict Authentication & Security**: STOMP `CONNECT` frames are authenticated using the existing `JwtService`. Revoked, expired, malformed, or refresh tokens are rejected.
5. **Private User Destination Isolation**: Clients can only subscribe to their own private queue (`/user/queue/notifications`). Cross-user eavesdropping, public broadcasts, and client-to-server publishing (`SEND`) are strictly denied.
6. **Reliable Client Fallback**: A documented Next.js reconnection contract ensures client state reconciliation via authoritative REST APIs (`GET /api/me/notifications` and `GET /api/me/notifications/unread-count`).
7. **Safe Payloads**: WebSocket payloads use a dedicated DTO (`RealtimeNotificationPayload`) omitting passwords, gateway secrets, audit metadata, and sensitive medical notes.

### 1.2 Message Flow Diagram

```text
+------------------------------------------------------------------------------------+
|                               REST Business Flow                                   |
|                                                                                    |
|  [REST Request] ---> [Service Method] ---> [notificationRepository.save(notif)]    |
|                             |                              |                       |
|                             |                     [publishEvent(Event)]            |
|                             v                              |                       |
|                   [Transaction Commits]                    |                       |
+-----------------------------|------------------------------|-----------------------+
                              |                              |
                              +--------------+---------------+
                                             |
                                             v (AFTER_COMMIT)
                              [NotificationEventListener]
                                             |
                                             v
                           [WebSocketNotificationPublisher]
                                             |
                                             v
                              [SimpMessagingTemplate]
                                             |
                                             v
                       /user/{userEmail}/queue/notifications
                                             |
                                             v
                              [Authenticated WebSocket Client]
```

---

## 2. WebSocket & STOMP Infrastructure

### 2.1 Endpoint Configuration
- **WebSocket Endpoint**: `/ws`
- **Transport Protocols**:
  - Raw WebSocket (`ws://` / `wss://`)
  - SockJS fallback (`http://` / `https://` with long polling, xhr-streaming, iframe)
- **Security HTTP Permit**: `/ws/**` is explicitly allowed in `SecurityConfig.java` to permit browser handshake requests without cookie or basic auth barriers. Protocol-level authentication is enforced upon the first STOMP frame.
- **Allowed Origins**: Explicitly driven by `${application.cors.allowed-origins:http://localhost:3000}`. Wildcard `*` is prohibited in production.

### 2.2 Message Broker Topology
- **Broker Type**: Spring In-Memory Simple Broker (`registry.enableSimpleBroker("/queue", "/topic")`).
- **User Destination Prefix**: `/user` (used by Spring's `UserDestinationMessageHandler` to route to user-specific sessions).
- **Application Destination Prefix**: `/app` (closed to arbitrary client publishing).

---

## 3. STOMP CONNECT JWT Authentication

Browser WebSocket handshakes cannot reliably transmit arbitrary HTTP headers. Therefore, authentication occurs during the STOMP `CONNECT` protocol handshake.

### 3.1 Authentication Workflow
1. Client establishes the WebSocket connection to `/ws`.
2. Client sends a STOMP `CONNECT` frame containing:
   ```text
   CONNECT
   accept-version:1.2,1.1,1.0
   heart-beat:10000,10000
   Authorization:Bearer <jwt_access_token>

   ^@
   ```
3. `StompChannelInterceptor` intercepts the frame on `clientInboundChannel`.
4. Token validation pipeline:
   - Header validation: Verifies `Authorization` native header starts with `Bearer `.
   - Token type verification: Strictly checks `token_type == "ACCESS"`. If `token_type == "REFRESH"`, the connection is rejected.
   - User identity extraction: Extracts subject (email) using `jwtService.extractUsername()`.
   - Account verification: Queries `CustomUserDetailsService.loadUserByUsername()`. Verifies user is active (`isEnabled() == true`, `isAccountNonLocked() == true`).
   - Signature & expiry verification: Re-uses `jwtService.isAccessTokenValid(jwt, userDetails, tokenVersion)`.
   - Token revocation: Matches token's `token_version` claim against database `user.token_version`. If revoked, rejects.
5. Principal Association:
   - Constructs `UsernamePasswordAuthenticationToken` with user roles and attaches it to `accessor.setUser(auth)`.
   - Spring associates this principal with the entire WebSocket session.
6. Rejection:
   - If invalid, expired, revoked, or missing, throws `BadCredentialsException` or `AuthenticationCredentialsNotFoundException`.
   - Spring sends a STOMP `ERROR` frame to the client and closes the connection.
   - Security rule: Token strings and authorization credentials are never logged.

---

## 4. Destination Authorization

### 4.1 Permitted Destinations
- **Private Notifications**: `/user/queue/notifications`
  - Spring STOMP maps this subscription to the authenticated user's session queue: `/queue/notifications-user{sessionId}`.
  - Principal identity is derived strictly from the verified JWT.

### 4.2 Denied Destinations
- **Cross-User Queues**: Any attempt to subscribe to `/user/{otherUser}/queue/notifications` where `{otherUser}` does not match the authenticated principal name results in `AccessDeniedException`.
- **Public Topics**: Any attempt to subscribe to `/topic/**` or `/queue/**` directly without authorization is rejected with `AccessDeniedException`.
- **Client Publishing (`SEND`)**: All client-to-server publishing (`SEND` commands) to `/app/**`, `/queue/**`, or `/topic/**` is rejected with `AccessDeniedException("Client-to-server SEND commands are not permitted")`. The WebSocket channel is strictly a server-to-client notification push channel.

---

## 5. Event-Driven Publishing & Transaction Commit

### 5.1 Transaction Decoupling
To guarantee that uncommitted or rolled-back transactions never leak notification events to users:
1. `NotificationServiceImpl.createNotification(...)` checks deduplication and persists `Notification` inside the active transaction.
2. `NotificationServiceImpl` publishes an internal Spring application event: `NotificationCreatedEvent`.
3. `NotificationEventListener` handles the event using:
   ```java
   @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
   public void handleNotificationCreated(NotificationCreatedEvent event)
   ```
4. If the database transaction rolls back, `NotificationEventListener` is **never executed**.
5. If the database transaction commits, `NotificationEventListener` formats the `RealtimeNotificationPayload` and dispatches it via `WebSocketNotificationPublisher.publishToUser()`.

### 5.2 Error Isolation
- `WebSocketNotificationPublisherImpl` wraps `SimpMessagingTemplate.convertAndSendToUser` in a defensive `try-catch` block.
- Any STOMP broker failure, closed socket, or network timeout is logged at `ERROR` level without rethrowing.
- The business transaction remains fully committed in PostgreSQL, and the notification remains retrievable via REST.

---

## 6. Real-Time Notification Payload Contract

The real-time payload is a lightweight, safe data transfer object that excludes sensitive data, provider secrets, and JPA internals.

### 6.1 DTO Schema (`RealtimeNotificationPayload`)
```json
{
  "id": 105,
  "userId": 42,
  "notificationType": "ORDER_CREATED",
  "title": "Order Placed Successfully",
  "message": "Your order ORD-38151270-C0EA for INR 1499.00 has been placed successfully.",
  "referenceType": "ORDER",
  "referenceId": 42,
  "isRead": false,
  "createdAt": "2026-10-10T18:45:51.280"
}
```

### 6.2 Field Specifications
| Field | Type | Description |
|---|---|---|
| `id` | Long | Database ID of the persistent notification (used for REST mark-as-read) |
| `userId` | Long | Recipient user ID |
| `notificationType` | String / Enum | Logical event type (`ORDER_CREATED`, `PAYMENT_SUCCESS`, etc.) |
| `title` | String | Human-readable notification header |
| `message` | String | Notification summary message |
| `referenceType` | String | Associated domain entity (`ORDER`, `APPOINTMENT`, `SERVICE_BOOKING`, `PAYMENT`) |
| `referenceId` | Long | Entity ID of the referenced business record |
| `isRead` | Boolean | Read state (defaults to `false` for new notifications) |
| `createdAt` | LocalDateTime | Server ISO timestamp |

---

## 7. Supported Business Domain Events

| Domain Event | Notification Type | Recipient | Deduplication Key (`dedupeKey`) | Real-Time Trigger |
|---|---|---|---|---|
| Veterinary Appointment Booked | `BOOKING_CREATED` | Veterinarian | `NOTIF-APT-{id}-CREATED` | Customer books appointment |
| Veterinary Appointment Cancelled | `BOOKING_CANCELLED` | Veterinarian | `NOTIF-APT-{id}-CANCELLED` | Customer cancels appointment |
| Appointment Confirmed | `BOOKING_CONFIRMED` | Pet Owner | `NOTIF-APT-{id}-CONFIRMED` | Vet transitions to `CONFIRMED` |
| Appointment Cancelled by Vet | `BOOKING_CANCELLED` | Pet Owner | `NOTIF-APT-{id}-CANCELLED` | Vet transitions to `CANCELLED` |
| Appointment Completed | `BOOKING_CONFIRMED` | Pet Owner | `NOTIF-APT-{id}-COMPLETED` | Vet transitions to `COMPLETED` |
| Service Booking Created | `BOOKING_CREATED` | Service Provider | `NOTIF-SB-{id}-CREATED` | Customer books service |
| Service Booking Cancelled | `BOOKING_CANCELLED` | Service Provider | `NOTIF-SB-{id}-CANCELLED` | Customer cancels booking |
| Service Booking Confirmed | `BOOKING_CONFIRMED` | Pet Owner | `NOTIF-SB-{id}-CONFIRMED` | Provider confirms booking |
| Appointment Payment Verified | `PAYMENT_SUCCESS` | Pet Owner | `NOTIF-PAYMENT-APT-{id}-SUCCESS` | Razorpay signature verified |
| Service Booking Payment Verified | `PAYMENT_SUCCESS` | Pet Owner | `NOTIF-PAYMENT-SB-{id}-SUCCESS` | Razorpay signature verified |
| Order Payment Verified | `PAYMENT_SUCCESS` | Customer | `NOTIF-ORDER-{id}-PAID` | Razorpay signature verified |
| Webhook Payment Failed | `PAYMENT_FAILED` | Payer | `NOTIF-PAYMENT-{id}-FAILED` | Razorpay `payment.failed` webhook |
| Product Order Created | `ORDER_CREATED` | Customer | `NOTIF-ORDER-{id}-CREATED` | Customer checks out active cart |
| Order Packed | `ORDER_PACKED` | Customer | `NOTIF-ORDER-{id}-PACKED` | Admin updates status to `PACKED` |
| Order Shipped | `ORDER_SHIPPED` | Customer | `NOTIF-ORDER-{id}-SHIPPED` | Admin updates status to `SHIPPED` |
| Order Delivered | `ORDER_DELIVERED` | Customer | `NOTIF-ORDER-{id}-DELIVERED` | Admin updates status to `DELIVERED` |
| Order Cancelled | `ORDER_CANCELLED` | Customer | `NOTIF-ORDER-{id}-CANCELLED` | Customer or Admin cancels order |
| Upcoming Appointment Reminder | `APPOINTMENT_REMINDER` | Pet Owner | `REMINDER-APT-{id}-{date}` | Daily reminder scheduler sweep |
| Upcoming Booking Reminder | `BOOKING_REMINDER` | Pet Owner | `REMINDER-SB-{id}-{date}` | Daily reminder scheduler sweep |

---

## 8. Scheduled Reminders (Part H)

### 8.1 Workflow
`ScheduledReminderService` executes a daily sweep (default: 8:00 AM, configurable via `application.scheduling.reminders.cron`):
1. Queries `AppointmentRepository.findByAppointmentDateAndStatus(tomorrow, CONFIRMED)`.
2. Queries `ServiceBookingRepository.findByBookingDateAndStatus(tomorrow, CONFIRMED)`.
3. For each eligible booking, computes a deterministic deduplication key:
   - Appointments: `REMINDER-APT-{bookingId}-{date}`
   - Service Bookings: `REMINDER-SB-{bookingId}-{date}`
4. Invokes `notificationService.createNotification(...)`.

### 8.2 Invariants & Safety
- **Strict Status Check**: Cancelled, rejected, pending, or completed bookings are never selected.
- **Idempotency**: Running the scheduler multiple times on the same day produces zero duplicate notifications because `NotificationRepository.findByDedupeKey(dedupeKey)` detects existing records.
- **Safe Retries**: Transient failures on one booking record do not prevent reminders for other bookings.
- **In-App First**: The reminder is persisted and dispatched in-app/WebSocket without requiring active third-party SMS or SMTP gateways.

---

## 9. Next.js Frontend Reconnection Contract

The Next.js client integration should follow this recommended lifecycle:

```text
[Client App Starts]
       |
       v
1. Obtain valid access token from NextAuth / AuthContext
       |
       v
2. Establish STOMP connection:
   - Endpoint: /ws (or http://localhost:8000/ws using SockJS)
   - STOMP Headers: { Authorization: "Bearer " + accessToken }
       |
       v
3. On Connect Success:
   - Subscribe to "/user/queue/notifications"
   - On incoming message:
       a. Parse JSON payload
       b. Prepend to in-memory notification bell dropdown
       c. Increment local unread count badge
       |
       v
4. Reconcile with Authoritative REST State:
   - Fetch GET /api/me/notifications?page=0&size=20
   - Fetch GET /api/me/notifications/unread-count
   - Update UI store
       |
       v
[Connection Disconnected / Network Interrupted]
       |
       v
5. Reconnect Strategy:
   - Exponential backoff (1s, 2s, 4s, 8s, max 30s)
   - If token expired: refresh token via POST /api/auth/refresh first
   - Re-connect with fresh access token
   - Re-subscribe to /user/queue/notifications
   - Re-fetch GET /api/me/notifications and unread-count to catch missed messages
```

### 9.1 Handling Disconnects & Expired Tokens
- WebSocket connections are long-lived; access tokens expire every 15 minutes.
- When an expired token causes reconnection rejection, the frontend must call `POST /api/auth/refresh` to obtain a fresh access token before reconnecting STOMP.
- Missed notifications during disconnection are preserved in PostgreSQL and retrieved upon calling `GET /api/me/notifications`.

---

## 10. Deployment & Scalability Limitations

1. **Single-Instance Deployment (Current)**:
   - The current implementation uses Spring's in-memory `SimpleBrokerMessageHandler`.
   - All connected WebSocket sessions reside in the memory of the single backend instance.
   - For a single-server deployment (e.g. standard staging or single container), this architecture is optimal, zero-dependency, and high-performance.
2. **Multi-Instance / Clustered Limitations**:
   - If the backend is horizontally scaled across multiple instances (e.g. Kubernetes with >1 replica behind a load balancer), instance A cannot send a message to a WebSocket client connected to instance B without a distributed broker.
   - To scale horizontally across multiple instances in future phases, the `SimpleBrokerMessageHandler` must be replaced with `StompBrokerRelayRegistration` pointing to an external STOMP message broker (such as RabbitMQ with STOMP plugin, Redis Pub/Sub, or ActiveMQ Artemis).
   - The application event architecture (`NotificationCreatedEvent` + `@TransactionalEventListener`) will remain identical; only `WebSocketConfig` will be swapped to relay to the external broker.
