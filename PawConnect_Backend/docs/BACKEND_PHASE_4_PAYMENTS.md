# PawConnect Backend — Phase 4: Booking Payments with Razorpay Specification

This document provides complete documentation for the Phase 4 Razorpay payment integration in the PawConnect Spring Boot backend. All payment endpoints strictly conform to the unified `ApiResponse<T>` envelope, enforce server-side authorization and booking eligibility, calculate amounts server-side in INR, perform cryptographic HMAC-SHA256 signature verification, and support resilient, idempotent webhook processing.

---

## 1. Overview & Architecture

### High-Level Architecture
1. **Server-Side Order Generation**:
   - The client requests a Razorpay order for an eligible, confirmed booking.
   - The backend validates ownership and booking eligibility (`CONFIRMED` status only).
   - The backend derives the amount directly from the server database (veterinary consultation fee or service price in INR). Any client-supplied amounts are ignored or rejected.
   - The backend creates an order with Razorpay (converted to paise: `amount * 100`) and records a `Payment` entity with `status = PENDING`.
   - The backend returns the `orderId`, `keyId`, `amount`, `currency`, and `bookingType` to the client. The Razorpay secret is never exposed.

2. **Client Checkout & Signature Verification**:
   - The frontend opens Razorpay Checkout using the returned `orderId` and `keyId`.
   - Upon successful client-side payment completion, Razorpay provides `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
   - The client submits these credentials to `POST /api/payments/razorpay/verify`.
   - The backend computes the HMAC-SHA256 signature over `razorpayOrderId + "|" + razorpayPaymentId` using the configured `razorpay.key-secret` and compares it in constant time with `razorpaySignature`.
   - Upon match, the `Payment` is transitioned to `SUCCESS`, the transaction/payment ID is stored, and the payment is linked to the appointment or service booking.
   - Re-verification of an already verified payment returns HTTP 200 with the existing payment record idempotently.

3. **Asynchronous Webhook Reconciliation**:
   - Razorpay delivers server-to-server webhook notifications to `POST /api/webhooks/razorpay`.
   - The webhook endpoint is public from JWT session requirements, but secured cryptographically via the `X-Razorpay-Signature` header computed over the raw payload using `razorpay.webhook-secret`.
   - Supported events:
     - `payment.captured` / `order.paid`: Safely reconciles the payment to `SUCCESS` under pessimistic database lock.
     - `payment.failed`: Sets status to `FAILED` (if not already `SUCCESS`). A verified `SUCCESS` payment is never downgraded by a subsequent failure event.
   - Webhook processing is idempotent: repeated deliveries return HTTP 200 without duplicate state changes.

4. **Lifecycle Decoupling**:
   - `Payment.status` (`PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`) is strictly decoupled from the booking status (`CONFIRMED`, `COMPLETED`).
   - A successful payment updates the payment entity to `SUCCESS` and links `paymentId` to the booking. It does **not** mark the appointment or service booking `COMPLETED`. The booking is completed only when the service is physically fulfilled by the veterinarian or service provider.

5. **Concurrency & Double-Capture Prevention**:
   - Database row-level pessimistic write locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) is used on `findByGatewayOrderIdForUpdate` to prevent race conditions between simultaneous client verification calls and asynchronous webhook callbacks.

---

## 2. API Endpoints

### 2.1 Customer Booking Payment Order (Unified)
- **Method**: `POST`
- **Path**: `/api/me/bookings/{bookingId}/payments/order`
- **Access**: `hasRole('PET_OWNER')`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Initiates a payment order for either a veterinary appointment or a service booking. Booking must be in `CONFIRMED` status.

#### Request Body (Optional)
```json
{
  "notes": "Payment for routine checkup"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Payment order initiated successfully",
  "data": {
    "orderId": "order_mock_5a8f2e4b1c",
    "keyId": "rzp_test_sampleKeyId123",
    "amount": 150.00,
    "currency": "INR",
    "bookingType": "VETERINARY",
    "bookingId": 42,
    "paymentId": 89
  },
  "errors": [],
  "timestamp": "2026-10-09T13:30:00.000Z",
  "meta": {
    "requestId": "e4f8b910-3c2a-4a5e-9912-fa81023d5a1b"
  }
}
```

---

### 2.2 Get Payment for Customer Booking (Unified)
- **Method**: `GET`
- **Path**: `/api/me/bookings/{bookingId}/payment`
- **Access**: `hasRole('PET_OWNER')`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Retrieves the latest payment record associated with the specified customer booking.

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Payment details retrieved successfully",
  "data": {
    "id": 89,
    "userId": 5,
    "amount": 150.00,
    "currency": "INR",
    "paymentMethod": "RAZORPAY",
    "status": "SUCCESS",
    "gatewayOrderId": "order_mock_5a8f2e4b1c",
    "gatewayPaymentId": "pay_mock_99182312",
    "gatewaySignature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "paymentFor": "APPOINTMENT",
    "referenceId": 42,
    "createdAt": "2026-10-09T13:30:00",
    "updatedAt": "2026-10-09T13:31:00"
  },
  "errors": [],
  "timestamp": "2026-10-09T13:31:00.000Z",
  "meta": {
    "requestId": "f1a2b3c4-d5e6-7890-abcd-ef0123456789"
  }
}
```

