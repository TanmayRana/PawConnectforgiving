# PawConnect Backend — Phase 4 Implementation Report

**Phase Name**: Phase 4 — Booking Payments with Razorpay  
**Status**: **COMPLETE**  
**Build & Test Result**: **104 passed / 0 failures / 0 errors** (`mvn clean test` and `mvn verify` PASS)  
**Target Architecture**: Spring Boot 4.1.1, Java 21, Spring Security with stateless JWT, Razorpay Java SDK 1.4.8 + Offline Mock Client, Hibernate / JPA with PostgreSQL & H2 Test Container

---

## 1. Executive Summary

Phase 4 introduces end-to-end payment integration using Razorpay for eligible confirmed bookings in the PawConnect platform.
Key deliverables achieved:
1. **Server-Side Pricing & Order Generation**: Clients can only request orders for confirmed appointments and service bookings. The payment amount is derived strictly on the server from the consultation fee or service price in INR. Client-submitted payment amounts are strictly prohibited.
2. **Cryptographic Checkout Verification**: Verifies Razorpay checkout signatures (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) using HMAC-SHA256 against the server's private secret before marking any transaction `SUCCESS`.
3. **Public Webhook Endpoint with Cryptographic Security**: `POST /api/webhooks/razorpay` is exempted from JWT session authentication and secured exclusively via the `X-Razorpay-Signature` HMAC-SHA256 header.
4. **Idempotency & Concurrency Safety**: Re-verification calls return existing successful payment records idempotently. Webhook retries are handled safely. Row-level pessimistic write locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) on `gatewayOrderId` prevents race conditions between simultaneous client verification calls and asynchronous webhook deliveries.
5. **Decoupled Lifecycle**: Successful payment transitions the `Payment` entity to `SUCCESS` and links the payment reference ID to the booking. The booking status remains `CONFIRMED` and is not prematurely marked `COMPLETED`.
6. **Zero Regressions & Comprehensive Coverage**: All 85 existing tests from Phases 0, 1, 2, and 3 pass without modification alongside 19 new integration tests for Phase 4 (104 total passing tests).

---

## 2. Implemented Endpoints & API Contracts

### Unified Customer Payment Routes (`/api/me/bookings`)
- `POST /api/me/bookings/{bookingId}/payments/order` — Create Razorpay order for an eligible confirmed booking (polymorphic: checks appointment or service booking)
- `GET /api/me/bookings/{bookingId}/payment` — Retrieve payment details for a customer booking

### Dedicated Customer Veterinary Appointment Payments (`/api/me/appointments`)
- `POST /api/me/appointments/{appointmentId}/payments/order` — Create Razorpay order for a confirmed veterinary appointment
- `GET /api/me/appointments/{appointmentId}/payment` — Retrieve payment details for a veterinary appointment

### Dedicated Customer Service Booking Payments (`/api/me/service-bookings`)
- `POST /api/me/service-bookings/{bookingId}/payments/order` — Create Razorpay order for a confirmed service booking
- `GET /api/me/service-bookings/{bookingId}/payment` — Retrieve payment details for a service booking

### Checkout Verification & Payment Lookup (`/api/payments`)
- `POST /api/payments/razorpay/verify` — Verify client checkout credentials (`razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`)
- `GET /api/payments/{paymentId}` — Retrieve payment details by ID (authorized for booking owner or `ADMIN`)

### Webhook Event Handling (`/api/webhooks`)
- `POST /api/webhooks/razorpay` — Reconciles asynchronous Razorpay webhook events (`payment.captured`, `order.paid`, `payment.failed`) verified by `X-Razorpay-Signature`

---

## 3. Files Created and Modified

### Maven & Configuration
- `pom.xml`: Added dependency `com.razorpay:razorpay-java:1.4.8`
- `src/main/resources/application.yaml`: Configured `razorpay.key-id`, `razorpay.key-secret`, `razorpay.webhook-secret`, and `razorpay.mock-client`
- `src/test/resources/application.yaml`: Added test profile configuration with `mock-client: true`

### Security Configuration
- `src/main/java/com/example/PawConnect/security/SecurityConfig.java`: Configured `/api/webhooks/**` in `permitAll()` to allow incoming webhook requests without JWT headers

