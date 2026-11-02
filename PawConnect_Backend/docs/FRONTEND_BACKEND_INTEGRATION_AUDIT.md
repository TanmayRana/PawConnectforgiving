# PawConnect Frontend-Backend Integration Audit (Phase 8)

**Date:** October 2026  
**Status:** Completed Baseline Audit  
**Author:** Antigravity IDE Integration Agent  
**Target Backend:** PawConnect Spring Boot 4.1.1 (Java 17/21, PostgreSQL / Neon, Port 8000)  
**Target Frontend:** PawConnect Next.js 16.3.8 (React 19, TypeScript, Tailwind CSS v4, Zustand, TanStack Query)

---

## 1. Executive Summary

The PawConnect Spring Boot backend has successfully passed 177 automated tests across Phases 0–7, exposing fully validated REST APIs and a secure WebSocket/STOMP notification broker.

The PawConnect Next.js frontend currently contains a polished UI/UX design adhering to the brand design tokens, responsive layouts, and modal dialogs. However, the data tier has been running on client-side simulation: `localStorage` persistence, fake timeouts (`setTimeout`), mock data generators, and disconnected modal submit handlers.

This audit details the comprehensive mapping between frontend client modules and authoritative backend endpoints, highlights contract shape mismatches, documents endpoints supported by the backend, identifies UI features requiring adaptation, and outlines integration risks.

---

## 2. Inventory of Frontend Modules & Mock State Mechanisms

| Frontend File / Module | Current Mock / Persistence Mechanism | Target Backend Controller & Endpoints | Status |
|---|---|---|---|
| `src/lib/api/client.ts` | Basic fetch wrapper, defaults to `http://localhost:8000/api`, doesn't unpack `ApiResponse<T>` / `PageResponse<T>`, lacks refresh retry queue | Central typed API client with `NEXT_PUBLIC_API_BASE_URL`, token injection, automatic token refresh, `401`/`403`/validation error parsing | Needs Upgrade |
| `src/stores/auth-modal.store.ts` & `src/components/shared/auth-modal-provider.tsx` | View state only (`login`, `register`, `otp`, `reset-password`); forms execute `e.preventDefault()` without making HTTP requests | `AuthController.java` (`/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/verify-otp`, `/api/auth/reset-password`) | Mock Flow to Replace |
| No dedicated auth session store | Role and user identity was hardcoded or absent in layouts | Central session store (`auth.store.ts`) with reactive JWT token storage, user info, role checks, and `/api/me` profile hydration | Needs Creation |
| `src/lib/api/customer.ts` | `localStorage` key `pawconnect_profile_v1` and `pawconnect_addresses_v1` | `MeController.java` (`GET/PUT /api/me`, `PUT /api/me/password`) & `AddressController.java` (`/api/me/addresses`) | Mock Flow to Replace |
| `src/lib/api/pets.ts` | `localStorage` key `pawconnect_pets_v1` | `PetController.java` (`/api/me/pets`), `PetVaccinationController.java` (`/api/me/pets/{petId}/vaccinations`), `PetMedicalRecordController.java` (`/api/me/pets/{petId}/medical-records`) | Mock Flow to Replace |
| `src/lib/api/bookings.ts` | `localStorage` key `pawconnect_bookings_v1`, fake ID generation, fake conflict checks | `CustomerAppointmentController.java` (`/api/me/appointments`), `CustomerServiceBookingController.java` (`/api/me/service-bookings`), `CustomerBookingController.java` (`/api/me/bookings`) | Mock Flow to Replace |
| `src/lib/api/products.ts` | Static array `IN_HOUSE_PRODUCTS` from `src/lib/mock/products.ts` | `ProductController.java` (`/api/products`, `/api/products/{id}`, `/api/products/categories`, `/api/products/featured`) | Mock Flow to Replace |
| `src/lib/api/cart.ts` | `localStorage` key `pawconnect_cart_v1` with client-side price totals and promo code logic | `CartController.java` (`/api/me/cart`, `/api/me/cart/items`) | Mock Flow to Replace |
| `src/lib/api/orders.ts` | `localStorage` key `pawconnect_orders_v1` with fake tracking numbers and timelines | `OrderController.java` (`/api/me/orders`, `/api/me/orders/{id}`, `/api/me/orders/{id}/items`, `/api/me/orders/{id}/cancel`, `/api/me/orders/{id}/payments/order`) | Mock Flow to Replace |
| `src/lib/mock/notifications.ts` | Static mock array `INITIAL_MOCK_NOTIFICATIONS` | `NotificationController.java` (`/api/me/notifications`, `/api/me/notifications/unread-count`, `/api/me/notifications/{id}/read`, `/api/me/notifications/read-all`, `/api/me/notifications/{id}`) + STOMP `/ws` | Mock Flow to Replace |
| `src/lib/api/professional.ts` | `localStorage` keys for vet and provider profiles, availability, and bookings | `VeterinarianAppointmentController.java` (`/api/vet/appointments`), `ProviderBookingController.java` (`/api/provider/bookings`), `MeController.java` | Mock Flow to Replace |
| `src/lib/api/admin.ts` | `localStorage` keys for users, categories, bookings, reports, audit logs, settings, etc. | `AdminDashboardController.java`, `AdminUserController.java`, `AdminProfessionalController.java`, `AdminBookingController.java`, `AdminPaymentController.java`, `AdminProductController.java`, `AdminOrderController.java`, `AdminModerationController.java`, `AdminAuditLogController.java`, `AdminPlatformSettingController.java` | Mock Flow to Replace |
| `src/lib/api/reviews.ts` | `localStorage` key `pawconnect_reviews_v1` | Public reviews / Admin moderation reviews (`/api/admin/reviews`) | Align & Bridge |

