# PawConnect Backend Implementation Plan & Refactoring Roadmap

**Project:** PawConnect Spring Boot Backend  
**Document:** Master Refactoring & Implementation Plan  
**Target Architecture:** Spring Boot + PostgreSQL + JWT + STOMP WebSocket + Razorpay  
**Frontend Client:** Next.js App Router (`/api` proxy)  

---

## Architecture Overview & Design Principles

1. **Clean Layered Architecture:**
   `Controller` → `Service` → `Repository` → `Database`
   - Controllers handle HTTP routing, request parsing, and validation.
   - Services enforce business invariants, security checks, and transaction boundaries.
   - Repositories encapsulate database access, pagination, and projection queries.
2. **Security-First Model:**
   - Role-Based Access Control via `@PreAuthorize("hasRole('...')")`.
   - Dedicated `AuthenticationEntryPoint` returning standard `ApiResponse` JSON on 401/403.
   - Externalized environment configuration for all credentials and secrets.
3. **Zero-Trust Pricing & Invariants:**
   - Server-side calculation of all amounts, discounts, taxes, and fees.
   - Server-side validation of appointment and service slot end times and provider availability.
4. **Resilient Real-time Model:**
   - Database is the durable source of truth for all notifications; WebSocket is an accelerator.

---

## Phase 0 — Audit / Refactor (Foundation Cleanup)

### Objectives
Resolve all immediate architectural risks, security bugs, and entity relationship flaws identified in `BACKEND_AUDIT_REPORT.md` without breaking baseline project compilation.

- **Entities Modified:**
  - `User.java`: Replace `@Data` with `@Getter`/`@Setter`/`@EqualsAndHashCode(of="id")`. Remove `CascadeType.ALL` from `payments`, `orders`, `statusChanges`, `auditLogs`, `createdProducts`.
  - `Product.java`: Remove `CascadeType.ALL` from `orderItems`. Rename `approvalStatus` to `status` (`ProductStatus.java`).
  - `Order.java`: Add denormalized snapshot fields (`deliveryRecipientName`, `deliveryPhone`, `deliveryAddressLine1`, `deliveryAddressLine2`, `deliveryCity`, `deliveryState`, `deliveryPostalCode`, `deliveryCountry`).
  - `Payment.java`: Add Razorpay metadata fields (`gatewayOrderId`, `gatewayPaymentId`, `gatewaySignature`, `currency`, `gatewayStatus`, `capturedAt`, `refundId`, `refundAmount`, `gatewayProvider`).
  - `Appointment.java` & `ServiceBooking.java`: Replace raw `payment_id` column with `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "payment_id") private Payment payment;`.
  - `Cart.java` & `CartItem.java`: Add database unique constraints (`(user_id, status)` and `(cart_id, product_id)`).
  - `Notification.java`: Add `NotificationType` enum and `dedupeKey` column.
- **DTOs:**
  - Standardize `ApiResponse<T>` with `code`, `timestamp`, `meta`, and `errors`.
  - Create `PageResponse<T>` pagination wrapper.
- **Repositories Modified:**
  - `UserRoleRepository`: Add `List<UserRole> findByUserId(Long userId)`.
  - `AppointmentRepository`: Add JPQL overlap query and `Page<Appointment>` methods.
  - `ServiceBookingRepository`: Add JPQL overlap query and `Page<ServiceBooking>` methods.
  - `ProductRepository`: Add atomic stock decrement `@Modifying` query.