### Repositories
- `src/main/java/com/example/PawConnect/repository/PaymentRepository.java`:
  - `findByPaymentForAndReferenceId(PaymentFor paymentFor, Long referenceId)`
  - `findFirstByPaymentForAndReferenceIdOrderByIdDesc(PaymentFor paymentFor, Long referenceId)`
  - `findByPaymentForAndReferenceIdAndStatus(PaymentFor paymentFor, Long referenceId, PaymentStatus status)`
  - `findByIdForUpdate(Long id)` with pessimistic write lock
  - `findByGatewayOrderIdForUpdate(String gatewayOrderId)` with pessimistic write lock

### Request & Response DTOs
- `src/main/java/com/example/PawConnect/dto/request/payment/CreatePaymentOrderRequest.java` (Created)
- `src/main/java/com/example/PawConnect/dto/request/payment/VerifyPaymentRequest.java` (Created)
- `src/main/java/com/example/PawConnect/dto/response/RazorpayOrderResponse.java` (Created)
- `src/main/java/com/example/PawConnect/dto/response/PaymentResponse.java` (Created)

### Mappers
- `src/main/java/com/example/PawConnect/mapper/PaymentMapper.java` (Created)

### Services & Implementations
- `src/main/java/com/example/PawConnect/service/RazorpayService.java` (Created)
- `src/main/java/com/example/PawConnect/service/impl/RazorpayServiceImpl.java` (Created): Handles Razorpay API client initialization, test/mock order creation, and cryptographic HMAC-SHA256 signature verification for payments and webhooks using `javax.crypto.Mac`
- `src/main/java/com/example/PawConnect/service/PaymentService.java` (Created)
- `src/main/java/com/example/PawConnect/service/impl/PaymentServiceImpl.java` (Created): Orchestrates order creation, server-side amount derivation, ownership verification, checkout verification, idempotent webhook reconciliation, and pessimistic locking

### Controllers
- `src/main/java/com/example/PawConnect/controller/CustomerPaymentController.java` (Created)
- `src/main/java/com/example/PawConnect/controller/PaymentController.java` (Created)
- `src/main/java/com/example/PawConnect/controller/RazorpayWebhookController.java` (Created)

### Test Suites
- `src/test/java/com/example/PawConnect/controller/PaymentIntegrationTests.java` (Created — 19 comprehensive tests covering order generation, checkout verification, tampering detection, webhook events, idempotency, and concurrency)

### Documentation
- `docs/BACKEND_PHASE_4_PAYMENTS.md` (Created — Complete API reference and payloads)
- `docs/BACKEND_PHASE_4_IMPLEMENTATION_REPORT.md` (Created — Architecture and verification report)

---

## 4. Core Business Logic & State Rules Implemented

1. **Eligibility Enforcement**:
   - Only appointments with `status == AppointmentStatus.CONFIRMED` and service bookings with `status == BookingStatus.CONFIRMED` can generate payment orders.
   - Any attempt to pay for `PENDING`, `CANCELLED`, or `COMPLETED` bookings results in an immediate `400 Bad Request` with `INVALID_STATE`.
   - If a booking already has a payment with `status == PaymentStatus.SUCCESS`, order creation is rejected with `PAYMENT_ALREADY_COMPLETED`.

2. **Server-Side Pricing**:
   - The consultation fee for veterinary appointments is retrieved from `appointment.getConsultationFee()`.
   - The price for service bookings is retrieved from `booking.getTotalPrice()` (or `service.getPrice()`).
   - The amount stored on `Payment.amount` is in INR, while the amount dispatched to Razorpay is in paise (`amount.multiply(100)`).

3. **HMAC-SHA256 Cryptographic Verification**:
   - Checkout signatures are verified using standard Razorpay formula:
     `HMAC_SHA256(order_id + "|" + payment_id, key_secret) == signature`
   - Constant-time string/digest comparison prevents timing attacks.
   - Webhook signatures are verified against the raw request body using `razorpay.webhook-secret`.

