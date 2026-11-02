# PawConnect Spring Boot Backend — Phase 0 Implementation Report

**Document Status:** Complete  
**Date:** October 9, 2026  
**Phase:** Phase 0 — Backend Refactor + Security + Infrastructure Hardening  
**Target Platform:** Spring Boot 4.1.1 / Java 17 (Java 21 runtime) / PostgreSQL (Neon)

---

## 1. Executive Summary & Changes Made

Phase 0 successfully transitioned the PawConnect Spring Boot backend from an audited skeleton with critical vulnerabilities (hardcoded database credentials, hardcoded JWT fallback, in-memory `findAll()` role authorization, dangerous cascade deletes, lack of request validation, missing indexes, unhandled exception 500 crashes) into a hardened, secure, production-ready foundation.

### Scope Boundary Enforcement
- **Strict Role Model Enforced:** PawConnect operates exclusively with four active roles:
  - `PET_OWNER`
  - `VETERINARIAN`
  - `SERVICE_PROVIDER`
  - `ADMIN`
- **Zero Vendor / Multi-Vendor Code:** There is no `VENDOR` role, no vendor verifications, no seller commission/payout logic, and no multi-vendor checkout. All catalog products are PawConnect-owned and Admin-managed.
- **Phase Boundary Respected:** Zero controllers, zero business services, zero Razorpay network clients, and zero WebSocket handlers were implemented. The application is strictly prepared for subsequent phases.

---

## 2. Security Hardening

| Component | Before Refactor | Hardened Implementation |
| :--- | :--- | :--- |
| **Database Credentials** | Hard-coded Neon connection string, user, and password in `application.yaml`. | Completely externalized to environment variables (`${DB_URL}`, `${DB_USERNAME}`, `${DB_PASSWORD}`) with fail-fast validation. No plaintext credentials in repo. |
| **Git Secrets Exclusion** | `.gitignore` lacked coverage for local environment files. | Updated `.gitignore` to explicitly ignore `.env`, `.env.*`, `application-local.yaml`, and credential dumps. |
| **Credential Rotation Notice** | Legacy credentials were committed to repository history. | **CRITICAL:** Immediate rotation of the Neon database credentials and any exposed secrets is required prior to production deployment. |
| **JWT Secret & Lifetime** | Hard-coded fallback secret in `JwtService.java`; indefinite or unspecified expiry. | Configurable `security.jwt.secret` (minimum 256 bits). Default expiration reduced to 15 minutes (`900000ms`). Hardcoded fallback completely eliminated. |
| **JWT Error Handling** | Expired or malformed tokens propagated unhandled exceptions causing HTTP 500 errors. | Wrapped in `JwtAuthenticationFilter` with granular catch blocks (`ExpiredJwtException`, `MalformedJwtException`, `SignatureException`). Invalid tokens fail gracefully and delegate to Spring Security entry point returning HTTP 401. |
| **User Status Checks** | Loose string matching for status checks; inactive/blocked users could authenticate. | Type-safe `UserStatus` enum validation (`user.getStatus() == UserStatus.ACTIVE`) in `UserDetailsImpl`, `JwtAuthenticationFilter`, and `CustomUserDetailsService`. Blocked/inactive users are rejected with HTTP 401 Unauthorized. |
| **Role Query Authorization** | Loaded all system user-roles via `userRoleRepository.findAll()` and filtered in Java memory. | Optimized with user-specific query: `findByUserIdWithRole(Long userId)` using a single `JOIN FETCH ur.role` query. O(1) database fetch rather than O(N) table scan. |
| **CORS Policy** | Default or missing CORS allowing potential cross-origin vulnerabilities. | Configured explicit `CorsConfigurationSource` targeting Next.js frontend (`http://localhost:3000`). Restricted HTTP methods (`GET, POST, PUT, PATCH, DELETE, OPTIONS`), explicitly allowed headers, credentials enabled without wildcard origins. |
| **Security Exceptions** | Default HTML error responses or uncaught exceptions. | Implemented custom JSON `AuthenticationEntryPoint` (HTTP 401) and `AccessDeniedHandler` (HTTP 403) matching the standard `ApiResponse` envelope. |

---

## 3. JPA Entity Hardening & Cascades

