# PawConnect Backend Architecture Audit Report

**Date:** 2026-10-09  
**Auditor:** Antigravity AI  
**Spring Boot Version:** 4.1.1  
**Java Version:** 17 (Runtime: Java 21.0.8)  
**Database:** PostgreSQL (Neon Cloud, PostgreSQL 18.6)  
**Source Repository:** `PawConnect_bakend/`  

---

## 1. Executive Summary

A comprehensive architectural audit of the PawConnect Spring Boot backend repository was conducted against `PawConnect_SpringBoot_Backend_Development_Notes.md` and enterprise production standards.

### Current Project State
The repository currently represents an **early skeleton layer**:
- **Entities & Models:** 46 files (covering 28 domain entities and associated enums).
- **DTOs:** 25 response-oriented DTO classes (no request, create, or update DTOs).
- **Repositories:** 28 Spring Data `JpaRepository` interfaces.
- **Security & JWT:** Minimal Spring Security stateless config, `JwtService`, `JwtAuthenticationFilter`, and `CustomUserDetailsService`.
- **Exception & Responses:** 1 `GlobalExceptionHandler` with generic handling; 1 basic `ApiResponse<T>` wrapper (3 fields).
- **Test Suite:** 1 test (`PawConnectApplicationTests.contextLoads()`) which compiles and executes successfully against the live Neon PostgreSQL database.

### What Is Missing (Zero Implementation Found)
| Layer / Feature | Current Status | Impact |
|---|---|---|
| **Service Layer** | ❌ 0 classes | No business logic, transaction boundaries, or validation exist. |
| **Controller Layer** | ❌ 0 classes | No HTTP REST endpoints exist; backend cannot receive requests. |
| **Mapper Layer** | ❌ 0 classes | Entity-to-DTO and DTO-to-Entity conversions are absent. |
| **Request DTOs** | ❌ 0 classes | No input models or Bean Validation constraints. |
| **Custom Exceptions** | ❌ 0 classes | No domain-specific exceptions (NotFound, Conflict, Unauthorized, etc.). |
| **Razorpay Integration** | ❌ 0 classes | No SDK, order creation, signature verification, or webhooks. |
| **WebSocket / STOMP** | ❌ 0 classes | Real-time notification delivery is not configured. |
| **Database Migrations** | ❌ 0 scripts | No Flyway scripts; relies on unsafe Hibernate `ddl-auto: update`. |
| **CORS Configuration** | ❌ Absent | Frontend on `localhost:3000` will be blocked by browser CORS policy. |
| **OpenAPI / Swagger** | ❌ Absent | No API contracts or UI for frontend alignment. |
| **Platform Settings** | ❌ Missing entity | No persistence for platform-wide configs (fees, windows). |
| **Rate Limiting** | ❌ Absent | Auth endpoints vulnerable to credential stuffing/DDoS. |

---

## 2. Business Scope & Vendor Legacy Findings

### 2.1 Active Business Roles
The defined active roles are:
- `PET_OWNER`
- `VETERINARIAN`
- `SERVICE_PROVIDER`
- `ADMIN`

### 2.2 Marketplace Architecture
PawConnect operates an **in-house, admin-curated e-commerce catalog** and a direct veterinary/service provider booking system. There is **NO external vendor role** and **NO multi-vendor marketplace**.

### 2.3 Legacy Vendor Code Findings
During inspection, the following vendor-era patterns and vestiges were identified:
1. **`ProductApprovalStatus` Enum (`model/ProductApprovalStatus.java`):**
   - Contains `ACTIVE`, `INACTIVE`.
   - In a multi-vendor marketplace, products undergo vendor approval workflows. In PawConnect, products are created directly by Admins.
   - **Recommendation:** Rename to `ProductStatus` (`ACTIVE`, `INACTIVE`) and eliminate all approval workflow semantics.
2. **`Product.approvalStatus` (`model/Product.java:49`):**
   - References `ProductApprovalStatus`. Should be replaced with `ProductStatus status` or streamlined into `isActive`.
3. **`ProductRepository.findByCreatedById` (`repository/ProductRepository.java:16`):**
   - Filtering catalog products by creator ID reflects vendor store query patterns.
   - **Recommendation:** Keep solely for Admin audit trails, not as a customer-facing or vendor filter.
