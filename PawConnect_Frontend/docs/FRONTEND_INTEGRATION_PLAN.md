# PawConnect Frontend-Backend Integration Plan (Phase 8)

**Target Backend Baseline:** 177 passing Spring Boot integration tests  
**Frontend Framework:** Next.js 16.3.8 App Router with TypeScript  
**Goal:** Replace all client-side mock/localStorage data layers with live, typed backend Spring Boot APIs without redesigning the website or breaking existing UI components.

---

## 1. Architectural Strategy & Guiding Principles

1. **Preserve UI Aesthetics & Component Layouts:**
   - Keep existing designs, color tokens, Radix UI dialogs, drawers, and animations completely intact.
   - Retain existing modal and drawer form workflows. Do not invent unnecessary standalone pages.

2. **Consistent API Abstraction Layer:**
   - Centralize HTTP requests in a unified, typed client (`src/lib/api-client.ts`).
   - Automatically unwrap `ApiResponse<T>` and `PageResponse<T>` envelopes.
   - Seamlessly handle token injection and transparent 401 JWT refresh token rotation with concurrency deduplication.

3. **Incremental Migration via Service Modules & React Query Hooks:**
   - Replace the simulated storage code in `src/lib/api/*.ts` with real API client calls.
   - The React Query hooks in `src/lib/api/hooks.ts` remain the consumption interface for UI pages, ensuring continuous compatibility across all views.

4. **Strict Role-Based Integrity:**
   - Support the four authoritative roles: `PET_OWNER`, `VETERINARIAN`, `SERVICE_PROVIDER`, `ADMIN`.
   - Never allow client-side role fabrication to bypass backend checks.

5. **No Silent Mock Fallbacks:**
   - Remove fake success mock fallbacks from production code paths. Display real validation errors, loading skeletons, and empty states.

---

## 2. Stage Breakdown & Execution Roadmap

