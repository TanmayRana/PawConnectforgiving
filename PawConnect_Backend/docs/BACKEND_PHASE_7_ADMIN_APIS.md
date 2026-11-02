# PawConnect Backend — Phase 7: Administrative APIs Specification

## 1. Overview

Phase 7 implements administrative and platform management capabilities for the PawConnect Spring Boot backend. Administrative endpoints are strictly accessible only by authenticated users with the `ROLE_ADMIN` authority (`@PreAuthorize("hasRole('ADMIN')")`).

Administrative capabilities include:
- **User Management**: Paginated search, inspection, activation, blocking, creation, updating, and protection against deactivating the last active administrator.
- **Professional Management**: Veterinarian and Service Provider listing, detail inspection, verification approval/rejection with notes, and active status toggling.
- **Booking Oversight**: System-wide inspection of veterinary appointments and service bookings with date, provider, and status filters.
- **Commerce & Payment Oversight**: Read-only payment auditing and inspection, integration with existing product catalogue and order fulfillment pipelines.
- **Moderation**: Content review moderation (VISIBLE, REPORTED, HIDDEN) and user report lifecycle resolution.
- **Platform Settings**: Read and write APIs for platform configuration with allow-listed keys, range validation, and credential protection.
- **Administrative Dashboard**: Aggregated system metrics computed via database queries.

---

## 2. Security and Authorization Rules

1. **Role Enforcement**: Every administrative route requires `ROLE_ADMIN`. Non-ADMIN authenticated users receive `403 Forbidden` (`FORBIDDEN`), and unauthenticated requests receive `401 Unauthorized` (`UNAUTHORIZED`).
2. **Actor Immutability**: All administrative actions pull the actor identity from the security context (`CurrentUserService.getCurrentUser()`). Clients cannot supply or override actor IDs.
3. **Sensitive Field Exclusion**: User endpoints never return password hashes, token versions, refresh tokens, OTPs, or reset secrets.
4. **Last Active Admin Invariant**: An administrator cannot deactivate (`INACTIVE`), block (`BLOCKED`), or remove the `ADMIN` role from the system's last active administrator (`countActiveByRoleCode("ADMIN", ACTIVE) <= 1`).
5. **Fixed Role Model**: Only four fixed roles are supported: `PET_OWNER`, `VETERINARIAN`, `SERVICE_PROVIDER`, `ADMIN`. Attempts to assign or introduce arbitrary roles (e.g., `SUPER_ADMIN`, `VENDOR`) are rejected with `BUSINESS_RULE_VIOLATION`.

---

## 3. Administrative User Management API

Base Path: `/api/admin/users`

### 3.1 List Users
- **Method**: `GET`
- **Path**: `/api/admin/users`
- **Query Parameters**:
  - `search` (string, optional): Matches `firstName`, `lastName`, `email`, or `phone`.
  - `role` (string, optional): Filters by role code (`PET_OWNER`, `VETERINARIAN`, `SERVICE_PROVIDER`, `ADMIN`).
  - `status` (`UserStatus`, optional): `ACTIVE`, `INACTIVE`, `BLOCKED`, `PENDING`.
  - `startDate` (ISO Date, optional): Registration date from.
  - `endDate` (ISO Date, optional): Registration date to.
  - `page`, `size`, `sort` (Pageable, max size: 100, allowed sort fields: `id`, `firstName`, `lastName`, `email`, `createdAt`, `status`).
- **Response**: `ApiResponse<PageResponse<UserResponse>>`

### 3.2 Get User by ID
- **Method**: `GET`
- **Path**: `/api/admin/users/{userId}`
- **Response**: `ApiResponse<UserResponse>`

### 3.3 Update User Status
- **Method**: `PATCH`
- **Path**: `/api/admin/users/{userId}/status`
- **Request Body**:
  ```json
  {
    "status": "BLOCKED",
    "reason": "Suspicious login attempts"
  }
  ```
- **Response**: `ApiResponse<UserResponse>`
- **Auditing**: Emits `USER_STATUS_UPDATED` audit record.

### 3.4 Create User (Administrative)
- **Method**: `POST`
- **Path**: `/api/admin/users`
- **Request Body**:
  ```json
  {
    "firstName": "Admin",
    "lastName": "Staff",
    "email": "staff@pawconnect.com",
    "phone": "+919876543210",
    "password": "SecurePassword123!",
    "status": "ACTIVE",
    "roleCodes": ["ADMIN"]
  }
  ```
- **Response**: `ApiResponse<UserResponse>` (201 Created)
- **Auditing**: Emits `USER_CREATED` audit record.

### 3.5 Update User Profile and Roles
- **Method**: `PUT`
- **Path**: `/api/admin/users/{userId}`
- **Request Body**: `UpdateUserRequest`
- **Response**: `ApiResponse<UserResponse>`
- **Auditing**: Emits `USER_UPDATED` audit record.

---

## 4. Professional Administration API

Base Path: `/api/admin`

### 4.1 Veterinarians
- `GET /api/admin/veterinarians`
  - Params: `verificationStatus`, `isActive`, `search`, pagination.
  - Returns: `ApiResponse<PageResponse<AdminVeterinarianResponse>>`
- `GET /api/admin/veterinarians/{veterinarianId}`
  - Returns: `ApiResponse<AdminVeterinarianResponse>`
- `PATCH /api/admin/veterinarians/{veterinarianId}/verification`
  - Body:
    ```json
    {
      "approved": true,
      "rejectionReason": null
    }
    ```
  - Emits: `PROFESSIONAL_VERIFICATION_UPDATED`
- `PATCH /api/admin/veterinarians/{veterinarianId}/status`
  - Body:
    ```json
    {
      "isActive": true,
      "reason": "Profile verified and ready"
    }
    ```
  - Emits: `PROFESSIONAL_STATUS_UPDATED`

