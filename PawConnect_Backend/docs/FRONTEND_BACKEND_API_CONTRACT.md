# PawConnect Frontend-Backend API Contract (Phase 8)

**Target Backend Version:** PawConnect Spring Boot 4.1.1  
**Authoritative Base URL:** `http://localhost:8000/api`  
**WebSocket URL:** `http://localhost:8000/ws`  
**Standard Response Envelope:** `ApiResponse<T>`  
**Standard Paginated Envelope:** `PageResponse<T>`  

---

## 1. Response Envelopes & Error Handling

### 1.1 `ApiResponse<T>`
```typescript
export interface ApiResponse<T> {
  success: boolean;
  code: string;       // "SUCCESS", "VALIDATION_FAILED", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "INTERNAL_SERVER_ERROR"
  message: string;
  data: T;
  meta?: {
    requestId?: string;
    [key: string]: unknown;
  };
  errors?: string[];
  timestamp: string;
}
```

### 1.2 `PageResponse<T>`
```typescript
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  sort?: string;
}
```

---

## 2. API Endpoints Specification

### 2.1 Authentication & Profile (`/api/auth`, `/api/me`)

| Endpoint | Method | Role | Request DTO | Response DTO | Query Params | Relevant UI Screen |
|---|---|---|---|---|---|---|
| `/api/auth/register` | `POST` | Public | `RegisterRequest { firstName, lastName, email, password, phone? }` | `ApiResponse<AuthResponse>` | None | Auth Modal (Register View) |
| `/api/auth/login` | `POST` | Public | `LoginRequest { email, password }` | `ApiResponse<AuthResponse>` | None | Auth Modal (Login View) |
| `/api/auth/refresh` | `POST` | Public | `RefreshTokenRequest { refreshToken }` | `ApiResponse<AuthResponse>` | None | Background API Client Interceptor |
| `/api/auth/logout` | `POST` | Authenticated | `RefreshTokenRequest { refreshToken? }` | `ApiResponse<null>` | None | Topbar / Header Logout Actions |
| `/api/auth/forgot-password` | `POST` | Public | `ForgotPasswordRequest { email }` | `ApiResponse<null>` | None | Auth Modal (Forgot Password View) |
| `/api/auth/verify-otp` | `POST` | Public | `VerifyOtpRequest { email, otp }` | `ApiResponse<{ resetToken: string }>` | None | Auth Modal (OTP View) |
| `/api/auth/reset-password` | `POST` | Public | `ResetPasswordRequest { email, resetToken, newPassword }` | `ApiResponse<null>` | None | Auth Modal (Reset Password View) |
| `/api/me` | `GET` | Authenticated | None | `ApiResponse<UserResponse>` | None | App Header, Profile Page, Role Guard |
| `/api/me` | `PUT` | Authenticated | `UpdateProfileRequest { firstName, lastName, phone, profileImage? }` | `ApiResponse<UserResponse>` | None | Customer Profile Page |
| `/api/me/password` | `PUT` | Authenticated | `ChangePasswordRequest { currentPassword, newPassword }` | `ApiResponse<null>` | None | Customer Profile Security Settings |

---

### 2.2 Customer Address Book (`/api/me/addresses`)

| Endpoint | Method | Role | Request DTO | Response DTO | Query Params | Relevant UI Screen |
|---|---|---|---|---|---|---|
| `/api/me/addresses` | `GET` | `PET_OWNER` | None | `ApiResponse<AddressResponse[]>` | None | Profile Addresses, Checkout Address Drawer |
| `/api/me/addresses` | `POST` | `PET_OWNER` | `CreateAddressRequest { recipientName, recipientPhone, streetAddress, apartment, landmark, city, state, postalCode, addressType, isDefault }` | `ApiResponse<AddressResponse>` | None | Add Address Modal |
| `/api/me/addresses/{id}` | `GET` | `PET_OWNER` | None | `ApiResponse<AddressResponse>` | None | Address Detail Modal |
| `/api/me/addresses/{id}` | `PUT` | `PET_OWNER` | `UpdateAddressRequest { ... }` | `ApiResponse<AddressResponse>` | None | Edit Address Modal |
| `/api/me/addresses/{id}` | `DELETE` | `PET_OWNER` | None | `ApiResponse<null>` | None | Address Card Delete Button |
| `/api/me/addresses/{id}/default` | `PATCH` | `PET_OWNER` | None | `ApiResponse<AddressResponse>` | None | Address Card Set Default Button |

---

