# PawConnect Backend — Phase 7: Audit Logging Architecture

## 1. Overview

Audit logging in PawConnect captures all critical administrative and platform state mutations into an append-only, queryable audit log table (`audit_logs`). 

Audit logs preserve historical traceability, accountability, and forensic clarity for administrative actions including user status changes, professional approvals, product and inventory updates, order status changes, content moderation, and platform settings.

---

## 2. Audit Log Model

Database Table: `audit_logs`

| Field | Type | Description |
|---|---|---|
| `id` | `BIGINT` (PK) | Auto-increment primary key |
| `user_id` | `BIGINT` (FK) | Actor user ID (nullable for unauthenticated/system actions) |
| `action` | `VARCHAR(100)` | Standard action code (e.g., `USER_STATUS_UPDATED`) |
| `module` | `VARCHAR(100)` | Module/domain identifier (e.g., `USER_MANAGEMENT`, `CATALOGUE`) |
| `entity_type` | `VARCHAR(100)` | Target entity name (e.g., `USER`, `PRODUCT`, `ORDER`) |
| `entity_id` | `BIGINT` | Target entity identifier |
| `old_data` | `TEXT` | Sanitized snapshot of the before state |
| `new_data` | `TEXT` | Sanitized snapshot of the after state |
| `ip_address` | `VARCHAR(50)` | Client IP address extracted from `X-Forwarded-For` or remote address |
| `user_agent` | `TEXT` | Client User-Agent header from request attributes |
| `created_at` | `TIMESTAMP` | Timestamp automatically populated via JPA Auditing |

---

## 3. Catalog of Action Codes

| Action Code | Module | Entity Type | Trigger Event |
|---|---|---|---|
| `USER_STATUS_UPDATED` | `USER_MANAGEMENT` | `USER` | Admin updates a user's status (`ACTIVE`, `BLOCKED`, `INACTIVE`) |
| `USER_CREATED` | `USER_MANAGEMENT` | `USER` | Admin creates a new user directly |
| `USER_UPDATED` | `USER_MANAGEMENT` | `USER` | Admin updates a user's details or role assignments |
| `PROFESSIONAL_VERIFICATION_UPDATED` | `PROFESSIONALS` | `VETERINARIAN` / `SERVICE_PROVIDER` | Admin approves or rejects professional verification |
| `PROFESSIONAL_STATUS_UPDATED` | `PROFESSIONALS` | `VETERINARIAN` / `SERVICE_PROVIDER` | Admin activates or deactivates a professional profile |
| `PRODUCT_CREATED` | `CATALOGUE` | `PRODUCT` | Admin adds a new catalogue product |
| `PRODUCT_UPDATED` | `CATALOGUE` | `PRODUCT` | Admin edits product details or price |
| `PRODUCT_STATUS_UPDATED` | `CATALOGUE` | `PRODUCT` | Admin alters product status or active flag |
| `PRODUCT_STOCK_UPDATED` | `CATALOGUE` | `PRODUCT` | Admin adjusts product inventory quantity |
| `ORDER_STATUS_UPDATED` | `ORDERS` | `ORDER` | Admin updates fulfillment status (`PACKED`, `SHIPPED`, etc.) |
| `REVIEW_MODERATED` | `MODERATION` | `REVIEW` | Admin updates review visibility status (`HIDDEN`, `VISIBLE`) |
| `REPORT_RESOLVED` | `MODERATION` | `REPORT` | Admin resolves or rejects a user report with notes |
| `PLATFORM_SETTING_UPDATED` | `SETTINGS` | `PLATFORM_SETTING` | Admin modifies a platform setting |

---

## 4. Privacy, Safety, and Sanitization

1. **Strict Credential Redaction**: All snapshot serialization passes through regex-based sanitization masking sensitive values:
   - Passwords and password hashes
   - JWT access and refresh tokens
   - Razorpay key secrets and webhook signatures
   - Card numbers, CVV, and OTP values
2. **Actor Immutability**: Actor user identity is retrieved server-side via `CurrentUserService` and `SecurityContextHolder`. It cannot be forged or submitted by the caller.
3. **Transaction Isolation**:
   - The audit log record participates in the surrounding business transaction. If the business operation rolls back (e.g. database error, constraint violation), the audit record does not persist, guaranteeing audit consistency with actual committed state.
4. **Append-Only Immutability**:
   - There are no edit (`PUT`, `PATCH`) or delete (`DELETE`) APIs exposed for audit records.
   - Historical audit records are immutable.

---

## 5. Audit Log Query API

Base Path: `/api/admin/audit-logs`

### 5.1 Query Logs
- **Method**: `GET`
- **Path**: `/api/admin/audit-logs`
- **Query Parameters**:
  - `userId` (Long, optional): Filter by actor user ID
  - `module` (String, optional): Filter by module name (case-insensitive)
  - `action` (String, optional): Filter by action code (case-insensitive)
  - `entityType` (String, optional): Filter by entity type (case-insensitive)
  - `startDate` (ISO LocalDateTime, optional): Range start
  - `endDate` (ISO LocalDateTime, optional): Range end
  - `page`, `size`, `sort` (Pageable, max page size: 100, allow-listed sort fields: `id`, `createdAt`, `action`, `module`, `entityType`)
- **Response**: `ApiResponse<PageResponse<AuditLogResponse>>`

### 5.2 Get Log Details
- **Method**: `GET`
- **Path**: `/api/admin/audit-logs/{auditLogId}`
- **Response**: `ApiResponse<AuditLogResponse>`
