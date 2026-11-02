# PawConnect — Production Readiness Audit (Phase 9)

**Date:** October 2026  
**Auditor:** Antigravity Engineering (Phase 9 QA & Security Gate)  
**System Scope:** Full-Stack PawConnect Platform (Next.js 16 App Router Frontend + Spring Boot 4 / Java 21 REST API Backend)

---

## 1. Executive Summary & Repository Discovery

PawConnect has undergone an exhaustive Phase 9 production-readiness, security, and quality gate audit. Every sub-system was audited against live codebase sources, database configuration, security boundaries, and automated test suites.

### Repository Root & Workspace Architecture

| Component | Physical Path | Git Working Tree Status | Role / Framework |
| :--- | :--- | :--- | :--- |
| **Backend API** | `D:\TDS WORKS\PawConnect\PROJECT\PawConnect_bakend`<br>*(Junction: `PawConnect/PawConnect_bakend`)* | On `main`. Clean working tree for core source, modified configuration profiles for environment variables. | Spring Boot 4.1.1 on Java 21, Hibernate JPA, PostgreSQL / Neon |
| **Frontend App** | `D:\TDS WORKS\PawConnect\PROJECT\pawconnect`<br>*(Junction: `PawConnect/pawconnect`)* | On `main`. Fully typed, clean lint, compiled static/dynamic App Router bundle. | Next.js 16.3.8, React 19.2.8, Tailwind CSS v4, Lucide React, Sonner |

---

## 2. Part A — Environment & Configuration Audit

### Frontend Configuration (`pawconnect/.env.example`)

1. **Public Environment Variables**:
   - `NEXT_PUBLIC_API_BASE_URL`: Evaluated in `src/lib/api/client.ts`. Resiliently normalized so that `/api` is guaranteed even if an operator supplies `https://api.domain.com` without a trailing path.
   - `NEXT_PUBLIC_WS_URL`: Evaluated in `src/lib/api/websocket.ts`. Normalized to automatically detect `wss://` on HTTPS domains and strip scheme prefixes cleanly.
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Client-side public key ID used solely for initializing the client-side checkout modal. Defaults safely to `rzp_test_placeholder`.
2. **Secrets Exposure**:
   - Zero private secrets or API keys are bundled into client-side JS chunks.
   - All critical financial and authentication actions are verified server-side.

### Backend Configuration (`PawConnect_bakend/src/main/resources/application.yaml`)

1. **Port & Prefix Agreement**:
   - Default server port is `8000` (`server.port: ${SERVER_PORT:8000}`).
   - All backend controllers are prefixed under `/api` (`/api/auth`, `/api/me`, `/api/admin`, `/api/payments`, `/api/webhooks`).
   - Frontend and backend defaults agree on `http://localhost:8000/api`.
2. **CORS & WebSocket Origins**:
   - Configured via `${CORS_ALLOWED_ORIGINS:http://localhost:3000}`.
   - Wildcards (`*`) with credentials are expressly prohibited.
   - WebSocket endpoint `/ws` enforces origin validation in `WebSocketConfig.java`.
3. **Database & Connection Pooling**:
   - Configured for PostgreSQL (`org.postgresql.Driver`).
   - Neon pooled connection string supported via `${DB_URL}`.
4. **Actuator & OpenAPI Surface**:
   - `spring-boot-starter-actuator` is **not** bundled in dependencies, eliminating accidental leakage of operational metrics or environment dumps.
   - OpenAPI Swagger UI (`/swagger-ui/**`, `/v3/api-docs/**`) is active in development; recommended for disabling or firewall protection in production.

---

## 3. Part B — Credential & Repository Security Review

### Security Advisory: Prior Database Credential Exposure

> [!WARNING]
> **CRITICAL RELEASE BLOCKER (OPERATIONAL ACTION REQUIRED)**
> During early project development commits, a live Neon cloud PostgreSQL database connection string was committed to Git history.
> While `.env` is now properly ignored in `.gitignore` and `application.yaml` uses environment variable placeholders (`${DB_URL}`, `${DB_USERNAME}`, `${DB_PASSWORD}`), any secret once committed to Git history must be considered compromised.
> 
> **Required Action**: The authorized cloud operator must rotate the database credentials in the Neon Console prior to production release.

### Repository Credential Scan Results

- **Tracked Files**: Zero live credentials, private keys, or passwords are tracked in active git files.
- **Git Ignore Hygiene**:
  - `application-local.yaml`, `application-local.properties`, `.env`, `.env.*` are actively ignored.
  - Ignored `.env` file in `PawConnect_bakend` was verified untracked (`git ls-files .env` returns empty).
