# PawConnect Backend Development Notes
## Spring Boot + PostgreSQL + JWT + WebSocket/STOMP + Razorpay

**Document purpose:** Master backend development reference for PawConnect.  
**Audience:** Backend developer / OpenCode / Cursor / full-stack integration work.  
**Frontend:** Next.js App Router  
**Backend:** Java Spring Boot  
**Database:** PostgreSQL in the currently uploaded backend configuration  
**Current API base expected by frontend:** `/api`  
**Payment Gateway:** Razorpay  
**Realtime:** WebSocket + STOMP  
**Authentication:** JWT Bearer authentication  
**Current roles:** Pet Owner, Veterinarian, Service Provider, Admin  
**Vendor marketplace:** Removed

---

# 1. Executive Decision Summary

The uploaded Spring Boot source already contains:

- JPA models/entities
- DTO classes
- Spring Data repositories
- JWT/security classes
- a global exception handler
- a generic `ApiResponse`

However, the uploaded backend archive is source-only. It does **not** contain the project build file (`pom.xml` / `build.gradle`), controllers, services, mapper layer, configuration packages, payment integration, notification service, WebSocket layer, or API implementation. Dependency versions therefore must be checked in the real backend project root before implementation.

The current backend source is a **good skeleton**, but it should not be connected directly to the Next.js application without a structured service layer, request DTO validation, authorization, pagination, transactional business logic, database migrations, realtime notification architecture, and secure Razorpay verification.

The final backend architecture should be:

```text
Next.js Frontend
      |
      | HTTPS REST / STOMP WebSocket
      v
Spring Boot API
      |
      +-- Security / JWT
      +-- Controllers
      +-- Request Validation
      +-- Services / Transactions
      +-- Domain Business Rules
      +-- Notification Service
      +-- Razorpay Payment Service
      +-- Audit Service
      +-- Repositories
      |
      v
PostgreSQL
      |
      +-- 28 core in-house tables
      +-- optional implementation table for persistent platform settings
```

The current PawConnect product specification explicitly removes the Vendor role and external marketplace. Products are in-house and Admin-managed. Login/registration and CRUD forms are modal-first in the frontend, while Admin, Veterinarian and Service Provider applications use management layouts. The platform combines veterinary, grooming, training, pet records, in-house e-commerce, bookings, orders, payments, reviews, notifications and audit/activity tracking.  
Source: `PawConnect_UI_Page_Architecture_and_Project_Details`.

---

# 2. IMPORTANT SOURCE CONFLICTS TO RESOLVE

There are two versions of the database scope in the supplied materials.

## Older PDF schema

The supplied database PDF describes **30 tables**, including:

```text
vendors
vendor_verifications
```

and describes products/order items using vendor ownership.

That database PDF explicitly says those additional implementation tables are recommendations, not all directly required by the synopsis.

## Current PawConnect scope

The latest PawConnect UI/business specification removed:

```text
Vendor
External seller
Vendor verification
Vendor product ownership
Vendor commission
Vendor settlement
Vendor payout
Multi-vendor checkout
```

The current in-house baseline is approximately **28 tables**:

```text
users
roles
user_roles
pets
pet_vaccinations
pet_medical_records
veterinarians
veterinarian_availability
appointments
service_providers
service_categories
services
service_provider_availability
service_bookings
reviews
products
product_categories
product_images
cart
cart_items
addresses
orders
order_items
order_status_history
payments
reports
notifications
audit_logs
```

The current specification explicitly says products are in-house and managed directly by Admin, with no Vendor role or vendor marketplace workflow.

### Backend decision

Use the **current 28-table in-house architecture** as the authoritative business baseline.

Do not recreate:

```text
vendors
vendor_verifications
```

Do not create:

```text
products.vendor_id
order_items.vendor_id
```

Do not create vendor foreign keys.

The older PDF's vendor-dependent product model is obsolete for the current implementation.

---

# 3. DATABASE TECHNOLOGY DECISION

The older database PDF describes MySQL.

The uploaded Spring Boot `application.yaml`, however, is configured for PostgreSQL/Neon.

### Decision for current backend

Keep **PostgreSQL** unless the actual backend project owner explicitly requires a MySQL migration.

Do not silently change PostgreSQL to MySQL.

The current backend configuration already targets PostgreSQL.

### Important security issue

The uploaded `application.yaml` contains database credentials.

Do not keep credentials in source control.

Immediately:

```text
move credentials to environment variables / secret storage
rotate the exposed database credential
remove secrets from Git history if the file was committed
```

Never reproduce the current password in documentation, logs, commits, prompts, or code.

Recommended configuration pattern:

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
```

For production:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
MAIL credentials
```

must come from environment/secret management.

---

# 4. CURRENT BACKEND CODE AUDIT

## 4.1 Models already present

The source contains entities for:

```text
User
Role
UserRole

Pet
PetVaccination
PetMedicalRecord

Veterinarian
VeterinarianAvailability
Appointment

ServiceProvider
ServiceCategory
Service
ServiceProviderAvailability
ServiceBooking

ProductCategory
Product
ProductImage

Cart
CartItem

Address

Order
OrderItem
OrderStatusHistory

Payment

Review
Report
Notification
AuditLog
```

This is a strong starting point.

## 4.2 DTO layer already present

DTOs exist for almost all current entities.

However, most current DTOs are **response-shaped DTOs**, not robust request contracts.

Do not reuse the same DTO blindly for:

```text
create
update
response
```

Create separate request/response classes where appropriate.

Example:

```text
CreatePetRequest
UpdatePetRequest
PetResponse
PetSummaryResponse
PetDetailResponse
```

instead of one mutable `PetDto` for everything.

## 4.3 Repository layer already present

Repositories extend `JpaRepository`.

This is correct as a starting point.

However, most repository methods currently return raw:

```text
List<T>
```

and therefore do not support proper pagination/filtering.

They must be upgraded to:

```text
Page<T>
Pageable
Sort
Specifications / dynamic filters
```

where the endpoint can produce large result sets.

## 4.4 Controllers are missing

The uploaded backend source contains no controller package.

Controllers must be introduced after the architecture is established.

Controllers should remain thin:

```text
HTTP request
    ↓
Validation
    ↓
Authentication/Authorization
    ↓
Service
    ↓
Response DTO
```

Do not put business logic inside controllers.

## 4.5 Service layer is missing

A proper service layer is required.

Recommended package:

```text
service/
```

with domain-oriented services such as:

```text
AuthService
UserService
PetService
VeterinarianService
AppointmentService
ServiceProviderService
ServiceCatalogService
ServiceBookingService
ProductService
CartService
OrderService
PaymentService
ReviewService
ReportService
NotificationService
AuditLogService
AdminService
```

Use interfaces only where they add real value. Do not create meaningless interface/implementation duplication for every tiny class.

## 4.6 Mapper layer is missing

Add mapping outside controllers.

Recommended:

```text
mapper/
```

Use explicit mapper classes or MapStruct.

Do not return JPA entities directly.

## 4.7 Current `ApiResponse` is too small

Current response:

```text
success
message
data
```

is insufficient for a production-style API.

Recommended:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {},
  "meta": {
    "requestId": "..."
  },
  "timestamp": "..."
}
```

For paginated responses:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Products fetched successfully",
  "data": [],
  "meta": {
    "page": 0,
    "size": 20,
    "totalElements": 125,
    "totalPages": 7,
    "first": true,
    "last": false,
    "sort": "createdAt,desc",
    "requestId": "..."
  },
  "timestamp": "..."
}
```

For validation errors:

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
  "timestamp": "..."
}
```

---

# 5. CURRENT MODEL PROBLEMS THAT MUST BE FIXED

## 5.1 `@Data` on JPA entities

Most entities currently use Lombok:

```java
@Data
```

Avoid this on JPA entities.

Reasons:

- generated `equals()` / `hashCode()` can involve relationships
- `toString()` can traverse lazy relations
- bidirectional relationships can recurse
- proxies/lazy collections can produce unexpected behavior

Prefer:

```text
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
```

and define equality carefully.

Do not include entity relationships in generated equality.

## 5.2 Cascade settings are too aggressive

`User` currently cascades `CascadeType.ALL` into many unrelated domain aggregates:

```text
pets
orders
payments
audit logs
notifications
reviews
reports
```

This is unsafe.

Deleting/deactivating a user must not casually delete:

```text
orders
payments
audit logs
historical records
```

For example:

```text
User -> AuditLog
```

should NOT use aggressive cascade deletion.

Historical business data must survive account blocking/deactivation.

Use cascade only where the entity truly owns the child aggregate.

Good candidates:

```text
Pet -> PetVaccination
Pet -> PetMedicalRecord
Cart -> CartItem
Product -> ProductImage
Order -> OrderItem
Order -> OrderStatusHistory
```

Even then, choose `orphanRemoval` only when the business aggregate permits actual deletion.

## 5.3 Timestamp management

Current entities manually carry:

```text
createdAt
updatedAt
```

Use Spring Data JPA auditing where suitable:

```text
@CreatedDate
@LastModifiedDate
```

with:

```text
@EntityListeners(AuditingEntityListener.class)
```

Do not let arbitrary controller code manage timestamps.

## 5.4 Nullability

Core fields should have explicit:

```text
nullable = false
```

and database constraints.

Do not rely only on Java validation.

Example:

```text
users.email
users.password_hash
users.status
pets.owner_id
pets.name
products.name
products.price
products.stock_quantity
orders.user_id
orders.total_amount
```

must have appropriate DB constraints.

---

# 6. ENUM / STATUS ALIGNMENT

The current backend enums need to match the UI/domain terminology.

## Appointment status

Current backend:

```text
PENDING
CONFIRMED
COMPLETED
CANCELLED
NO_SHOW
```

The professional UI also uses:

```text
IN_PROGRESS
```

Recommended:

```text
PENDING
CONFIRMED
IN_PROGRESS
COMPLETED
CANCELLED
NO_SHOW
```

## Service booking status

Use the same consistent lifecycle where applicable:

```text
PENDING
CONFIRMED
IN_PROGRESS
COMPLETED
CANCELLED
NO_SHOW
```

## Order status

Current scope:

```text
CONFIRMED
PACKED
SHIPPED
DELIVERED
CANCELLED
```

Keep this.

Do not introduce Vendor fulfillment states.

## Payment status

Recommended:

```text
PENDING
AUTHORIZED
SUCCESS
FAILED
REFUNDED
PARTIALLY_REFUNDED
```

`AUTHORIZED` is useful when modeling Razorpay authorization separately from capture.

If the project uses automatic capture, successful captured payments should transition to `SUCCESS`.

## Review status

Current UI/business flow supports moderation.

Recommended:

```text
VISIBLE
REPORTED
HIDDEN
REMOVED
```

## Professional verification

Keep:

```text
PENDING
APPROVED
REJECTED
```

Use:

```text
is_active = false
```

for blocked/inactive access where appropriate instead of inventing a Vendor-style workflow.

## Product status

The current `ProductApprovalStatus` is misnamed because its values are:

```text
ACTIVE
INACTIVE
```

For the in-house marketplace, approval by a seller is irrelevant.

Preferred long-term model:

```text
ProductStatus {
    ACTIVE,
    INACTIVE
}
```

or rename the current enum.

Do not create product seller approval workflows.

## Report type

Current report requirements mention:

```text
Reviews
Products
Users
Services
```

Align the enum accordingly:

```text
REVIEW
PRODUCT
USER
SERVICE
OTHER
```

---

# 7. AUTHENTICATION ARCHITECTURE

## 7.1 Authentication flow

Recommended:

```text
Register
    ↓