4. **Clean Domain Boundaries:**
   - No `vendor`, `vendor_verifications`, `vendorId`, `seller accounts`, `commission payouts`, or `vendor settlements` were found in entities or DTOs.
   - The codebase is clean of hard vendor tables; only the product approval naming residue needs cleanup.

---

## 3. Build & Dependency Audit (`pom.xml`)

| Dependency / Plugin | Version | Status | Finding / Action Required |
|---|---|---|---|
| `spring-boot-starter-parent` | 4.1.1 | ⚠️ Experimental | Spring Boot 4.1.1 is an upcoming line; library compatibility must be watched. |
| `spring-boot-starter-data-jpa` | Managed | ✅ Present | Operational. |
| `spring-boot-starter-webmvc` | Managed | ✅ Present | Operational. |
| `spring-boot-starter-security` | Managed | ✅ Present | Operational. |
| `postgresql` | Managed | ✅ Present | Neon PostgreSQL connectivity verified. |
| `lombok` | 1.18.30 | ⚠️ Action Required | Configured in compiler plugin; misuse of `@Data` on JPA entities. |
| `jjwt-api`, `jjwt-impl`, `jjwt-jackson` | 0.11.5 | ⚠️ Outdated | Functional, but recommend migrating to JJWT `0.12.x` API. |
| **Missing:** `spring-boot-starter-validation` | - | ❌ Critical | Bean validation (`@Valid`, `@NotBlank`, `@Min`) will fail without this. |
| **Missing:** `spring-boot-starter-websocket` | - | ❌ Critical | Required for STOMP over WebSocket real-time notifications. |
| **Missing:** `flyway-core` + `flyway-database-postgresql` | - | ❌ Critical | Required for deterministic database migrations. |
| **Missing:** `springdoc-openapi-starter-webmvc-ui` | - | ❌ High | Required for automated OpenAPI contract generation. |
| **Missing:** `razorpay-java` | - | ❌ Critical | Required for backend Razorpay payment orders and webhooks. |
| **Missing:** `bucket4j-core` (or Redis rate limiter) | - | ❌ Medium | Required for endpoint brute-force and rate-limiting protection. |

---

## 4. Security & JWT Vulnerability Audit

### Critical Vulnerabilities
1. **Hard-Coded JWT Secret Key Fallback:**
   - **File:** `security/JwtService.java:23`
   - **Issue:** `@Value("${application.security.jwt.secret-key:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")`
   - **Risk:** If the property is missing from environment variables, Spring Boot silently uses a public, hard-coded default secret. An attacker can forge arbitrary JWTs with `ROLE_ADMIN`.
   - **Resolution:** Remove default fallback. Require `${application.security.jwt.secret-key}` or `${JWT_SECRET}` and fail application context startup if absent.
2. **Plain-Text Database Credentials in `application.yaml`:**
   - **File:** `src/main/resources/application.yaml:5-7`
   - **Issue:** Neon database host, user, and plaintext password are hard-coded in git-tracked configuration.
   - **Resolution:** Externalize via environment variables (`${SPRING_DATASOURCE_URL}`, `${SPRING_DATASOURCE_USERNAME}`, `${SPRING_DATASOURCE_PASSWORD}`).
3. **Catastrophic In-Memory Role Query (`UserRoleRepository.findAll()`):**
   - **File:** `security/CustomUserDetailsService.java:28-30`
   - **Issue:** On **every single authenticated request**, the filter calls `userRoleRepository.findAll()` and filters roles for the specific user in memory using Java Streams.
   - **Risk:** At 10,000 users with roles, every HTTP request fetches all 10,000+ role records over network into JVM heap. Under production traffic, this will exhaust database bandwidth and trigger `OutOfMemoryError`.
   - **Resolution:** Add `List<UserRole> findByUserId(@Param("userId") Long userId)` in `UserRoleRepository` or fetch roles via `JOIN FETCH` directly in `UserRepository.findByEmail`.