### Removal of Unsafe `@Data` Annotations
All 28 JPA entity classes were refactored to replace Lombok's `@Data` with:
- `@Getter`, `@Setter`
- `@NoArgsConstructor`, `@AllArgsConstructor`
- `@Builder`
- `@EqualsAndHashCode(of = "id")` — safe identity equality preventing lazy-loading recursion and hash code instability.
- `@ToString(exclude = { ... })` — bidirectional relationships excluded to prevent cyclic recursion and `StackOverflowError`.

### Cascade Relationship Hardening (Task 5)
Dangerous `CascadeType.ALL` and `orphanRemoval = true` were removed from historical and independent business records:
- **`User.java`**: Historical records (`orders`, `payments`, `auditLogs`, `notifications`, `reviews`, `reports`, `createdProducts`) are preserved even if a user account is deactivated or deleted. Cascades restricted strictly to user profile lifecycle (`roles`, `addresses`).
- **`Pet.java`**: Kept safe cascades for aggregate-owned entities (`vaccinations`, `medicalRecords`), but disassociated historical appointments and bookings.
- **`Veterinarian.java` & `ServiceProvider.java`**: Reviews, appointments, and bookings decoupled from cascade deletion.
- **`Product.java`**: Retained cascade for owned child elements (`productImages`), decoupled historical order items and cart items.
- **`Order.java`**: Retained cascade for owned items (`orderItems`, `orderStatusHistories`).

### Key Model Enhancements
1. **Order Address Snapshot (Task 6):**
   - Added immutable snapshot fields to `Order.java`:
     - `deliveryRecipientName`, `deliveryPhone`
     - `deliveryAddressLine1`, `deliveryAddressLine2`
     - `deliveryCity`, `deliveryState`, `deliveryPostalCode`, `deliveryCountry`
   - Retained `deliveryAddress` (`@ManyToOne`) for traceability, while guaranteeing historical delivery address records remain immutable even if the customer edits or deletes their address book entry.
2. **Payment Relationships & Gateway Metadata (Task 7):**
   - In `Appointment.java` and `ServiceBooking.java`, replaced raw `paymentId` Long columns with `@ManyToOne(fetch = FetchType.LAZY) Payment payment`.
   - In `Payment.java`, added Razorpay fields:
     - `gatewayProvider`
     - `gatewayOrderId`, `gatewayPaymentId`, `gatewaySignature`
     - `currency`, `gatewayStatus`
     - `capturedAt`
     - `refundId`, `refundAmount`
3. **Product Status Cleanup (Task 8):**
   - Removed legacy `ProductApprovalStatus.java` and its approval semantics.
   - Introduced `ProductStatus.java` (`ACTIVE`, `INACTIVE`).
   - Clean PawConnect-owned and Admin-managed catalog architecture.
4. **Cart Uniqueness Constraints (Task 9):**
   - `Cart.java`: Unique constraint on `[user_id, status]` to enforce at most one active cart per user.
   - `CartItem.java`: Unique constraint on `[cart_id, product_id]` to prevent duplicate item rows for the same product in a cart.
5. **Notification Model Preparation (Task 10):**
   - Created `NotificationType.java` with 24 strongly-typed domain events (`BOOKING_CREATED`, `PAYMENT_SUCCESS`, `ORDER_SHIPPED`, `VACCINATION_REMINDER`, etc.).
   - Added `dedupeKey` column with index on `Notification.java` to support idempotent reminder scheduling.
6. **Platform Setting Entity (Task 21):**
   - Created `model/PlatformSetting.java` and `PlatformSettingRepository.java` to persist configurable platform parameters (cancellation windows, shipping thresholds, tax rates) in key-value structure.

---

## 4. DTO & Validation Foundation (Tasks 13 & 14)

Created 23 request DTOs under `dto/request/` with Jakarta Bean Validation (`@NotNull`, `@NotBlank`, `@Email`, `@Size`, `@Positive`, `@PositiveOrZero`, `@Pattern`, `@DecimalMin`, `@Future`, `@Past`):