4. **Webhook Re-conciliation & Idempotency**:
   - `payment.captured` / `order.paid`: Safely transitions `PENDING` payments to `SUCCESS`.
   - `payment.failed`: Sets status to `FAILED` only if payment is not already in `SUCCESS`.
   - Subsequent or duplicate webhook callbacks are safely acknowledged without error.

5. **Pessimistic Concurrency Control**:
   - `findByGatewayOrderIdForUpdate` executes `SELECT ... FOR UPDATE` ensuring atomic read-modify-write cycles even under high concurrent load or near-simultaneous client verification and webhook delivery.

---

## 5. Test Suite Verification

### Phase 4 Test Cases (`PaymentIntegrationTests`)
| Test Name | Verifications |
|---|---|
| `testCreatePaymentOrderForConfirmedAppointment_Success` | Generates Razorpay order, returns order ID, records `PENDING` payment with correct amount |
| `testCreatePaymentOrderForConfirmedServiceBooking_Success` | Generates Razorpay order for service booking with server-calculated price |
| `testCreatePaymentOrder_WhenAppointmentNotConfirmed_ReturnsBadRequest` | Fails with `INVALID_STATE` when appointment is in `PENDING` status |
| `testCreatePaymentOrder_WhenServiceBookingNotConfirmed_ReturnsBadRequest` | Fails with `INVALID_STATE` when service booking is in `CANCELLED` status |
| `testCreatePaymentOrder_CrossCustomerUnauthorized_ReturnsForbidden` | Pet owner A cannot initiate payment for Pet owner B's booking |
| `testVerifyPaymentSignature_Success` | Valid HMAC signature transitions payment to `SUCCESS` and links reference ID |
| `testVerifyPaymentSignature_InvalidSignature_ReturnsBadRequest` | Tampered signature fails with `PAYMENT_SIGNATURE_INVALID` and marks payment `FAILED` |
| `testVerifyPaymentSignature_Idempotency_Success` | Duplicate verify call returns HTTP 200 with unchanged `SUCCESS` payment |
| `testGetPaymentDetails_Success` | Customer retrieves payment details for their booking |
| `testGetPaymentDetails_CrossCustomer_ReturnsForbidden` | Pet owner cannot view payment details of another customer's booking |
| `testWebhookPaymentCaptured_Success` | Webhook with valid signature updates `PENDING` payment to `SUCCESS` |
| `testWebhookOrderPaid_Success` | Webhook with `order.paid` event successfully marks payment `SUCCESS` |
| `testWebhookPaymentFailed_Success` | Webhook with `payment.failed` event marks `PENDING` payment `FAILED` |
| `testWebhookPaymentFailed_DoesNotDowngradeSuccessPayment` | Failure webhook after verified success is safely ignored |
| `testWebhook_InvalidSignature_ReturnsBadRequest` | Tampered webhook signature rejected with `WEBHOOK_SIGNATURE_INVALID` |
| `testWebhook_UnknownOrder_AcknowledgedGracefully` | Unknown external order returns HTTP 200 without throwing exceptions |
| `testConcurrentPaymentVerification_SafeAndConsistent` | Multi-threaded verification attempts for same order execute consistently |
| `testCreatePaymentOrder_WhenAlreadyPaid_ReturnsBadRequest` | Second order attempt for already paid booking returns `PAYMENT_ALREADY_COMPLETED` |
| `testDedicatedAppointmentAndServiceBookingPaymentEndpoints` | Validates dedicated sub-resource paths `/api/me/appointments/{id}/payments/order` and `/api/me/service-bookings/{id}/payments/order` |

### Complete Test Results
```text
[INFO] Results:
[INFO]
[INFO] Tests run: 104, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  02:19 min
```

---

## 6. Limitations & Phase Boundaries

- **Phase 5 (E-commerce / Cart / Orders / Notifications)**: Physical merchandise orders, cart checkout, multi-item invoicing, and email/SMS/in-app notification delivery are explicitly reserved for Phase 5 and are not part of Phase 4.
- **Refund Orchestration**: The `PaymentStatus.REFUNDED` enum state exists and is modeled, but automated gateway refund issuance endpoints will be integrated with cancellation refund workflows in subsequent phases.