- **Services:** N/A (Preparing repository and model contracts).
- **Controllers:** N/A.
- **Configuration:**
  - Externalize `application.yaml` secrets to environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`).
  - Remove hardcoded JWT secret fallback in `JwtService.java`.
- **Validation:** Add `spring-boot-starter-validation` dependency to `pom.xml`.
- **Authorization:** Fix `CustomUserDetailsService.java` to query by `userId` rather than in-memory `findAll()`.
- **Transactions:** Enable `@EnableTransactionManagement`.
- **Pagination:** Implement `PageResponse<T>` contract.
- **Notifications / Audit Logging:** Prepare entity structures.
- **Tests:** Verify existing `PawConnectApplicationTests.contextLoads()` passes cleanly.
- **Dependencies:** `spring-boot-starter-validation`.
- **Expected Endpoints:** None in Phase 0.

---

## Phase 1 — Infrastructure & Shared Utilities

### Objectives
Establish CORS, Global Exception Handling, Base Auditing, and Database Migration baseline.

- **Entities:** Create `PlatformSetting.java` (`key`, `value`, `description`, `updatedAt`).
- **DTOs:** `PlatformSettingDto`, `ErrorDetailDto`.
- **Repositories:** `PlatformSettingRepository`.
- **Services:** `PlatformSettingService` (cached retrieval of platform parameters).
- **Controllers:** `HealthController` (`/api/public/health`).
- **Configuration:**
  - `CorsConfig.java`: Allowed origins (`http://localhost:3000`), methods (`GET, POST, PUT, DELETE, PATCH, OPTIONS`), headers (`*`).
  - `JpaAuditingConfig.java`: `@EnableJpaAuditing` with `AuditorAware<String>` provider.
  - `OpenApiConfig.java`: Swagger UI at `/swagger-ui/index.html`.
- **Validation:** Configure `MethodArgumentNotValidException` mapping in `GlobalExceptionHandler`.
- **Authorization:** Update `SecurityConfig` to permit `/api/public/**`, `/swagger-ui/**`, `/v3/api-docs/**`.
- **Transactions:** Read-only transactions for platform settings cache.
- **Pagination:** Standard pagination parameters (`page`, `size`, `sort`) validation helper.
- **Notifications / Audit Logging:** Audit logger utility helper class.
- **Tests:** `GlobalExceptionHandlerTest`, `CorsConfigurationTest`.
- **Dependencies:** `springdoc-openapi-starter-webmvc-ui`, `flyway-core`, `flyway-database-postgresql`.
- **Expected Endpoints:**
  - `GET /api/public/health`
  - `GET /swagger-ui/index.html`

---

## Phase 2 — Authentication & Security Core

### Objectives
Production-ready JWT authentication, public registration, rate limiting, and password reset workflows.

- **Entities:** `User`, `Role`, `UserRole`.
- **DTOs:**
  - `RegisterRequest` (first name, last name, email, phone, password - NO role input).
  - `LoginRequest` (email, password).
  - `AuthResponse` (token, refreshToken, user profile summary, roles).
  - `RefreshTokenRequest`, `ForgotPasswordRequest`, `VerifyOtpRequest`, `ResetPasswordRequest`.
- **Repositories:** `UserRepository`, `RoleRepository`, `UserRoleRepository`.
- **Services:**
  - `AuthService`: Registration (strictly enforces `ROLE_PET_OWNER`), Login, Password validation, Refresh token issuance.
  - `OtpService`: 6-digit OTP generation, TTL expiry, attempt throttling.
- **Controllers:** `AuthController` (`/api/auth/**`).
- **Configuration:**
  - `SecurityConfig`: Stateless security chain, custom `DelegatedAuthenticationEntryPoint`, `JwtAuthenticationFilter` exception handling.
- **Validation:**
  - `@Email`, `@NotBlank`, `@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)...")` on passwords.