Validate request
    ↓
Check unique email/phone
    ↓
Hash password with BCrypt
    ↓
Create PET_OWNER user
    ↓
Assign PET_OWNER role
    ↓
Optional email/phone verification
```

Public registration must NOT accept an arbitrary role.

Never let:

```json
{
  "role": "ADMIN"
}
```

from the public registration endpoint create an Admin.

Role assignment must be controlled server-side.

## 7.2 Login

```text
POST /api/auth/login
```

Flow:

```text
Validate email/password
        ↓
Load user
        ↓
Check status
        ↓
Verify BCrypt password
        ↓
Generate access token
        ↓
Return user summary + token
```

Update:

```text
lastLoginAt
```

only after successful authentication.

## 7.3 Password rules

Recommended minimum:

```text
8+ characters
uppercase
lowercase
number
special character
```

Do not store passwords in plain text.

The supplied database notes explicitly require password hashes only.

## 7.4 Forgot password

Use:

```text
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password
```

OTP:

```text
6 digits
5 minute expiry
single-use
limited verification attempts
resend throttling
```

Do not store the raw reset token permanently.

Recommended production architecture:

```text
Redis
```

for:

```text
OTP TTL
resend limits
attempt count
temporary password-reset state
```

If Redis is not available in the first deployment, use a dedicated persistence implementation temporarily, but do not leave unrestricted OTP state in memory.

## 7.5 Refresh token

Recommended production architecture:

```text
short-lived access token
+
refresh token
```

Access token:

```text
~10–20 minutes
```

Refresh token:

```text
longer lifetime
rotation
revocation
```

Never make the main access JWT unnecessarily long-lived.

If refresh tokens are persisted, store a secure hash rather than the raw token.

This may require Redis or a small persistent token store depending on the final deployment architecture.

---

# 8. CURRENT JWT SECURITY ISSUES

The current JWT implementation has several problems.

## 8.1 Default secret

The current JWT service contains a hard-coded default secret fallback.

This MUST be removed.

Never:

```java
@Value("${...:hard-coded-secret}")
```

for a production signing secret.

Fail startup if the secret is missing.

## 8.2 Token parsing exceptions

The current filter directly calls JWT parsing.

Malformed/expired tokens can throw parsing exceptions.

The filter must convert these into an appropriate unauthorized result rather than causing an unrelated server error.

Recommended:

```text
Invalid token
→ 401
```

not:

```text
500 Internal Server Error
```

## 8.3 Roles

Current `UserDetailsImpl` creates:

```text
ROLE_<roleCode>
```

This is correct conceptually.

Standardize role codes:

```text
ADMIN
PET_OWNER
VETERINARIAN
SERVICE_PROVIDER
```

## 8.4 Current role loading is inefficient

Current `CustomUserDetailsService` effectively loads all `UserRole` rows and filters them in memory.

Do not do:

```text
userRoleRepository.findAll()
```

followed by:

```text
filter(userId)
```

Use:

```text
findByUserId(...)
```

or a direct projection query.

## 8.5 Method security

Keep:

```java
@EnableMethodSecurity
```

and use:

```java
@PreAuthorize(...)
```

for role-sensitive service/controller methods.

Example:

```java
@PreAuthorize("hasRole('ADMIN')")
```

and:

```java
@PreAuthorize("hasRole('VETERINARIAN')")
```

Role checks alone are not enough.

You also need ownership checks.

Example:

```text
PET_OWNER can access pet only if pet.owner.id == authenticatedUser.id
```

---

# 9. AUTHORIZATION / RESOURCE OWNERSHIP

This is one of the most important backend rules.

Never trust frontend IDs.

## Pet

Customer requests:

```text
GET /api/pets/123
```

Backend must verify:

```text
pet.owner.id == authenticatedUser.id
```

## Address

Verify:

```text
address.user.id == currentUser.id
```

## Cart

Verify:

```text
cart.user.id == currentUser.id
```

## Order

Verify:

```text
order.user.id == currentUser.id
```

unless caller is Admin.

## Appointment

Pet Owner:

```text
appointment.pet.owner.id == currentUser.id
```

Veterinarian:

```text
appointment.veterinarian.user.id == currentUser.id
```

Admin:

```text
full access
```

## Service booking

Pet Owner:

```text
booking.pet.owner.id == currentUser.id
```

Service Provider:

```text
booking.provider.user.id == currentUser.id
```

Admin:

```text
full access
```

This prevents IDOR/BOLA vulnerabilities.

---

# 10. FORM VALIDATION ARCHITECTURE

Spring MVC supports Bean Validation with `@Valid` / `@Validated`, and validation errors should be handled centrally. The current backend does not yet have a complete request-validation layer.

Use:

```text
jakarta.validation
```

Request DTO example:

```java
public class CreatePetRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(max = 50)
    private String species;

    @Size(max = 100)
    private String breed;

    @Past
    private LocalDate dateOfBirth;

    @Positive
    private BigDecimal weight;

    @Size(max = 5000)
    private String notes;
}
```

Do not trust frontend validation alone.

Frontend and backend should both validate.

---

# 11. VALIDATION MATRIX

## Registration

```text
firstName
lastName
email
phone
password
confirmPassword
```

Validation:

```text
required
email format
phone format
password complexity
password match
email uniqueness
phone uniqueness
```

Role is never accepted from public registration.

## Login

```text
email
password
```

Both required.

## Pet

```text
name
species
breed
dateOfBirth
gender
weight
photoUrl
notes
```

Validate date, weight, string lengths, URL/file constraints.

## Vaccination

```text
vaccineName
vaccinationDate
nextDueDate
certificateUrl
administeredBy
notes
```

Rules:

```text
nextDueDate >= vaccinationDate
```

## Medical record

Validate:

```text
recordType
recordDate
text lengths
attachment URL
```

## Veterinarian

Validate:

```text
specialization
qualification
licenseNumber
experienceYears
clinicName
clinicAddress
consultationFee
bio
```

Consultation fee:

```text
>= 0
```

License:

```text
unique
```

## Professional availability

Validate:

```text
dayOfWeek
startTime
endTime
slotDurationMinutes
```

Business rule:

```text
endTime > startTime
```

No overlapping availability windows for the same professional.

## Provider service

Validate:

```text
name
category
description
price
durationMinutes
isActive
```

Price:

```text
>= 0
```

Duration:

```text
> 0
```

## Product

Validate:

```text
name
SKU
categoryId
description
price
stockQuantity
weight
images
isActive
```

Business:

```text
price >= 0
stock >= 0
SKU unique
```

Products are Admin-only.

## Category

Validate:

```text
name
description
isActive
```

Name should be unique.

## Address

Validate:

```text
recipientName
phone
addressLine1
city
state
postalCode
country
addressType
```

Only the owner can modify their own address.

## Booking

Validate:

```text
pet
provider
service
date
time
notes
```

Backend must independently verify:

```text
pet ownership
professional active/verified
service active
availability
slot conflict
business status
```

## Review

Validate:

```text
rating 1–5
review text length
target resource
```

Business rule:

```text
one eligible review per completed service/appointment/order item
```

## Report

Validate:

```text
reportType
targetType
targetId
reason
description
```

Backend checks that the target actually exists.

---

# 12. ERROR HANDLING

The current `GlobalExceptionHandler` exposes:

```text
ex.getMessage()
```

for generic exceptions.

Do not expose raw internal messages to users.

Use structured exception classes:

```text
ResourceNotFoundException
BusinessRuleException
DuplicateResourceException
ValidationException
SlotConflictException
InsufficientStockException
PaymentException
PaymentVerificationException
UnauthorizedException
ForbiddenException
```

HTTP mapping:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity (optional)
429 Too Many Requests
500 Internal Server Error
502 Bad Gateway for upstream payment dependency failures
```

Never return:

```text
stack trace
SQL error
database credentials
JWT data
gateway secrets
internal class names
```

---

# 13. PAGINATION STANDARD

Proper pagination is mandatory for:

```text
users
veterinarians
service providers
appointments
bookings
products
categories
orders
reviews
reports
audit logs
notifications
```

