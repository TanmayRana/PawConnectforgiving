# PawConnect — Security & Operations Checklist

**Phase:** Phase 9 Production QA & Operations Gate  
**Target:** Production Platform Administrators & DevOps Engineers

---

## 1. Manual Credential Rotation Checklist (Pre-Release Mandate)

> [!WARNING]
> The items in this section MUST be completed by an authorized administrator before directing real users or payments to the platform.

### Task 1: Neon Cloud PostgreSQL Credential Rotation
- [ ] Log in to the [Neon Console](https://console.neon.tech).
- [ ] Select project -> Settings -> Roles.
- [ ] Reset password for `neondb_owner` / application role.
- [ ] Copy the fresh connection string.
- [ ] Update the production hosting secrets manager with:
  - `DB_URL`
  - `DB_USERNAME`
  - `DB_PASSWORD`
- [ ] Test connectivity from the staging container before deploying production.

### Task 2: JWT Secret Regeneration
- [ ] Generate a cryptographically secure 256-bit random key:
  ```bash
  openssl rand -base64 32
  ```
- [ ] Store this value securely as `JWT_SECRET`.
- [ ] Confirm no default fallback key is used in production.

### Task 3: Razorpay Test-to-Live Credential Activation
- [ ] Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
- [ ] Switch toggle from **Test Mode** to **Live Mode**.
- [ ] Navigate to Settings -> API Keys -> **Generate Key**.
- [ ] Copy `Key ID` and store as:
  - `RAZORPAY_KEY_ID` (backend)
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (frontend)
- [ ] Copy `Key Secret` and store as `RAZORPAY_KEY_SECRET` (backend only; never expose in frontend!).
- [ ] Navigate to Settings -> Webhooks -> **Add New Webhook**:
  - Webhook URL: `https://api.pawconnect.com/api/webhooks/razorpay`
  - Secret: Generate a random 32-character token and set as `RAZORPAY_WEBHOOK_SECRET`
  - Active Events:
    - `payment.captured`
    - `payment.failed`
    - `order.paid`

### Task 4: Disable Default Development Admin
- [ ] Verify that `INIT_DEFAULT_ADMIN_ENABLED` is set to `false` in production.
- [ ] Ensure any administrative accounts are provisioned with unique, strong passwords.

---

## 2. Infrastructure & Network Security Checklist

- [ ] **SSL / TLS Enforcement**: All HTTP traffic is redirected to HTTPS (port 443).
- [ ] **Secure WebSockets**: WebSocket connections use `wss://` on production domains.
- [ ] **Strict CORS Allowed Origins**:
  - `application.cors.allowed-origins` must match only the production frontend domains (e.g., `https://pawconnect.com,https://app.pawconnect.com`).
  - Wildcard `*` origins are strictly prohibited.
- [ ] **No Secrets in Frontend Bundles**:
  - Verify that only `NEXT_PUBLIC_*` variables are bundled into frontend assets.
  - Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is a public Key ID (starts with `rzp_live_`), never a Secret Key.
- [ ] **OpenAPI / Swagger Ingress Rule**:
  - Restrict `/swagger-ui/**` and `/v3/api-docs/**` to private VPC networks or disable via `springdoc.swagger-ui.enabled=false`.

---

## 3. Data Privacy & Logging Hygiene Checklist

- [ ] **Password Integrity**:
  - Passwords are encrypted with BCrypt (`BCryptPasswordEncoder`).
  - Passwords are never logged in plaintext.
- [ ] **PII Masking**:
  - Email addresses in dev logging adapters are masked (e.g., `a***e@test.com`).
  - Razorpay signatures and webhook payloads are redacted in info-level logs.
- [ ] **Audit Trail**:
  - Administrative state changes, order status transitions, and user moderation actions write immutable records to the `audit_logs` table.

---

## 4. Operational Monitoring & Health Checks

- [ ] **Application Liveness**:
  - Configure monitoring health check pinging `GET /api/products` (returns HTTP 200).
- [ ] **Database Connection Pool Monitoring**:
  - Monitor database connection timeouts and active connections in Neon dashboard.
- [ ] **Error Rate Alerting**:
  - Configure alerts for sustained 5xx HTTP response spikes (> 1% of total traffic over 5 minutes).
- [ ] **Payment Verification Error Alerting**:
  - Configure alert notifications for any spike in `PAYMENT_VERIFICATION_FAILED` response codes (indicates webhook or key misconfiguration).