- **Authorization:** Public endpoints restricted to `/api/auth/**`.
- **Transactions:** `@Transactional` on registration and password change.
- **Pagination:** N/A.
- **Notifications:** Trigger welcome notification and OTP dispatch.
- **Audit Logging:** Log successful logins, failed attempts, and password resets.
- **Tests:** `AuthServiceTest`, `AuthControllerTest`, `JwtServiceTest`.
- **Dependencies:** `bucket4j-core` (or Spring rate-limiting filter).
- **Expected Endpoints:**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/verify-otp`
  - `POST /api/auth/reset-password`

---

## Phase 3 — Customer Core (Profiles, Pets, Addresses)

### Objectives
Self-service profile management, pet medical profiles, vaccination records, and saved addresses.

- **Entities:** `User`, `Pet`, `PetVaccination`, `PetMedicalRecord`, `Address`.
- **DTOs:**
  - `UpdateProfileRequest`, `ChangePasswordRequest`.
  - `CreatePetRequest`, `UpdatePetRequest`, `PetResponseDto`.
  - `CreateVaccinationRequest`, `CreateMedicalRecordRequest`.
  - `AddressRequest`, `AddressResponseDto`.
- **Repositories:** `PetRepository`, `PetVaccinationRepository`, `PetMedicalRecordRepository`, `AddressRepository`.
- **Services:**
  - `UserService`: Profile retrieval, updates, and password changes.
  - `PetService`: CRUD with strict pet-ownership authorization.
  - `AddressService`: Manage customer addresses with primary/default address logic.
- **Controllers:** `MeController` (`/api/me/**`).
- **Configuration:** Method security `@EnableMethodSecurity`.
- **Validation:** Pet birth dates in the past (`@PastOrPresent`), required fields validation.
- **Authorization:** Only authenticated users; resource ownership checks (`pet.getOwner().getId().equals(currentUser.getId())`).
- **Transactions:** `@Transactional` for pet/address mutations; read-only for queries.
- **Pagination:** `Page<PetResponseDto>` for pet listings if customer has multiple pets.
- **Notifications:** Vaccination due reminder scheduling hooks.
- **Audit Logging:** Log profile modifications and address changes.
- **Tests:** `PetServiceTest`, `PetOwnershipSecurityTest`.
- **Dependencies:** Standard Spring Boot dependencies.
- **Expected Endpoints:**
  - `GET /api/me`
  - `PUT /api/me`
  - `PUT /api/me/password`
  - `GET /api/me/pets`
  - `POST /api/me/pets`
  - `GET /api/me/pets/{id}`
  - `PUT /api/me/pets/{id}`
  - `DELETE /api/me/pets/{id}`
  - `GET /api/me/pets/{id}/vaccinations`
  - `POST /api/me/pets/{id}/vaccinations`
  - `GET /api/me/pets/{id}/medical-records`
  - `POST /api/me/pets/{id}/medical-records`
  - `GET /api/me/addresses`
  - `POST /api/me/addresses`
  - `PUT /api/me/addresses/{id}`
  - `DELETE /api/me/addresses/{id}`

---

## Phase 4 — Veterinary, Provider & Booking System

### Objectives
Public discovery of veterinarians and service providers, slot generation, appointment booking, concurrency locking, and status state machines.

- **Entities:**
  - `Veterinarian`, `VeterinarianAvailability`, `Appointment`.
  - `ServiceProvider`, `ServiceProviderAvailability`, `Service`, `ServiceBooking`.
- **DTOs:**
  - `BookAppointmentRequest`, `RescheduleAppointmentRequest`.
  - `BookServiceRequest`, `RescheduleBookingRequest`.
  - `SlotDto`, `VeterinarianPublicDto`, `ServiceProviderPublicDto`, `ServicePublicDto`.
- **Repositories:**
  - `VeterinarianRepository`, `VeterinarianAvailabilityRepository`, `AppointmentRepository`.
  - `ServiceProviderRepository`, `ServiceProviderAvailabilityRepository`, `ServiceRepository`, `ServiceBookingRepository`.
- **Services:**
  - `VeterinarianService`: Directory listing, profile management, verified-only queries.
  - `ServiceProviderService`: Directory listing, services catalog.
  - `AppointmentService`: Slot calculation, overlap validation, pessimistic locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`), booking creation.
  - `ServiceBookingService`: Slot validation, duration-based end time computation, locking, creation.
- **Controllers:**
  - `PublicDirectoryController` (`/api/public/veterinarians`, `/api/public/services`).
  - `AppointmentController` (`/api/appointments/**`, `/api/me/appointments`).
  - `ServiceBookingController` (`/api/service-bookings/**`, `/api/me/service-bookings`).
- **Configuration:** Task scheduling for appointment reminders.
- **Validation:** Appointment dates in future (`@Future`), valid working hours.
- **Authorization:**
  - Public can view active/verified providers.
  - Customers can book and cancel their own appointments.
  - Providers can confirm, start, complete, or reject bookings assigned to them.
- **Transactions:** Strict `@Transactional(isolation = Isolation.READ_COMMITTED)` on slot reservation with pessimistic locks.
- **Pagination:** Paged provider directory, paged appointment history.
- **Notifications:** Real-time and persistent alerts on `BOOKING_CREATED`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`.
- **Audit Logging:** Log status transitions (`PENDING` → `CONFIRMED` → `COMPLETED`).
- **Tests:** `AppointmentConcurrencyTest` (multi-threaded concurrent booking on identical slot).
- **Dependencies:** Standard Spring Boot JPA + Test harness.
- **Expected Endpoints:**
  - `GET /api/public/veterinarians`
  - `GET /api/public/veterinarians/{id}`
  - `GET /api/public/veterinarians/{id}/slots?date=YYYY-MM-DD`
  - `GET /api/public/services`
  - `GET /api/public/service-providers/{id}/slots?date=YYYY-MM-DD&serviceId=1`
  - `POST /api/appointments`
  - `GET /api/me/appointments`
  - `GET /api/appointments/{id}`
  - `POST /api/appointments/{id}/cancel`
  - `POST /api/appointments/{id}/reschedule`
  - `POST /api/service-bookings`
  - `GET /api/me/service-bookings`
  - `POST /api/service-bookings/{id}/cancel`

---

## Phase 5 — Commerce & Inventory (In-House Catalog & Cart)

### Objectives
Admin-managed product catalog, customer cart management, server-side price calculation, and atomic inventory reservation.

- **Entities:** `Product`, `ProductCategory`, `ProductImage`, `Cart`, `CartItem`, `Order`, `OrderItem`, `OrderStatusHistory`.
- **DTOs:**
  - `AddToCartRequest`, `UpdateCartItemRequest`, `CartResponseDto`.
  - `CheckoutRequest`, `OrderResponseDto`, `ProductFilterDto`.
- **Repositories:**
  - `ProductRepository`, `ProductCategoryRepository`, `CartRepository`, `CartItemRepository`, `OrderRepository`, `OrderItemRepository`.
- **Services:**
  - `ProductService`: Catalog listing with specifications, stock checks.
  - `CartService`: Add, update quantity, remove, and sync cart.
  - `OrderService`: Create order from cart, snapshot address, reserve inventory via atomic decrement.
- **Controllers:**
  - `PublicProductController` (`/api/public/products/**`).
  - `CartController` (`/api/me/cart/**`).
  - `OrderController` (`/api/orders/**`, `/api/me/orders/**`).
- **Configuration:** JpaSpecification support for product filters.
- **Validation:** Quantity > 0, valid shipping address selection.
- **Authorization:** Pet owners manage their own cart/orders; Admins manage product catalog.
- **Transactions:** `@Transactional` with atomic inventory updates during order placement.
- **Pagination:** `Page<ProductDto>`, `Page<OrderDto>`.
- **Notifications:** `ORDER_CREATED`, `ORDER_CONFIRMED`, `LOW_STOCK_ALERT` (to admin).
- **Audit Logging:** Audit log entries for order placement and status transitions.
- **Tests:** `CartServiceTest`, `OrderPlacementConcurrencyTest` (atomic decrement verification).
- **Dependencies:** Standard Spring Data JPA.
- **Expected Endpoints:**
  - `GET /api/public/products`
  - `GET /api/public/products/{id}`
  - `GET /api/public/product-categories`
  - `GET /api/me/cart`
  - `POST /api/me/cart/items`
  - `PUT /api/me/cart/items/{id}`
  - `DELETE /api/me/cart/items/{id}`
  - `DELETE /api/me/cart`
  - `POST /api/orders/checkout`
  - `GET /api/me/orders`
  - `GET /api/orders/{id}`
  - `POST /api/orders/{id}/cancel`

---

## Phase 6 — Razorpay Payment Gateway Integration

### Objectives
Secure payment initiation, server-side HMAC-SHA256 signature verification, webhook processing, and automatic order/booking confirmation.

- **Entities:** `Payment`, `Order`, `Appointment`, `ServiceBooking`.
- **DTOs:**
  - `CreatePaymentOrderRequest`, `PaymentOrderResponseDto`.
  - `VerifyPaymentRequest`, `PaymentVerificationResponseDto`.
  - `RazorpayWebhookPayload`.
- **Repositories:** `PaymentRepository`.
- **Services:**
  - `RazorpayService`: Initialize Razorpay client, create Razorpay Order, verify signature using HMAC-SHA256.
  - `PaymentService`: Orchestrate payment status updates, link to orders/appointments, handle refunds.
- **Controllers:**
  - `PaymentController` (`/api/payments/**`).
  - `WebhookController` (`/api/webhooks/razorpay`).
- **Configuration:**
  - `RazorpayConfig.java`: Configured with `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- **Validation:** Validate signature format, order ID matching, currency code (`INR`).
- **Authorization:** Authenticated customer for payment initiation/verification; Webhooks authenticated via raw body signature verification.
- **Transactions:** `@Transactional` on payment verification and fulfillment execution.
- **Pagination:** `Page<PaymentDto>` for customer payment history.
- **Notifications:** Real-time push for `PAYMENT_SUCCESS`, `PAYMENT_FAILED`.
- **Audit Logging:** Log gateway transaction IDs, reference IDs, and failure reasons.
- **Tests:** `RazorpaySignatureVerificationTest`, `WebhookHandlerTest`.
- **Dependencies:** `razorpay-java` (version 1.4.3+).
- **Expected Endpoints:**
  - `POST /api/payments/create-order`
  - `POST /api/payments/verify`
  - `POST /api/webhooks/razorpay`
  - `GET /api/me/payments`
  - `GET /api/payments/{id}`

---

## Phase 7 — Notifications & WebSocket Real-time Infrastructure

### Objectives
STOMP over WebSocket real-time alerts, in-app notification center, unread counters, and background reminder jobs.

- **Entities:** `Notification`.
- **DTOs:**
  - `NotificationDto`, `UnreadCountResponseDto`, `MarkReadRequest`.
- **Repositories:** `NotificationRepository`.
- **Services:**
  - `NotificationService`: Create notification in database (source of truth), then publish to STOMP destination (`/user/queue/notifications`).
  - `NotificationScheduler`: Batch jobs for upcoming appointment reminders (24h/2h before) using `dedupeKey`.
- **Controllers:**
  - `NotificationController` (`/api/notifications/**`).
  - `WebSocketNotificationEventListener`.
- **Configuration:**
  - `WebSocketConfig.java`: `@EnableWebSocketMessageBroker`, STOMP endpoint `/ws`, simple broker `/topic`, `/queue`, application prefix `/app`, user destination prefix `/user`.
  - `JwtChannelInterceptor`: Authenticate STOMP `CONNECT` frame via `Bearer` token header.
- **Validation:** Non-null title, message, and recipient.
- **Authorization:** STOMP destination restricted to authenticated user's queue.
- **Transactions:** Commit DB transaction prior to WebSocket dispatch (`TransactionSynchronizationManager.afterCommit`).
- **Pagination:** `Page<NotificationDto>` with sorting by `createdAt DESC`.
- **Notifications:** Engine itself.
- **Audit Logging:** Scheduled execution logs.
- **Tests:** `WebSocketConnectAuthTest`, `NotificationDeduplicationTest`.
- **Dependencies:** `spring-boot-starter-websocket`.
- **Expected Endpoints:**
  - `WS /ws` (STOMP connection endpoint)
  - `GET /api/notifications`
  - `GET /api/notifications/unread-count`
  - `PATCH /api/notifications/{id}/read`
  - `PATCH /api/notifications/read-all`

---

## Phase 8 — Admin Operations & Back-Office Control

### Objectives
Administrative verification of veterinarians/providers, product/inventory management, order fulfillment, moderation of reviews and reports, and audit trail inspection.

- **Entities:**
  - `User`, `Veterinarian`, `ServiceProvider`, `Product`, `Order`, `Review`, `Report`, `AuditLog`, `PlatformSetting`.
- **DTOs:**
  - `VerifyProfessionalRequest`, `AdminProductCreateRequest`, `AdminProductUpdateRequest`.
  - `AdminOrderStatusUpdateRequest`, `ModerateReviewRequest`, `ResolveReportRequest`.
  - `AuditLogFilterDto`, `PlatformSettingUpdateRequest`.
- **Repositories:** All repositories with `JpaSpecificationExecutor`.
- **Services:**
  - `AdminUserService`: Block/unblock users, assign roles.
  - `AdminVerificationService`: Approve/reject veterinarian and service provider credentials.
  - `AdminProductService`: Catalog CRUD, restock products.
  - `AdminOrderService`: Update order fulfillment (`PACKED`, `SHIPPED`, `DELIVERED`).
  - `AdminModerationService`: Moderate reviews and user-submitted reports.
  - `AuditLogService`: Query and log administrative actions.
- **Controllers:**
  - `AdminUserController` (`/api/admin/users/**`).
  - `AdminProviderController` (`/api/admin/professionals/**`).
  - `AdminProductController` (`/api/admin/products/**`).
  - `AdminOrderController` (`/api/admin/orders/**`).
  - `AdminReviewController` (`/api/admin/reviews/**`).
  - `AdminReportController` (`/api/admin/reports/**`).
  - `AdminAuditLogController` (`/api/admin/audit-logs/**`).
  - `AdminSettingController` (`/api/admin/settings/**`).
- **Configuration:** Role-based security `@PreAuthorize("hasRole('ADMIN')")`.
- **Validation:** Reason required on professional rejection or user account blocking.
- **Authorization:** Strictly restricted to `ROLE_ADMIN`.
- **Transactions:** Standard write transactions for all administrative state mutations.
- **Pagination:** All administrative tables paginated (`Pageable`, default size 20).
- **Notifications:** Alert professionals on verification status; alert customers on order status.
- **Audit Logging:** Mandatory audit log entry for every Admin state change with previous and updated data payloads.
- **Tests:** `AdminSecurityEnforcementTest`, `ProfessionalVerificationWorkflowTest`.
- **Dependencies:** Standard JPA and Security.
- **Expected Endpoints:**
  - `GET /api/admin/users`
  - `PATCH /api/admin/users/{id}/status`
  - `GET /api/admin/professionals/pending`
  - `POST /api/admin/professionals/{id}/verify`
  - `POST /api/admin/products`
  - `PUT /api/admin/products/{id}`
  - `PATCH /api/admin/orders/{id}/status`
  - `GET /api/admin/reviews`
  - `PATCH /api/admin/reviews/{id}/status`
  - `GET /api/admin/reports`
  - `PATCH /api/admin/reports/{id}/resolve`
  - `GET /api/admin/audit-logs`
  - `GET /api/admin/settings`
  - `PUT /api/admin/settings`

---

## Phase 9 — Next.js Frontend Integration & Contract Alignment

### Objectives
End-to-end alignment with the Next.js App Router client, response standardization, CORS verification, and TypeScript schema compatibility.

- **Entities:** N/A.
- **DTOs:** Full JSON schema alignment with Next.js frontend types (`ApiResponse<T>` wrapper contract).
- **Repositories:** N/A.
- **Services:** N/A.
- **Controllers:** Verification across all controllers for route paths matching frontend expectations (`/api/*`).
- **Configuration:**
  - Validate Next.js dev server (`http://localhost:3000`) and production origins in CORS policy.
  - Configure Cookie or Bearer header handling as expected by Next.js middleware.
- **Validation:** Ensure error response formats (`errors: [{ field, message }]`) align with frontend form handling.
- **Authorization:** Token refresh flow alignment.
- **Transactions:** N/A.
- **Pagination:** Verify Next.js pagination parameter names (`page`, `size`).
- **Notifications:** STOMP client compatibility over SockJS / native WebSocket.
- **Audit Logging:** Verify API access logging.
- **Tests:** End-to-end integration tests using MockMvc and simulated Next.js request headers.
- **Dependencies:** N/A.
- **Expected Endpoints:** Entire unified `/api` surface.

---

## Phase 10 — Production Hardening & QA

### Objectives
Automated database migration via Flyway, performance profiling, load testing, connection pooling, and final production checklist.

- **Entities:** Final schema freeze.
- **DTOs:** Documentation freeze.
- **Repositories:** Validate indexing (`EXPLAIN ANALYZE` on critical queries).
- **Services:** Production caching for platform settings and static categories (`@Cacheable`).
- **Controllers:** Rate limiting enabled on sensitive routes.
- **Configuration:**
  - Set `spring.jpa.hibernate.ddl-auto: validate`.
  - Configure HikariCP connection pool parameters (maximum pool size, connection timeout).
  - Actuator metrics enabled at `/actuator/health` and `/actuator/metrics`.
- **Validation:** Strict production sanity validation.
- **Authorization:** Full regression test across all 4 roles.
- **Transactions:** Deadlock prevention verification under simulated load.
- **Pagination:** Max page size limits enforced (max 100 items).
- **Notifications:** WebSocket disconnect and reconnect resilience testing.
- **Audit Logging:** Verification of immutability and retention.
- **Tests:**
  - Full unit and integration test suite (>80% coverage on service business rules).
  - Concurrency test suite (double booking, double checkout).
- **Dependencies:** `flyway-core`, `micrometer-registry-prometheus`.
- **Expected Endpoints:** `/actuator/health`, `/actuator/info`.

---

## Refactoring Execution Order Matrix

| Order | Phase | Focus | Primary Deliverables | Pre-requisites |
|---|---|---|---|---|
| 1 | **Phase 0** | Audit / Refactor | Fix entity relationships, remove unsafe cascades, fix `CustomUserDetailsService` | None |
| 2 | **Phase 1** | Infrastructure | CORS, Global Exception Handler, Swagger, Flyway baseline | Phase 0 |
| 3 | **Phase 2** | Auth / Security | Secure JWT, registration, login, rate limiting | Phase 1 |
| 4 | **Phase 3** | Customer Core | User profile, Pets, Medical records, Addresses | Phase 2 |
| 5 | **Phase 4** | Providers & Bookings | Slot calculation, overlap concurrency locking, appointment workflows | Phase 3 |
| 6 | **Phase 5** | Commerce | In-house catalog, Cart, checkout, atomic inventory decrement | Phase 3 |
| 7 | **Phase 6** | Razorpay | Order generation, signature verification, webhook processing | Phases 4, 5 |
| 8 | **Phase 7** | Real-time & WebSocket | STOMP setup, notification service, deduplicated reminders | Phases 2, 4, 5, 6 |
| 9 | **Phase 8** | Admin Operations | Professional verification, fulfillment, moderation, audit trail | All prior phases |
| 10 | **Phase 9** | Next.js Integration | Contract alignment, CORS verification, TypeScript alignment | Phase 8 |
| 11 | **Phase 10** | Production QA | `ddl-auto: validate`, load testing, connection pooling | Phase 9 |

---
*End of Implementation Plan.*