Spring Data JPA supports `Pageable` and `Page`.

Recommended request:

```text
?page=0&size=20&sort=createdAt,desc
```

Rules:

```text
default page = 0
default size = 20
maximum size = 100
```

Never allow unlimited client-controlled page size.

Use an allowlist for sort fields.

Do not allow:

```text
sort=arbitrarySqlExpression
```

## Repository pattern

Example:

```java
Page<Product> findByIsActiveTrue(Pageable pageable);
```

For filtering:

```java
Page<Product> findAll(Specification<Product> spec, Pageable pageable);
```

For large Admin screens, stable sorting should preferably be:

```text
createdAt DESC
id DESC
```

Spring Data documentation notes that `Page` can require a count query and that offset-based pagination becomes less efficient at large offsets. For moderate Admin/application screens, standard `Page` pagination is appropriate. For very large audit/event histories, keyset/scrolling can be considered later.

---

# 14. PAGINATION RESPONSE

Do not return raw Spring `Page` JSON directly.

Create:

```text
PageResponse<T>
```

Recommended:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 200,
  "totalPages": 10,
  "first": true,
  "last": false
}
```

Wrap it inside `ApiResponse`.

---

# 15. FILTER / SEARCH ARCHITECTURE

Use:

```text
JpaSpecificationExecutor
```

for complex management screens where multiple optional filters exist.

Examples:

```text
Products
- search
- category
- stock status
- active status

Users
- search
- role
- status

Bookings
- service type
- status
- date
- provider

Orders
- status
- payment status
- date
- customer

Reviews
- rating
- status
- reported
```

Do not create extremely long repository method names for every possible filter combination.

---

# 16. DATABASE INDEXING

Create indexes for high-frequency lookups.

Examples:

```text
users(email)
users(phone)

user_roles(user_id)
user_roles(role_id)

pets(owner_id)

pet_vaccinations(pet_id)

pet_medical_records(pet_id)
pet_medical_records(veterinarian_id)

veterinarians(user_id)
veterinarians(verification_status)
veterinarians(is_active)

veterinarian_availability(veterinarian_id, day_of_week)

appointments(veterinarian_id, appointment_date, start_time)
appointments(pet_id)
appointments(status)

service_providers(user_id)
service_providers(provider_type)
service_providers(verification_status)
service_providers(is_active)

services(provider_id)
services(category_id)
services(is_active)

service_provider_availability(provider_id, day_of_week)

service_bookings(provider_id, booking_date, start_time)
service_bookings(pet_id)
service_bookings(status)

products(category_id)
products(sku)
products(is_active)
products(stock_quantity)

product_images(product_id, sort_order)

cart(user_id, status)

cart_items(cart_id, product_id)

addresses(user_id)

orders(user_id)
orders(order_status)
orders(payment_status)
orders(created_at)

order_items(order_id)
order_items(product_id)

order_status_history(order_id, changed_at)

payments(user_id)
payments(payment_reference)
payments(payment_for, reference_id)
payments(status)
payments(gateway_order_id)
payments(gateway_payment_id)

reviews(user_id)
reviews(product_id / target references)
reviews(status)

reports(status)
reports(reported_by)
reports(assigned_to)

notifications(user_id, is_read, created_at)

audit_logs(user_id, module, action, created_at)
```

Exact indexes should be verified against actual query patterns and migration SQL.

---

# 17. BOOKING SYSTEM BUSINESS LOGIC

This is a high-risk concurrency area.

## Veterinary booking

Flow:

```text
Customer
 ↓
select pet
 ↓
select veterinarian
 ↓
select date
 ↓
backend calculates availability
 ↓
customer selects slot
 ↓
backend locks provider/vet resource
 ↓
re-check availability
 ↓
create PENDING appointment
 ↓
payment
 ↓
payment verified
 ↓
appointment CONFIRMED
```

Never trust the frontend slot list.

## Conflict detection

Check:

```text
same veterinarian
same date
overlapping time range
active booking statuses
```

Overlap rule:

```text
existing.start < requested.end
AND
existing.end > requested.start
```

Do not check only exact `start_time`.

Example:

```text
existing 10:00–11:00
requested 10:30–11:30
```

must be rejected.

## Concurrency strategy

Use:

```text
@Transactional
+
database locking / consistent locking strategy
+
overlap re-check
```

A practical approach for the current architecture is to lock the veterinarian/service-provider row before re-checking active bookings for the requested date/time.

At the DB level, maintain supporting indexes.

For PostgreSQL at larger scale, stronger database constraints can later be considered.

---

# 18. AVAILABILITY LOGIC

Availability records are recurring weekly windows.

Example:

```text
MONDAY 09:00–17:00
slot = 30 min
```

Backend generates/checks:

```text
09:00
09:30
10:00
...
16:30
```

Then removes slots occupied by active bookings.

Customer should only receive:

```text
currently bookable slots
```

Do not permanently store every future slot unless there is a performance requirement.

---

# 19. SERVICE BOOKING LOGIC

Grooming/training follows the same scheduling principle.

Flow:

```text
provider
+
service
+
duration
+
availability
+
existing bookings
```

The backend derives valid slots.

A selected service's duration must be used to calculate:

```text
endTime
```

Do not accept arbitrary endTime from the public customer request.

For example:

```text
service duration = 60
start = 15:00
end = 16:00
```

Backend calculates the end.

---

# 20. CANCELLATION / RESCHEDULE

Customer cancellation:

```text
verify ownership
verify status
verify cancellation window
update status
refund if required
create notification
audit where relevant
```

Reschedule:

```text
verify ownership
verify existing booking status
check cancellation/reschedule policy
check new slot
lock professional
re-check slot
update booking
create notification
```

Never change dates simply because the frontend submitted a new date/time.

---

# 21. PAYMENT ARCHITECTURE - RAZORPAY

This must be implemented on the **server**.

The frontend should never know:

```text
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
```

Only the public Key ID is safe to expose to the checkout UI.

Razorpay's current Java integration documentation supports the official Java SDK and requires Java 15+. The current docs show the `razorpay-java` Maven dependency and server-side Orders API integration.

Official Razorpay guidance also requires an order to be created on the server before payment, passing that order ID to Checkout.

---

# 22. RAZORPAY PAYMENT FLOW

## Product order flow

```text
Customer Cart
    ↓
POST /api/orders/checkout
    ↓
Backend loads authenticated customer
    ↓
Load cart from DB
    ↓
Reload products from DB
    ↓
Validate product status
    ↓
Validate stock
    ↓
Calculate subtotal
    ↓
Calculate discount
    ↓
Calculate shipping
    ↓
Calculate tax
    ↓
Calculate final total
    ↓
Create internal Order
    ↓
Create internal Payment
    ↓
Create Razorpay Order
    ↓
Store Razorpay Order ID
    ↓
Return checkout payload
```

Response:

```json
{
  "orderId": 123,
  "orderNo": "PC-ORD-20261008-00123",
  "paymentId": 987,
  "razorpayOrderId": "order_xxxxx",
  "razorpayKeyId": "rzp_test_xxxxx",
  "amount": 129900,
  "currency": "INR"
}
```

The amount returned to Razorpay must be in the smallest currency subunit.

For INR:

```text
₹1,299.00
→
129900
```

Never accept a trusted total from the frontend.

The server must calculate the amount itself.

---

# 23. PAYMENT TABLE ENHANCEMENT

Current `Payment` has:

```text
paymentReference
paymentFor
referenceId
amount
paymentMethod
transactionId
status
```

For proper Razorpay integration, add fields such as:

```text
gatewayProvider
gatewayOrderId
gatewayPaymentId
gatewaySignature (optional audit field)
currency
gatewayStatus
capturedAt
refundId
refundAmount
```

Names can be finalized during migration.

Do not create a separate vendor payment model.

---

# 24. RAZORPAY CHECKOUT

Frontend receives:

```text
keyId
razorpayOrderId
amount
currency
customer information
```

Frontend opens Razorpay Checkout.

On successful payment, Razorpay provides:

```text
razorpay_payment_id
razorpay_order_id
razorpay_signature
```

Send those values back to the backend.

---

# 25. SIGNATURE VERIFICATION

This is mandatory.

The backend must generate the signature using:

```text
SERVER-STORED Razorpay order_id
+
razorpay_payment_id
+
RAZORPAY KEY SECRET
```

Razorpay's current documentation explicitly warns that the order ID used for signature generation should come from your own server/database, not simply trust the checkout response.

Conceptually:

```text
HMAC-SHA256(
    serverOrderId + "|" + razorpayPaymentId,
    razorpayKeySecret
)
```

Compare against:

```text
razorpay_signature
```

using a constant-time comparison where possible.

If mismatch:

```text
payment verification fails
order is NOT marked successful
```

---

# 26. PAYMENT VERIFICATION ENDPOINT

Recommended:

```text
POST /api/payments/verify
```

Request:

```json
{
  "paymentReference": "PAY-...",
  "razorpayOrderId": "order_...",
  "razorpayPaymentId": "pay_...",
  "razorpaySignature": "..."
}
```

Backend:

```text
authenticate user
↓
load Payment
↓
verify Payment belongs to user
↓
load stored gateway order ID
↓
verify signature
↓
verify gateway/payment status
↓
verify amount
↓
update Payment
↓
update Order / Appointment / ServiceBooking
↓
create notification
↓
audit where required
```

Never mark payment success merely because the browser sent:

```text
success=true
```

---

# 27. PAYMENT AMOUNT INTEGRITY

The backend must independently know:

```text
expected amount
```

and compare it with the successful gateway transaction.

Do not use:

```text
frontendTotal
```

as the source of truth.

For order payment:

```text
expected = Order.totalAmount
```

For appointment:

```text
expected = Appointment.consultationFee
```

For service booking:

```text
expected = ServiceBooking.price
```

---

# 28. RAZORPAY WEBHOOK

Create a public webhook endpoint:

```text
POST /api/webhooks/razorpay
```

This endpoint does NOT use normal JWT authentication.

Authentication mechanism:

```text
Razorpay webhook signature
```

Verify:

```text
X-Razorpay-Signature
```

against:

```text
raw webhook request payload
+
Razorpay webhook secret
```

Do not parse and re-serialize JSON before signature validation.

The exact raw payload should be used.

---

# 29. WEBHOOK IDEMPOTENCY

Webhook events may be delivered more than once.

Never process the same logical event blindly multiple times.

Examples:

```text
payment captured
order paid
payment failed
refund processed
```

must be idempotent.

Strategies:

```text
gateway payment ID
+
current Payment status
+
allowed state transition
```

For stronger tracking, add a gateway-event identifier in a later implementation if needed.

At minimum:

```text
if payment already SUCCESS
and webhook says payment captured
→ no-op safely
```

Do not create duplicate orders, notifications or refunds.

---

# 30. PAYMENT CAPTURE / FULFILLMENT RULE

Razorpay's current guidance recommends auto-capture where appropriate and states that products/services should be delivered only after payment is captured.

Therefore:

```text
AUTHORIZED
```

must not be treated as equivalent to:

```text
SUCCESS/CAPTURED
```

Fulfillment logic should require the captured/success state.

---

# 31. REFUND LOGIC

For eligible cancellation:

```text
Order/Booking
    ↓
