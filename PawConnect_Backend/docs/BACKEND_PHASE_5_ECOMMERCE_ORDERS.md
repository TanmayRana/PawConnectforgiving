# PawConnect Backend — Phase 5: E-commerce, Shopping Cart & Orders Specification

This document provides complete technical documentation for the Phase 5 E-commerce, Shopping Cart, Product Orders, and Razorpay Order Payment integrations in the PawConnect Spring Boot backend. All endpoints conform strictly to the unified `ApiResponse<T>` and `PageResponse<T>` standards, enforce server-side authorization and ownership, maintain server-side pricing and financial snapshot immutability, and implement database-enforced atomic inventory management.

---

## 1. Overview & Business Model

### In-House Catalogue & Role Separation
- **Catalogue Ownership**: All products belong exclusively to PawConnect's in-house catalogue. There is **no Vendor role** and no external-vendor marketplace.
- **Actor Roles**:
  - `PET_OWNER` / Customer: Browse active catalogue, manage shopping cart, execute checkout, track order history, cancel eligible orders, initiate payments.
  - `ADMIN`: In-house catalogue management (CRUD products, categories, update inventory, toggle product active state), order fulfillment status transitions (`PACKED`, `SHIPPED`, `DELIVERED`).
  - `VETERINARIAN` & `SERVICE_PROVIDER`: Access to booking services (Phase 3/4); may browse public product catalogue.

---

## 2. Part A — Product Catalogue & Admin Management

### 2.1 Public Product Catalogue APIs

#### List & Filter Products
- **Method**: `GET`
- **Path**: `/api/products` (and `/api/public/products`)
- **Access**: Public (`permitAll()`)
- **Query Parameters**:
  - `search` *(optional)*: Case-insensitive search on product name, description, brand, or SKU.
  - `category` *(optional)*: Filter by category name.
  - `categoryId` *(optional)*: Filter by category ID.
  - `minPrice` *(optional)*: Minimum base/sale price.
  - `maxPrice` *(optional)*: Maximum base/sale price.
  - `inStock` *(optional, default false)*: When true, filters products where `stockQuantity > 0`.
  - `page` *(optional, default 0)*: Zero-based page index.
  - `size` *(optional, default 20, max 100)*: Page size (enforced `MAX_PAGE_SIZE = 100`).
  - `sort` *(optional, default `createdAt,desc`)*: Allow-listed sorting fields: `id`, `name`, `price`, `createdAt`, `stockQuantity`. Invalid sort properties return HTTP 400 Bad Request.

##### Business Rules:
1. Public listings return **only active products** (`status = ACTIVE` and `isActive = true`).
2. Internal/sensitive fields (e.g., cost margins, internal admin flags) are omitted via `ProductResponse`.

#### Get Product Details
- **Method**: `GET`
- **Path**: `/api/products/{productId}` (and `/api/public/products/{productId}`)
- **Access**: Public
- **Behavior**: Returns active product details. If product is inactive or not found, returns HTTP 404 Not Found.

#### List Active Categories
- **Method**: `GET`
- **Path**: `/api/products/categories`
- **Access**: Public
- **Behavior**: Returns all active product categories (`isActive = true`) ordered alphabetically.

#### List Featured Products
- **Method**: `GET`
- **Path**: `/api/products/featured`
- **Access**: Public
- **Behavior**: Returns active products flagged as featured (`isFeatured = true`).

---

### 2.2 Administrative Product Management APIs

All administrative endpoints require `hasRole('ADMIN')`. Authorization is derived strictly from the authenticated JWT principal.

#### Create Product
- **Method**: `POST`
- **Path**: `/api/admin/products`
- **Request Body**:
```json
{
  "categoryId": 1,
  "name": "Orthopedic Pet Bed",
  "sku": "BED-ORTHO-001",
  "description": "Ergonomic foam bed for dogs and cats",
  "price": 1499.00,
  "salePrice": 1299.00,
  "stockQuantity": 50,
  "lowStockThreshold": 5,
  "imageUrl": "https://example.com/bed.jpg",
  "brand": "PawLuxury",
  "isFeatured": true,
  "status": "ACTIVE"
}
```
- **Behavior**: Verifies category existence, generates unique SKU if missing, persists product with `in-house` ownership, and returns HTTP 201 Created.

#### Update Product
- **Method**: `PUT`
- **Path**: `/api/admin/products/{productId}`
- **Behavior**: Updates product metadata and pricing. Preserves historical order item snapshots.

#### Update Stock Level
- **Method**: `PATCH`
- **Path**: `/api/admin/products/{productId}/stock`
- **Request Body**:
```json
{
  "stockQuantity": 120
}
```
- **Behavior**: Updates product inventory level safely. Rejects negative quantities.

#### Toggle Product Status (Soft Deactivation)
- **Method**: `PATCH`
- **Path**: `/api/admin/products/{productId}/status`
- **Request Body**:
```json
{
  "status": "INACTIVE"
}
```
- **Behavior**: Sets `status = INACTIVE` and `isActive = false`. Products referenced by past orders are **never hard-deleted**, preserving full historical integrity.

