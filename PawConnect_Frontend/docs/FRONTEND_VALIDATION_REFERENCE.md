# PawConnect — Frontend Validation Reference Guide

## 1. Overview & Architectural Principles

PawConnect implements an end-to-end validated form architecture that bridges client-side user experience with Spring Boot Jakarta Bean Validation (`@Valid`, `@NotNull`, `@NotBlank`, `@Size`, `@Pattern`, `@Min`, `@Max`).

### Core Validation Rules
1. **Never Swallowing Errors:** Form modals never close on submission failure; modal dismissal occurs strictly within successful execution paths.
2. **Trim & Sanitize:** All text inputs are trimmed at the schema boundary prior to validation and transmission.
3. **Dual-Tier Feedback:** Field-level discrepancies trigger inline red error cues with accessibility bindings (`aria-invalid`, `aria-describedby`). Unmapped server exceptions or domain conflicts are displayed via top-level alert banners within the modal and global semantic toasts.
4. **Resilient Parsing:** Server validation arrays formatted as `["field: message"]` are mapped directly to React Hook Form field state via `applyServerErrors`.

---

## 2. Reusable Regular Expressions & Common Schemas

All patterns match the Spring Boot DTO constraints verified across backend controllers:

| Pattern Name | Regular Expression | Semantic Usage |
| :--- | :--- | :--- |
| **Phone Number** | `^\+?[0-9]{10,15}$` | E.164-compatible national and international telephone numbers (Users, Providers, Addresses) |
| **Postal Code** | `^[0-9]{5}(?:-[0-9]{4})?$|^[A-Za-z0-9\s-]{3,10}$` | US standard 5/9 digit zip or international alphanumeric postal codes |
| **Slug** | `^[a-z0-9]+(?:-[a-z0-9]+)*$` | URL-safe category, brand, and product slugs (lowercased, hyphen-separated) |
| **Time Format** | `^(?:[01]\d|2[0-3]):[0-5]\d$` | 24-hour military timestamp (`HH:mm`) for scheduling and availability slots |
| **Strong Password** | `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$` | Minimum 8 characters with at least one uppercase, lowercase, number, and special character |

---

## 3. Domain Form Specifications & Constraints

### 3.1 Authentication & Profile Domain

#### `LoginForm`
- `email`: Required, valid email format (`z.string().trim().email()`)
- `password`: Required, minimum 6 characters (`z.string().min(6)`)
- `rememberMe`: Optional boolean

#### `RegisterForm`
- `firstName`: Required, 2–50 characters (`z.string().trim().min(2).max(50)`)
- `lastName`: Required, 2–50 characters (`z.string().trim().min(2).max(50)`)
- `email`: Required, valid email format (`z.string().trim().email()`)
- `phone`: Required, matching phone regex (`^\+?[0-9]{10,15}$`)
- `password`: Required, minimum 8 characters matching `PASSWORD_REGEX`
- `confirmPassword`: Must match `password` via schema refinement (`.refine(data => data.password === data.confirmPassword)`)
- `role`: Enum `PET_OWNER | VETERINARIAN | SERVICE_PROVIDER`

#### `ChangePasswordModal`
- `currentPassword`: Required, non-empty (strictly untrimmed to preserve whitespace passwords)
- `newPassword`: Required, min 8, max 100 characters matching backend regex `^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!._-]).*$`
- `confirmNewPassword`: Required, must match `newPassword`
- *Backend Contract:* Spring Boot DTO `ChangePasswordRequest.java` strictly requires `{ currentPassword, newPassword, confirmNewPassword }`.

---

### 3.2 Pet & Clinical Domain