### 2.3 Customer Pets & Health Records (`/api/me/pets`)

| Endpoint | Method | Role | Request DTO | Response DTO | Query Params | Relevant UI Screen |
|---|---|---|---|---|---|---|
| `/api/me/pets` | `GET` | `PET_OWNER` | None | `ApiResponse<PageResponse<PetResponse>>` | `page, size, sort` | Pet Management Portal (`/app/pets`) |
| `/api/me/pets` | `POST` | `PET_OWNER` | `CreatePetRequest { name, species, breed, gender, birthDate, weightKg, microchipNumber, photoUrl, allergies, specialNeeds }` | `ApiResponse<PetResponse>` | None | Add Pet Modal / Form |
| `/api/me/pets/{petId}` | `GET` | `PET_OWNER` | None | `ApiResponse<PetResponse>` | None | Pet Details View (`/app/pets/[id]`) |
| `/api/me/pets/{petId}` | `PUT` | `PET_OWNER` | `UpdatePetRequest { ... }` | `ApiResponse<PetResponse>` | None | Edit Pet Modal / Form |
| `/api/me/pets/{petId}` | `DELETE` | `PET_OWNER` | None | `ApiResponse<null>` | None | Deactivate Pet Action |
| `/api/me/pets/{petId}/vaccinations` | `GET` | `PET_OWNER` | None | `ApiResponse<PageResponse<PetVaccinationResponse>>` | `page, size, sort` | Pet Vaccinations Tab |
| `/api/me/pets/{petId}/vaccinations` | `POST` | `PET_OWNER` | `CreateVaccinationRequest { vaccineName, vaccinationDate, nextDueDate, clinicName, batchNumber, notes }` | `ApiResponse<PetVaccinationResponse>` | None | Add Vaccination Modal |
| `/api/me/pets/{petId}/vaccinations/{vacId}` | `DELETE` | `PET_OWNER` | None | `ApiResponse<null>` | None | Delete Vaccination Action |
| `/api/me/pets/{petId}/medical-records` | `GET` | `PET_OWNER` | None | `ApiResponse<PageResponse<PetMedicalRecordResponse>>` | `page, size, sort` | Pet Medical History Tab |
| `/api/me/pets/{petId}/medical-records` | `POST` | `PET_OWNER` | `CreateMedicalRecordRequest { recordDate, diagnosis, treatment, clinicName, notes, attachmentUrls }` | `ApiResponse<PetMedicalRecordResponse>` | None | Add Medical Record Modal |
| `/api/me/pets/{petId}/medical-records/{recId}` | `DELETE` | `PET_OWNER` | None | `ApiResponse<null>` | None | Delete Medical Record Action |

---

### 2.4 Customer Bookings & Appointments (`/api/me/appointments`, `/api/me/service-bookings`, `/api/me/bookings`)

| Endpoint | Method | Role | Request DTO | Response DTO | Query Params | Relevant UI Screen |
|---|---|---|---|---|---|---|
| `/api/me/appointments` | `POST` | `PET_OWNER` | `CreateAppointmentRequest { petId, veterinarianId, appointmentDate, reason, notes, consultationType }` | `ApiResponse<AppointmentResponse>` | None | Veterinary Booking Modal |
| `/api/me/appointments` | `GET` | `PET_OWNER` | None | `ApiResponse<PageResponse<AppointmentResponse>>` | `status, page, size, sort` | Customer Bookings List |
| `/api/me/appointments/{id}` | `GET` | `PET_OWNER` | None | `ApiResponse<AppointmentResponse>` | None | Appointment Detail View |
| `/api/me/appointments/{id}/cancel` | `PATCH` | `PET_OWNER` | `CancelBookingRequest { reason }` | `ApiResponse<AppointmentResponse>` | None | Cancel Appointment Modal |
| `/api/me/service-bookings` | `POST` | `PET_OWNER` | `CreateServiceBookingRequest { petId, providerId, serviceType, bookingDate, notes, locationType }` | `ApiResponse<ServiceBookingResponse>` | None | Grooming / Training Booking Modal |
| `/api/me/service-bookings` | `GET` | `PET_OWNER` | None | `ApiResponse<PageResponse<ServiceBookingResponse>>` | `status, page, size, sort` | Customer Bookings List |
| `/api/me/service-bookings/{id}/cancel` | `PATCH` | `PET_OWNER` | `CancelBookingRequest { reason }` | `ApiResponse<ServiceBookingResponse>` | None | Cancel Service Booking Modal |
| `/api/me/bookings` | `GET` | `PET_OWNER` | None | `ApiResponse<PageResponse<BookingSummaryResponse>>` | `type, page, size, sort` | Unified Bookings Table |
| `/api/me/bookings/{id}/payments/order` | `POST` | `PET_OWNER` | `CreatePaymentOrderRequest` | `ApiResponse<RazorpayOrderResponse>` | None | Razorpay Booking Checkout |
| `/api/me/bookings/{id}/payment` | `GET` | `PET_OWNER` | None | `ApiResponse<PaymentResponse>` | `type` | Payment Status Badge |
| `/api/payments/razorpay/verify` | `POST` | Authenticated | `VerifyPaymentRequest { razorpayPaymentId, razorpayOrderId, razorpaySignature }` | `ApiResponse<PaymentResponse>` | None | Razorpay Modal Verification Callback |