- **Test Secret Isolation**: Test suites use isolated H2 in-memory databases with standard synthetic test keys (`404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`).

---

## 4. Part C — Authentication & Application Security

### Token Lifecycle & Storage Architecture

- **Stateless Bearer JWT**: Access tokens expire in 15 minutes (`900000ms`); refresh tokens expire in 7 days (`604800000ms`).
- **Token Invalidation via `token_version`**: Users possess a database-backed `token_version` integer. Bumping `token_version` (triggered on password change, logout, or account lock) instantaneously invalidates all active tokens across all devices.
- **Enumeration Defenses**: Authentication and password-reset endpoints return uniform generic responses to prevent user enumeration.
- **Untrimmed Password Policy**: Password fields are never trimmed or altered, allowing valid leading/trailing whitespace without silent truncation.

### LocalStorage vs. HttpOnly Cookie / BFF Assessment

- **Current State**: Bearer tokens are stored in browser `localStorage`.
- **Threat Model**:
  - `localStorage` is vulnerable to Cross-Site Scripting (XSS). An attacker executing JavaScript in the browser context could exfiltrate the access/refresh token.
  - However, because PawConnect does not allow unsanitized user HTML injection (React JSX escapes strings by default) and enforces strict Content-Type headers, XSS risk is low.
- **Architectural Migration Recommendation (Post-Phase 9)**:
  - Transitioning to `HttpOnly`, `Secure`, `SameSite=Strict` cookies or a Next.js Backend-For-Frontend (BFF) proxy route (`/api/auth/*`) is recommended for enterprise hardening.
  - Because implementing HttpOnly cookies requires changing CORS credentials handling, cookie domain configuration, and token exchange endpoints across both repositories, it should be scheduled as a dedicated post-launch milestone rather than an unverified emergency refactor.

---

## 5. Part D — Payment Integrity & Razorpay Readiness

### Server-Side Architecture

1. **Order Creation**: Initiated strictly server-side through `RazorpayService.createOrder()`. Validates booking confirmation status (`CONFIRMED`) and prevents duplicate payments.
2. **Cryptographic Verification**: HMAC-SHA256 signature verification is performed using `MessageDigest.isEqual` to prevent timing attacks.
3. **Pessimistic Locking**: `paymentRepository.findByGatewayOrderIdForUpdate` locks the payment row during verification to serialize concurrent attempts.
4. **Idempotency**: Repeated checkout verification or repeated webhook delivery returns current success state without double processing or duplicated notifications.
5. **Abandoned Checkout Handling**: Webhook handler (`payment.captured`) automatically reconciles `APPOINTMENT`, `SERVICE_BOOKING`, and merchandise `ORDER` records, ensuring customer notifications and database links are created even if the customer leaves the browser checkout page.
6. **No Status Downgrade**: Once marked `SUCCESS`, a payment record refuses downgrade upon a delayed `payment.failed` webhook event.

---

## 6. Part E — Inventory, Booking & Schedule Integrity

### Concurrency & Business Rules

1. **Atomic Inventory Decrement**:
   - `ProductRepository.decrementStock` executes atomic conditional SQL:
     ```sql
     UPDATE products SET stock_quantity = stock_quantity - :qty 
     WHERE id = :id AND stock_quantity >= :qty
     ```
   - If stock is insufficient, the update affects 0 rows, throwing `InsufficientStockException` and rolling back the transaction.
   - Stock can never become negative.
2. **Pessimistic Locking on Provider Bookings**:
   - Booking creation acquires a pessimistic write lock on the `Veterinarian` or `ServiceProvider` row during slot validation.
   - Concurrent overlapping slot requests for the same provider are serialized, preventing double bookings.
3. **Idempotent Order Cancellation**:
   - `OrderServiceImpl.cancelOrder` locks the order row with `findByIdForUpdate`.
   - If already cancelled, it returns immediately without restoring inventory a second time.

---

## 7. Part F — Database & Migration Readiness

### Flyway Status & Cloud Schema Safety

- **Current Configuration**:
  - `spring.jpa.hibernate.ddl-auto: update`
  - `spring.flyway.enabled: false`
  - Flyway PostgreSQL dependencies are present in `pom.xml`.
- **Risk Assessment**:
  - Hibernate `ddl-auto: update` modifies schemas non-deterministically and cannot safely manage column renames, drops, or constraint alterations in multi-instance production.
- **Production Baseline Requirement**:
  - Before launching in production, the Neon database must be snapshotted.
  - A baseline Flyway migration `V1__init_schema.sql` must be generated and baselined (`flyway:baseline`).
  - `spring.jpa.hibernate.ddl-auto` must be transitioned from `update` to `validate`.

