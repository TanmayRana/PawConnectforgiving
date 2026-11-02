# PawConnect — Production Deployment Runbook

**Version:** 1.0.0 (Phase 9 Release Readiness)  
**Target Environments:** Staging & Production  
**Architecture:** Next.js 16 (Vercel/Node.js) + Spring Boot 4 (Docker/VM/Cloud Run) + Neon Serverless PostgreSQL

---

## 1. System Architecture Topology

```
+-------------------------------------------------------------+
|                     Client Browser                         |
|  - Next.js 16 App Router (HTTPS)                            |
|  - Real-Time STOMP over WebSocket (WSS)                     |
+------------------------------+------------------------------+
                               |
            HTTPS / REST       |        WSS / STOMP
                               v
+-------------------------------------------------------------+
|               Reverse Proxy / Ingress (SSL / TLS)           |
|  - Port 443 termination                                     |
|  - CORS validation: https://app.pawconnect.com             |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|               Spring Boot 4.1.1 Backend Container           |
|  - Port 8000 (Internal)                                     |
|  - In-Memory STOMP SimpleBroker (/ws)                       |
|  - JWT Stateless Auth (15m access / 7d refresh)             |
|  - Pessimistic Locks on bookings and payments               |
+----------------+-----------------------------+--------------+
                 |                             |
                 v                             v
+--------------------------------+   +------------------------+
|    Neon Serverless Postgres    |   | Razorpay Payment API   |
|  - Connection Pooler (PgBouncer)|   | - Order Creation (S2S) |
|  - SSL enforced (require)      |   | - Webhooks (HMAC-SHA256|
+--------------------------------+   +------------------------+
```

---

## 2. Environment Variables & Secrets Checklist

> [!IMPORTANT]
> Never commit populated values to Git. Supply these values via secure secrets managers (e.g., AWS Secrets Manager, GitHub Secrets, Doppler, or Cloud Environment Variables).

### Backend Environment Variables (`PawConnect_bakend`)

| Variable Name | Required | Default / Sample Format | Purpose |
| :--- | :--- | :--- | :--- |
| `SERVER_PORT` | Optional | `8000` | Backend HTTP listening port |
| `DB_URL` | **Required** | `jdbc:postgresql://ep-xyz.us-east-2.aws.neon.tech/pawconnect?sslmode=require` | Neon PostgreSQL pooled JDBC connection URL |
| `DB_USERNAME` | **Required** | `pawconnect_user` | Database authentication username |
| `DB_PASSWORD` | **Required** | `[SECURE_ROTATED_PASSWORD]` | Database password (must be freshly rotated) |
| `JWT_SECRET` | **Required** | `[256_BIT_BASE64_RANDOM_SECRET]` | Cryptographic HMAC-SHA256 JWT signing secret key |
| `JWT_EXPIRATION` | Optional | `900000` (15 minutes) | Access token lifespan in milliseconds |
| `JWT_REFRESH_EXPIRATION` | Optional | `604800000` (7 days) | Refresh token lifespan in milliseconds |
| `CORS_ALLOWED_ORIGINS` | **Required** | `https://pawconnect.com,https://app.pawconnect.com` | Comma-separated list of permitted frontend origins |
| `RAZORPAY_KEY_ID` | **Required** | `rzp_live_[KEY_ID]` | Razorpay production merchant key ID |
| `RAZORPAY_KEY_SECRET` | **Required** | `[RAZORPAY_LIVE_SECRET]` | Razorpay production merchant secret key |
| `RAZORPAY_WEBHOOK_SECRET` | **Required** | `[WEBHOOK_SECRET_KEY]` | Webhook signature HMAC secret configured in Razorpay dashboard |
| `NOTIFICATION_EMAIL_ENABLED`| Optional | `false` | Enable production email notifications |
| `NOTIFICATION_SMS_ENABLED` | Optional | `false` | Enable production SMS notifications |
| `INIT_DEFAULT_ADMIN_ENABLED`| Optional | `false` | Set to `false` in production to prevent auto-seeding default credentials |

### Frontend Environment Variables (`pawconnect`)