- **Auth:** `RegisterRequest`, `LoginRequest` (with confirm-password matching support).
- **Pet:** `CreatePetRequest`, `UpdatePetRequest`, `CreateVaccinationRequest`, `UpdateVaccinationRequest`, `CreateMedicalRecordRequest`, `UpdateMedicalRecordRequest`.
- **Address:** `CreateAddressRequest`, `UpdateAddressRequest`.
- **Professional:** `UpdateVeterinarianProfileRequest`, `UpdateProviderProfileRequest`, `UpdateAvailabilityRequest`.
- **Service:** `CreateServiceRequest`, `UpdateServiceRequest`.
- **Booking:** `CreateAppointmentRequest`, `CreateServiceBookingRequest`, `RescheduleBookingRequest`.
- **Commerce:** `CreateCartItemRequest`, `UpdateCartItemRequest`, `CheckoutRequest`.
- **Review:** `CreateReviewRequest`, `UpdateReviewRequest`.
- **Report:** `CreateReportRequest`.
- **Admin:** `CreateUserRequest`, `UpdateUserRequest`, `UpdateUserStatusRequest`, `VerificationRequest`, `ProductRequest`, `CategoryRequest`, `OrderStatusRequest`, `ReviewModerationRequest`, `ReportResolutionRequest`, `PlatformSettingRequest`.

---

## 5. Domain Exception & Error Handling Foundation (Task 15)

Created 10 strongly-typed domain exceptions under `exception/`:
- `ResourceNotFoundException` (404)
- `DuplicateResourceException` (409)
- `BusinessRuleException` (400)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `SlotConflictException` (409)
- `InsufficientStockException` (409)
- `PaymentException` (400)
- `PaymentVerificationException` (400)
- `InvalidStateTransitionException` (400)

### Sanitized `GlobalExceptionHandler`
- Mapped all Jakarta validation failures (`MethodArgumentNotValidException`, `ConstraintViolationException`) to detailed field-level error maps.
- Explicitly handles `BadCredentialsException`, `AccessDeniedException`, and domain exceptions.
- Completely sanitized generic fallback (500 Internal Server Error) to return `"An unexpected error occurred. Please contact support."` without leaking raw database queries, SQL errors, or stack traces.

---

## 6. Response & Pagination Contracts (Tasks 16 & 17)

- Upgraded `ApiResponse<T>` with standardized structure:
  - `success` (boolean)
  - `code` (string / HTTP status code)
  - `message` (string)
  - `data` (payload T)
  - `meta` (optional metadata map)
  - `errors` (field errors map or list)
  - `timestamp` (ISO-8601 `LocalDateTime`)
- Created `PageResponse<T>` wrapper to encapsulate pagination metadata cleanly (`content`, `page`, `size`, `totalElements`, `totalPages`, `first`, `last`, `sort`) rather than returning internal Spring `Page` representations.
- Added `Pageable` support across list repositories (`UserRepository`, `AppointmentRepository`, `ServiceBookingRepository`, `ProductRepository`, `OrderRepository`, `ReviewRepository`, `ReportRepository`, `NotificationRepository`, `AuditLogRepository`).

---

## 7. Repositories & Concurrency Preparation (Tasks 18–20)

1. **Booking Conflict Prevention (Task 18):**
   - Implemented overlap queries in `AppointmentRepository` and `ServiceBookingRepository`:
     - `existing.startTime < :endTime AND existing.endTime > :startTime`
     - Filtering out terminal/cancelled states (`CANCELLED`, `REJECTED`).
2. **Atomic Stock Decrement (Task 19):**
   - Added atomic conditional update query in `ProductRepository`:
     ```sql
     UPDATE Product p SET p.stockQuantity = p.stockQuantity - :qty 
     WHERE p.id = :id AND p.stockQuantity >= :qty
     ```
   - Annotated with `@Modifying(clearAutomatically = true, flushAutomatically = true)` to ensure persistence context synchronization.
3. **Payment Gateway Lookups (Task 20):**
   - Added gateway indexing and repository lookups:
     - `findByGatewayOrderId(String gatewayOrderId)`
     - `findByGatewayPaymentId(String gatewayPaymentId)`
     - `findByPaymentReference(String paymentReference)`

---

## 8. Database Migration & Flyway Foundation (Task 22)

- Added Flyway migration dependencies (`flyway-core`, `flyway-database-postgresql`) to `pom.xml`.
- Configured safe migration baseline in `application.yaml`:
  - `spring.flyway.baseline-on-migrate: true`
  - `spring.flyway.baseline-version: 0`