### 4.2 Service Providers
- `GET /api/admin/service-providers`
  - Params: `verificationStatus`, `isActive`, `providerType`, `search`, pagination.
  - Returns: `ApiResponse<PageResponse<AdminServiceProviderResponse>>`
- `GET /api/admin/service-providers/{providerId}`
  - Returns: `ApiResponse<AdminServiceProviderResponse>`
- `PATCH /api/admin/service-providers/{providerId}/verification`
  - Body: `VerificationRequest` (`approved`, `rejectionReason`)
  - Emits: `PROFESSIONAL_VERIFICATION_UPDATED`
- `PATCH /api/admin/service-providers/{providerId}/status`
  - Body: `UpdateEntityStatusRequest` (`isActive`, `reason`)
  - Emits: `PROFESSIONAL_STATUS_UPDATED`

---

## 5. Booking and Payment Oversight API

### 5.1 Appointments
- `GET /api/admin/appointments`: Filters by `status`, `veterinarianId`, `userId`, `startDate`, `endDate`, pagination. Returns `ApiResponse<PageResponse<AppointmentResponse>>`.
- `GET /api/admin/appointments/{appointmentId}`: Returns `ApiResponse<AppointmentResponse>`.

### 5.2 Service Bookings
- `GET /api/admin/service-bookings`: Filters by `status`, `providerId`, `userId`, `startDate`, `endDate`, pagination. Returns `ApiResponse<PageResponse<ServiceBookingResponse>>`.
- `GET /api/admin/service-bookings/{bookingId}`: Returns `ApiResponse<ServiceBookingResponse>`.

### 5.3 Payments (Read-Only Inspection)
- `GET /api/admin/payments`: Filters by `status`, `paymentFor`, `userId`, pagination. Returns `ApiResponse<PageResponse<PaymentResponse>>`.
- `GET /api/admin/payments/{paymentId}`: Returns `ApiResponse<PaymentResponse>`.
- *Note*: Administrative bypass of payment verification is strictly prohibited. Payment status transitions remain governed solely by payment gateways and webhook verification.

---

## 6. Review and Report Moderation API

### 6.1 Reviews
- `GET /api/admin/reviews`: Filters by `status` (`VISIBLE`, `REPORTED`, `HIDDEN`), `userId`, pagination.
- `GET /api/admin/reviews/{reviewId}`: Returns review details.
- `PATCH /api/admin/reviews/{reviewId}/status`:
  ```json
  {
    "status": "HIDDEN",
    "moderationNote": "Violates community standards"
  }
  ```
  - Emits: `REVIEW_MODERATED`

### 6.2 Reports
- `GET /api/admin/reports`: Filters by `status` (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`), `reportType`, `reportedById`, pagination.
- `GET /api/admin/reports/{reportId}`: Returns report details.
- `PATCH /api/admin/reports/{reportId}/status`:
  ```json
  {
    "status": "RESOLVED",
    "resolutionNote": "Reported content has been hidden and warning issued"
  }
  ```
  - Emits: `REPORT_RESOLVED`

---

## 7. Platform Settings API

Base Path: `/api/admin/settings`

### 7.1 Supported Whitelist Keys
| Setting Key | Type / Format | Permitted Range / Example | Description |
|---|---|---|---|
| `tax_rate` | Decimal | `0.00` to `100.00` (e.g. `18.00`) | Tax percentage applied to orders |
| `delivery_fee` | Decimal | `>= 0.00` (e.g. `50.00`) | Standard delivery fee in INR |
| `free_delivery_threshold` | Decimal | `>= 0.00` (e.g. `500.00`) | Minimum order total for free delivery |
| `cancellation_fee_hours` | Integer | `0` to `720` (e.g. `24`) | Hours before appointment for cancellation |
| `platform_currency` | String (3 chars) | `INR`, `USD` | System default currency |
| `maintenance_mode` | Boolean String | `true` or `false` | System maintenance status flag |
| `consultation_platform_fee` | Decimal | `>= 0.00` (e.g. `20.00`) | Fee charged on consultations |

### 7.2 Endpoints
- `GET /api/admin/settings`: Returns list of all settings.
- `GET /api/admin/settings/{key}`: Returns setting by key.
- `PUT /api/admin/settings/{key}`:
  ```json
  {
    "settingKey": "tax_rate",
    "settingValue": "18.00",
    "description": "Standard GST Rate"
  }
  ```
  - Emits: `PLATFORM_SETTING_UPDATED`

---

## 8. Administrative Dashboard Summary API

- **Method**: `GET`
- **Path**: `/api/admin/dashboard/summary`
- **Response**: `ApiResponse<DashboardSummaryResponse>`
  ```json
  {
    "success": true,
    "code": "SUCCESS",
    "message": "Operation completed successfully",
    "data": {
      "totalUsers": 120,
      "activeUsers": 115,
      "petOwnerCount": 95,
      "vetCount": 15,
      "serviceProviderCount": 10,
      "pendingVetVerifications": 3,
      "pendingProviderVerifications": 2,
      "activeVets": 12,
      "activeProviders": 8,
      "totalAppointments": 450,
      "totalServiceBookings": 210,
      "totalOrders": 380,
      "totalPaidRevenue": 158420.00,
      "pendingPaymentCount": 5,
      "failedPaymentCount": 2,
      "activeProductCount": 65,
      "lowStockProductCount": 4,
      "openReportCount": 1
    }
  }
  ```
- **Calculation Mechanism**: All metrics are aggregated directly in database queries using JPA repository `count()` and `SUM()` queries. No unbounded in-memory collection processing is performed.
