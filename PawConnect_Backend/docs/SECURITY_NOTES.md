# PawConnect Backend — Security Notes & Credential Rotation Guidelines

## 1. Security Advisory: Previous Credential Exposure

During the Phase 0 Backend Audit, it was discovered that a live cloud PostgreSQL database connection string (Neon database credential) had previously been committed to Git history in early development commits of `application.properties`/`application.yaml`.

### Status of Credential Rotation:
- **Action Required**: The database credentials for the affected cloud/production database instance **MUST BE IMMEDIATELY ROTATED** in the database provider management console (e.g., Neon Console).
- **Rotation Status**: **PENDING ADMIN / DEVOPS ACTION**. Rotation cannot be performed automatically from this repository code and must be manually executed by the project owner in the Neon/cloud dashboard.
- **Do Not Assume Safety**: Any secret committed to Git history—even if subsequently deleted or modified in subsequent commits—must be treated as compromised.

---

## 2. JWT Secret Rotation Advisory

If any previous JWT secret string was shared in repository files, environment dumps, or commits:
- The secret key must be regenerated immediately.
- Use a cryptographically strong, randomly generated key with at least 256 bits of entropy (e.g., generated using `openssl rand -base64 32`).
- The JWT secret must be supplied solely via the `JWT_SECRET` environment variable.

---

## 3. Git Ignore & Repository Protection Rules

To prevent accidental leakage of sensitive credentials and developer-specific artifacts:

1. **Active `.gitignore` Rules**:
   - `application-local.yaml`, `application-local.properties`
   - `.env`, `.env.*`
   - `target/`, `*.jar`, `*.war`
   - IDE configuration directories (`.idea/`, `.vscode/`, `*.iml`)
   - Log files and heap dumps (`*.log`, `*.hprof`)

2. **Commit Hygiene Checklist**:
   - Never commit connection strings containing passwords.
   - Never commit private keys, webhook secrets, or API tokens.
   - Always verify `git diff --cached` before committing changes to any configuration files.
   - Utilize placeholder values in documentation and templates exclusively.

---

## 4. Backend Authentication & Access Control Hardening (Phase 1)

As part of Phase 1 implementation, the following architectural security protections are active:
- **Stateless Bearer JWT Authentication**: Access tokens expire in 15 minutes.
- **Refresh Token Rotation**: Refresh tokens expire in 7 days and use a database-backed token versioning strategy.
- **Instant Revocation**: Users possess a `token_version` column. Bumping this version upon logout, password reset, or account lock instantaneously invalidates all active access and refresh tokens.
- **Password Hashing**: BCrypt with default strength factor is enforced for all stored credentials.
- **Role Escalation Protection**: Registration strictly assigns `ROLE_PET_OWNER`. Role requests from client payloads are discarded.
- **Enumeration Defense**: Authentication failures (login, forgot password) return uniform generic messages to prevent user enumeration.
- **Strict CORS Policy**: Restricted to configured frontend origins (e.g., `http://localhost:3000`) with explicit HTTP verbs and headers; wildcard origins with credentials are expressly prohibited.
