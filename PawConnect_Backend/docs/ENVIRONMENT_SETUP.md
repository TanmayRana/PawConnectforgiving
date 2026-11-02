# PawConnect Backend — Environment Setup Guide

This document describes the environment variable configuration and startup instructions for running the PawConnect Spring Boot backend locally or in production.

---

## 1. Overview

The backend uses environment variables to externalize all sensitive secrets and deployment-specific parameters. No secrets, credentials, or host-specific URLs are hardcoded into source code or committed property files.

---

## 2. Environment Variables

### Required Variables (Mandatory for application startup)

| Variable Name | Description | Example / Placeholder Format |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://<db-host>:<db-port>/<db-name>?sslmode=require` |
| `DB_USERNAME` | PostgreSQL database username | `<db-username>` |
| `DB_PASSWORD` | PostgreSQL database password | `<db-password>` |
| `JWT_SECRET` | HMAC-SHA secret key for JWT signing (minimum 256 bits / 32 bytes) | `<secure-random-256-bit-string>` |

> **Security Notice**: Do **NOT** commit actual values for these variables to Git or share them in unencrypted channels.

---

### Optional / Future Variables (Default fallback values provided)

| Variable Name | Default Value | Description |
|---|---|---|
| `SERVER_PORT` | `8000` | Port on which the Spring Boot REST API listens |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed frontend origins (Next.js) |
| `RAZORPAY_KEY_ID` | `dummy_key_id` | Razorpay Merchant Key ID (Phase 3+) |
| `RAZORPAY_KEY_SECRET` | `dummy_key_secret` | Razorpay Merchant Key Secret (Phase 3+) |
| `RAZORPAY_WEBHOOK_SECRET` | `dummy_webhook_secret` | Razorpay Webhook Signature Secret (Phase 3+) |
| `MAIL_HOST` | `smtp.gmail.com` | SMTP Server Host for transactional notifications |
| `MAIL_USERNAME` | `""` | SMTP Username / Email |
| `MAIL_PASSWORD` | `""` | SMTP Application Password |

---

## 3. Local Setup Instructions (PowerShell / Windows)

Set the environment variables in your active PowerShell session before running the application:

```powershell
# Required Database & Security Settings (Replace placeholders with actual local/dev credentials)
$env:DB_URL="jdbc:postgresql://localhost:5432/pawconnect_db"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="your_local_password_here"
$env:JWT_SECRET="c2VjdXJlLXBhd2Nvbm5lY3Qtand0LXNlY3JldC1rZXktZm9yLWRldmVsb3BtZW50LW9ubHk="

# Optional Server & CORS Configuration
$env:SERVER_PORT="8000"
$env:CORS_ALLOWED_ORIGINS="http://localhost:3000"

# Optional Payment & Mail Placeholders (For Phase 1, defaults will suffice if unset)
$env:RAZORPAY_KEY_ID="dummy_key_id"
$env:RAZORPAY_KEY_SECRET="dummy_key_secret"
$env:RAZORPAY_WEBHOOK_SECRET="dummy_webhook_secret"
$env:MAIL_HOST="smtp.gmail.com"
$env:MAIL_USERNAME=""
$env:MAIL_PASSWORD=""
```

---

## 4. Building and Running the Backend

Ensure you have **Java 21+** installed and available in your `PATH`.

### Running Tests
Execute the automated test suite (uses embedded in-memory H2 database, requiring no external PostgreSQL):
```powershell
.\mvnw.cmd clean test
```

### Full Verification & Packaging
```powershell
.\mvnw.cmd clean verify
```

### Starting the Backend Application
```powershell
.\mvnw.cmd spring-boot:run
```

Once started:
- Backend REST API: `http://localhost:8000/api`
- Swagger UI Documentation: `http://localhost:8000/swagger-ui/index.html`
- OpenAPI Specification JSON: `http://localhost:8000/v3/api-docs`
- Health Endpoint: `http://localhost:8000/actuator/health`