### Stage 1: Foundation & Authentication
- **Step 1.1:** Setup `.env.example` and environment configuration:
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api`
  - `NEXT_PUBLIC_WS_URL=http://localhost:8000/ws`
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholder`
- **Step 1.2:** Enhance `src/lib/api/client.ts` (or `src/lib/api-client.ts`):
  - Token header management (`Bearer <accessToken>`).
  - `ApiResponse<T>` unwrapping and `ApiError` class with HTTP status code and server validation messages.
  - Transparent JWT refresh logic: when `401 Unauthorized` occurs, pause pending calls, call `POST /api/auth/refresh`, rotate tokens, and replay pending requests.
- **Step 1.3:** Implement global session store (`src/stores/auth.store.ts`):
  - Reactive user state, token persistence in `localStorage`, role extraction.
  - Automatic `GET /api/me` verification on mount.
- **Step 1.4:** Connect Auth Modals (`src/components/shared/auth-modal-provider.tsx`):
  - Real `login` with email and password -> store tokens and user -> close modal -> toast success.
  - Real `register` with firstName, lastName, email, password -> toast success -> redirect or switch to login.
  - Real `forgot-password`, `verify-otp`, and `reset-password`.
- **Step 1.5:** Implement Route Guard and Topbar sync:
  - Update `CustomerTopbar`, `PublicHeader`, and layout role guards to reflect real authenticated state and role-based portal navigation.

---

### Stage 2: Customer Core
- **Step 2.1:** Customer Profile:
  - Connect `GET /api/me` and `PUT /api/me` for profile updates.
  - Connect `PUT /api/me/password` with `currentPassword` and `newPassword`.
- **Step 2.2:** Customer Addresses:
  - Replace `localStorage` in `src/lib/api/customer.ts` with real `/api/me/addresses` CRUD operations and `PATCH /api/me/addresses/{id}/default`.
- **Step 2.3:** Pets Management:
  - Replace `localStorage` in `src/lib/api/pets.ts` with `/api/me/pets` (`GET`, `POST`, `PUT`, `DELETE`).
- **Step 2.4:** Pet Vaccinations:
  - Connect `/api/me/pets/{petId}/vaccinations` (`GET`, `POST`, `DELETE`).
- **Step 2.5:** Pet Medical Records:
  - Connect `/api/me/pets/{petId}/medical-records` (`GET`, `POST`, `DELETE`).

---

### Stage 3: Professional Workflows
- **Step 3.1:** Veterinarian Appointments:
  - Connect `src/lib/api/professional.ts` to `/api/vet/appointments` (`GET`, `GET /{id}`, `PATCH /{id}/status`).
- **Step 3.2:** Service Provider Bookings:
  - Connect `src/lib/api/professional.ts` to `/api/provider/bookings` (`GET`, `GET /{id}`, `PATCH /{id}/status`).
- **Step 3.3:** Professional Profile & Availability:
  - Connect professional profile data to `/api/me` and document any static availability rules supported by the backend.

---

### Stage 4: Commerce & Booking Checkout
- **Step 4.1:** Product Catalogue:
  - Connect `src/lib/api/products.ts` to `/api/products` (with filters: search, categoryId, minPrice, maxPrice, inStock, featured, pagination) and `/api/products/{id}`.
- **Step 4.2:** Active Cart:
  - Connect `src/lib/api/cart.ts` to `/api/me/cart` (`GET`, `POST /items`, `PUT /items/{id}`, `DELETE /items/{id}`, `DELETE`).
- **Step 4.3:** Order Placement & History:
  - Connect `src/lib/api/orders.ts` to `/api/me/orders` (`POST` checkout, `GET` user orders, `GET /{id}`, `PATCH /{id}/cancel`).
- **Step 4.4:** Customer Bookings:
  - Connect `src/lib/api/bookings.ts` to `/api/me/appointments`, `/api/me/service-bookings`, and `/api/me/bookings`.
- **Step 4.5:** Razorpay Checkout Integration:
  - Booking payments: `POST /api/me/bookings/{id}/payments/order`.
  - Order payments: `POST /api/me/orders/{id}/payments/order`.
  - Verification: `POST /api/payments/razorpay/verify`.
  - Create Razorpay helper modal hook using test key ID.

---

### Stage 5: Notifications & STOMP / WebSocket
- **Step 5.1:** REST Notifications:
  - Connect `/api/me/notifications`, `/api/me/notifications/unread-count`, `/api/me/notifications/{id}/read`, `/api/me/notifications/read-all`, `/api/me/notifications/{id}`.
- **Step 5.2:** WebSocket / STOMP Integration:
  - Implement real-time STOMP client connecting to `/ws` with native `Authorization: Bearer <accessToken>` header.
  - Subscribe to `/user/queue/notifications`.
  - Reconnect on token refresh or temporary disconnection with exponential backoff.
  - On notification receipt, invalidate TanStack Query unread-count and notifications list, and display toast.

---

### Stage 6: Admin Portal
- **Step 6.1:** Admin Dashboard:
  - Connect `GET /api/admin/dashboard/summary`.
- **Step 6.2:** Admin User Management:
  - Connect `GET /api/admin/users`, `POST /api/admin/users`, `PUT /api/admin/users/{id}`, `PATCH /api/admin/users/{id}/status`.
- **Step 6.3:** Professional Oversight:
  - Connect `/api/admin/veterinarians` and `/api/admin/service-providers` (listing, verification, status toggle).
- **Step 6.4:** Bookings & Payments Oversight:
  - Connect `/api/admin/appointments`, `/api/admin/service-bookings`, `/api/admin/payments`.
- **Step 6.5:** Products & Categories Management:
  - Connect `/api/admin/products` (CRUD + status + stock) and `/api/admin/categories` (CRUD).
- **Step 6.6:** Order Oversight:
  - Connect `/api/admin/orders` and `PATCH /api/admin/orders/{id}/status`.
- **Step 6.7:** Reviews & Reports Moderation:
  - Connect `/api/admin/reviews` and `/api/admin/reports` with resolution notes.
- **Step 6.8:** Audit Logs & Platform Settings:
  - Connect `/api/admin/audit-logs` (strictly read-only).
  - Connect `/api/admin/settings` and `PUT /api/admin/settings/{key}`.

---

## 3. Verification & Quality Gates

At each stage:
1. `pnpm typecheck` must pass with 0 errors.
2. `pnpm lint` must pass with 0 errors.
3. Relevant interactive workflows verified.
4. Comprehensive report generated in `docs/FRONTEND_INTEGRATION_REPORT.md`.