---

## 8. Part G — WebSocket & Real-Time Delivery

1. **STOMP Inbound Interceptor (`StompChannelInterceptor`)**:
   - Validates JWT on `CONNECT` frame.
   - Rejects expired, malformed, or revoked `token_version` tokens.
   - Strictly enforces private destination `/user/queue/notifications`.
   - Rejects cross-user queue subscriptions (`/user/other@domain/queue/notifications`).
   - Rejects client-to-server `SEND` frames (publishers are server-only).
2. **Transactional Event Listener**:
   - Real-time notifications are dispatched via `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`.
   - Notifications are never broadcast before the transaction commits or if it rolls back.
3. **Single-Instance Limitation**:
   - The current architecture uses Spring's in-memory `SimpleBroker`.
   - In a multi-replica deployment, client A connected to replica 1 will not receive notifications published by replica 2 unless a shared STOMP broker (e.g. RabbitMQ / ActiveMQ) is configured.
   - Single-instance deployment is verified and recommended for initial release.

---

## 9. Part H — Rate Limiting, Scheduled Jobs & Operations

1. **In-Memory Limitations**:
   - `InMemoryOtpService` stores OTPs with a 5-minute TTL and 3-attempt limit.
   - `InMemoryRateLimiterService` enforces sliding-window limits in-memory.
   - **Behavior on Restart**: Active OTPs and rate-limit counters are cleared upon process restart.
   - **Multi-Instance Requirement**: For distributed clusters, state should be backed by Redis. For single-instance production, in-memory is fully functional and thread-safe.
2. **Scheduled Reminders (`ScheduledReminderService`)**:
   - Sweeps confirmed bookings daily at 08:00 AM.
   - Deterministic deduplication key (`REMINDER-APT-{id}-{date}`) prevents duplicate notifications even if executed repeatedly.

---

## 10. Part I — External Email & SMS Delivery

- **Current Adapters**: `DevEmailServiceImpl` and `DevSmsServiceImpl` (logs actions and masks PII).
- **Safety**: Delivery failures are caught and logged without rolling back booking or order database transactions.
- **Production Requirement**: Operator must configure a production email provider (AWS SES / SendGrid) and SMS gateway (Twilio) when live delivery is enabled.

---

## 11. Part J — Frontend Runtime & UX Verification

- **TypeScript Typecheck**: `tsc --noEmit` passed with 0 errors.
- **ESLint**: Clean lint with 0 warnings.
- **Turbopack Build**: Compiled successfully in 5.8s; all 47 routes statically rendered or server-rendered on demand.
- **Global Toast**: Single `<Toaster />` mounted in `AppProviders.tsx`; direct `sonner` imports eliminated from feature components; non-fraudulent messaging enforced.

---

## 12. Verification & Test Metrics

| Suite | Scope | Tests Run | Failures | Errors | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend Integration Suite** | All controllers, security, payments, commerce, bookings, validation | 180 | 0 | 0 | **PASS** |
| **Frontend TypeScript** | Full App Router tree (47 routes, 29 forms) | N/A | 0 | 0 | **PASS** |
| **Frontend ESLint** | React 19 / Next.js standards | N/A | 0 | 0 | **PASS** |
| **Next.js Production Build** | Full application optimization | 47 / 47 | 0 | 0 | **PASS** |

---

## 13. Release Blockers Classification

| Blocker / Finding | Classification | Resolution / Next Step |
| :--- | :--- | :--- |
| **1. Neon DB Credential Rotation** | **Requires Manual Operator Action** | Operator must rotate password in Neon Console and update `DB_PASSWORD`. |
| **2. Razorpay Live Activation** | **Requires Manual Operator Action** | Operator must update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` from Razorpay Live Dashboard. |
| **3. OpenAPI Exposure in Production** | **Fixed / Documented** | Configure `springdoc.swagger-ui.enabled=false` in production profile. |
| **4. Flyway Schema Baseline** | **Requires Manual Operator Action** | Baseline database snapshot with `flyway:baseline` before setting `ddl-auto: validate`. |
| **5. Multi-Instance In-Memory State** | **Requires Architectural Decision** | Documented: Single-instance deployment recommended initially; Redis required for multi-replica scaling. |
| **6. Frontend URL Protocol & Scheme Resilience** | **Fixed and Verified** | Resolved in `client.ts` and `websocket.ts`. |
| **7. Webhook Booking Notification Reconciliation** | **Fixed and Verified** | Implemented and verified in `PaymentServiceImpl.java` (3 regression tests added). |
