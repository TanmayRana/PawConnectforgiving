# PawConnect Backend — Phase 3: Booking APIs Specification

This document provides comprehensive documentation for all Phase 3 Booking APIs implemented in the PawConnect Spring Boot backend. All endpoints adhere strictly to the unified `ApiResponse<T>` envelope, enforce server-side role and ownership authorization, prevent schedule overlaps and double-bookings with database concurrency controls, and validate strict booking lifecycle transitions.

---

## 1. Overview & Architecture

### Supported Domains & Models
PawConnect provides two primary booking domains:
1. **Veterinary Appointments (`Appointment`)**: Direct bookings with licensed veterinarians (`Veterinarian`), including consultation fee tracking, clinic location, and appointment lifecycle states (`AppointmentStatus`).
2. **Service Provider Bookings (`ServiceBooking`)**: Direct bookings with verified in-house service providers (`ServiceProvider`) such as groomers and trainers, associated with catalogued services (`Service`) and booking lifecycle states (`BookingStatus`).

### Route Structure
- **Unified Customer Endpoints**: `/api/me/bookings/**` (supports polymorphic creation and viewing of both veterinary appointments and service bookings)
- **Dedicated Customer Appointments**: `/api/me/appointments/**` (veterinary-specific customer self-service)
- **Dedicated Customer Service Bookings**: `/api/me/service-bookings/**` (service-provider specific customer self-service)
- **Veterinarian Management**: `/api/vet/appointments/**` (veterinarian portal endpoints)
- **Service Provider Management**: `/api/provider/bookings/**` (service provider portal endpoints)

---

## 2. Part A: Customer Booking Management APIs

### 2.1 Unified Booking Creation
- **Method**: `POST`
- **Path**: `/api/me/bookings`
- **Access**: `hasRole('PET_OWNER')`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Creates either a veterinary appointment or a service booking based on `bookingType`.

#### Request Body (`VETERINARY`)
```json
{
  "bookingType": "VETERINARY",
  "petId": 15,
  "veterinarianId": 3,
  "date": "2026-10-15",
  "startTime": "10:00:00",
  "endTime": "10:30:00",
  "reason": "Vaccination Boosters",
  "notes": "First visit"
}
```

#### Request Body (`SERVICE`)
```json
{
  "bookingType": "SERVICE",
  "petId": 15,
  "providerId": 5,
  "serviceId": 12,
  "date": "2026-10-16",
  "startTime": "14:00:00",
  "notes": "Gentle wash please"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Booking created successfully",
  "data": {
    "id": 42,
    "bookingType": "VETERINARY",
    "referenceNo": "APT-30911033-0DCC",
    "petId": 15,
    "petName": "Max",
    "species": "Dog",
    "breed": "Golden Retriever",
    "providerId": 3,
    "providerName": "Dr. Charlie Vet",
    "providerType": "VETERINARIAN",
    "providerPhone": "+1333333333",
    "serviceId": null,
    "serviceOrReason": "Vaccination Boosters",
    "date": "2026-10-15",
    "startTime": "10:00:00",
    "endTime": "10:30:00",
    "amount": 150.00,
    "status": "PENDING",
    "notes": null,
    "createdAt": "2026-10-09T13:00:00",
    "updatedAt": "2026-10-09T13:00:00"
  },
  "errors": [],
  "timestamp": "2026-10-09T13:00:00.000Z",
  "meta": {
    "requestId": "d8e3b7c2-1a4f-4d6e-9821-fa3b4c5d6e7f"
  }
}
```

---