4. **Unhandled JWT Parsing Exceptions in Filter:**
   - **File:** `security/JwtAuthenticationFilter.java:41`
   - **Issue:** `jwtService.extractUsername(jwt)` is invoked outside a `try-catch` block.
   - **Risk:** Expired, malformed, or tampered tokens throw `ExpiredJwtException`, `MalformedJwtException`, or `SignatureException`. Instead of returning HTTP 401, the filter crashes or surfaces unhandled 500 errors.
   - **Resolution:** Wrap extraction in `try-catch (JwtException | IllegalArgumentException e)` and delegate to `AuthenticationEntryPoint` or proceed down chain unauthenticated.
5. **No CORS Configuration:**
   - **File:** `security/SecurityConfig.java:44-54`
   - **Issue:** `http.cors()` is not configured. Requests from Next.js (`http://localhost:3000`) will fail browser preflight (`OPTIONS`) checks.
   - **Resolution:** Configure explicit `CorsConfigurationSource` with configured allowed origins, methods, and headers.
6. **Token Lifetime & Revocation Gaps:**
   - **Issue:** Single 24-hour access token (`86400000ms`); no refresh token mechanism, no token blacklist, and no status invalidation. If a compromised user is blocked by Admin, their JWT remains valid for up to 24 hours.
   - **Resolution:** Reduce access token TTL to 15 minutes; introduce refresh tokens with rotation and validate user status (`UserStatus.ACTIVE`) during token authentication.
7. **Insecure Status Checks in `UserDetailsImpl`:**
   - **File:** `security/UserDetailsImpl.java:55, 60`
   - **Issue:** Uses string equality: `user.getStatus().name().equals("ACTIVE")` and `!user.getStatus().name().equals("INACTIVE")`.
   - **Resolution:** Use type-safe enum comparisons (`user.getStatus() == UserStatus.ACTIVE`).

---

## 5. Entity & JPA Architecture Audit

### 5.1 Misuse of `@Data` on JPA Entities (High Risk)
- **Affected:** All 28 JPA entity classes.
- **Problem:** Lombok's `@Data` generates `equals()`, `hashCode()`, and `toString()` including all bidirectional relations (`User` ↔ `Pet`, `Cart` ↔ `CartItem`, `Order` ↔ `OrderItem`).
- **Consequences:**
  1. `StackOverflowError` due to cyclic recursion.
  2. Unintentional triggering of lazy queries when logging entities.
  3. Hibernate set/collection corruption due to mutable identity in `hashCode()`.
- **Resolution:** Replace `@Data` with `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, and explicit `@EqualsAndHashCode(of = "id")`.

### 5.2 Dangerous `CascadeType.ALL` on Root Entities (Critical Risk)
- **File:** `model/User.java:60-103`
- **Issue:** `User` specifies `cascade = CascadeType.ALL` on:
  - `payments`
  - `orders`
  - `statusChanges` (audit trail)
  - `auditLogs`
  - `createdProducts`
  - `notifications`
- **Risk:** In Hibernate, deleting or detaching a `User` cascades deletions to historical orders, financial payment audit trails, and legal compliance logs.
- **Resolution:**
  - Remove `CascadeType.ALL` from `payments`, `orders`, `statusChanges`, `auditLogs`, and `createdProducts`.
  - Maintain historical integrity; use soft-delete (`is_active = false` or `is_deleted = true`).

### 5.3 Missing Snapshot Fields in `Order`
- **File:** `model/Order.java:32-35`
- **Issue:** `Order` holds a direct `@ManyToOne` foreign key to `Address`.
- **Risk:** If a user edits or deletes an address in `/api/me/addresses`, past legal invoices and shipping logs are modified or broken.
- **Resolution:** Denormalize and snapshot recipient name, phone, line1, line2, city, state, postal code, and country directly on `orders`.

### 5.4 Foreign Key & Relationship Deficiencies
1. **Raw `payment_id` Long Columns:**
   - `model/Appointment.java:54` and `model/ServiceBooking.java:54` store `paymentId` as a raw `Long` with a `// TODO` comment.
   - **Resolution:** Map to `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "payment_id") private Payment payment;`.
2. **Missing Unique Constraints:**
   - `Cart`: Needs unique constraint on `(user_id, status)` to prevent multiple active carts.
   - `CartItem`: Needs unique constraint on `(cart_id, product_id)` to avoid duplicate rows instead of quantity increments.