| Variable Name | Required | Default / Sample Format | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | **Required** | `https://api.pawconnect.com/api` | Base URL of the backend REST API |
| `NEXT_PUBLIC_WS_URL` | **Required** | `wss://api.pawconnect.com/ws` | Secure WebSocket notification endpoint |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`| **Required** | `rzp_live_[KEY_ID]` | Public Razorpay key ID for client-side modal checkout |

---

## 3. Database Pre-Deployment & Migration Procedure

### Step 1: Pre-Deployment Neon Snapshot
Before executing any migration or schema deployment:
1. Log in to the [Neon Console](https://console.neon.tech).
2. Navigate to the project and select the target Branch (e.g., `main`).
3. Click **Create Snapshot** / **Branch Point**. Label the snapshot: `pre-deploy-phase-9-[YYYYMMDD-HHMM]`.

### Step 2: Flyway Baseline & Validation Transition
PawConnect uses Hibernate entities with explicit column definitions. To transition safely to Flyway:
1. Export the schema baseline using `flyway:baseline`:
   ```bash
   mvn flyway:baseline -Dflyway.baselineVersion=1 -Dflyway.baselineDescription="Initial Schema Baseline"
   ```
2. In `application.yaml`, transition schema auto-generation to validation:
   ```yaml
   spring:
     jpa:
       hibernate:
         ddl-auto: validate
     flyway:
       enabled: true
   ```

---

## 4. Production Deployment Sequence

### Phase 1: Backend Deployment
1. Build the production executable JAR:
   ```powershell
   .\mvnw.cmd clean package -DskipTests
   ```
2. Package container image and deploy to container runtime (ECS / Cloud Run / Kubernetes).
3. Verify backend health:
   - Check container logs for Spring Boot startup: `Started PawConnectApplication in X.XXX seconds`.
   - Send HTTP GET request to `/api/products` (public endpoint) to confirm database connectivity.

### Phase 2: Frontend Deployment
1. Set production environment variables in host provider (e.g., Vercel / Docker build args).
2. Execute production build and verification:
   ```powershell
   pnpm install --frozen-lockfile
   pnpm typecheck
   pnpm lint
   pnpm build
   ```
3. Deploy frontend bundle and verify custom domain SSL certificate.

---

## 5. Post-Deployment Verification Smoke Tests

Execute these verification checks immediately following deployment:

1. **Health & Public Endpoints**:
   - `GET https://api.pawconnect.com/api/products` -> HTTP 200 with product catalogue JSON.
   - `GET https://pawconnect.com` -> HTTP 200 with home landing page.
2. **Authentication Journey**:
   - Register a new test pet owner account.
   - Confirm login generates valid JWT tokens.
   - Inspect local browser storage: tokens stored without unhandled errors.
3. **Database Write & Profile**:
   - Register a pet profile and upload details.
   - Update user profile address.
4. **WebSocket Notification Connectivity**:
   - Open browser developer tools -> Network -> WS.
   - Confirm successful connection to `wss://api.pawconnect.com/ws/websocket`.
   - Verify STOMP `CONNECTED` frame received.
5. **Razorpay Test-to-Live Verification**:
   - Initiate a test booking checkout.
   - Verify Razorpay modal displays accurate merchant name and amount in INR.
6. **Administrative Access**:
   - Log in with dedicated administrative credentials.
   - Verify dashboard metric cards load without 403 or 500 errors.

---

## 6. Rollback & Forward-Fix Procedures

### Backend Rollback
- If the new backend version fails health checks or throws database connection errors:
  1. Revert container service traffic immediately to the previous image tag.
  2. If database schema was altered incompatibly, restore the database from the pre-deployment Neon snapshot.

### Frontend Rollback
- In Vercel / CDN: Select the previous stable deployment and click **Promote to Production** (instantaneous DNS cutover).

---

## 7. Known Single-Instance Boundaries

The current architecture is optimized for a single backend instance:
1. **STOMP SimpleBroker**: Connected WebSocket sessions are maintained in JVM memory. Deploying multiple backend instances without sticky sessions or an external message broker (RabbitMQ/ActiveMQ) will cause missed notifications.
2. **In-Memory Rate Limiting & OTP**: OTP tokens and sliding-window rate limit counters are held in memory and will reset upon application restart.