### 2.2 List Customer Bookings (Paginated)
- **Method**: `GET`
- **Path**: `/api/me/bookings`
- **Access**: `hasRole('PET_OWNER')`
- **Query Parameters**:
  - `type` (optional): `VETERINARY` or `SERVICE` (omitted returns merged list of all bookings)
  - `page` (optional, default `0`): Zero-indexed page number
  - `size` (optional, default `20`, max `100`): Items per page
  - `sort` (optional, default `date,desc`): Allow-listed sort fields (`id`, `date`, `startTime`, `endTime`, `status`, `createdAt`, `updatedAt`)

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Bookings retrieved successfully",
  "data": {
    "content": [
      {
        "id": 42,
        "bookingType": "VETERINARY",
        "referenceNo": "APT-30911033-0DCC",
        "petId": 15,
        "petName": "Max",
        "species": "Dog",
        "breed": "Golden Retriever",
        "providerId": 3,
        "providerName": "Dr. Charlie Vet",
        "providerType": "VETERINARIAN",
        "serviceId": null,
        "serviceOrReason": "Vaccination Boosters",
        "date": "2026-10-15",
        "startTime": "10:00:00",
        "endTime": "10:30:00",
        "amount": 150.00,
        "status": "PENDING",
        "createdAt": "2026-10-09T13:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true,
    "sort": "date: DESC"
  },
  "errors": [],
  "timestamp": "2026-10-09T13:05:00.000Z"
}
```

---

### 2.3 Retrieve Customer Booking by ID
- **Method**: `GET`
- **Path**: `/api/me/bookings/{bookingId}`
- **Access**: `hasRole('PET_OWNER')`
- **Security Check**: Enforces pet ownership. If `{bookingId}` belongs to another user, returns `403 Forbidden`. If nonexistent, returns `404 Not Found`.

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Booking retrieved successfully",
  "data": {
    "id": 42,
    "bookingType": "VETERINARY",
    "referenceNo": "APT-30911033-0DCC",
    "petId": 15,
    "petName": "Max",
    "providerId": 3,
    "providerName": "Dr. Charlie Vet",
    "date": "2026-10-15",
    "startTime": "10:00:00",
    "endTime": "10:30:00",
    "amount": 150.00,
    "status": "PENDING"
  }
}
```

---

### 2.4 Cancel Customer Booking
- **Method**: `PATCH`
- **Path**: `/api/me/bookings/{bookingId}/cancel`
- **Access**: `hasRole('PET_OWNER')`
- **Rules**:
  - Only active non-terminal bookings (`PENDING` or `CONFIRMED`) can be cancelled.
  - Bookings in the past cannot be cancelled.
  - Cancelling an already `CANCELLED`, `COMPLETED`, or `NO_SHOW` booking returns `409 Conflict` (`INVALID_STATE_TRANSITION`).
  - Upon cancellation, the reserved provider slot is released immediately for other clients to book.

#### Request Body (Optional)
```json
{
  "reason": "Change of travel plans"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Booking cancelled successfully",
  "data": {
    "id": 42,
    "bookingType": "VETERINARY",
    "referenceNo": "APT-30911033-0DCC",
    "status": "CANCELLED",
    "notes": "Cancel reason: Change of travel plans"
  }
}
```

---

### 2.5 Dedicated Customer Appointment & Service Booking Endpoints
In addition to the unified endpoints, dedicated endpoints exist for clients interacting directly with appointment or service booking entities:
- `POST /api/me/appointments` — Book veterinary appointment
- `GET /api/me/appointments` — List customer veterinary appointments (supports `?status=...`)
- `GET /api/me/appointments/{appointmentId}` — Retrieve appointment details
- `PATCH /api/me/appointments/{appointmentId}/cancel` — Cancel appointment
- `POST /api/me/service-bookings` — Book service provider appointment
- `GET /api/me/service-bookings` — List customer service bookings (supports `?status=...`)
- `GET /api/me/service-bookings/{bookingId}` — Retrieve service booking details
- `PATCH /api/me/service-bookings/{bookingId}/cancel` — Cancel service booking

---

## 3. Part B: Veterinarian Booking Management APIs

All veterinarian endpoints are rooted under `/api/vet/appointments/**` and require `hasRole('VETERINARIAN')`. The veterinarian identity is automatically extracted from the authenticated user's JWT token via `VeterinarianRepository.findByUserId(currentUserId)`.

### 3.1 List Assigned Appointments
- **Method**: `GET`
- **Path**: `/api/vet/appointments`
- **Access**: `hasRole('VETERINARIAN')`
- **Query Parameters**:
  - `status` (optional): Filter by `AppointmentStatus` (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)
  - `page` (default `0`), `size` (default `20`, max `100`), `sort` (default `appointmentDate,desc`)

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Appointments retrieved successfully",
  "data": {
    "content": [
      {
        "id": 42,
        "appointmentNo": "APT-30911033-0DCC",
        "petId": 15,
        "petName": "Max",
        "species": "Dog",
        "breed": "Golden Retriever",
        "ownerId": 7,
        "ownerName": "Alice Smith",
        "ownerPhone": "+1111111111",
        "veterinarianId": 3,
        "veterinarianName": "Dr. Charlie Vet",
        "clinicName": "Charlie Animal Clinic",
        "specialization": "General Practice",
        "appointmentDate": "2026-10-15",
        "startTime": "10:00:00",
        "endTime": "10:30:00",
        "reason": "Vaccination Boosters",
        "consultationFee": 150.00,
        "status": "PENDING",
        "notes": null
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

---

### 3.2 Retrieve Assigned Appointment by ID
- **Method**: `GET`
- **Path**: `/api/vet/appointments/{appointmentId}`
- **Access**: `hasRole('VETERINARIAN')`
- **Security Check**: Enforces provider assignment. If the appointment is assigned to a different veterinarian, returns `403 Forbidden`.

---

### 3.3 Update Appointment Status
- **Method**: `PATCH`
- **Path**: `/api/vet/appointments/{appointmentId}/status`
- **Access**: `hasRole('VETERINARIAN')`

#### Request Body
```json
{
  "status": "CONFIRMED",
  "notes": "Confirmed by clinic staff"
}
```

#### Allowed Status Transitions:
- `PENDING` $\rightarrow$ `CONFIRMED` or `CANCELLED`
- `CONFIRMED` $\rightarrow$ `COMPLETED`, `CANCELLED`, or `NO_SHOW`
- Terminal states (`COMPLETED`, `CANCELLED`, `NO_SHOW`): Cannot be transitioned out of. Attempting an invalid transition returns `409 Conflict` (`INVALID_STATE_TRANSITION`).

---

## 4. Part C: Service Provider Booking Management APIs

All service provider endpoints are rooted under `/api/provider/bookings/**` and require `hasRole('SERVICE_PROVIDER')`. The provider identity is automatically derived from the authenticated security context via `ServiceProviderRepository.findByUserId(currentUserId)`.

### 4.1 List Assigned Service Bookings
- **Method**: `GET`
- **Path**: `/api/provider/bookings`
- **Access**: `hasRole('SERVICE_PROVIDER')`
- **Query Parameters**:
  - `status` (optional): Filter by `BookingStatus` (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)
  - `page`, `size`, `sort`

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Bookings retrieved successfully",
  "data": {
    "content": [
      {
        "id": 55,
        "bookingNo": "SB-30910057-1EE3",
        "petId": 15,
        "petName": "Max",
        "species": "Dog",
        "breed": "Golden Retriever",
        "ownerId": 7,
        "ownerName": "Alice Smith",
        "ownerPhone": "+1111111111",
        "providerId": 5,
        "businessName": "Evan's Pet Grooming",
        "providerPhone": "+1555555555",
        "providerType": "GROOMER",
        "serviceId": 12,
        "serviceName": "Deluxe Bath & Trim",
        "durationMinutes": 60,
        "bookingDate": "2026-10-16",
        "startTime": "14:00:00",
        "endTime": "15:00:00",
        "price": 80.00,
        "status": "PENDING",
        "notes": "Gentle wash please"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1
  }
}
```

---

### 4.2 Retrieve Assigned Booking by ID
- **Method**: `GET`
- **Path**: `/api/provider/bookings/{bookingId}`
- **Access**: `hasRole('SERVICE_PROVIDER')`
- **Security Check**: Enforces provider assignment. Cannot access bookings assigned to another provider (`403 Forbidden`).

---

### 4.3 Update Service Booking Status
- **Method**: `PATCH`
- **Path**: `/api/provider/bookings/{bookingId}/status`
- **Access**: `hasRole('SERVICE_PROVIDER')`

#### Request Body
```json
{
  "status": "COMPLETED",
  "notes": "Full grooming completed without issues"
}
```

#### Allowed Status Transitions:
- `PENDING` $\rightarrow$ `CONFIRMED` or `CANCELLED`
- `CONFIRMED` $\rightarrow$ `COMPLETED`, `CANCELLED`, or `NO_SHOW`
- Terminal states (`COMPLETED`, `CANCELLED`, `NO_SHOW`): Cannot be transitioned out of.

---

## 5. Part D: Booking Lifecycle & Permitted Transitions

| Source Status | Target Status | Permitted Roles | Notes / Conditions |
|---|---|---|---|
| `PENDING` | `CONFIRMED` | `VETERINARIAN`, `SERVICE_PROVIDER` | Provider accepts the requested slot |
| `PENDING` | `CANCELLED` | `PET_OWNER`, `VETERINARIAN`, `SERVICE_PROVIDER` | Pet owner or provider declines/cancels before service; slot released |
| `CONFIRMED` | `COMPLETED` | `VETERINARIAN`, `SERVICE_PROVIDER` | Appointment/service completed; terminal state |
| `CONFIRMED` | `CANCELLED` | `PET_OWNER`, `VETERINARIAN`, `SERVICE_PROVIDER` | Allowed if appointment time has not passed; slot released |
| `CONFIRMED` | `NO_SHOW` | `VETERINARIAN`, `SERVICE_PROVIDER` | Client did not arrive for scheduled slot; terminal state |
| `COMPLETED` | *Any* | *None* | **Terminal state**: Cannot transition |
| `CANCELLED` | *Any* | *None* | **Terminal state**: Cannot transition |
| `NO_SHOW` | *Any* | *None* | **Terminal state**: Cannot transition |

---

## 6. Part E: Schedule Integrity & Double-Booking Prevention

### 1. Working Hours & Availability Checks
- Before booking, provider availability is verified via `VeterinarianAvailabilityRepository` or `ServiceProviderAvailabilityRepository` matching the requested `DayOfWeek`.
- If the provider is marked unavailable (`isAvailable = false`) on that day of week, a `422 Unprocessable Entity` (`BUSINESS_RULE_VIOLATION`) is returned.
- If requested `startTime` or calculated `endTime` falls outside working hours (`startTime < avail.startTime` or `endTime > avail.endTime`), a `422 Unprocessable Entity` is returned.

### 2. Overlap Collision Detection
- Active bookings in `PENDING` or `CONFIRMED` status occupy provider slots.
- Queries check `appointmentDate = :date AND startTime < :reqEnd AND endTime > :reqStart AND status NOT IN ('CANCELLED', 'NO_SHOW')`.
- If an overlap exists, returns `409 Conflict` (`SLOT_CONFLICT`).

### 3. Concurrency Safety & Pessimistic Locking
- To eliminate race conditions where two simultaneous requests attempt to book the same slot:
  - Both `AppointmentServiceImpl` and `ServiceBookingServiceImpl` acquire a pessimistic write lock (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) on the provider entity row (`findByIdForUpdate(providerId)`) inside a `@Transactional` block.
  - The second transaction blocks until the first completes.
  - The second transaction then sees the newly committed booking and fails with `SlotConflictException` (409 Conflict).
  - Verified by multi-threaded automated integration tests.

---

## 7. Error Codes & HTTP Status Mappings

| Error Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHORIZED` | `401 Unauthorized` | Missing or invalid JWT Bearer token |
| `FORBIDDEN` | `403 Forbidden` | Accessing another customer's booking or wrong provider assignment |
| `RESOURCE_NOT_FOUND` | `404 Not Found` | Booking, pet, vet, or provider does not exist |
| `SLOT_CONFLICT` | `409 Conflict` | Overlapping booking detected for the provider |
| `INVALID_STATE_TRANSITION` | `409 Conflict` | Attempted invalid or terminal state transition |
| `BUSINESS_RULE_VIOLATION` | `422 Unprocessable Entity` | Past date/time, outside working hours, unverified provider |
| `VALIDATION_ERROR` | `400 Bad Request` | Missing required payload fields or malformed data |