---

### 2.5 Professional Portals (`/api/vet`, `/api/provider`)

| Endpoint | Method | Role | Request DTO | Response DTO | Query Params | Relevant UI Screen |
|---|---|---|---|---|---|---|
| `/api/vet/appointments` | `GET` | `VETERINARIAN` | None | `ApiResponse<PageResponse<AppointmentResponse>>` | `status, page, size, sort` | Vet Dashboard & Appointment List |
| `/api/vet/appointments/{id}` | `GET` | `VETERINARIAN` | None | `ApiResponse<AppointmentResponse>` | None | Vet Appointment Detail Modal |
| `/api/vet/appointments/{id}/status` | `PATCH` | `VETERINARIAN` | `UpdateBookingStatusRequest { status, notes }` | `ApiResponse<AppointmentResponse>` | None | Vet Status Update Controls |
| `/api/provider/bookings` | `GET` | `SERVICE_PROVIDER` | None | `ApiResponse<PageResponse<ServiceBookingResponse>>` | `status, page, size, sort` | Provider Dashboard & Bookings List |
| `/api/provider/bookings/{id}` | `GET` | `SERVICE_PROVIDER` | None | `ApiResponse<ServiceBookingResponse>` | None | Provider Booking Detail Modal |
| `/api/provider/bookings/{id}/status` | `PATCH` | `SERVICE_PROVIDER` | `UpdateBookingStatusRequest { status, notes }` | `ApiResponse<ServiceBookingResponse>` | None | Provider Status Update Controls |

---

### 2.6 Products, Cart, Orders & E-Commerce (`/api/products`, `/api/me/cart`, `/api/me/orders`)

| Endpoint | Method | Role | Request DTO | Response DTO | Query Params | Relevant UI Screen |
|---|---|---|---|---|---|---|
| `/api/products` | `GET` | Public | None | `ApiResponse<PageResponse<ProductResponse>>` | `search, categoryId, minPrice, maxPrice, inStock, featured, page, size, sort` | Shop Product Grid (`/shop`) |
| `/api/products/{id}` | `GET` | Public | None | `ApiResponse<ProductResponse>` | None | Product Detail Page (`/shop/[id]`) |
| `/api/products/categories` | `GET` | Public | None | `ApiResponse<ProductCategoryResponse[]>` | None | Shop Category Filters |
| `/api/products/featured` | `GET` | Public | None | `ApiResponse<ProductResponse[]>` | `limit` | Homepage / Shop Featured Carousel |
| `/api/me/cart` | `GET` | `PET_OWNER` | None | `ApiResponse<CartResponse>` | None | Cart Drawer & Checkout Summary |
| `/api/me/cart/items` | `POST` | `PET_OWNER` | `CreateCartItemRequest { productId, quantity }` | `ApiResponse<CartResponse>` | None | Add to Cart Button |
| `/api/me/cart/items/{itemId}` | `PUT` | `PET_OWNER` | `UpdateCartItemRequest { quantity }` | `ApiResponse<CartResponse>` | None | Cart Item Quantity +/- |
| `/api/me/cart/items/{itemId}` | `DELETE` | `PET_OWNER` | None | `ApiResponse<CartResponse>` | None | Cart Item Delete Button |
| `/api/me/cart` | `DELETE` | `PET_OWNER` | None | `ApiResponse<CartResponse>` | None | Clear Cart Button |
| `/api/me/orders` | `POST` | `PET_OWNER` | `CheckoutRequest { shippingAddressId, customerNotes? }` | `ApiResponse<OrderResponse>` | None | Place Order Button |
| `/api/me/orders` | `GET` | `PET_OWNER` | None | `ApiResponse<PageResponse<OrderResponse>>` | `page, size, sort` | Order History (`/app/orders`) |
| `/api/me/orders/{id}` | `GET` | `PET_OWNER` | None | `ApiResponse<OrderResponse>` | None | Order Details Modal / View |
| `/api/me/orders/{id}/items` | `GET` | `PET_OWNER` | None | `ApiResponse<OrderItemResponse[]>` | None | Order Items List |
| `/api/me/orders/{id}/cancel` | `PATCH` | `PET_OWNER` | `{ reason?: string }` | `ApiResponse<OrderResponse>` | None | Cancel Order Action |
| `/api/me/orders/{id}/payments/order` | `POST` | `PET_OWNER` | `CreatePaymentOrderRequest` | `ApiResponse<RazorpayOrderResponse>` | None | Order Razorpay Checkout |
| `/api/me/orders/{id}/payment` | `GET` | `PET_OWNER` | None | `ApiResponse<PaymentResponse>` | None | Order Payment Details |