---

## 3. Authoritative Backend Contract & Envelope Architecture

### 3.1 Response Envelopes

Every Spring Boot REST endpoint returns the standardized `ApiResponse<T>`:
```typescript
interface ApiResponse<T> {
  success: boolean;
  code: string;       // "SUCCESS", "VALIDATION_FAILED", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", etc.
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

Paginated endpoints return `ApiResponse<PageResponse<T>>`, where `PageResponse<T>` is defined as:
```typescript
interface PageResponse<T> {
  content: T[];        // NOTE: backend property is `content`, NOT `items`!
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  sort?: string;
}
```

### 3.2 Authorization Envelopes & Authorities
The backend uses Spring Security with JWT Bearer tokens in the `Authorization: Bearer <accessToken>` header.
Roles in DB:
- `PET_OWNER`
- `VETERINARIAN`
- `SERVICE_PROVIDER`
- `ADMIN`

Spring Security Authorities:
- `ROLE_PET_OWNER`
- `ROLE_VETERINARIAN`
- `ROLE_SERVICE_PROVIDER`
- `ROLE_ADMIN`

There is strictly NO `ROLE_VENDOR`, `ROLE_SELLER`, or `ROLE_SUPER_ADMIN`.
All products are in-house PawConnect goods managed by `ROLE_ADMIN`.

---

## 4. Contract Mismatches & Technical Discrepancies

### 4.1 Authentication Response Shape
- **Mock frontend assumption:** Expected `{ token: string, user: { id: string, role: string, ... } }`.
- **Authoritative backend reality:**
  ```json
  {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "roles": ["PET_OWNER"],
      "profileImage": null,
      "status": "ACTIVE",
      "emailVerified": true,
      "phoneVerified": false
    }
  }
  ```
- **Correction:** Update `AuthResponse` and `UserResponse` types. Provide normalized role helpers (`user.roles.includes("PET_OWNER") || user.roles.includes("ROLE_PET_OWNER")`). Store both `accessToken` and `refreshToken`.

### 4.2 Customer Address Endpoint Path
- **Mock frontend assumption:** Placed address operations under `/api/addresses` or standalone paths.
- **Authoritative backend reality:** All customer address operations are scoped under `/api/me/addresses`. Setting default address is `PATCH /api/me/addresses/{addressId}/default`.

### 4.3 Customer Pets & Records Endpoint Paths
- **Mock frontend assumption:** `GET /pets`, `POST /pets`.
- **Authoritative backend reality:** Customer pet routes are `/api/me/pets`.
  - Vaccines: `/api/me/pets/{petId}/vaccinations`
  - Medical Records: `/api/me/pets/{petId}/medical-records`
  - All paginated endpoints return `PageResponse<T>` with `content: T[]`.

### 4.4 Booking Architecture
- **Mock frontend assumption:** Single generic `createBooking` writing to localStorage.
- **Authoritative backend reality:**
  1. `POST /api/me/appointments` (Veterinary appointment)
  2. `POST /api/me/service-bookings` (Grooming / training booking)
  3. `POST /api/me/bookings` (Unified booking creation)
  4. Cancellation: `PATCH /api/me/appointments/{id}/cancel`, `PATCH /api/me/service-bookings/{id}/cancel`, or `PATCH /api/me/bookings/{id}/cancel`
  5. Booking Payment Orders: `POST /api/me/bookings/{bookingId}/payments/order` or `/api/me/appointments/{appointmentId}/payments/order`.

### 4.5 Product Catalogue & E-Commerce Cart
- **Mock frontend assumption:** Cart calculation done client-side with promo codes stored in localStorage.
- **Authoritative backend reality:**
  - `GET /api/me/cart` computes items, total, and validation on the server.
  - Adding item: `POST /api/me/cart/items` with `{ productId: number, quantity: number }`.
  - Updating item: `PUT /api/me/cart/items/{cartItemId}` with `{ quantity: number }`.
  - Removing item: `DELETE /api/me/cart/items/{cartItemId}`.
  - Clearing: `DELETE /api/me/cart`.
  - Checkout: `POST /api/me/orders` with `CheckoutRequest { shippingAddressId, customerNotes }`.
  - Payment order: `POST /api/me/orders/{orderId}/payments/order`.
  - Payment verification: `POST /api/payments/razorpay/verify`.

### 4.6 WebSocket / STOMP Real-Time Notifications
- **Mock frontend assumption:** Static notification arrays.
- **Authoritative backend reality:**
  - STOMP over SockJS and Native WebSocket at `/ws`.
  - Native CONNECT header: `Authorization: Bearer <accessToken>`.
  - Subscription: `/user/queue/notifications`.
  - REST persistence: `GET /api/me/notifications`, `GET /api/me/notifications/unread-count`, `PATCH /api/me/notifications/{id}/read`, `PATCH /api/me/notifications/read-all`.

### 4.7 Admin Endpoints
- **Mock frontend assumption:** Fake in-browser arrays with localStorage.
- **Authoritative backend reality:**
  - `GET /api/admin/dashboard/summary` (Real aggregated database counts and revenue).
  - Users: `/api/admin/users`, `/api/admin/users/{id}`, `PATCH /api/admin/users/{id}/status`.
  - Professionals: `/api/admin/veterinarians`, `PATCH /api/admin/veterinarians/{id}/verification`, `/api/admin/service-providers`, `PATCH /api/admin/service-providers/{id}/verification`.
  - Bookings: `/api/admin/appointments`, `/api/admin/service-bookings`.
  - Payments: `/api/admin/payments`.
  - Products & Categories: `/api/admin/products`, `/api/admin/categories`.
  - Orders: `/api/admin/orders`, `PATCH /api/admin/orders/{id}/status`.
  - Moderation: `/api/admin/reviews`, `PATCH /api/admin/reviews/{id}/status`, `/api/admin/reports`, `PATCH /api/admin/reports/{id}/status`.
  - Audit Logs: `/api/admin/audit-logs`. Read-only! No modification/deletion controls permitted.
  - Settings: `/api/admin/settings`, `PUT /api/admin/settings/{key}`.

---

## 5. Integration Risks & Mitigation Strategies

1. **Token Refresh Concurrency:**
   - *Risk:* Multiple simultaneous API calls returning 401 could trigger multiple concurrent `/api/auth/refresh` requests. The backend uses token versioning and single-use refresh token rotation; concurrent refreshes would invalidate each other.
   - *Mitigation:* Implement a mutex / promise queue in `api-client.ts` so only one refresh call runs at a time, queueing other requests until the refresh completes.

2. **Data Model ID Type Discrepancies:**
   - *Risk:* Frontend mock models use string IDs (`"prod-1"`, `"pet-1"`, `"bk-1"`), whereas backend JPA entities use numerical `Long` IDs (`1`, `2`, `3`).
   - *Mitigation:* Normalize IDs in API adapters to support numeric IDs while ensuring UI routing safely parses and formats IDs.

3. **Page Response Wrapper Handling:**
   - *Risk:* Frontend hooks previously expected raw arrays (`Pet[]`, `CustomerBooking[]`).
   - *Mitigation:* Adapt API services to return both raw arrays (where current pages consume arrays) and full `PageResponse` envelopes so existing UI components do not crash while pagination metadata is preserved.

4. **Razorpay Window SDK Availability:**
   - *Risk:* The Razorpay checkout modal requires `window.Razorpay` script to be loaded on demand.
   - *Mitigation:* Implement a clean Razorpay script loader utility that injects `https://checkout.razorpay.com/v1/checkout.js` dynamically in test mode, and handles verification securely via `/api/payments/razorpay/verify`.

5. **Silent Mock Fallback Elimination:**
   - *Risk:* Code paths falling back silently to fake data hide real API errors.
   - *Mitigation:* Remove silent mock fallbacks in all production API services. Render proper error and empty states in UI.