validate refund policy
    ↓
call Razorpay refund
    ↓
store refund information
    ↓
mark payment REFUNDED
    ↓
notify customer
```

Do not mark `REFUNDED` merely because your refund request was sent.

The final state should reflect gateway confirmation.

---

# 32. PAYMENT SECURITY RULES

Never store:

```text
card number
CVV
card PIN
raw payment credentials
```

Only store gateway identifiers and business payment metadata.

Never log:

```text
Authorization header
Razorpay secret
webhook secret
full payment payload containing sensitive fields
```

Use masking for logs.

---

# 33. NOTIFICATION SYSTEM

The notification table already exists.

Use it as the **source of truth**.

WebSocket is the **realtime delivery channel**, not the durable data store.

Recommended architecture:

```text
Business Event
    ↓
NotificationService
    ↓
Persist Notification
    ↓
Transaction commits
    ↓
Publish WebSocket notification
    ↓
Frontend updates bell/dropdown
```

If WebSocket delivery fails:

```text
notification remains in DB
```

and the next API fetch still retrieves it.

This makes WebSocket an accelerator rather than a reliability dependency.

---

# 34. NOTIFICATION TYPES

Create a controlled enum such as:

```text
BOOKING_CREATED
BOOKING_CONFIRMED
BOOKING_CANCELLED
BOOKING_RESCHEDULED
APPOINTMENT_REMINDER
BOOKING_REMINDER

PAYMENT_SUCCESS
PAYMENT_FAILED
REFUND_COMPLETED

ORDER_CREATED
ORDER_CONFIRMED
ORDER_PACKED
ORDER_SHIPPED
ORDER_DELIVERED
ORDER_CANCELLED

REVIEW_SUBMITTED
REVIEW_MODERATED
REPORT_UPDATED

PROFESSIONAL_VERIFIED
PROFESSIONAL_REJECTED
ACCOUNT_BLOCKED
ACCOUNT_UNBLOCKED

VACCINATION_REMINDER
SYSTEM
```

Do not allow arbitrary notification type strings to spread throughout the codebase.

---

# 35. NOTIFICATION SERVICE

Recommended service API:

```text
createNotification(...)
createAndPublish(...)
markAsRead(...)
markAllAsRead(...)
getUserNotifications(...)
getUnreadCount(...)
```

The service should centralize:

```text
title
message
type
referenceType
referenceId
recipient
dedupe key
```

---

# 36. NOTIFICATION DEDUPLICATION

Add a `dedupeKey` concept to prevent repeated reminders.

Example:

```text
APPOINTMENT_REMINDER:appointment:123:24h
```

For vaccination:

```text
VACCINATION_REMINDER:pet:123:vaccine:456:7d
```

If the same job runs again:

```text
do not insert duplicate notification
```

---

# 37. WEB SOCKET ARCHITECTURE

Use:

```text
Spring WebSocket
+
STOMP
```

Spring's current documentation supports STOMP over WebSocket and user destinations such as `/user/queue/...`.

Recommended endpoint:

```text
/ws
```

Application destination:

```text
/app
```

User destination:

```text
/user/queue
```

Notification subscription:

```text
/user/queue/notifications
```

---

# 38. WEB SOCKET MESSAGE FLOW

```text
Business action
    ↓
NotificationService
    ↓
Notification saved in DB
    ↓
transaction commits
    ↓
SimpMessagingTemplate
    ↓
/user/{user}/queue/notifications
    ↓
Next.js WebSocket client
```

Spring's WebSocket/STOMP documentation supports sending messages to authenticated user destinations.

---

# 39. WEB SOCKET JWT AUTHENTICATION

Browser WebSocket handshakes cannot rely on arbitrary custom HTTP headers in the same way as normal fetch requests.

For STOMP token authentication:

```text
client connects
    ↓
STOMP CONNECT
    ↓
Authorization: Bearer <JWT>
    ↓
ChannelInterceptor
    ↓
validate JWT
    ↓
set Principal
    ↓
