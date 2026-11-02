# PawConnect Backend — Phase 2: Customer Core API Specification

This document provides complete, part-wise documentation for all Customer Core endpoints implemented in Phase 2. All endpoints are rooted under `/api/me/**` and require standard JWT Bearer authentication. All responses strictly adhere to the unified `ApiResponse<T>` envelope.

---

## Part 1: Profile & Security Management APIs

### 1.1 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/me`
- **Access**: Authenticated (`PET_OWNER`, `VETERINARIAN`, `SERVICE_PROVIDER`, `ADMIN`)
- **Headers**: `Authorization: Bearer <accessToken>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Current user retrieved successfully",
  "data": {
    "id": 14,
    "firstName": "Alice",
    "lastName": "Smith",
    "fullName": "Alice Smith",
    "email": "alice.smith@example.com",
    "phone": "+12345678901",
    "roles": ["PET_OWNER"],
    "profileImage": "https://example.com/avatar.jpg",
    "status": "ACTIVE",
    "emailVerified": false,
    "phoneVerified": false,
    "createdAt": "2026-10-09T10:00:00",
    "lastLoginAt": "2026-10-09T12:00:00"
  },
  "errors": [],
  "timestamp": "2026-10-09T12:05:00.000Z",
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 1.2 Update Profile
- **Method**: `PUT`
- **Path**: `/api/me`
- **Access**: Authenticated
- **Description**: Updates profile fields. Note: Roles, account status, token version, email, and password hash cannot be modified through this endpoint.

#### Request Body
```json
{
  "firstName": "Alicia",
  "lastName": "Smith-Williams",
  "phone": "+12345678999",
  "profileImage": "https://example.com/new-avatar.jpg"
}
```

#### Validation Rules
- `firstName`: Required, 1-100 characters
- `lastName`: Required, 1-100 characters
- `phone`: Optional, 10-15 digits if present, unique across accounts
- `profileImage`: Optional, max 500 characters

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Profile updated successfully",
  "data": {
    "id": 14,
    "firstName": "Alicia",
    "lastName": "Smith-Williams",
    "fullName": "Alicia Smith-Williams",
    "email": "alice.smith@example.com",
    "phone": "+12345678999",
    "roles": ["PET_OWNER"],
    "profileImage": "https://example.com/new-avatar.jpg",
    "status": "ACTIVE",
    "emailVerified": false,
    "phoneVerified": false,
    "createdAt": "2026-10-09T10:00:00",
    "lastLoginAt": "2026-10-09T12:00:00"
  },
  "errors": [],
  "timestamp": "2026-10-09T12:05:00.000Z",
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

#### Error Responses
- **409 Conflict**: Phone already registered (`code: "DUPLICATE_RESOURCE"`).
- **400 Bad Request**: Validation constraint failure (`code: "VALIDATION_ERROR"`).

---

### 1.3 Change Password
- **Method**: `PUT`
- **Path**: `/api/me/password`
- **Access**: Authenticated
- **Description**: Verifies the current password, encodes the new password with BCrypt, updates the hash, and increments `token_version` to immediately invalidate all existing sessions.

#### Request Body
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "BrandNewPassword@456",
  "confirmNewPassword": "BrandNewPassword@456"
}
```

#### Validation Rules
- `currentPassword`: Required
- `newPassword`: Required, 8-100 characters, uppercase, lowercase, digit, and special symbol
- `confirmNewPassword`: Must match `newPassword`
- `newPassword` must differ from `currentPassword`

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Password changed successfully. Prior sessions have been revoked.",
  "data": null,
  "errors": [],
  "timestamp": "2026-10-09T12:05:00.000Z",
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

#### Error Responses
- **401 Unauthorized**: Current password incorrect (`code: "INVALID_CREDENTIALS"`).
- **422 Unprocessable Entity**: Passwords mismatch or new password equals current (`code: "BUSINESS_RULE_VIOLATION"`).

---

## Part 2: Pet Profile Management APIs

### 2.1 List Pets (Paginated)
- **Method**: `GET`
- **Path**: `/api/me/pets?page=0&size=20&sort=createdAt,desc`
- **Access**: Authenticated
- **Description**: Returns paginated list of active pets belonging strictly to the current user.