---

### 2.7 Persistent & Real-Time Notifications (`/api/me/notifications`, `/ws`)

| Endpoint | Protocol / Method | Role | Request | Response | Notes / UI Screen |
|---|---|---|---|---|---|
| `/api/me/notifications` | `GET` | Authenticated | None | `ApiResponse<PageResponse<NotificationResponse>>` | Notifications Dropdown & Page |
| `/api/me/notifications/unread-count` | `GET` | Authenticated | None | `ApiResponse<UnreadCountResponse>` | Header Bell Unread Badge |
| `/api/me/notifications/{id}/read` | `PATCH` | Authenticated | None | `ApiResponse<NotificationResponse>` | Notification Item Click |
| `/api/me/notifications/read-all` | `PATCH` | Authenticated | None | `ApiResponse<null>` | Mark All Read Button |
| `/api/me/notifications/{id}` | `DELETE` | Authenticated | None | `ApiResponse<null>` | Delete Notification Action |
| `/ws` | STOMP CONNECT | Authenticated | Header: `Authorization: Bearer <accessToken>` | STOMP CONNECTED Frame | WebSocket Hook / Provider |
| `/user/queue/notifications` | STOMP SUBSCRIBE | Authenticated | Subscription destination | `NotificationResponse` push | Triggers React Query invalidation & Sonner toast |

---

### 2.8 Administrative Portal (`/api/admin/*`)