#### Category Management
- `POST /api/admin/categories` — Create category
- `PUT /api/admin/categories/{categoryId}` — Update category

---

## 3. Part B — Shopping Cart Management

Authenticated customers manage a single active shopping cart bound to their security context. Arbitrary `userId` parameters from request bodies or URL parameters are rejected.

### Endpoints (`/api/me/cart`)
- `GET /api/me/cart` — Retrieve or initialize current user's active cart.
- `POST /api/me/cart/items` — Add product to active cart.
- `PUT /api/me/cart/items/{cartItemId}` — Update item quantity in active cart.
- `DELETE /api/me/cart/items/{cartItemId}` — Remove item from active cart.
- `DELETE /api/me/cart/items` — Clear all items in active cart.

### Cart Business Rules & Invariants
1. **Server-Side Pricing**: Unit prices and line totals (`effectivePrice * quantity`) are calculated strictly from persisted `Product` records on the server. Client-submitted prices or subtotals are completely ignored.
2. **Stock Verification**: Adding or updating an item quantity to exceed current `product.stockQuantity` is rejected with HTTP 409 Conflict (`INSUFFICIENT_STOCK`).
3. **Product Eligibility**: Inactive products (`status != ACTIVE` or `isActive = false`) cannot be added to a cart; requests fail with HTTP 400 Bad Request.
4. **Duplicate Product Merging**: Adding a product that is already present in the active cart atomically increments the existing item's quantity rather than creating duplicate lines.
5. **Cross-Customer Isolation**: Every cart item lookup verifies ownership against the authenticated customer (`item.getCart().getUser().getId().equals(currentUserId)`). Cross-user modifications fail with HTTP 403 Forbidden.
6. **Concurrent Cart Creation**: Active cart retrieval uses `cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)` and handles concurrent initialization safely.

---

## 4. Part C & D — Order Creation, Checkout & Lifecycle

### 4.1 Order Placement (`POST /api/me/orders`)
- **Access**: `hasRole('PET_OWNER')`
- **Request Body**:
```json
{
  "addressId": 12,
  "notes": "Please leave with security"
}
```

#### Checkout Workflow:
1. **User & Cart Resolution**: Authenticated customer is resolved from `SecurityContext`. Active cart is retrieved with all items. If cart is missing or empty, returns HTTP 400 Bad Request.
2. **Address Ownership Validation**: Delivery address is looked up by `addressId`. Ownership is verified (`address.getUser().getId().equals(userId)`). Foreign addresses produce HTTP 403 Forbidden.
3. **Address Snapshotting**: All delivery address fields (recipient name, street address, city, state, postal code, phone) are snapshotted directly into the `Order` record, ensuring historical accuracy if the user subsequently updates or deletes the address.
4. **Item Snapshotting**: Each cart item is captured into an `OrderItem` containing:
   - `productName` (snapshot)
   - `productSku` (snapshot)
   - `unitPrice` (server-side current effective price)
   - `quantity`
   - `totalPrice` (`unitPrice * quantity`)
5. **Charges & Totals Calculation**:
   - `subtotalAmount` = Sum of all item line totals.
   - `taxAmount` = Read from `PlatformSetting` (`TAX_RATE`, default 0.00).
   - `deliveryFee` = Read from `PlatformSetting` (`DELIVERY_FEE`, default 0.00).
   - `totalAmount` = `subtotalAmount + taxAmount + deliveryFee`.
   No arbitrary discount or delivery charges are invented.
6. **Cart Conversion**: Cart status is transitioned from `ACTIVE` to `CONVERTED` and existing cart items are purged.
7. **Order Status History**: Initial history record created (`CONFIRMED` status, timestamped, referencing user).
8. **Deduplicated In-App Notification**: Emits `ORDER_CREATED` notification with deduplication key `NOTIF-ORDER-{orderId}-CREATED`.

---

### 4.2 Inventory Reservation Policy

To eliminate race conditions and prevent overselling during simultaneous checkouts of high-demand items, the backend implements **Atomic Conditional Row-Level Updates**:

```sql
UPDATE products 
SET stock_quantity = stock_quantity - :quantity 
WHERE id = :productId 
  AND stock_quantity >= :quantity 
  AND is_active = true
```

#### Concurrency & Consistency Guarantees:
1. **Deadlock Prevention**: Before decrementing stock, cart items are sorted by `productId` ascending. All database locks are acquired in identical deterministic order across concurrent transactions.
2. **Atomic Failure Rollback**: If any single product in a multi-item checkout fails the conditional decrement (insufficient stock), the entire `@Transactional` operation is rolled back, restoring any previously decremented items automatically. The user receives HTTP 409 Conflict (`INSUFFICIENT_STOCK`).
3. **No Negative Stock**: Stock levels can never drop below zero at the database level.
4. **Single-Restoration Guarantee on Cancellation**: When an order is cancelled, stock is restored via atomic increment:
   ```sql
   UPDATE products SET stock_quantity = stock_quantity + :quantity WHERE id = :productId
   ```
   Repeated cancellation requests are idempotent: if the order is already in `CANCELLED` status, the service returns the existing order state immediately without incrementing stock twice.