- Documented baseline strategy in `src/main/resources/db/migration/README.md`.
- **Zero Destructive Actions:** No tables were dropped, truncated, or recreated. Existing PostgreSQL database schema is preserved.

---

## 9. Comprehensive Test Suite (Task 27)

Added 3 test suites verifying all hardening pillars:
1. **`SecurityHardeningTests` (5 tests):**
   - `testInvalidJwtRejected`
   - `testExpiredJwtRejected`
   - `testUnknownUserAuthenticationFails`
   - `testBlockedUserAuthenticationFails`
   - `testValidJwtGenerationAndSubjectExtraction`
2. **`ValidationTests` (7 tests):**
   - `testInvalidEmailRejected`
   - `testBlankRequiredFieldRejected`
   - `testShortPasswordRejected`
   - `testNegativePriceRejected`
   - `testNegativeStockRejected`
   - `testInvalidAvailabilityWindow`
   - `testValidRegistrationRequest`
3. **`RepositoryHardeningTests` (3 tests):**
   - `testUserRoleLookupLoadsOnlyTargetUserRoles` (verifying isolation from `findAll()`)
   - `testAtomicStockDecrement` (verifying conditional decrement and oversell prevention)
   - `testAppointmentOverlapDetection` (verifying slot conflict detection query)
4. **`PawConnectApplicationTests` (1 test):**
   - Application context initialization verification.

**Total Tests:** 16 tests executed, 0 failures, 0 errors.

---

## 10. Build Verification (Task 28)

### Maven Test Execution:
```bash
.\mvnw.cmd test
```
**Result:** `BUILD SUCCESS` (16 tests passed).

### Maven Verify Execution:
```bash
.\mvnw.cmd clean verify
```
**Result:** `BUILD SUCCESS` (packaged JAR created without errors).

---

## 11. Files Changed & Created

### Modified Files:
- `.gitignore`
- `pom.xml`
- `src/main/resources/application.yaml`
- `src/main/java/com/example/PawConnect/security/JwtService.java`
- `src/main/java/com/example/PawConnect/security/JwtAuthenticationFilter.java`
- `src/main/java/com/example/PawConnect/security/CustomUserDetailsService.java`
- `src/main/java/com/example/PawConnect/security/UserDetailsImpl.java`
- `src/main/java/com/example/PawConnect/security/SecurityConfig.java`
- `src/main/java/com/example/PawConnect/exception/GlobalExceptionHandler.java`
- `src/main/java/com/example/PawConnect/response/ApiResponse.java`
- `src/main/java/com/example/PawConnect/dto/ProductDto.java`
- `src/main/java/com/example/PawConnect/dto/NotificationDto.java`
- All 28 entities in `src/main/java/com/example/PawConnect/model/`
- All repositories in `src/main/java/com/example/PawConnect/repository/`

### Deleted Files:
- `src/main/java/com/example/PawConnect/model/ProductApprovalStatus.java` (replaced with `ProductStatus.java`)

### Created Files:
- `src/main/java/com/example/PawConnect/config/JpaConfig.java`
- `src/main/java/com/example/PawConnect/model/ProductStatus.java`
- `src/main/java/com/example/PawConnect/model/NotificationType.java`
- `src/main/java/com/example/PawConnect/model/PlatformSetting.java`
- `src/main/java/com/example/PawConnect/repository/PlatformSettingRepository.java`
- `src/main/java/com/example/PawConnect/response/PageResponse.java`
- 10 exception classes in `src/main/java/com/example/PawConnect/exception/`
- 23 request DTO classes in `src/main/java/com/example/PawConnect/dto/request/`
- `src/main/resources/db/migration/README.md`
- `src/test/resources/application.yaml`
- `src/test/java/com/example/PawConnect/security/SecurityHardeningTests.java`
- `src/test/java/com/example/PawConnect/validation/ValidationTests.java`
- `src/test/java/com/example/PawConnect/repository/RepositoryHardeningTests.java`

---

## 12. Unresolved Issues & Recommendations
1. **Neon Secret Rotation:** Neon DB credentials committed in earlier repository commits must be rotated immediately.
2. **Phase 1 Readiness:** The backend is fully hardened and ready for Phase 1 (Authentication and User Profile APIs). No controllers or business services have been added in accordance with Phase 0 stop conditions.
