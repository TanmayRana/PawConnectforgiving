# PawConnect Backend — Authentication API Contract

This document provides the canonical API contract for all Authentication and Current User endpoints implemented in Phase 1.

All responses use the standard `ApiResponse<T>` envelope format.

---

## Standard Response Envelopes

### Success Envelope (2xx)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Operation completed successfully",
  "data": { ... },
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "c1f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```

### Validation Error Envelope (400 BAD REQUEST)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Enter a valid email address"
    }
  ],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "c1f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```

### Unauthorized Envelope (401 UNAUTHORIZED)
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Invalid email or password",
  "data": null,
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "c1f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```

### Forbidden Envelope (403 FORBIDDEN)
```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "Account has been suspended or access is denied",
  "data": null,
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "c1f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```

### Rate Limited Envelope (429 TOO MANY REQUESTS)
```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please wait a moment before trying again.",
  "data": null,
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "c1f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```

---

## 1. Register User

- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Access**: Public
- **Rate Limit**: 10 requests / minute / IP

### Request Body
```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "9876543210",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```

### Validation Constraints
- `fullName`: Required, 2-100 characters
- `email`: Required, valid email format, unique in database
- `phone`: Optional, 10-15 digits if present, unique in database
- `password`: Required, 8-100 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (`@$!%*?&`)
- `confirmPassword`: Required, must exactly match `password`

### Success Response (201 CREATED)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Registration successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": 14,
      "fullName": "Jane Doe",
      "email": "jane.doe@example.com",
      "phone": "9876543210",
      "profileImageUrl": null,
      "accountStatus": "ACTIVE",
      "roles": ["PET_OWNER"],
      "lastLoginAt": null,
      "createdAt": "2026-10-09T10:45:00Z"
    }
  },
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "22f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```

### Error Responses
- **400 Bad Request**: Password confirmation mismatch or validation failure (`code: "VALIDATION_ERROR"`).
- **409 Conflict**: Email or phone already registered (`code: "DUPLICATE_RESOURCE"`).

---

## 2. Login User

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Access**: Public
- **Rate Limit**: 10 requests / minute / IP

### Request Body
```json
{
  "email": "jane.doe@example.com",
  "password": "Password@123"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": 14,
      "fullName": "Jane Doe",
      "email": "jane.doe@example.com",
      "phone": "9876543210",
      "profileImageUrl": null,
      "accountStatus": "ACTIVE",
      "roles": ["PET_OWNER"],
      "lastLoginAt": "2026-10-09T10:45:00Z",
      "createdAt": "2026-10-09T10:45:00Z"
    }
  },
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "33f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```

### Error Responses
- **401 Unauthorized**: Generic error message `"Invalid email or password"` (safe against enumeration).
- **403 Forbidden**: Account is locked or suspended (`"Account is locked or suspended"`).

---

## 3. Refresh Access Token

- **Method**: `POST`
- **Path**: `/api/auth/refresh`
- **Access**: Public (requires valid refresh token)
- **Rate Limit**: 20 requests / minute / IP

### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": 14,
      "fullName": "Jane Doe",
      "email": "jane.doe@example.com",
      "phone": "9876543210",
      "profileImageUrl": null,
      "accountStatus": "ACTIVE",
      "roles": ["PET_OWNER"],
      "lastLoginAt": "2026-10-09T10:45:00Z",
      "createdAt": "2026-10-09T10:45:00Z"
    }
  },
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "44f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```

### Error Responses
- **401 Unauthorized**: Refresh token is expired, malformed, revoked, or invalid token type (`code: "UNAUTHORIZED"`).

---

## 4. Logout User

- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Access**: Public / Authenticated (Accepts optional `refreshToken` in body and/or Bearer token in header)
- **Rate Limit**: 20 requests / minute / IP

### Request Body (Optional)
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Logged out successfully",
  "data": null,
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "55f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```
*Note: Logout increments the user's `token_version` in the database, invalidating all issued access and refresh tokens immediately.*

---

## 5. Forgot Password (Request OTP)

- **Method**: `POST`
- **Path**: `/api/auth/forgot-password`
- **Access**: Public
- **Rate Limit**: 5 requests / minute / IP

### Request Body
```json
{
  "email": "jane.doe@example.com"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "If an account exists with this email, a verification OTP has been sent.",
  "data": null,
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "66f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```
*Note: Returns uniform message regardless of email existence to prevent user enumeration.*

---

## 6. Verify OTP

- **Method**: `POST`
- **Path**: `/api/auth/verify-otp`
- **Access**: Public
- **Rate Limit**: 10 requests / minute / IP

### Request Body
```json
{
  "email": "jane.doe@example.com",
  "otp": "482910"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "OTP verified successfully",
  "data": {
    "resetToken": "0d209149-aebf-4fbe-bb9b-b27b3e02029b"
  },
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "77f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```

### Error Responses
- **400 Bad Request**: Invalid OTP, expired OTP, or maximum verification attempts exceeded (`code: "BUSINESS_RULE_VIOLATION"`).

---

## 7. Reset Password

- **Method**: `POST`
- **Path**: `/api/auth/reset-password`
- **Access**: Public
- **Rate Limit**: 5 requests / minute / IP

### Request Body
```json
{
  "email": "jane.doe@example.com",
  "resetToken": "0d209149-aebf-4fbe-bb9b-b27b3e02029b",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Password reset successfully. You may now log in with your new password.",
  "data": null,
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "88f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```
*Note: Increments user `token_version` to invalidate prior sessions and consumes the one-time `resetToken`.*

---

## 8. Get Current Authenticated User

- **Method**: `GET`
- **Path**: `/api/me`
- **Access**: Authenticated (`PET_OWNER`, `VETERINARIAN`, `SERVICE_PROVIDER`, `ADMIN`)
- **Headers**: `Authorization: Bearer <accessToken>`

### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "User details fetched successfully",
  "data": {
    "id": 14,
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "9876543210",
    "profileImageUrl": null,
    "accountStatus": "ACTIVE",
    "roles": ["PET_OWNER"],
    "lastLoginAt": "2026-10-09T10:45:00Z",
    "createdAt": "2026-10-09T10:45:00Z"
  },
  "errors": [],
  "timestamp": "2026-10-09T10:45:00.000Z",
  "meta": {
    "requestId": "99f77651-7f9a-4cbf-a9d0-0a63ce736b42"
  }
}
```

### Error Responses
- **401 Unauthorized**: Missing, malformed, expired, or revoked Bearer token (`code: "UNAUTHORIZED"`).