---

### 4.3 Order Lifecycle State Transitions

```
[CONFIRMED] -------- (Admin PACKED) --------> [PACKED]
     |                                           |
     | (Customer Cancel)                         | (Customer Cancel)
     v                                           v
[CANCELLED]                                 [CANCELLED]
                                                 |
                                                 | (Admin SHIPPED)
                                                 v
                                             [SHIPPED]
                                                 |
                                                 | (Admin DELIVERED)
                                                 v
                                            [DELIVERED] (Terminal)
```

#### Lifecycle Rules:
- **Eligible Cancellation**: A customer may cancel an order (`PATCH /api/me/orders/{orderId}/cancel`) only while it is in `CONFIRMED` or `PACKED` status.
- **Ineligible Cancellation**: An order in `SHIPPED` or `DELIVERED` status cannot be cancelled; attempts produce HTTP 409 Conflict (`INVALID_STATE_TRANSITION`).
- **Terminal States**: `DELIVERED` and `CANCELLED` are terminal. Any attempt to update their status via administrative APIs produces HTTP 409 Conflict.
- **Admin State Progression**: Admins advance fulfillment via `PATCH /api/admin/orders/{orderId}/status`:
  - `CONFIRMED` -> `PACKED`
  - `PACKED` -> `SHIPPED`
  - `SHIPPED` -> `DELIVERED`
  - Any non-terminal state -> `CANCELLED` (restores stock atomically)
- **Status Auditing**: Every status change generates an immutable `OrderStatusHistory` row recording previous/new status, timestamp, administrator/user ID, and operational remarks.

---

## 5. Part E — Razorpay Payment Integration for Orders

Product order payments reuse the verified Razorpay payment infrastructure implemented in Phase 4 without duplicating payment gateways.

### 5.1 Architecture & Endpoints
- **Create Payment Order**: `POST /api/me/orders/{orderId}/payments/order`
  - **Access**: `hasRole('PET_OWNER')`
  - **Validation**: Order must belong to authenticated user, must be in `CONFIRMED` status, and cannot already have `paymentStatus = SUCCESS`.
  - **Amount Derivation**: Amount is derived strictly from `order.totalAmount` in INR, converted to paise (`totalAmount * 100`).
  - **Gateway Integration**: Creates order with Razorpay with notes (`orderId`, `orderNo`, `orderType: MERCHANDISE_ORDER`).
  - **Persistence**: Persists `Payment` record with `paymentFor = PaymentFor.ORDER` and `referenceId = order.getId()`.
- **Verify Checkout Signature**: `POST /api/payments/razorpay/verify`
  - **Payload**: `{ "razorpayOrderId": "...", "razorpayPaymentId": "...", "razorpaySignature": "..." }`
  - **HMAC Verification**: Computes HMAC-SHA256 signature and verifies authenticity.
  - **Reconciliation**: On match, updates `Payment` to `SUCCESS`, sets `order.paymentStatus = PaymentStatus.SUCCESS`, and creates deduplicated `PAYMENT_SUCCESS` notification.
  - **Idempotency**: Repeated verification submissions return HTTP 200 with the existing record.
- **Webhook Reconciliation**: `POST /api/webhooks/razorpay`
  - Reconciles `payment.captured` / `order.paid` under pessimistic database lock (`@Lock(LockModeType.PESSIMISTIC_WRITE)`).
  - Webhook failures (`payment.failed`) do **not** downgrade an already verified `SUCCESS` transaction.
  - Polymorphic association guarantees `PaymentFor.ORDER` events never modify appointment or service booking records.

---

## 6. Error Codes & HTTP Status Mapping

| HTTP Status | Error Code | Description |
|---|---|---|
| 400 Bad Request | `BAD_REQUEST` / `VALIDATION_ERROR` | Malformed JSON, non-positive quantities, invalid sort parameters, empty cart checkout |
| 401 Unauthorized | `UNAUTHORIZED` | Missing, invalid, or expired JWT token |
| 403 Forbidden | `FORBIDDEN` | Accessing foreign carts, foreign orders, or non-admin accessing admin routes |
| 404 Not Found | `RESOURCE_NOT_FOUND` | Missing product, cart item, order, or delivery address |
| 409 Conflict | `INSUFFICIENT_STOCK` | Requested quantity exceeds available inventory |
| 409 Conflict | `INVALID_STATE_TRANSITION` | Attempting to cancel shipped/delivered orders or revert terminal states |
| 422 Unprocessable | `BUSINESS_RULE_VIOLATION` | Business invariant check failure |
| 502 Bad Gateway | `PAYMENT_GATEWAY_ERROR` | Razorpay external network or gateway failure |