allow session
```

Spring's current documentation specifically describes token authentication at the STOMP CONNECT message level with a `ChannelInterceptor`.

Do not send JWT in URL query parameters unless there is a compelling infrastructure reason. Tokens in URLs can leak into logs.

---

# 40. WEB SOCKET AUTHORIZATION

Secure:

```text
CONNECT
SUBSCRIBE
SEND
```

Use Spring Security WebSocket message authorization where supported by the project's Spring Security version.

Examples:

```text
/user/queue/notifications
```

must only be accessible to the authenticated user.

Admin broadcasts:

```text
/topic/admin/*
```

must be Admin-only if such topics are introduced.

Do not allow clients to send arbitrary messages to server broadcast topics.

For notification delivery, prefer server-to-client user destinations and avoid an unnecessary public topic.

---

# 41. WEB SOCKET RELIABILITY

WebSocket is not a database.

Frontend should:

```text
connect
↓
subscribe
↓
receive live notifications
↓
on reconnect
↓
fetch unread notifications through REST
```

If the socket disconnects:

```text
REST API remains authoritative
```

Implement reconnection on the frontend.

---

# 42. EMAIL + IN-APP NOTIFICATIONS

For important auth/account workflows:

```text
OTP
Password reset
Email verification
```

email delivery can be added.

For normal product events:

```text
order updated
booking confirmed
service completed
```

in-app + WebSocket is sufficient for the first implementation.

Do not make email mandatory for every event unless the business requires it.

---

# 43. AUDIT LOG SYSTEM

Audit logs are already modeled.

Important Admin actions must record:

```text
actor user
action
module
entity type
entity ID
old state
new state
IP
user agent
timestamp
```

Examples:

```text
CREATE_USER
UPDATE_USER
BLOCK_USER
UNBLOCK_USER

VERIFY_VETERINARIAN
REJECT_VETERINARIAN
BLOCK_VETERINARIAN

VERIFY_PROVIDER
REJECT_PROVIDER
BLOCK_PROVIDER

CREATE_PRODUCT
UPDATE_PRODUCT
STOCK_UPDATE
DELETE_PRODUCT
DEACTIVATE_PRODUCT

ORDER_STATUS_UPDATE

REVIEW_HIDE
REVIEW_REMOVE
REPORT_RESOLVE

SETTING_UPDATE
```

Audit logs are read-only for Admin UI.

Never allow Admin to edit historical audit records.

---

# 44. AUDIT LOG IMPLEMENTATION

Prefer explicit service-level audit logging.

Pattern:

```text
@Transactional
update business entity
↓
create audit record
↓
transaction commits
```

For update operations, store:

```text
oldData
newData
```

as JSON snapshots.

Do not include:

```text
password_hash
JWT token
Razorpay secret
raw payment credentials
```

in audit snapshots.

---

# 45. ORDER BUSINESS LOGIC

## Create order

Never accept:

```text
subtotal
shippingFee
taxAmount
discountAmount
totalAmount
```

as trusted values from frontend.

Backend calculates them.

Flow:

```text
Load current customer cart
↓
Load all products from DB
↓
Validate stock
↓
Calculate current price
↓
calculate subtotal
↓
apply valid discount
↓
calculate shipping
↓
calculate tax
↓
calculate final total
↓
create order
↓
create order items
```

Order item stores:

```text
productId
quantity
unitPrice
lineTotal
```

`unitPrice` is a historical snapshot.

---

# 46. ORDER ADDRESS SNAPSHOT

The current model points an order to:

```text
address_id
```

That is useful, but it is not enough for full historical integrity because the customer may edit the address later.

Recommended enhancement:

store an immutable delivery-address snapshot on the order.

Possible columns:

```text
delivery_recipient_name
delivery_phone
delivery_address_line1
delivery_address_line2
delivery_city
delivery_state
delivery_postal_code
delivery_country
```

Keep `address_id` as the original selected address reference if useful.

But order display should use the immutable order snapshot.

---

# 47. STOCK MANAGEMENT

Stock must be backend-authoritative.

Do not simply do:

```text
product.stock -= quantity
save(product)
```

under high concurrency.

Use an atomic update or proper locking.

Conceptual SQL:

```text
UPDATE products
SET stock_quantity = stock_quantity - :quantity
WHERE id = :productId
AND stock_quantity >= :quantity
```

Then verify the affected row count.

If:

```text
affectedRows == 0
```

return:

```text
INSUFFICIENT_STOCK
```

This avoids overselling.

---

# 48. CART BUSINESS LOGIC

One active cart per customer.

Use:

```text
CartStatus.ACTIVE
```

or the finalized equivalent.

Unique constraint:

```text
(user_id, status)
```

for the active cart concept should be enforced carefully according to the chosen database strategy.

Cart item:

```text
unique(cart_id, product_id)
```

Adding an existing product:

```text
increase quantity
```

not:

```text
duplicate row
```

At checkout:

```text
re-price from current DB product data
```

Do not trust client-side cart amounts.

---

# 49. REVIEW BUSINESS RULE

A review is eligible only when:

```text
service booking completed
OR
veterinary appointment completed
OR
order delivered
```

For product review:

```text
user owns order
order delivered
order contains product
```

For service review:

```text
user owns booking
booking completed
```

Rating:

```text
1–5
```

One eligible review per target transaction.

Admin can moderate.

---

# 50. REPORT BUSINESS LOGIC

Customer:

```text
create report
```

Admin:

```text
view
assign
review
resolve
reject
```

Reports should not grant ordinary users the ability to change moderation status.

---

# 51. ADMIN BUSINESS LOGIC

Admin manages:

```text
users
veterinarians
service providers
services
products
categories
bookings
orders
reviews
reports
notifications
audit logs
settings
```

Do not let Admin use customer-only mutation paths in a way that bypasses audit logging.

Admin actions should go through Admin service methods.

---

# 52. PROFESSIONAL VERIFICATION

Veterinarian:

```text
PENDING
    ↓
APPROVED
```

or:

```text
PENDING
    ↓
REJECTED
```

Provider uses the same model.

Only Admin can approve/reject.

When approved:

```text
verification_status = APPROVED
is_active = true
```

When rejected:

```text
verification_status = REJECTED
is_active = false
```

Do not make a rejected professional bookable.

---

# 53. SERVICE PROVIDER RULES

A Service Provider can be:

```text
GROOMER
TRAINER
```

A provider can manage:

```text
services
pricing
availability
bookings
profile
```

Only their own resources.

Do not allow a Provider to:

```text
edit another provider's service
view another provider's bookings
change Admin state
```

---

# 54. VETERINARIAN RULES

Veterinarian can:

```text
profile
availability
appointments
appointment status
relevant pet data
```

Cannot:

```text
manage other veterinarians
manage products
manage users
approve professionals
```

unless also an Admin through a separately assigned role.

---

# 55. ROLE COMBINATION

`user_roles` is a many-to-many model.

Technically one user can have multiple roles.

However, the current product can keep:

```text
Pet Owner
Veterinarian
Service Provider
Admin
```

with business-specific assignments.

If multi-role accounts are permitted, authorization should be intentional.

Do not simply expose a frontend role switcher.

---

# 56. PUBLIC ENDPOINTS

Recommended:

```text
GET /api/public/services
GET /api/public/services/categories
GET /api/public/veterinarians
GET /api/public/service-providers
GET /api/public/products
GET /api/public/products/{id}
GET /api/public/product-categories
```

Only public-safe fields should be returned.

Do not return:

```text
private email
phone
internal IDs where unnecessary
admin data
inactive providers
private notes
```

---

# 57. AUTH ENDPOINTS

Recommended:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password
```

Optional:

```text
POST /api/auth/verify-email
POST /api/auth/resend-verification
```

---

# 58. CUSTOMER ENDPOINTS

## Profile

```text
GET /api/me
PUT /api/me
PUT /api/me/password
```

## Pets

```text
GET /api/me/pets
POST /api/me/pets
GET /api/me/pets/{id}
PUT /api/me/pets/{id}
DELETE /api/me/pets/{id}
```

## Vaccination

```text
GET /api/me/pets/{petId}/vaccinations
POST /api/me/pets/{petId}/vaccinations
PUT /api/me/pets/{petId}/vaccinations/{id}
DELETE /api/me/pets/{petId}/vaccinations/{id}
```

## Medical records

```text
GET /api/me/pets/{petId}/medical-records
POST /api/me/pets/{petId}/medical-records
PUT /api/me/pets/{petId}/medical-records/{id}
DELETE /api/me/pets/{petId}/medical-records/{id}
```

## Addresses

```text
GET /api/me/addresses
POST /api/me/addresses
PUT /api/me/addresses/{id}
DELETE /api/me/addresses/{id}
PATCH /api/me/addresses/{id}/default
```

---

# 59. CUSTOMER BOOKING ENDPOINTS

## Veterinary

```text
GET /api/veterinarians
GET /api/veterinarians/{id}
GET /api/veterinarians/{id}/slots?date=YYYY-MM-DD
POST /api/appointments
GET /api/me/appointments
GET /api/me/appointments/{id}
PATCH /api/me/appointments/{id}/cancel
PATCH /api/me/appointments/{id}/reschedule
```

## Grooming/Training

```text
GET /api/service-providers
GET /api/service-providers/{id}
GET /api/services
GET /api/services/{id}
GET /api/service-providers/{id}/slots?serviceId=...&date=...
POST /api/service-bookings
GET /api/me/service-bookings
GET /api/me/service-bookings/{id}
PATCH /api/me/service-bookings/{id}/cancel
PATCH /api/me/service-bookings/{id}/reschedule
```

Exact naming may be finalized during API implementation, but the ownership/security semantics must remain.

---

# 60. SHOP ENDPOINTS

```text
GET /api/products
GET /api/products/{id}
GET /api/product-categories
```

Customer cart:

```text
GET /api/me/cart
POST /api/me/cart/items
PATCH /api/me/cart/items/{productId}
DELETE /api/me/cart/items/{productId}
DELETE /api/me/cart
```

---

# 61. ORDER ENDPOINTS

```text
POST /api/orders/checkout
GET /api/me/orders
GET /api/me/orders/{id}
PATCH /api/me/orders/{id}/cancel
```

Admin:

```text
GET /api/admin/orders
GET /api/admin/orders/{id}
PATCH /api/admin/orders/{id}/status
```

---

# 62. PAYMENT ENDPOINTS

Recommended:

```text
POST /api/payments/create
POST /api/payments/verify
GET /api/payments/{paymentReference}
POST /api/payments/{paymentReference}/refund
```

Refund endpoint must be protected.

The gateway webhook is separate:

```text
POST /api/webhooks/razorpay
```

---

# 63. NOTIFICATION ENDPOINTS

```text
GET /api/me/notifications
GET /api/me/notifications/unread-count
PATCH /api/me/notifications/{id}/read
PATCH /api/me/notifications/read-all
```

Pagination:

```text
?page=0&size=20
```

WebSocket:

```text
/ws
```

Subscribe:

```text
/user/queue/notifications
```

---

# 64. ADMIN ENDPOINTS

## Users

```text
GET /api/admin/users
POST /api/admin/users
GET /api/admin/users/{id}
PUT /api/admin/users/{id}
PATCH /api/admin/users/{id}/status
```

## Veterinarians

```text
GET /api/admin/veterinarians
GET /api/admin/veterinarians/{id}
PATCH /api/admin/veterinarians/{id}/verification
PATCH /api/admin/veterinarians/{id}/status
```

## Service Providers

```text
GET /api/admin/service-providers
GET /api/admin/service-providers/{id}
PATCH /api/admin/service-providers/{id}/verification
PATCH /api/admin/service-providers/{id}/status
```

## Products

```text
GET /api/admin/products
POST /api/admin/products
GET /api/admin/products/{id}
PUT /api/admin/products/{id}
PATCH /api/admin/products/{id}/status
PATCH /api/admin/products/{id}/stock
DELETE /api/admin/products/{id}
```

## Categories

```text
GET /api/admin/categories
POST /api/admin/categories
PUT /api/admin/categories/{id}
PATCH /api/admin/categories/{id}/status
DELETE /api/admin/categories/{id}
```

## Bookings

```text
GET /api/admin/bookings
GET /api/admin/bookings/{id}
PATCH /api/admin/bookings/{id}/status
```

## Reviews

```text
GET /api/admin/reviews
PATCH /api/admin/reviews/{id}/moderation
DELETE /api/admin/reviews/{id}
```

## Reports

```text
GET /api/admin/reports
GET /api/admin/reports/{id}
PATCH /api/admin/reports/{id}/assign
PATCH /api/admin/reports/{id}/resolve
PATCH /api/admin/reports/{id}/reject
```

## Audit

```text
GET /api/admin/audit-logs
```

Read-only.

---

# 65. ADMIN DASHBOARD

Recommended:

```text
GET /api/admin/dashboard/summary
GET /api/admin/dashboard/bookings
GET /api/admin/dashboard/orders
GET /api/admin/dashboard/revenue
GET /api/admin/dashboard/service-usage
GET /api/admin/dashboard/recent-activity
```

Do not execute 10 expensive queries independently on every dashboard request if one optimized aggregate query can produce the summary.

Cache only after measuring.

---

# 66. SETTINGS PERSISTENCE

The current UI includes an Admin Settings page with values such as:

```text
appointment cancellation windows
shipping fee
free shipping threshold
tax rate
```

These values need durable persistence.

The supplied 28-table baseline does not explicitly contain a settings table.

Recommended implementation:

```text
platform_settings
```

as one additional implementation table if Admin settings must be database-editable.

Alternative:

```text
application configuration
```

is acceptable only for settings that do not need runtime Admin modification.

Do not save mutable platform settings in frontend localStorage.

---

# 67. DATABASE MIGRATIONS

The uploaded backend currently uses:

```text
ddl-auto: update
```

Do not use this as the production schema-management strategy.

Recommended:

```text
Flyway
```

Development:

```text
ddl-auto: validate
```

Production:

```text
ddl-auto: validate
```

Migration scripts should create:

```text
tables
indexes
constraints
unique keys
foreign keys
enum/string values where applicable
seed data
```

Recommended migration order:

```text
V1__core_tables.sql
V2__pet_tables.sql
V3__professional_tables.sql
V4__booking_tables.sql
V5__shop_tables.sql
V6__orders_and_payments.sql
V7__reviews_reports_notifications_audit.sql
V8__indexes_and_constraints.sql
V9__settings.sql
```

Exact version naming can be adapted.

---

# 68. SEED DATA

Seed:

```text
roles
admin user
basic categories
service categories
```

Do not seed real customer passwords.

Development-only seed:

```text
ADMIN
PET_OWNER
VETERINARIAN
SERVICE_PROVIDER
```

Use environment/profile-specific seed behavior.

Never expose development admin credentials in production.

---

# 69. API DOCUMENTATION

Add OpenAPI/Swagger support.

Document:

```text
auth
public
customer
veterinarian
provider
admin
payments
notifications
```

Include:

```text
request schema
response schema
validation errors
authorization
pagination parameters
```

This will make Next.js integration much easier.

---

# 70. NEXT.JS INTEGRATION CONTRACT

The current frontend API client defaults to:

```text
http://localhost:8000/api
```

The Spring Boot application normally defaults to port `8080`.

Pick one strategy and keep it consistent.

Recommended local backend:

```text
server.port=8000
```

or change:

```text
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Do not leave frontend and backend ports mismatched.

Recommended local development:

```text
Frontend:
http://localhost:3000

Backend:
http://localhost:8000

WebSocket:
ws://localhost:8000/ws
```

Production:

```text
HTTPS frontend
HTTPS API
WSS WebSocket
```

---

# 71. CORS

Allow only known origins.

Development:

```text
http://localhost:3000
```

Production:

```text
https://your-pawconnect-frontend-domain
```

Never use:

```text
*
```

with credentials.

Keep allowed origins in configuration.

---

# 72. TIMEZONE

Use:

```text
UTC
```

for stored timestamps.

Convert to customer locale at the UI edge.

For bookings, define the platform/business timezone explicitly.

Date/time slot logic should never depend on the server machine's local timezone accidentally.

---

# 73. MONEY

Use:

```text
BigDecimal
```

never:

```text
double
float
```

Rules:

```text
2 decimal places for INR
```

Gateway conversion:

```text
BigDecimal → paise
```

with exact rounding.

Never use binary floating-point for payment totals.

---

# 74. API DTO DESIGN

Use separate DTO layers.

Example:

```text
dto/
  request/
    auth/
    pet/
    booking/
    product/
    order/
    payment/

  response/
    auth/
    pet/
    booking/
    product/
    order/
    payment/
```

Do not send unnecessary internal fields.

Example customer ProductResponse should NOT contain:

```text
createdBy
internal audit metadata
admin-only status fields
```

unless needed.

---

# 75. ENTITY → DTO MAPPING

Never return:

```text
ResponseEntity<Entity>
```

with full JPA entities.

Use:

```text
Entity
↓
Mapper
↓
Response DTO
```

This prevents:

```text
lazy loading problems
recursive JSON
internal field exposure
huge payloads
```

---

# 76. TRANSACTION BOUNDARIES

Use `@Transactional` around business operations.

Examples:

```text
createBooking
rescheduleBooking
checkoutOrder
verifyPayment
updateOrderStatus
updateStock
moderateReview
verifyProfessional
```

Do not put `@Transactional` on every controller.

---

# 77. ORDER CHECKOUT TRANSACTION

Recommended logical transaction:

```text
begin
 ↓
validate cart
 ↓
validate stock
 ↓
calculate totals
 ↓
create order
 ↓
create order items
 ↓
reserve/decrement stock
 ↓
create payment record
 ↓
commit
```

Then create external Razorpay order.

Important:

Do not hold a DB transaction open while waiting unnecessarily on a slow external gateway call.

Prefer:

```text
short DB transaction
+
external gateway call
+
short DB transaction to persist gateway order data
```

or carefully design idempotent state transitions.

---

# 78. EXTERNAL PAYMENT FAILURE

If Razorpay order creation fails:

```text
do not leave a permanently confirmed order
```

Use an explicit payment-pending state strategy.

Where necessary:

```text
Order payment pending
```

and background cleanup/cancellation can release inventory.

If the current order status enum does not include a pending state, keep payment state authoritative and cancel stale pending orders via job/policy.

Document the selected lifecycle clearly.

---

# 79. BACKGROUND JOBS

Potential scheduled jobs:

```text
booking reminders
vaccination reminders
expire pending payments
expire abandoned carts
reconcile payment states
```

Do not rely solely on application memory.

For one backend instance:

```text
@Scheduled
```

can be adequate.

For multiple instances:

```text
distributed scheduler / Quartz / external job system
```

may be required.

---

# 80. NOTIFICATION TIMING EXAMPLES

Appointment:

```text
24h reminder
1h reminder
```

Order:

```text
order placed
packed
shipped
delivered
```

Payment:

```text
success
failure
refund
```

Professional:

```text
verification approved/rejected
```

Account:

```text
blocked/unblocked
```

---

# 81. PERFORMANCE / JPA

Watch for N+1 queries.

For list endpoints, prefer:

```text
DTO projections
@EntityGraph
fetch joins
```

where needed.

Do not solve N+1 by setting every relationship to:

```text
EAGER
```

Keep most relations:

```text
LAZY
```

and explicitly fetch what the endpoint requires.

---

# 82. API QUERY OPTIMIZATION

Example:

```text
GET /api/products
```

should not load:

```text
cartItems
orderItems
all images
all reviews
```

unless needed.

Use summary DTOs for lists.

Product detail may load:

```text
product
images
category
ratings summary
```

separately.

---

# 83. SECURITY LOGGING

Log:

```text
request ID
method
path
status
duration
actor ID
module
```

Do NOT log:

```text
Authorization
JWT
password
OTP
Razorpay secret
card data
CVV
```

Use structured logs.

---

# 84. REQUEST ID / CORRELATION

Add:

```text
X-Request-ID
```

or generate one server-side.

Store it in:

```text
MDC
```

and return it in:

```text
ApiResponse.meta.requestId
```

This will make frontend/support debugging much easier.

---

# 85. OBSERVABILITY

Recommended:

```text
Spring Boot Actuator
health
metrics
structured logs
request timing
```

Production health endpoint should not expose sensitive details.

---

# 86. FILE UPLOADS

The model stores URLs:

```text
photo_url
certificate_url
attachment_url
image_url
```

Do not store large binaries in PostgreSQL.

Recommended:

```text
Cloudinary
or
S3-compatible object storage
```

Backend should validate:

```text
MIME type
file size
file extension
authenticated owner/admin
```

and only persist the resulting URL.

---

# 87. FRONTEND STORAGE REPLACEMENT

The current Next.js frontend still uses browser storage for many mock flows.

Backend integration should replace:

```text
localStorage mock API
```

with:

```text
Spring Boot REST API
```

The mock service functions should be replaced gradually behind the same frontend API abstraction.

Do not rewrite every component just to connect the backend.

---

# 88. FRONTEND API CONTRACT CHANGES

Current frontend authentication expects roughly:

```text
token
user
```

Current frontend API paths are under:

```text
/api/auth/...
```

Keep a consistent backend envelope or adapt the frontend API client once.

Recommended:

```text
frontend apiClient
↓
backend ApiResponse
↓
client unwraps data/meta
```

Do not let every component understand the backend envelope independently.

---

# 89. RAZORPAY FRONTEND/BACKEND CONTRACT

Frontend should receive only:

```text
razorpayKeyId
razorpayOrderId
amount
currency
internalPaymentReference
```

Frontend sends back:

```text
razorpayPaymentId
razorpayOrderId
razorpaySignature
internalPaymentReference
```

Backend performs the actual verification.

---

# 90. PAYMENT STATE MACHINE

Recommended internal lifecycle:

```text
PENDING
   ↓
AUTHORIZED
   ↓
SUCCESS
```

Failure:

```text
PENDING → FAILED
AUTHORIZED → FAILED/EXPIRED according to gateway state
```

Refund:

```text
SUCCESS → REFUNDED
```

Do not allow impossible arbitrary transitions.

Create a payment state-transition validator.

---

# 91. ORDER STATE MACHINE

```text
CONFIRMED
   ↓
PACKED
   ↓
SHIPPED
   ↓
DELIVERED
```

Cancellation:

```text
CONFIRMED → CANCELLED
PACKED    → CANCELLED
```

Do not allow:

```text
DELIVERED → PACKED
DELIVERED → CONFIRMED
```

unless an explicit correction workflow is later added.

---

# 92. BOOKING STATE MACHINE

Recommended:

```text
PENDING
   ↓
CONFIRMED
   ↓
IN_PROGRESS
   ↓
COMPLETED
```

Alternative terminal states:

```text
CANCELLED
NO_SHOW
```

Do not allow arbitrary jumps without business permission.

---

# 93. REVIEW MODERATION STATE MACHINE

```text
VISIBLE
   ↓
REPORTED
   ↓
HIDDEN
```

Possible removal:

```text
HIDDEN → REMOVED
```

Admin-only moderation.

---

# 94. PRODUCT BUSINESS RULES

Products are:

```text
PawConnect-owned
Admin-created
Admin-managed
```

No:

```text
vendorId
sellerId
vendor ownership
commission
payout
```

Product creation must require:

```text
ADMIN
```

Product public listing only when:

```text
isActive = true
stock policy allows display
```

---

# 95. CATEGORY RULES

Admin creates/updates categories.

Do not delete a category that is still used by active products unless:

```text
reassign products
```

or:

```text
deactivate category
```

Use safe deletion.

---

# 96. USER BLOCKING

Blocking a user should affect authentication.

Example:

```text
status = BLOCKED
```

Then:

```text
existing JWT
```

should not remain indefinitely valid.

Recommended:

```text
short-lived access token
+
load active user state
```

or a token-version/revocation strategy.

A user blocked by Admin must lose access promptly.

---

# 97. AUTH TOKEN REVOCATION OPTION

For a simple scalable implementation:

Add a `tokenVersion` field to users.

JWT contains:

```text
tokenVersion
```

When Admin blocks/unblocks or password changes:

```text
increment tokenVersion
```

Server verifies:

```text
JWT tokenVersion == current user tokenVersion
```

This gives easy token invalidation without storing every access token.

---

# 98. WEBSOCKET USER IDENTITY

Use authenticated user principal.

Do not accept:

```text
userId
```

from the client to decide whose notification queue to use.

The server determines the destination identity.

---

# 99. API VERSIONING

Current frontend uses:

```text
/api
```

Do not change it unnecessarily during initial integration.

For future public versions:

```text
/api/v1
```

can be introduced when the contract stabilizes.

---

# 100. TESTING STRATEGY

## Unit tests

Test:

```text
validation
price calculations
booking overlap
state transitions
stock decrement
payment signature verification
notification deduplication
authorization rules
```

## Service integration tests

Test:

```text
register
login
create pet
book appointment
create service booking
checkout
payment verification
order cancellation
review eligibility
admin verification
```

## Repository tests

Test important queries and filters.

## Security tests

Test:

```text
unauthenticated → 401
wrong role → 403
wrong owner → 403/404 according to resource policy
blocked user → 401/403
```

## WebSocket tests

Verify:

```text
authenticated CONNECT
user subscription
notification delivery
unauthorized subscription rejected
```

## Payment tests

Test:

```text
valid signature
invalid signature
wrong amount
wrong order
duplicate callback
duplicate webhook
payment failure
refund state
```

---

# 101. TEST DATABASE

Prefer:

```text
Testcontainers + PostgreSQL
```

for integration tests.

Do not make tests depend on production/remote Neon databases.

---

# 102. SECURITY TEST CHECKLIST

Test:

```text
SQL injection protection
XSS through stored text
IDOR
BOLA
CSRF considerations
CORS restrictions
JWT expiry
invalid JWT
token revocation
brute-force login
OTP abuse
file upload abuse
oversized request
stock race condition
booking race condition
duplicate payment verification
webhook spoofing
```

---

# 103. RATE LIMITING

Recommended endpoints to throttle:

```text
login
forgot-password
verify-otp
resend-otp
register
payment verification
```

Possible infrastructure:

```text
Redis + Bucket4j
```

or an API gateway / reverse proxy.

Do not implement an unlimited OTP endpoint.

---

# 104. DATABASE CONSTRAINTS

Use database constraints wherever practical.

Examples:

```text
users.email UNIQUE
users.phone UNIQUE
veterinarians.license_number UNIQUE
products.sku UNIQUE
product_categories.name UNIQUE
service categories logical uniqueness
cart_items(cart_id, product_id) UNIQUE
role code UNIQUE
user_roles(user_id, role_id) UNIQUE
```

Use service-level business constraints in addition to DB constraints.

---

# 105. DEVELOPMENT PROJECT STRUCTURE

Recommended:

```text
src/main/java/com/example/PawConnect/
├── PawConnectApplication.java
│
├── config/
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   ├── WebSocketConfig.java
│   ├── OpenApiConfig.java
│   └── JacksonConfig.java
│
├── controller/
│   ├── AuthController.java
│   ├── PublicController.java
│   ├── CustomerController.java
│   ├── PetController.java
│   ├── AppointmentController.java
│   ├── ServiceBookingController.java
│   ├── ProductController.java
│   ├── CartController.java
│   ├── OrderController.java
│   ├── PaymentController.java
│   ├── NotificationController.java
│   ├── ReviewController.java
│   ├── ReportController.java
│   ├── AdminController.java
│   ├── VeterinarianController.java
│   └── ServiceProviderController.java
│
├── dto/
│   ├── request/
│   └── response/
│
├── model/
├── repository/
├── service/
├── mapper/
├── validation/
├── exception/
├── response/
├── security/
├── notification/
│   ├── NotificationService.java
│   ├── NotificationPublisher.java
│   ├── NotificationType.java
│   └── NotificationEvent.java
│
├── websocket/
│   ├── WebSocketConfig.java
│   ├── WebSocketAuthChannelInterceptor.java
│   └── WebSocketSecurityConfig.java
│
├── payment/
│   └── razorpay/
│       ├── RazorpayProperties.java
│       ├── RazorpayService.java
│       ├── RazorpayWebhookController.java
│       └── RazorpaySignatureVerifier.java
│
├── audit/
│   └── AuditLogService.java
│
└── util/
```

Keep actual names aligned with existing code conventions.

---

# 106. CONFIGURATION FILES

Recommended environment configuration:

```text
application.yaml
application-dev.yaml
application-test.yaml
application-prod.yaml
```

Do not duplicate secrets.

Example:

```yaml
server:
  port: ${SERVER_PORT:8000}

spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false

app:
  jwt:
    secret: ${JWT_SECRET}
    access-expiration-ms: ${JWT_ACCESS_EXPIRATION_MS:900000}

razorpay:
  key-id: ${RAZORPAY_KEY_ID}
  key-secret: ${RAZORPAY_KEY_SECRET}
  webhook-secret: ${RAZORPAY_WEBHOOK_SECRET}
```

Exact property naming can be finalized.

---

# 107. DEPENDENCIES TO VERIFY IN THE REAL POM

Because the uploaded archive is source-only, inspect the actual build file first.

Likely dependencies:

```text
spring-boot-starter-web
spring-boot-starter-validation
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-websocket
spring-boot-starter-actuator
postgresql
lombok
JWT/JJWT dependencies
Flyway
Razorpay Java SDK
Springdoc OpenAPI
Spring Boot AOP if audit annotations/aspects are used
Spring Security test
Testcontainers PostgreSQL
```

Optional:

```text
Spring Data Redis
Bucket4j
MapStruct
```

Do not add libraries just because they are popular.

Check the actual Spring Boot version before choosing dependency versions.

---

# 108. RAZORPAY DEPENDENCY

Razorpay's current Java documentation provides:

```xml
<dependency>
    <groupId>com.razorpay</groupId>
    <artifactId>razorpay-java</artifactId>
    <version>x.y.z</version>
</dependency>
```

Use the current compatible version at implementation time.

Do not guess a version in source code based on this document.

---

# 109. RAZORPAY REFERENCES TO IMPLEMENT

The current Razorpay Java integration flow requires:

```text
1. Server-side Order creation
2. Pass Razorpay Order ID to Checkout
3. Collect payment ID/order ID/signature
4. Server-side signature verification
5. Payment status/capture verification
6. Webhook signature validation
7. Idempotent processing
```

Razorpay's current documentation also recommends testing in Test Mode before switching to Live Mode.

---

# 110. WEBSOCKET REFERENCES TO IMPLEMENT

Use current Spring STOMP support for:

```text
authentication
token authentication
user destinations
message authorization
```

Recommended architecture:

```text
REST business operation
       ↓
@Transactional service
       ↓
DB state committed
       ↓
Notification event
       ↓
WebSocket publish
```

Do not make business transactions dependent on a connected browser.

---

# 111. FINAL IMPLEMENTATION PHASES

## Phase 0 — Backend audit/refactor

Do:

```text
inspect real pom/build
inspect config
remove exposed secrets
fix entity design
fix status enums
fix repository inefficiencies
add request validation architecture
fix exception handling
```

STOP here and verify.

## Phase 1 — Infrastructure

Implement:

```text
Flyway
configuration profiles
CORS
response wrapper
error handling
request ID
OpenAPI
Actuator
```

## Phase 2 — Security/Auth

Implement:

```text
register
login
JWT
role authorization
ownership checks
forgot password OTP
refresh/revocation
```

## Phase 3 — Customer Core

Implement:

```text
profile
pets
vaccinations
medical records
addresses
```

## Phase 4 — Professional + Booking

Implement:

```text
veterinarian
availability
appointment
service provider
services
provider availability
service bookings
double-booking prevention
```

## Phase 5 — Commerce

Implement:

```text
products
categories
cart
order
stock
```

## Phase 6 — Razorpay

Implement:

```text
Razorpay order creation
Checkout payload
signature verification
payment status
webhook
refund
idempotency
```

## Phase 7 — Notifications + WebSocket

Implement:

```text
notification persistence
notification API
STOMP
JWT CONNECT authentication
user queue
notification events
reminders
reconnection-safe frontend contract
```

## Phase 8 — Admin

Implement:

```text
users
vets
providers
bookings
products
categories
orders
reviews
reports
notifications
audit logs
settings
dashboard
```

## Phase 9 — Integration

Replace frontend mocks with backend APIs.

Verify:

```text
auth
pets
bookings
shop
cart
checkout
Razorpay
orders
notifications
professional portals
admin
```

## Phase 10 — Production QA

Perform:

```text
security testing
concurrency testing
payment testing
WebSocket testing
pagination testing
load testing
database migration testing
responsive frontend regression
```

---

# 112. BACKEND DEFINITION OF DONE

Backend is NOT complete just because endpoints return 200.

Every module must have:

```text
request DTO
validation
authentication
authorization
ownership checks
service layer
transaction boundary
repository queries
pagination where applicable
consistent response
structured errors
audit where required
notifications where required
tests
```

Payment modules additionally require:

```text
gateway order creation
signature verification
status verification
webhook verification
idempotency
refund handling
```

WebSocket additionally requires:

```text
authenticated CONNECT
authorized subscription
user-specific notification delivery
reconnect-safe REST fallback
```

---

# 113. BACKEND TEST COMMAND STANDARD

Once the actual build file exists, establish:

```bash
mvn clean test
mvn verify
mvn spring-boot:run
```

or the project's Gradle equivalents.

Never declare a backend phase complete if:

```text
tests fail
migration fails
security context fails
```

---

# 114. OPENAPI / FRONTEND CONTRACT REVIEW

Before integrating each frontend module:

```text
OpenAPI endpoint
↓
request JSON
↓
response JSON
↓
validation errors
↓
pagination
↓
authorization
```

must be reviewed.

Do not let Next.js and Spring Boot independently invent different field names.

---

# 115. FINAL ARCHITECTURAL PRINCIPLES

Always follow:

```text
Controller = HTTP only
Service = business logic
Repository = persistence
DTO = API contract
Entity = persistence model
Mapper = entity ↔ DTO
Security = authentication + authorization
NotificationService = durable notification + realtime publication
PaymentService = gateway abstraction
AuditLogService = traceability
```

Never:

```text
Controller → Repository directly
Controller → Razorpay directly
Controller → Entity serialization
Frontend → trusted amount
Frontend → trusted role
Frontend → trusted stock
Frontend → trusted booking availability
```

---

# 116. ABSOLUTE PROHIBITIONS

Do not introduce:

```text
Vendor
Seller
Vendor Dashboard
Vendor Verification
Vendor Commission
Vendor Payout
Multi-vendor Checkout
Vendor Product Ownership
```

Do not introduce:

```text
raw password storage
hard-coded JWT secret
hard-coded database password
hard-coded Razorpay secret
client-trusted totals
client-trusted stock
client-trusted booking availability
```

Do not use:

```text
double
float
```

for monetary calculations.

Do not expose JPA entities directly.

Do not use unlimited list queries in Admin.

Do not use `findAll()` and filter in memory for security-critical data.

---

# 117. FIRST BACKEND CODING TASK FOR OPENCODE

Use the following as the first backend agent prompt.

```text
Read this document completely:

docs/PAWCONNECT_BACKEND_DEVELOPMENT_NOTES.md

Then inspect the COMPLETE Spring Boot repository, including the real project root and build file.

The uploaded source skeleton already contains model, DTO, repository, response and security packages.

DO NOT immediately build all APIs.

FIRST perform a Backend Architecture Audit and Phase 0 refactor plan.

Inspect:

1. pom.xml / build.gradle
2. application configuration
3. all model/entity classes
4. all enums
5. all DTOs
6. repositories
7. security classes
8. exception handler
9. response wrapper
10. existing controllers/services/configuration if present
11. database migration setup if present

Produce a file:

docs/BACKEND_AUDIT_REPORT.md

The report must identify:

- entity problems
- relationship/cascade problems
- status enum inconsistencies
- DTO/request validation gaps
- repository pagination gaps
- security vulnerabilities
- JWT issues
- response/error handling gaps
- missing service/controller architecture
- database migration issues
- Razorpay preparation gaps
- notification/WebSocket gaps
- frontend/backend API contract mismatches
- PostgreSQL vs MySQL decision
- missing settings persistence
- any vendor-related legacy code
- exact files requiring modification

IMPORTANT:

The current PawConnect scope is in-house only.

There must be:

0 Vendor role
0 Vendor tables
0 vendorId fields
0 vendor commission
0 vendor payout
0 vendor marketplace

Do NOT implement the large backend yet.

After the audit, create:

docs/BACKEND_IMPLEMENTATION_PLAN.md

This plan must divide development into:

Phase 0
Infrastructure
Security/Auth
Customer Core
Professional/Booking
Commerce
Razorpay
Notifications/WebSocket
Admin
Frontend Integration
Production QA

For every phase specify:

- files/packages
- entities
- DTOs
- repositories
- services
- controllers
- validations
- security
- transactions
- pagination
- notifications
- tests

Then STOP.

Do not create business controllers or production APIs until the audit/plan has been reviewed.

At the end, run only the checks needed to ensure your audit/refactor did not break the existing project.

Report:

- current architecture
- critical issues
- medium issues
- recommended fixes
- files changed
- build/test result
```

---

# 118. OFFICIAL INTEGRATION NOTES

For Razorpay:

- The Java SDK is supported for server-side integration and the current documentation lists the `razorpay-java` dependency.
- Razorpay requires server-created Orders for the normal Order + Checkout flow.
- The Checkout response includes payment ID, order ID and signature.
- Signature verification is mandatory and uses the server-side Order ID and payment ID with the key secret.
- Webhook signatures must also be validated.
- Payment capture/status must be verified before treating a transaction as fulfilled.

For Spring:

- Spring supports STOMP over WebSocket.
- Token-based authentication can be performed at STOMP CONNECT using a `ChannelInterceptor`.
- Message authorization can be applied to WebSocket destinations.
- User-specific destinations are appropriate for notification delivery.
- Spring Data JPA supports `Pageable`/`Page` and dynamic sorting/filtering; very large offset pagination may eventually require keyset/scrolling.

---

# 119. FINAL BACKEND TARGET

The finished backend should look conceptually like:

```text
                    PAWCONNECT
                        |
                 Spring Boot API
                        |
     +------------------+------------------+
     |                  |                  |
   REST                JWT            WebSocket/STOMP
     |                  |                  |
     +------------------+------------------+
                        |
                  Service Layer
                        |
      +-----------------+-----------------+
      |                 |                 |
   Booking           Commerce          Identity
      |                 |                 |
      +--------+--------+--------+--------+
               |                 |
          Notification        Payment
               |              Razorpay
               |                 |
               +--------+--------+
                        |
                   PostgreSQL
```

The backend should become the single source of truth for:

```text
authentication
authorization
users
pets
professional availability
bookings
products
stock
cart
orders
payment status
reviews
reports
notifications
audit logs
settings
```

The Next.js application remains responsible for:

```text
presentation
interaction
form UX
client caching
realtime display
navigation
```

but never becomes the authority for business-critical data.

---

# 120. FINAL IMPLEMENTATION BASELINE

Use:

```text
Database:
PostgreSQL

Backend:
Spring Boot

Authentication:
JWT Bearer

Password:
BCrypt

Validation:
Jakarta Bean Validation

Persistence:
Spring Data JPA

Migration:
Flyway

Pagination:
Pageable + PageResponse

Filtering:
Specifications / controlled queries

Realtime:
WebSocket + STOMP

Notifications:
DB persistence + WebSocket delivery

Payments:
Razorpay Java SDK + server-side verification + webhooks

API contract:
DTO-based + OpenAPI

Error handling:
Centralized structured exceptions

Auditing:
AuditLog service

Storage:
Object storage for uploaded images/documents

Testing:
JUnit + Spring Security Test + Testcontainers

Production secrets:
Environment / secret manager

Frontend integration:
Next.js `/api` client
```

This is the authoritative backend-development blueprint for the current PawConnect in-house product architecture.

---

# 121. PROMO CODE & COUPON SYSTEM ARCHITECTURE

## 121.1 Overview
The Promo Code & Coupon System provides backend-authoritative validation, calculation, and usage tracking for merchandise discounts across PawConnect.

## 121.2 Data Model (`promo_codes` table)
- `id` (BIGSERIAL PK)
- `code` (VARCHAR(50), UNIQUE, NOT NULL - stored trimmed & uppercase, e.g., `PAW10`)
- `description` (VARCHAR(255))
- `discount_type` (`PERCENTAGE`, `FIXED_AMOUNT`)
- `discount_value` (DECIMAL(10,2), NOT NULL, > 0)
- `min_order_amount` (DECIMAL(10,2), default 0.00)
- `max_discount_amount` (DECIMAL(10,2), nullable - caps percentage discounts)
- `usage_limit` (INTEGER, nullable - platform-wide limit)
- `used_count` (INTEGER, NOT NULL, default 0)
- `per_user_limit` (INTEGER, NOT NULL, default 1)
- `valid_from` (TIMESTAMP, nullable)
- `valid_until` (TIMESTAMP, nullable)
- `is_active` (BOOLEAN, NOT NULL, default true)
- `created_at`, `updated_at` (Audit timestamps)

Historical tracking: `orders.promo_code` (VARCHAR(50), nullable) stores the applied code alongside `orders.discount_amount`.

## 121.3 Validation Rules
A promo code is valid if and only if:
1. It exists in the database and `is_active == true`.
2. Current UTC timestamp is within `valid_from` and `valid_until` (if defined).
3. Total platform usage `used_count < usage_limit` (if `usage_limit` is defined).
4. Customer usage count across non-cancelled orders does not exceed `per_user_limit`.
5. Cart items subtotal meets or exceeds `min_order_amount`.

## 121.4 Monetary Calculations
- Strict `BigDecimal` arithmetic with `RoundingMode.HALF_UP` (scale 2).
- `PERCENTAGE`: `subtotal * (discount_value / 100)`, capped at `max_discount_amount`.
- `FIXED_AMOUNT`: `discount_value`.
- Final `discount_amount` never exceeds cart `subtotal`.
- Final order total: `subtotal - discount_amount + shipping_fee + tax_amount`.

## 121.5 Endpoints
- Admin:
  - `GET /api/admin/promo-codes`: Paginated search & filtering (`isActive`, query).
  - `POST /api/admin/promo-codes`: Create promo code + AuditLog (`CREATE_PROMO_CODE`).
  - `PUT /api/admin/promo-codes/{id}`: Update promo code + AuditLog (`UPDATE_PROMO_CODE`).
  - `PATCH /api/admin/promo-codes/{id}/status`: Toggle active status + AuditLog (`TOGGLE_PROMO_CODE_STATUS`).
  - `DELETE /api/admin/promo-codes/{id}`: Delete or deactivate promo code + AuditLog (`DELETE_PROMO_CODE`).
- Customer:
  - `POST /api/me/cart/apply-promo`: Server-side validation against user's active cart.
  - `POST /api/me/promo-codes/validate`: Alias endpoint.
  - `POST /api/me/orders` (`CheckoutRequest.promoCode`): Server-side revalidation, atomic `used_count` increment, discount applied prior to Razorpay payment order generation.
  - Safe decrement of `used_count` upon order cancellation or timeout expiration.