#### `PetFormModal`
- `name`: Required, 1–100 characters (`@NotBlank @Size(min = 1, max = 100)`)
- `species`: String, 1–50 characters (`@NotBlank @Size(max = 50)` — permits all domestic & exotic species)
- `breed`: Required, 1–100 characters
- `gender`: Enum (`Male | Female`, mapped to backend `MALE | FEMALE`)
- `dateOfBirth` / `birthDate`: Past or present ISO date, mapped to backend `dateOfBirth: LocalDate`
- `age`: Number, min 0, max 35 years (auto-derived from date of birth or used to calculate birth year)
- `weight`: Number, positive, min 0.01 kg, max 500 kg
- `color`: Required, 1–100 characters (persisted into notes/tags)
- `photo`: URL, min 5, max 500 characters, mapped to backend `photoUrl`
- `microchipId`: Optional, max 100 characters

#### `VaccinationModal`
- `vaccineName`: Required, 1–150 characters (`@NotBlank @Size(max = 150)`)
- `dateAdministered`: Required ISO date (`<= today`), mapped to backend `vaccinationDate: LocalDate`
- `nextDueDate`: Optional ISO date, forward-constrained (`>= dateAdministered`) when specified
- `veterinarian`: Administering provider, mapped to backend `administeredBy` (`@Size(max = 150)`)
- `notes`: Optional clinical notes

#### `MedicalRecordModal`
- `recordType`: Required enum (`Checkup | Surgery | Lab | Prescription | Vaccination | Emergency | Other`)
- `title`: Required, 3–150 characters
- `date`: Required ISO date string (`<= today`)
- `veterinarian`: Required, 2–100 characters
- `clinic`: Required, 2–100 characters
- `diagnosis`: Optional, max 1000 characters
- `treatment`: Optional, max 1000 characters
- `notes`: Optional, max 2000 characters

---

### 3.3 Professional & Booking Domain

#### `ProviderProfileModal` & `VetProfileModal`
- `name`: Required, 2–100 characters
- `businessName`: Required (for providers), 2–100 characters
- `email`: Required, valid email format
- `phone`: Required, phone regex matching
- `qualification` / `specialization`: Required, 2–100 characters
- `experienceYears`: Number, min 0, max 60 years
- `clinic` / `location`: Required, 2–150 characters
- `bio`: Required, min 10, max 1000 characters

#### `ServiceFormModal`
- `name`: Required, 2–100 characters
- `category`: Enum (`grooming | training`)
- `description`: Required, min 10, max 1000 characters
- `price`: Number, min 0.00, max 10,000.00 USD
- `durationMinutes`: Number, min 5, max 480 minutes (8 hours)
- `active`: Boolean

#### `AvailabilityEditor`
- `startTime`: Required, `HH:mm` format
- `endTime`: Required, `HH:mm` format, must be chronologically after `startTime`
- `slotDurationMinutes`: Number, enum or min 15, max 240 minutes
- `isAvailable`: Boolean toggle

#### `BookingModal` & Reschedule
- `serviceId`: Required string/number ID
- `petId`: Required pet selection
- `date`: Required date string, strictly today or future
- `time`: Required time slot selection
- `notes`: Optional, max 500 characters

---

### 3.4 E-Commerce Domain

#### `CheckoutAddressSelector` & `AddressModal`
- `label`: Enum (`Home | Work | Other`), normalized to backend `AddressType` (`HOME | OFFICE | OTHER`)
- `recipientName`: Required, 1–150 characters (`@NotBlank @Size(max = 150)`)
- `phone`: Required, matching E.164 phone pattern (`^\+?[0-9]{10,15}$`)
- `street`: Required, 3–255 characters, mapped to backend `addressLine1` (`@NotBlank @Size(max = 255)`)
- `unit`: Optional, up to 255 characters, mapped to backend `addressLine2`
- `city`: Required, 2–100 characters (`@NotBlank @Size(max = 100)`)
- `state`: Required, 2–100 characters (`@NotBlank @Size(max = 100)`)
- `zipCode`: Required, 4–20 characters, mapped to backend `postalCode` (`@NotBlank @Size(min = 4, max = 20)`)
- `country`: Required, defaults to "United States" (`@NotBlank @Size(max = 100)`)
- `isDefault`: Boolean indicator for primary delivery location

#### `ProductReviewModal`
- `rating`: Required integer, 1 to 5 stars
- `comment`: Required, trimmed, min 5, max 1000 characters

