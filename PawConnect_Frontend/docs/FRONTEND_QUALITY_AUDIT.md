# PawConnect — Frontend Quality Audit

## 1. Executive Summary & Objective

This audit presents a thorough inspection of the PawConnect Next.js frontend application across all four user roles:
- **`PET_OWNER`** (Customer)
- **`VETERINARIAN`** (Healthcare Professional)
- **`SERVICE_PROVIDER`** (Care & Grooming Professional)
- **`ADMIN`** (Platform Administrator)

The purpose of this quality pass is to elevate form validation, global graphical feedback, user-facing error handling, interaction ergonomics, and responsive layout polish to production quality, prior to Phase 9 Production QA.

---

## 2. Environment & Dependency Baseline

- **Framework**: Next.js 16.3.8 (App Router), React 19.2.8, React DOM 19.2.8
- **TypeScript**: TypeScript 5 with `tsconfig.json` paths (`@/*` -> `./src/*`)
- **Package Manager**: pnpm 12.10.1
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), Radix UI primitives, Lucide React icons
- **Form Infrastructure**: React Hook Form (`^7.89.0`), `@hookform/resolvers` (`^5.9.1`), Zod (`^4.6.5`)
- **Toast System**: Sonner (`^2.0.8`) installed, with preliminary `<Toaster />` in `AppProviders.tsx`
- **State & Data Fetching**: TanStack React Query (`^5.104.1`), Zustand (`^5.0.15`)
- **Initial Verification**:
  - `pnpm typecheck`: Exit Code 0 (PASS)
  - `pnpm lint`: Exit Code 0 (PASS)

---

## 3. Comprehensive Form Inventory

Across public, customer, professional, and admin sections, the application contains 29 primary forms, modals, drawers, and state mutation dialogs:

| Form Identifier | Location / Component | Trigger / Container | User Role | Backend Endpoint / DTO |
|---|---|---|---|---|
| **AUTH-01: Login** | `auth-modal-provider.tsx` | Dialog Modal | Public / All | `POST /api/auth/login` (`LoginRequest`) |
| **AUTH-02: Register** | `auth-modal-provider.tsx` | Dialog Modal | Public / Pet Owner | `POST /api/auth/register` (`RegisterRequest`) |
| **AUTH-03: Forgot Password** | `auth-modal-provider.tsx` | Dialog Modal | Public / All | `POST /api/auth/forgot-password` (`ForgotPasswordRequest`) |
| **AUTH-04: OTP Verification** | `auth-modal-provider.tsx` | Dialog Modal | Public / All | `POST /api/auth/verify-otp` (`VerifyOtpRequest`) |
| **AUTH-05: Reset Password** | `auth-modal-provider.tsx` | Dialog Modal | Public / All | `POST /api/auth/reset-password` (`ResetPasswordRequest`) |
| **AUTH-06: Change Password** | `profile-client.tsx` | Profile Modal / Section | Authenticated | `PUT /api/me/password` (`ChangePasswordRequest`) |
| **CUST-01: Profile Editor** | `profile-form-modal.tsx` | Dialog Modal | Pet Owner | `PUT /api/me` (`UpdateProfileRequest`) |
| **CUST-02: Pet Profile (Create/Edit)** | `pet-form-modal.tsx` | Dialog Modal | Pet Owner | `POST/PUT /api/me/pets` (`CreatePetRequest`, `UpdatePetRequest`) |
| **CUST-03: Vaccination Record** | `vaccination-modal.tsx` | Dialog Modal | Pet Owner | `POST /api/me/pets/{id}/vaccinations` (`CreateVaccinationRequest`) |
| **CUST-04: Medical Record** | `medical-record-modal.tsx` | Dialog Modal | Pet Owner | `POST /api/me/pets/{id}/medical-records` (`CreateMedicalRecordRequest`) |
| **CUST-05: Address (Create/Edit)** | `address-modal.tsx` | Dialog Modal | Pet Owner | `POST/PUT /api/me/addresses` (`CreateAddressRequest`, `UpdateAddressRequest`) |
| **CUST-06: Appointment Booking** | `booking-modal.tsx` | Dialog Modal | Pet Owner | `POST /api/me/appointments` (`CreateAppointmentRequest`) |
| **CUST-07: Service Booking** | `booking-modal.tsx` | Dialog Modal | Pet Owner | `POST /api/me/service-bookings` (`CreateServiceBookingRequest`) |
| **CUST-08: Cart Item Quantity** | `product-quantity.tsx`, `cart-item.tsx` | Inline Controls | Pet Owner | `PUT /api/cart/items/{id}` (`UpdateCartItemRequest`) |
| **CUST-09: Checkout & Delivery** | `checkout-client.tsx`, `checkout-address-selector.tsx` | Multi-step Page | Pet Owner | `POST /api/orders` (`CheckoutRequest`) |
| **CUST-10: Booking Cancel / Reschedule** | `booking-detail-view.tsx` | Confirm Dialogs | Pet Owner | `PUT /api/me/appointments/{id}/cancel` (`CancelBookingRequest`) |
| **CUST-11: Order Cancellation** | `order-detail-client.tsx` | Confirm Dialog | Pet Owner | `PUT /api/me/orders/{id}/cancel` |
| **CUST-12: Product Review** | `product-review-modal.tsx` | Dialog Modal | Pet Owner | `POST /api/reviews` (`CreateReviewRequest`) |
| **PRO-01: Vet / Provider Profile** | `profile-form-modal.tsx` (professional) | Dialog Modal | Vet / Provider | `PUT /api/vet/profile`, `PUT /api/provider/profile` |
| **PRO-02: Weekly Availability** | `availability-editor.tsx` | Dialog Modal | Vet / Provider | `PUT /api/vet/availability`, `PUT /api/provider/availability` |
| **PRO-03: Service Management** | `service-form-modal.tsx` | Dialog Modal | Provider | `POST/PUT /api/provider/services` (`CreateServiceRequest`) |
| **PRO-04: Booking Action & Status** | `provider-booking-modal.tsx` | Dialog Modal | Provider | `PUT /api/provider/bookings/{id}/status` |
| **ADM-01: User Create / Edit** | `user-form-modal.tsx` | Dialog Modal | Admin | `POST/PUT /api/admin/users` (`CreateUserRequest`, `UpdateUserRequest`) |
| **ADM-02: Professional Verification** | `verification-dialog.tsx` | Dialog Modal | Admin | `PATCH /admin/veterinarians/{id}/verification` (`VerificationRequest`) |
| **ADM-03: Category Create / Edit** | `category-form-modal.tsx` | Dialog Modal | Admin | `POST/PUT /api/admin/categories` (`CategoryRequest`) |
| **ADM-04: Product Create / Edit** | `product-form-drawer.tsx` | Sheet Drawer | Admin | `POST/PUT /api/admin/products` (`ProductRequest`) |
| **ADM-05: Order Status Update** | `order-status-dialog.tsx` | Dialog Modal | Admin | `PATCH /admin/orders/{id}/status` (`OrderStatusRequest`) |
| **ADM-06: Report Resolution** | `report-resolution-dialog.tsx` | Dialog Modal | Admin | `PATCH /api/admin/reports/{id}/status` (`ReportResolutionRequest`) |
| **ADM-07: Platform Settings** | `admin-settings-client.tsx` | Page Form | Admin | `PUT /api/admin/settings` (`PlatformSettingRequest`) |