---

### 2.3 Dedicated Veterinary Appointment Payment Order
- **Method**: `POST`
- **Path**: `/api/me/appointments/{appointmentId}/payments/order`
- **Access**: `hasRole('PET_OWNER')`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Initiates a Razorpay payment order for a confirmed veterinary appointment.

#### Success Response (201 Created)
Returns `RazorpayOrderResponse` (same schema as 2.1).

---

### 2.4 Dedicated Veterinary Appointment Payment Retrieval
- **Method**: `GET`
- **Path**: `/api/me/appointments/{appointmentId}/payment`
- **Access**: `hasRole('PET_OWNER')`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Retrieves the payment record for the specified appointment.

#### Success Response (200 OK)
Returns `PaymentResponse` (same schema as 2.2).

---

### 2.5 Dedicated Service Provider Booking Payment Order
- **Method**: `POST`
- **Path**: `/api/me/service-bookings/{bookingId}/payments/order`
- **Access**: `hasRole('PET_OWNER')`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Initiates a Razorpay payment order for a confirmed service provider booking.

#### Success Response (201 Created)
Returns `RazorpayOrderResponse` (same schema as 2.1).

---

### 2.6 Dedicated Service Provider Booking Payment Retrieval
- **Method**: `GET`
- **Path**: `/api/me/service-bookings/{bookingId}/payment`
- **Access**: `hasRole('PET_OWNER')`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Retrieves the payment record for the specified service booking.

#### Success Response (200 OK)
Returns `PaymentResponse` (same schema as 2.2).

---

### 2.7 Checkout Signature Verification
- **Method**: `POST`
- **Path**: `/api/payments/razorpay/verify`
- **Access**: `hasRole('PET_OWNER')`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Verifies checkout credentials submitted by client after Razorpay payment modal completion.

#### Request Body
```json
{
  "razorpayOrderId": "order_mock_5a8f2e4b1c",
  "razorpayPaymentId": "pay_mock_99182312",
  "razorpaySignature": "computed_hmac_hex_digest"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Payment verified and recorded successfully",
  "data": {
    "id": 89,
    "userId": 5,
    "amount": 150.00,
    "currency": "INR",
    "paymentMethod": "RAZORPAY",
    "status": "SUCCESS",
    "gatewayOrderId": "order_mock_5a8f2e4b1c",
    "gatewayPaymentId": "pay_mock_99182312",
    "gatewaySignature": "computed_hmac_hex_digest",
    "paymentFor": "APPOINTMENT",
    "referenceId": 42,
    "createdAt": "2026-10-09T13:30:00",
    "updatedAt": "2026-10-09T13:31:00"
  },
  "errors": [],
  "timestamp": "2026-10-09T13:31:00.000Z",
  "meta": {
    "requestId": "98765432-abcd-ef01-2345-6789abcdef01"
  }
}
```

---