3. **Missing Razorpay Columns on `Payment`:**
   - `Payment.java` lacks: `gateway_order_id`, `gateway_payment_id`, `gateway_signature`, `currency`, `gateway_status`, `captured_at`, `refund_id`, `refund_amount`, `gateway_provider`.
4. **Missing Auditing & Column Constraints:**
   - No `@CreatedDate` / `@LastModifiedDate` with `@EnableJpaAuditing`.
   - Core non-nullable fields lack `nullable = false` on `@Column`.

---

## 6. Repository & Query Layer Audit

1. **Unbounded Queries (`List<T>` Instead of `Page<T>`):**
   - `OrderRepository`, `AppointmentRepository`, `ServiceBookingRepository`, `ProductRepository`, `AuditLogRepository`, and `NotificationRepository` return unpaged `List<T>`.
   - **Resolution:** Standardize on Spring Data `Pageable` and return `Page<T>`.
2. **Missing Appointment & Booking Overlap Detection:**
   - Neither `AppointmentRepository` nor `ServiceBookingRepository` contains slot-overlap JPQL queries.
   - **Required Overlap Query Formula:**
     `WHERE provider_id = :id AND date = :date AND status NOT IN ('CANCELLED', 'NO_SHOW') AND start_time < :reqEnd AND end_time > :reqStart`
3. **Missing Atomic Stock Decrement:**
   - `ProductRepository` lacks atomic decrement logic, risking inventory overselling under high concurrency.
   - **Required Query:**
     `UPDATE Product p SET p.stockQuantity = p.stockQuantity - :qty WHERE p.id = :id AND p.stockQuantity >= :qty`
4. **Missing Payment Gateway Lookups:**
   - `PaymentRepository` has no lookup by `gatewayOrderId` or `gatewayPaymentId`.

---

## 7. DTO, Validation & Mapping Audit

1. **Absence of Request DTOs:**
   - Only 25 response DTOs exist. Zero request DTOs exist for registration, login, bookings, checkout, reviews, or administrative updates.
2. **Zero Bean Validation:**
   - Fields lack `@NotBlank`, `@Size`, `@Email`, `@NotNull`, `@Min`, `@Future`, or `@Pattern`.
   - Missing `spring-boot-starter-validation` dependency in `pom.xml`.
3. **Absence of Dedicated Mappers:**
   - No MapStruct or dedicated mapping service exists.

---

## 8. Exception Handling & Response Structure Audit

1. **Information Leakage in `GlobalExceptionHandler`:**
   - Handles `Exception.class` by returning `ex.getMessage()` directly, exposing database error messages, constraint names, and SQL statements to clients.
2. **Missing Bean Validation Error Handling:**
   - No handler for `MethodArgumentNotValidException` to return structured field-level error lists.
3. **Absence of Custom Domain Exceptions:**
   - Missing: `ResourceNotFoundException`, `DuplicateResourceException`, `BusinessRuleException`, `SlotConflictException`, `InsufficientStockException`, `PaymentVerificationException`, `UnauthorizedException`.
4. **Minimal `ApiResponse<T>` Contract:**
   - Current fields: `success`, `message`, `data`.
   - Missing: `code`, `timestamp`, `meta` (for pagination and request tracking), `errors` (for field-level validation errors).

---

## 9. Booking Concurrency & E-Commerce Audit

1. **Booking Double-Allocation Vulnerability:**
   - Without pessimistic locking (`SELECT ... FOR UPDATE`) or serializable transaction boundaries on slot reservation, simultaneous checkout of the same slot will double-book veterinarians or service providers.
2. **Client-Supplied Slot Time Tampering:**
   - The backend must compute `endTime` server-side based on `service.durationMinutes` and never accept client-supplied end times.
3. **Cart Price Tampering:**
   - Checkout logic must recalculate prices against active database products and never trust client-submitted prices or totals.

---

## 10. Notifications & WebSocket Readiness Audit

1. **Real-time Infrastructure Missing:**
   - No WebSocket configuration, STOMP endpoint (`/ws`), broker configuration (`/app`, `/user/queue`), or JWT ChannelInterceptor.
2. **Notification Persistence Source of Truth:**
   - Database `notifications` table must be persisted before WebSocket dispatch.
3. **Type Safety & Deduplication:**
   - `Notification.notificationType` is an unconstrained string. Must be converted to a `NotificationType` enum.
   - Needs a `dedupeKey` to prevent duplicate automated reminder notifications.