---

## 4. Discovered Validation & Feedback Gaps

### 4.1 Field Validation Gaps vs. Backend DTOs

1. **Authentication (Register & Reset)**:
   - Previously lacked field-level error mapping: errors were surfaced only as a single raw message banner at the top of the dialog.
   - Password confirmation policy required matching frontend regex to backend constraints (`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`).
   - String inputs were not consistently trimmed prior to request dispatch, risking whitespace-only submissions.

2. **Pet Management (`PetFormModal`)**:
   - `name`: Not trimmed; permitted whitespace-only names.
   - `species`: Backend permits dynamic string (up to 50 chars); UI was restricted without custom fallback.
   - `dateOfBirth`: Backend requires `@PastOrPresent`. Frontend used a simple `age` number field and hardcoded `dateOfBirth: "2023-01-01"`.
   - `weight`: Backend enforces `@DecimalMin("0.01")` and `@Positive`.
   - `photoUrl`: Max 500 characters on backend; frontend schema had a loose URL/string union.

3. **Vaccinations (`VaccinationModal`)**:
   - `vaccinationDate`: Backend requires `@PastOrPresent` (no future dates permitted). Frontend allowed future dates.
   - `nextDueDate`: Must be on or after `vaccinationDate`. No client-side cross-field validation existed.
   - `vaccineName`: Backend max 150 characters.

4. **Addresses (`AddressModal`)**:
   - `phone`: Backend enforces `@Pattern(regexp = "^\\+?[0-9]{10,15}$")`. Frontend schema only checked `z.string().min(7)`, allowing invalid formatting like `(555) 123-4567` which failed backend validation.
   - `postalCode`: Backend requires 4 to 20 characters (`@Size(min = 4, max = 20)`).
   - `country`: Backend requires `@NotBlank`, but frontend did not allow users to view or configure country.