### 2.8 Payment Lookup by Payment ID
- **Method**: `GET`
- **Path**: `/api/payments/{paymentId}`
- **Access**: `hasAnyRole('PET_OWNER', 'ADMIN')`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Retrieves detailed payment record by primary key. Enforces ownership check (the calling pet owner must own the underlying booking; ADMIN can access any payment).

#### Success Response (200 OK)
Returns `PaymentResponse` (same schema as 2.2).

---

### 2.9 Razorpay Server Webhook Endpoint
- **Method**: `POST`
- **Path**: `/api/webhooks/razorpay`
- **Access**: Public / Unauthenticated via JWT (secured via HMAC-SHA256 signature in `X-Razorpay-Signature` header)
- **Headers**:
  - `Content-Type: application/json`
  - `X-Razorpay-Signature: <hex_encoded_hmac_signature>`
- **Description**: Reconciles asynchronous payment events delivered by Razorpay webhooks.

#### Sample Webhook Payload (`payment.captured`)
```json
{
  "entity": "event",
  "account_id": "acc_sample123",
  "event": "payment.captured",
  "contains": ["payment"],
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_mock_99182312",
        "entity": "payment",
        "amount": 15000,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_mock_5a8f2e4b1c",
        "method": "upi",
        "captured": true
      }
    }
  },
  "created_at": 1728470000
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Webhook processed successfully",
  "data": {
    "event": "payment.captured",
    "orderId": "order_mock_5a8f2e4b1c",
    "paymentId": "pay_mock_99182312",
    "status": "PROCESSED"
  },
  "errors": [],
  "timestamp": "2026-10-09T13:31:05.000Z",
  "meta": {
    "requestId": "webhook-ack-12345"
  }
}
```

---

## 3. Error Handling and Edge Cases

| Scenario | HTTP Status | Error Code | Description |
|---|---|---|---|
| Booking is `PENDING` (not confirmed) | 400 Bad Request | `INVALID_STATE` | Only `CONFIRMED` bookings can be paid. |
| Booking is `CANCELLED` | 400 Bad Request | `INVALID_STATE` | Cancelled bookings cannot accept payments. |
| Booking already has a `SUCCESS` payment | 400 Bad Request | `PAYMENT_ALREADY_COMPLETED` | Cannot create a new order when booking is already paid. |
| Customer attempts to pay for another user's booking | 403 Forbidden | `ACCESS_DENIED` | Server-side pet and booking ownership check fails. |
| Invalid checkout verification signature | 400 Bad Request | `PAYMENT_SIGNATURE_INVALID` | HMAC-SHA256 signature does not match secret key calculation. |
| Order ID not found during verification | 404 Not Found | `ORDER_NOT_FOUND` | No matching payment record found with `gatewayOrderId`. |
| Missing or invalid `X-Razorpay-Signature` webhook header | 400 Bad Request | `WEBHOOK_SIGNATURE_INVALID` | Webhook verification fails cryptographic HMAC check. |
| Webhook references unknown `order_id` | 200 OK | `SUCCESS` | Safely acknowledged to prevent retry storms for unmanaged external events. |
| Webhook `payment.failed` on already `SUCCESS` payment | 200 OK | `SUCCESS` | Idempotently ignored; verified payments are never downgraded. |
| Concurrent verification requests for same order | 200 OK | `SUCCESS` | Pessimistic locking synchronizes execution; second thread returns updated record idempotently. |

---

## 4. Security & Configuration Properties

### Configuration (`application.yaml`)
```yaml
razorpay:
  key-id: ${RAZORPAY_KEY_ID:rzp_test_sampleKeyId}
  key-secret: ${RAZORPAY_KEY_SECRET:sampleKeySecret}
  webhook-secret: ${RAZORPAY_WEBHOOK_SECRET:sampleWebhookSecret}
  mock-client: ${RAZORPAY_MOCK_CLIENT:false}
```

- When `mock-client: true` (used in test profiles and local offline development), mock orders with deterministic IDs are created without invoking external Razorpay HTTP APIs.
- Production environments set real credentials via environment variables: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