| Endpoint | Method | Role | Request DTO | Response DTO | Query Params | Relevant UI Screen |
|---|---|---|---|---|---|---|
| `/api/admin/dashboard/summary` | `GET` | `ADMIN` | None | `ApiResponse<DashboardSummaryResponse>` | None | Admin Dashboard Overview |
| `/api/admin/users` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<UserResponse>>` | `search, role, status, startDate, endDate, page, size, sort` | Admin Users Table |
| `/api/admin/users/{id}` | `GET` | `ADMIN` | None | `ApiResponse<UserResponse>` | None | User Details Drawer |
| `/api/admin/users/{id}/status` | `PATCH` | `ADMIN` | `UpdateUserStatusRequest { status, reason }` | `ApiResponse<UserResponse>` | None | User Status Toggle |
| `/api/admin/users` | `POST` | `ADMIN` | `CreateUserRequest { firstName, lastName, email, phone, role, password }` | `ApiResponse<UserResponse>` | None | Create User Modal |
| `/api/admin/users/{id}` | `PUT` | `ADMIN` | `UpdateUserRequest { firstName, lastName, phone, status }` | `ApiResponse<UserResponse>` | None | Edit User Modal |
| `/api/admin/veterinarians` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<AdminVeterinarianResponse>>` | `verificationStatus, isActive, search, page, size, sort` | Admin Vets Table |
| `/api/admin/veterinarians/{id}/verification` | `PATCH` | `ADMIN` | `VerificationRequest { status, rejectionReason }` | `ApiResponse<AdminVeterinarianResponse>` | None | Vet Verification Modal |
| `/api/admin/veterinarians/{id}/status` | `PATCH` | `ADMIN` | `UpdateEntityStatusRequest { isActive, reason }` | `ApiResponse<AdminVeterinarianResponse>` | None | Vet Active Toggle |
| `/api/admin/service-providers` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<AdminServiceProviderResponse>>` | `verificationStatus, isActive, providerType, search, page, size, sort` | Admin Providers Table |
| `/api/admin/service-providers/{id}/verification` | `PATCH` | `ADMIN` | `VerificationRequest { status, rejectionReason }` | `ApiResponse<AdminServiceProviderResponse>` | None | Provider Verification Modal |
| `/api/admin/service-providers/{id}/status` | `PATCH` | `ADMIN` | `UpdateEntityStatusRequest { isActive, reason }` | `ApiResponse<AdminServiceProviderResponse>` | None | Provider Active Toggle |
| `/api/admin/appointments` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<AppointmentResponse>>` | `status, veterinarianId, userId, startDate, endDate, page, size, sort` | Admin Appointments Oversight |
| `/api/admin/service-bookings` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<ServiceBookingResponse>>` | `status, providerId, userId, startDate, endDate, page, size, sort` | Admin Service Bookings Oversight |
| `/api/admin/payments` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<PaymentResponse>>` | `status, paymentFor, userId, page, size, sort` | Admin Payments Oversight |
| `/api/admin/products` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<ProductResponse>>` | `search, categoryId, status, isActive, page, size, sort` | Admin Products Management |
| `/api/admin/products` | `POST` | `ADMIN` | `ProductRequest { name, description, price, originalPrice, categoryId, stockQuantity, sku, images, featured, status }` | `ApiResponse<ProductResponse>` | None | Add Product Modal |
| `/api/admin/products/{id}` | `PUT` | `ADMIN` | `ProductRequest { ... }` | `ApiResponse<ProductResponse>` | None | Edit Product Modal |
| `/api/admin/products/{id}/status` | `PATCH` | `ADMIN` | `UpdateProductStatusRequest { status }` | `ApiResponse<ProductResponse>` | None | Product Status Select |
| `/api/admin/products/{id}/stock` | `PATCH` | `ADMIN` | `UpdateStockRequest { stockQuantity }` | `ApiResponse<ProductResponse>` | None | Stock Update Input |
| `/api/admin/categories` | `GET` | `ADMIN` | None | `ApiResponse<ProductCategoryResponse[]>` | None | Categories List |
| `/api/admin/categories` | `POST` | `ADMIN` | `CategoryRequest { name, description, slug, icon, displayOrder }` | `ApiResponse<ProductCategoryResponse>` | None | Create Category Modal |
| `/api/admin/categories/{id}` | `PUT` | `ADMIN` | `CategoryRequest { ... }` | `ApiResponse<ProductCategoryResponse>` | None | Edit Category Modal |
| `/api/admin/orders` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<OrderResponse>>` | `status, paymentStatus, userId, page, size, sort` | Admin Orders Management |
| `/api/admin/orders/{id}` | `GET` | `ADMIN` | None | `ApiResponse<OrderResponse>` | None | Admin Order Detail Drawer |
| `/api/admin/orders/{id}/status` | `PATCH` | `ADMIN` | `OrderStatusRequest { status, trackingNumber?, carrier?, reason? }` | `ApiResponse<OrderResponse>` | None | Update Order Status Modal |
| `/api/admin/reviews` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<ReviewResponse>>` | `status, userId, page, size, sort` | Admin Reviews Moderation |
| `/api/admin/reviews/{id}/status` | `PATCH` | `ADMIN` | `ReviewModerationRequest { status, moderationNotes }` | `ApiResponse<ReviewResponse>` | None | Moderate Review Modal |
| `/api/admin/reports` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<ReportResponse>>` | `status, reportType, reportedById, page, size, sort` | Admin Reports Moderation |
| `/api/admin/reports/{id}/status` | `PATCH` | `ADMIN` | `ReportResolutionRequest { status, resolutionNotes, actionTaken }` | `ApiResponse<ReportResponse>` | None | Resolve Report Modal |
| `/api/admin/audit-logs` | `GET` | `ADMIN` | None | `ApiResponse<PageResponse<AuditLogResponse>>` | `userId, module, action, entityType, startDate, endDate, page, size, sort` | Admin Audit Logs (Read-Only) |
| `/api/admin/audit-logs/{id}` | `GET` | `ADMIN` | None | `ApiResponse<AuditLogResponse>` | None | Audit Log Detail Modal |
| `/api/admin/settings` | `GET` | `ADMIN` | None | `ApiResponse<PlatformSettingResponse[]>` | None | Platform Settings Page |
| `/api/admin/settings/{key}` | `PUT` | `ADMIN` | `PlatformSettingRequest { settingValue, description }` | `ApiResponse<PlatformSettingResponse>` | None | Edit Platform Setting Modal |