5. **Customer Password Change (`profile-client.tsx`)**:
   - The "Change Password" button previously triggered a mock `toast.info` with no actual form dialog to execute `PUT /api/me/password` with `ChangePasswordRequest` (`currentPassword`, `newPassword`, `confirmNewPassword`).

6. **Admin Verification & Rejection (`verification-dialog.tsx`)**:
   - Rejection requires `rejectionReason` on backend (`VerificationRequest`). Frontend sent a hardcoded string without letting the admin specify a custom audit reason.

7. **Admin Report Resolution (`report-resolution-dialog.tsx`)**:
   - Backend `ReportResolutionRequest` marks `resolutionNote` as `@NotBlank`. The dialog permitted submitting with an empty resolution note.

8. **Admin Platform Settings (`admin-settings-client.tsx`)**:
   - Form inputs used ad-hoc label/error wrappers instead of `Input` component props (`label`, `error`, `hint`), breaking accessible `aria-invalid` and `aria-describedby` associations.

---

### 4.2 Toast Notification System Inconsistencies

1. **Direct Ad-Hoc Imports**:
   - Over 180 places throughout `src/` import `{ toast }` directly from `"sonner"`.
   - Inconsistent styling, varied auto-close durations (defaulting to unpredictable library timeouts), and missing icons.
2. **Double Notification Risk**:
   - When requests fail, some page handlers catch errors, display an inline error, AND fire a toast, or API callers trigger toasts redundantly.
3. **No Centralized Semantic Helper**:
   - Missing unified wrappers (`showSuccess`, `showError`, `showWarning`, `showInfo`) that enforce uniform toast styling, action-oriented messaging, and deduplication keys.
4. **Premature / Inaccurate Success Feedback**:
   - In several places, success toasts claimed "Appointment Confirmed!" or "dummy refund initiated" even when appointments were pending review or refund was non-transactional.

---

### 4.3 Modal & Dialog Lifecycle Issues

1. **Premature Modal Closure**:
   - Several modals (`PetFormModal`, `VaccinationModal`, `MedicalRecordModal`, `AddressModal`, `CategoryFormModal`, `UserFormModal`) invoked `onOpenChange(false)` inside `handleSubmit` unconditionally, even when mutation promises failed or errors occurred.
2. **Swallowed Errors**:
   - Callers wrapped `mutateAsync` inside `try { ... } catch { ... }` without re-throwing or passing field errors to the active form, causing the modal to close and discarding the user's filled data.

---

### 4.4 UI, Layout, & Responsiveness Defects

1. **Input Heights & Borders**:
   - Some inputs used `h-9.5`, others `h-11`, and some `h-9`.
   - Select triggers had mismatched border radiuses compared to adjacent text inputs.
2. **Dialog Overflow on Mobile**:
   - Some dialog contents lacked responsive max-height constraints (`max-h-[85vh] overflow-y-auto`), causing overflow below viewport on mobile keyboards.
3. **Password Visibility Buttons**:
   - Need accessible labels, clear positioning, and no overlap with input text padding.

---

## 5. Corrective Action Plan

1. **Create Unified Form Error Utility (`src/lib/utils/form-errors.ts`)**:
   - Parse Spring Boot validation responses (`code: "VALIDATION_ERROR"`, `errors: ["fieldName: message"]`).
   - Map field-specific errors to React Hook Form `setError` or local form states.
   - Format clean user-friendly fallbacks without exposing technical details.
2. **Establish Central Global Toast System (`src/lib/utils/toast.ts` & `src/components/ui/toast.tsx`)**:
   - Provide `showSuccess`, `showError`, `showWarning`, `showInfo` helpers with deduplication, consistent duration, and branded theme icons.
   - Configure global `<Toaster />` in `AppProviders.tsx` with rich colors, accessible live regions, and close buttons.
3. **Standardize Shared Form Field Wrapper & Input Consistency**:
   - Standardize `Input`, `Textarea`, `SelectField` to reliably propagate `aria-invalid`, `aria-describedby`, label, and inline error.
4. **Implement Field-Specific Validation Across All 24 Forms**:
   - Update schemas in Zod to mirror Spring Boot DTO constraints (string trimming, phone format regex, past/future dates, password complexity).
   - Prevent premature dialog closure on request failures.
   - Provide Change Password dialog in profile views.
5. **UI Polish & Mobile Layout Verification**:
   - Fix modal responsive heights, input alignments, and button loading spinners.
6. **Documentation & Verification**:
   - Produce all four required documents and verify with `pnpm typecheck`, `pnpm lint`, `pnpm build`.