#### Allowed Sort Fields
`id`, `name`, `species`, `breed`, `dateOfBirth`, `weight`, `createdAt`, `updatedAt` (Default: `createdAt,desc`)

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Pets retrieved successfully",
  "data": {
    "content": [
      {
        "id": 101,
        "ownerId": 14,
        "ownerName": "Alice Smith",
        "name": "Buddy",
        "species": "Dog",
        "breed": "Golden Retriever",
        "dateOfBirth": "2024-04-15",
        "age": "2 years 5 months",
        "gender": "MALE",
        "weight": 28.50,
        "photoUrl": "https://example.com/buddy.jpg",
        "notes": "Friendly, loves playing fetch",
        "status": "ACTIVE",
        "createdAt": "2026-05-01T10:00:00",
        "updatedAt": "2026-05-01T10:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true,
    "sort": "createdAt: DESC"
  },
  "errors": [],
  "timestamp": "2026-10-09T12:05:00.000Z",
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 2.2 Create Pet
- **Method**: `POST`
- **Path**: `/api/me/pets`
- **Access**: Authenticated
- **Description**: Creates a pet profile for the authenticated user (`ownerId` is automatically derived).

#### Request Body
```json
{
  "name": "Buddy",
  "species": "Dog",
  "breed": "Golden Retriever",
  "dateOfBirth": "2024-04-15",
  "gender": "MALE",
  "weight": 28.50,
  "photoUrl": "https://example.com/buddy.jpg",
  "notes": "Friendly, loves playing fetch"
}
```

#### Success Response (201 CREATED)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Pet created successfully",
  "data": {
    "id": 101,
    "ownerId": 14,
    "ownerName": "Alice Smith",
    "name": "Buddy",
    "species": "Dog",
    "breed": "Golden Retriever",
    "dateOfBirth": "2024-04-15",
    "age": "2 years 5 months",
    "gender": "MALE",
    "weight": 28.50,
    "photoUrl": "https://example.com/buddy.jpg",
    "notes": "Friendly, loves playing fetch",
    "status": "ACTIVE",
    "createdAt": "2026-10-09T12:00:00",
    "updatedAt": "2026-10-09T12:00:00"
  },
  "errors": [],
  "timestamp": "2026-10-09T12:05:00.000Z",
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 2.3 Get Pet by ID
- **Method**: `GET`
- **Path**: `/api/me/pets/{petId}`
- **Access**: Authenticated
- **Enforcement**: Verifies ownership; returns 403 Forbidden if accessed by another user.

---

### 2.4 Update Pet
- **Method**: `PUT`
- **Path**: `/api/me/pets/{petId}`
- **Access**: Authenticated
- **Enforcement**: Verifies ownership.

#### Request Body
```json
{
  "name": "Buddy Champion",
  "species": "Dog",
  "breed": "Golden Retriever",
  "dateOfBirth": "2024-04-15",
  "gender": "MALE",
  "weight": 29.00,
  "photoUrl": "https://example.com/buddy-updated.jpg",
  "notes": "Updated training notes"
}
```

---

### 2.5 Delete Pet (Soft Deletion)
- **Method**: `DELETE`
- **Path**: `/api/me/pets/{petId}`
- **Access**: Authenticated
- **Strategy**: Sets `status = INACTIVE`. Preserves referential integrity for historical vaccinations, medical records, and past bookings without cascade deletion.

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Pet deleted successfully",
  "data": null,
  "errors": [],
  "timestamp": "2026-10-09T12:05:00.000Z",
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

## Part 3: Pet Vaccination Records APIs

### 3.1 List Vaccinations
- **Method**: `GET`
- **Path**: `/api/me/pets/{petId}/vaccinations?page=0&size=20&sort=vaccinationDate,desc`
- **Access**: Authenticated
- **Enforcement**: Verifies pet ownership.

#### Allowed Sort Fields
`id`, `vaccineName`, `vaccinationDate`, `nextDueDate`, `createdAt`

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Vaccinations retrieved successfully",
  "data": {
    "content": [
      {
        "id": 201,
        "petId": 101,
        "petName": "Buddy",
        "vaccineName": "Rabies",
        "vaccinationDate": "2026-09-01",
        "nextDueDate": "2027-09-01",
        "certificateUrl": "https://example.com/rabies-cert.pdf",
        "administeredBy": "City Pet Hospital",
        "notes": "No allergic reaction",
        "createdAt": "2026-09-01T11:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true,
    "sort": "vaccinationDate: DESC"
  },
  "errors": [],
  "timestamp": "2026-10-09T12:05:00.000Z",
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 3.2 Add Vaccination Record
- **Method**: `POST`
- **Path**: `/api/me/pets/{petId}/vaccinations`
- **Access**: Authenticated

#### Request Body
```json
{
  "vaccineName": "DHPP",
  "vaccinationDate": "2026-09-15",
  "nextDueDate": "2027-09-15",
  "certificateUrl": "https://example.com/dhpp.pdf",
  "administeredBy": "Apex Vet Clinic",
  "notes": "Core booster"
}
```

#### Chronological Invariant
`nextDueDate` cannot precede `vaccinationDate`. Violations trigger HTTP 422 (`code: "BUSINESS_RULE_VIOLATION"`).

---

### 3.3 Update Vaccination Record
- **Method**: `PUT`
- **Path**: `/api/me/pets/{petId}/vaccinations/{vaccinationId}`
- **Access**: Authenticated
- **Enforcement**: Verifies pet ownership and verifies that `vaccinationId` belongs to `petId`.

---

### 3.4 Delete Vaccination Record
- **Method**: `DELETE`
- **Path**: `/api/me/pets/{petId}/vaccinations/{vaccinationId}`
- **Access**: Authenticated
- **Enforcement**: Verifies pet ownership and record linkage.

---

## Part 4: Pet Medical Records APIs

### 4.1 List Medical Records
- **Method**: `GET`
- **Path**: `/api/me/pets/{petId}/medical-records?page=0&size=20&sort=recordDate,desc`
- **Access**: Authenticated
- **Allowed Sort Fields**: `id`, `recordType`, `recordDate`, `createdAt`

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Medical records retrieved successfully",
  "data": {
    "content": [
      {
        "id": 301,
        "petId": 101,
        "petName": "Buddy",
        "veterinarianId": null,
        "veterinarianName": null,
        "isVeterinarianVerified": false,
        "recordType": "Home Checkup",
        "diagnosis": "Minor ear redness",
        "treatment": "Ear cleaning solution applied",
        "medicines": "Otic drops 2x daily",
        "recordDate": "2026-10-01",
        "attachmentUrl": null,
        "notes": "Follow up if not resolved in 3 days",
        "createdAt": "2026-10-01T10:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true,
    "sort": "recordDate: DESC"
  },
  "errors": [],
  "timestamp": "2026-10-09T12:05:00.000Z",
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 4.2 Add Customer-Entered Medical Record
- **Method**: `POST`
- **Path**: `/api/me/pets/{petId}/medical-records`
- **Access**: Authenticated
- **Impersonation Protection**: Customer-entered records automatically set `veterinarian = null` and `isVeterinarianVerified = false`. Arbitrary client veterinarian IDs are discarded.

#### Request Body
```json
{
  "recordType": "Allergy Observation",
  "diagnosis": "Seasonal paw licking",
  "treatment": "Antihistamine shampoo",
  "medicines": "Apoquel 16mg",
  "recordDate": "2026-10-05",
  "attachmentUrl": "https://example.com/record.pdf",
  "notes": "Symptoms improved after 24h"
}
```

---

### 4.3 Update Medical Record
- **Method**: `PUT`
- **Path**: `/api/me/pets/{petId}/medical-records/{recordId}`
- **Access**: Authenticated
- **Veterinarian Authorship Protection**: If a record was authored by a licensed veterinarian (`veterinarian != null`), any customer attempt to update it is rejected with **403 Forbidden** (`"Cannot modify a medical record authored by a veterinarian"`).

---

### 4.4 Delete Medical Record
- **Method**: `DELETE`
- **Path**: `/api/me/pets/{petId}/medical-records/{recordId}`
- **Access**: Authenticated
- **Veterinarian Authorship Protection**: If authored by a licensed veterinarian, rejection with **403 Forbidden** (`"Cannot delete a medical record authored by a veterinarian"`).

---

## Part 5: Customer Address Book APIs

### 5.1 List Addresses
- **Method**: `GET`
- **Path**: `/api/me/addresses`
- **Access**: Authenticated
- **Ordering**: Returns addresses with the default primary address first (`is_default DESC, created_at DESC`).

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Addresses retrieved successfully",
  "data": [
    {
      "id": 401,
      "userId": 14,
      "addressType": "HOME",
      "recipientName": "Alice Smith",
      "phone": "+12345678901",
      "addressLine1": "123 Maple Street",
      "addressLine2": "Apt 4B",
      "city": "Springfield",
      "state": "Illinois",
      "postalCode": "62701",
      "country": "USA",
      "isDefault": true,
      "createdAt": "2026-10-01T10:00:00",
      "updatedAt": "2026-10-01T10:00:00"
    }
  ],
  "errors": [],
  "timestamp": "2026-10-09T12:05:00.000Z",
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 5.2 Add Address
- **Method**: `POST`
- **Path**: `/api/me/addresses`
- **Access**: Authenticated
- **Default Policy**: If this is the user's first address, or if `isDefault == true`, any existing default address is transactionally unset and this address becomes default.

#### Request Body
```json
{
  "addressType": "HOME",
  "recipientName": "Alice Smith",
  "phone": "+12345678901",
  "addressLine1": "123 Maple Street",
  "addressLine2": "Apt 4B",
  "city": "Springfield",
  "state": "Illinois",
  "postalCode": "62701",
  "country": "USA",
  "isDefault": true
}
```

---

### 5.3 Update Address
- **Method**: `PUT`
- **Path**: `/api/me/addresses/{addressId}`
- **Access**: Authenticated
- **Enforcement**: Verifies ownership.

---

### 5.4 Delete Address
- **Method**: `DELETE`
- **Path**: `/api/me/addresses/{addressId}`
- **Access**: Authenticated
- **Default Address Auto-Promotion**: If the deleted address was the user's primary default address, the next available address is automatically promoted to `isDefault = true`.

---

### 5.5 Set Address as Default
- **Method**: `PATCH`
- **Path**: `/api/me/addresses/{addressId}/default`
- **Access**: Authenticated
- **Description**: Transactionally unsets all other addresses for this user and sets the target address as default.

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Default address updated successfully",
  "data": {
    "id": 401,
    "userId": 14,
    "addressType": "HOME",
    "recipientName": "Alice Smith",
    "phone": "+12345678901",
    "addressLine1": "123 Maple Street",
    "addressLine2": "Apt 4B",
    "city": "Springfield",
    "state": "Illinois",
    "postalCode": "62701",
    "country": "USA",
    "isDefault": true,
    "createdAt": "2026-10-01T10:00:00",
    "updatedAt": "2026-10-09T12:00:00"
  },
  "errors": [],
  "timestamp": "2026-10-09T12:05:00.000Z",
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

## Part 6: Security, Ownership & Error Contract Reference

### HTTP Status Code Specifications

| Code | HTTP Status | Response Code | Description |
|---|---|---|---|
| 200 | OK | `SUCCESS` | Successful query or mutation |
| 201 | Created | `SUCCESS` | Successfully created resource |
| 400 | Bad Request | `VALIDATION_ERROR` / `BAD_REQUEST` | Validation violation or illegal parameter |
| 401 | Unauthorized | `UNAUTHORIZED` / `INVALID_CREDENTIALS` | Missing or invalid authentication token |
| 403 | Forbidden | `FORBIDDEN` | Access denied: user does not own the requested resource or attempted to alter vet records |
| 404 | Not Found | `RESOURCE_NOT_FOUND` | Target entity not found |
| 409 | Conflict | `DUPLICATE_RESOURCE` | Duplicate unique property (e.g. phone) |
| 422 | Unprocessable Entity | `BUSINESS_RULE_VIOLATION` | Business invariant failed (e.g. dates invalid) |
| 500 | Server Error | `INTERNAL_SERVER_ERROR` | Generic server fallback (database traces masked) |