---

### 3.5 Administrative Domain

#### `UserFormModal`
- `name`: Required, 2–100 characters
- `email`: Required, valid email
- `phone`: Required, phone regex matching (`^\+?[0-9]{10,15}$`)
- `role`: Enum (`PET_OWNER | VETERINARIAN | SERVICE_PROVIDER | ADMIN`)
- `status`: Backend Enum `UserStatus` (`ACTIVE | BLOCKED | PENDING`)

#### `CategoryFormModal`
- `name`: Required, 2–100 characters
- `slug`: Required, lowercase hyphenated slug pattern
- `description`: Optional, max 500 characters

#### `ProductFormDrawer`
- `name`: Required, 2–150 characters
- `category`: Required selection
- `description`: Required, min 10, max 2000 characters
- `price`: Number, min 0.01, max 100,000.00
- `stock`: Integer, min 0, max 100,000 units
- `status`: Backend Enum `ProductStatus` (`ACTIVE | INACTIVE`)
- `inStock`: Boolean mapped to `isActive` and `status` (`ACTIVE` vs `INACTIVE`)
- `images`: Array of validated URLs, min 1 image required

#### `VerificationDialog` (Practitioner Auditing)
- Backend DTO: `VerificationRequest` (`approved: boolean`, `rejectionReason?: string`)
- Status Action: Approved (`approved: true`) or Rejected (`approved: false`)
- `rejectionReason`: Required when rejecting (min 5 characters)

#### `ReportResolutionDialog`
- Backend DTO: `ReportResolutionRequest` (`status: ReportStatus`, `resolutionNote: string`)
- Status: Enum `ReportStatus` (`OPEN | UNDER_REVIEW | RESOLVED | REJECTED`)
- `resolutionNote`: Required for all status actions (`@NotBlank`, min 3 characters)

---

## 4. Backend Validation Error Mapping Pipeline

Spring Boot returns validation discrepancies formatted as:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed for argument",
  "errors": [
    "email: Email must be a well-formed email address",
    "phone: Phone number must contain 10 to 15 digits",
    "price: Price must be greater than or equal to 0.01"
  ]
}
```

The frontend maps these errors using `applyServerErrors`:
```typescript
import { applyServerErrors } from "@/lib/utils/form-errors";

try {
  await mutation.mutateAsync(payload);
  showSuccess("Saved", "Your details have been saved.");
  onOpenChange(false);
} catch (err: unknown) {
  const generalMsg = applyServerErrors(
    err,
    setError,
    "Unable to save changes. Please review the highlighted fields."
  );
  if (generalMsg) {
    setRootError(generalMsg);
  }
}
```

### Domain Error Code Handlers
In addition to field lists, `extractFieldErrors` maps business exceptions directly:
- `DUPLICATE_RESOURCE` (`"email already exists"`) -> Sets `email` field error: *"This email address is already in use."*
- `DUPLICATE_RESOURCE` (`"phone already exists"`) -> Sets `phone` field error: *"This phone number is already registered."*
- `SLOT_CONFLICT` -> Sets `time` field error: *"This appointment time slot is no longer available."*
- `INSUFFICIENT_STOCK` -> Sets `quantity` field error: *"The requested quantity is currently out of stock."*

---

## 5. Accessible Form Attributes & WCAG 2.1 AA Compliance

All form inputs (`<Input>`, `<Textarea>`, `<Select>`) integrate `React.useId()` for reliable accessibility binding:
- **`aria-invalid={!!error}`**: Programmatically communicates error state to assistive technologies.
- **`aria-describedby={error ? `${inputId}-error` : undefined}`**: Connects the input field to its descriptive error message.
- **`role="alert"` on Inline Messages**: Announces dynamic error updates to screen readers.
- **Visual Error Indicators**: High-contrast border (`border-destructive`) and icon accents (`AlertCircle`).
- **Submit Buttons**: Render `<Loader2 className="animate-spin" />` and apply `disabled={isSubmitting}` to prevent accidental duplicate submissions.