---

## 11. Database & Migrations Audit

1. **Hibernate `ddl-auto: update`:**
   - Unsafe for production environments; fails to handle renames, index creations, or schema drift safely.
   - Must be migrated to Flyway scripts (`V1__init_schema.sql`, `V2__seed_roles_and_categories.sql`).
2. **Missing `platform_settings` Table:**
   - Admin settings (cancellation cutoffs, platform fees, tax rates) have no persistence model.

---

## 12. Complete List of Files Requiring Modification or Creation

### Files to Modify
1. `pom.xml` — Add validation, WebSocket, Flyway, Swagger, Razorpay, and test libraries.
2. `src/main/resources/application.yaml` — Environment variable placeholders, JPA logging, Flyway configuration.
3. `src/main/java/com/example/PawConnect/security/JwtService.java` — Remove hardcoded secret fallback, tighten TTL.
4. `src/main/java/com/example/PawConnect/security/JwtAuthenticationFilter.java` — Exception handling, error responses.
5. `src/main/java/com/example/PawConnect/security/CustomUserDetailsService.java` — Fix catastrophic `userRoleRepository.findAll()`.
6. `src/main/java/com/example/PawConnect/security/SecurityConfig.java` — Add CORS configuration, route permissions.
7. `src/main/java/com/example/PawConnect/security/UserDetailsImpl.java` — Fix string comparison on status enum.
8. `src/main/java/com/example/PawConnect/response/ApiResponse.java` — Add timestamp, error array, metadata.
9. `src/main/java/com/example/PawConnect/exception/GlobalExceptionHandler.java` — Add validation handling, sanitize 500 responses.
10. `src/main/java/com/example/PawConnect/model/User.java` — Replace `@Data`, remove unsafe `CascadeType.ALL`.
11. `src/main/java/com/example/PawConnect/model/Product.java` — Replace `@Data`, remove order item cascade, clean vendor approval enum.
12. `src/main/java/com/example/PawConnect/model/Order.java` — Denormalize delivery address snapshots.
13. `src/main/java/com/example/PawConnect/model/Payment.java` — Add Razorpay fields.
14. `src/main/java/com/example/PawConnect/model/Appointment.java` — Link `Payment` entity, replace `@Data`.
15. `src/main/java/com/example/PawConnect/model/ServiceBooking.java` — Link `Payment` entity, replace `@Data`.
16. `src/main/java/com/example/PawConnect/model/Cart.java` & `CartItem.java` — Add unique constraints.
17. `src/main/java/com/example/PawConnect/model/Notification.java` — Add `NotificationType` enum and `dedupeKey`.
18. `src/main/java/com/example/PawConnect/repository/AppointmentRepository.java` — Add overlap query, pagination.
19. `src/main/java/com/example/PawConnect/repository/ServiceBookingRepository.java` — Add overlap query, pagination.
20. `src/main/java/com/example/PawConnect/repository/ProductRepository.java` — Add atomic stock decrement, pagination.
21. `src/main/java/com/example/PawConnect/repository/PaymentRepository.java` — Add gateway lookups.
22. `src/main/java/com/example/PawConnect/repository/UserRoleRepository.java` — Add `findByUserId(Long userId)`.

### New Packages & Files to Create
- `com.example.PawConnect.config` (CorsConfig, WebSocketConfig, OpenApiConfig, JpaAuditingConfig)
- `com.example.PawConnect.dto.request.**` (RegisterRequest, LoginRequest, BookingRequests, CheckoutRequest, etc.)
- `com.example.PawConnect.dto.response.**` (AuthResponse, PageResponse, etc.)
- `com.example.PawConnect.exception` (Domain custom exceptions)
- `com.example.PawConnect.service.**` (AuthService, UserService, PetService, AppointmentService, OrderService, PaymentService, RazorpayService, NotificationService, AdminService)
- `com.example.PawConnect.controller.**` (AuthController, MeController, PublicController, AppointmentController, OrderController, PaymentController, AdminController, etc.)
- `com.example.PawConnect.model.PlatformSetting.java`
- `src/main/resources/db/migration/` (Flyway migration scripts)

---
*End of Audit Report.*
